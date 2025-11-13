/**
 * BWG (BandwagonHost) 磁盘检查脚本
 * 通过 BWG API 检查服务器磁盘使用情况，并在磁盘即将满时发送警告
 */

const axios = require('axios');
const EmailSender = require('./email-sender');

class BWGDiskChecker {
  constructor() {
    // 从环境变量获取 BWG API 配置
    this.veid = process.env.BWG_VEID || '666722';
    this.apiKey = process.env.BWG_API_KEY;
    this.apiUrl = 'https://api.64clouds.com/v1/getServiceInfo';

    // 磁盘使用率阈值配置（百分比）
    this.warningThreshold = parseFloat(process.env.BWG_DISK_WARNING_THRESHOLD || '80');
    this.criticalThreshold = parseFloat(process.env.BWG_DISK_CRITICAL_THRESHOLD || '90');

    this.emailSender = new EmailSender();
  }

  /**
   * 格式化字节为可读格式
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的字符串
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 获取 BWG 服务信息
   * @returns {Promise<Object>} BWG 服务信息
   */
  async getServiceInfo() {
    if (!this.apiKey) {
      throw new Error('BWG_API_KEY environment variable is not set');
    }

    try {
      console.log('🔍 Fetching BWG service information...');

      const response = await axios.get(this.apiUrl, {
        params: {
          veid: this.veid,
          api_key: this.apiKey
        },
        timeout: 30000 // 30秒超时
      });

      if (response.data.error !== 0) {
        throw new Error(`API returned error: ${response.data.error}`);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`API request failed: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error('API request failed: No response received');
      } else {
        throw new Error(`API request failed: ${error.message}`);
      }
    }
  }

  /**
   * 检查磁盘使用情况
   * @param {Object} serviceInfo - BWG 服务信息
   * @returns {Object} 磁盘检查结果
   */
  checkDiskUsage(serviceInfo) {
    const planDisk = serviceInfo.plan_disk; // 计划磁盘大小（字节）

    // 注意：API 返回的数据中没有直接的"已使用磁盘"字段
    // 我们需要通过其他方式估算或使用 ve_used_disk_space_b 如果 API 提供
    // 这里假设可能需要额外的 API 调用来获取实际使用情况

    // 如果 API 响应中有 ve_used_disk_space_b 字段
    const usedDisk = serviceInfo.ve_used_disk_space_b || 0;

    const usagePercent = planDisk > 0 ? (usedDisk / planDisk) * 100 : 0;
    const availableDisk = planDisk - usedDisk;

    let status = 'normal';
    let alertLevel = '✅';

    if (usagePercent >= this.criticalThreshold) {
      status = 'critical';
      alertLevel = '🔴';
    } else if (usagePercent >= this.warningThreshold) {
      status = 'warning';
      alertLevel = '⚠️';
    }

    return {
      status,
      alertLevel,
      planDisk,
      usedDisk,
      availableDisk,
      usagePercent: Math.round(usagePercent * 100) / 100,
      planDiskFormatted: this.formatBytes(planDisk),
      usedDiskFormatted: this.formatBytes(usedDisk),
      availableDiskFormatted: this.formatBytes(availableDisk)
    };
  }

  /**
   * 生成检查报告
   * @param {Object} serviceInfo - BWG 服务信息
   * @param {Object} diskCheck - 磁盘检查结果
   * @returns {string} Markdown 格式的报告
   */
  generateReport(serviceInfo, diskCheck) {
    const timestamp = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    let report = `# ${diskCheck.alertLevel} BWG 服务器磁盘检查报告

## 📊 检查时间
${timestamp}

## 🖥️ 服务器信息
- **主机名**: ${serviceInfo.hostname}
- **节点位置**: ${serviceInfo.node_location}
- **数据中心**: ${serviceInfo.node_datacenter}
- **IP 地址**: ${serviceInfo.ip_addresses.join(', ')}
- **操作系统**: ${serviceInfo.os}
- **计划类型**: ${serviceInfo.plan}

## 💾 磁盘使用情况
- **总容量**: ${diskCheck.planDiskFormatted}
- **已使用**: ${diskCheck.usedDiskFormatted}
- **可用空间**: ${diskCheck.availableDiskFormatted}
- **使用率**: ${diskCheck.usagePercent}%

`;

    // 根据状态添加不同的提示信息
    if (diskCheck.status === 'critical') {
      report += `## 🔴 严重警告

**磁盘使用率已达到 ${diskCheck.usagePercent}%，超过临界阈值 ${this.criticalThreshold}%！**

### 🚨 建议立即采取以下措施：
1. **清理临时文件和日志**: \`sudo journalctl --vacuum-time=7d\`
2. **检查大文件**: \`sudo du -h / | sort -rh | head -20\`
3. **清理 Docker 资源**: \`docker system prune -af\`
4. **清理包管理器缓存**: \`sudo apt-get clean\` 或 \`sudo yum clean all\`
5. **考虑升级服务器套餐**获得更大存储空间

### ⚠️ 风险提示：
- 磁盘满可能导致服务无法正常运行
- 数据库可能无法写入新数据
- 日志服务可能停止工作
- 应用程序可能崩溃

`;
    } else if (diskCheck.status === 'warning') {
      report += `## ⚠️ 警告提醒

**磁盘使用率为 ${diskCheck.usagePercent}%，已超过警告阈值 ${this.warningThreshold}%**

### 💡 建议采取以下措施：
1. 定期清理不需要的文件和日志
2. 检查是否有异常大的文件占用空间
3. 考虑设置日志轮转策略
4. 监控磁盘使用趋势，必要时升级套餐

`;
    } else {
      report += `## ✅ 状态正常

磁盘使用率为 ${diskCheck.usagePercent}%，在正常范围内。

### 📝 建议：
- 继续保持定期监控
- 建议使用率不超过 80%
- 定期清理不需要的文件

`;
    }

    // 添加流量和其他信息
    const dataUsed = this.formatBytes(serviceInfo.data_counter);
    const dataTotal = this.formatBytes(serviceInfo.plan_monthly_data);
    const dataPercent = ((serviceInfo.data_counter / serviceInfo.plan_monthly_data) * 100).toFixed(2);

    const nextReset = new Date(serviceInfo.data_next_reset * 1000).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai'
    });

    report += `## 📈 流量使用情况
- **已使用**: ${dataUsed} / ${dataTotal}
- **使用率**: ${dataPercent}%
- **下次重置**: ${nextReset}

## 💿 服务器配置
- **内存**: ${this.formatBytes(serviceInfo.plan_ram)}
- **Swap**: ${this.formatBytes(serviceInfo.plan_swap)}
- **每月流量**: ${this.formatBytes(serviceInfo.plan_monthly_data)}

---

*本报告由 AI Jarvis 自动生成*
`;

    return report;
  }

  /**
   * 执行检查
   * @returns {Promise<void>}
   */
  async run() {
    console.log('🚀 Starting BWG disk check...');
    console.log(`⚙️ Warning threshold: ${this.warningThreshold}%`);
    console.log(`⚙️ Critical threshold: ${this.criticalThreshold}%`);
    console.log('');

    try {
      // 获取服务信息
      const serviceInfo = await this.getServiceInfo();
      console.log('✅ Service information retrieved successfully');

      // 检查磁盘使用
      const diskCheck = this.checkDiskUsage(serviceInfo);
      console.log(`📊 Disk usage: ${diskCheck.usagePercent}% (${diskCheck.usedDiskFormatted} / ${diskCheck.planDiskFormatted})`);
      console.log(`📈 Status: ${diskCheck.status.toUpperCase()}`);
      console.log('');

      // 生成报告
      const report = this.generateReport(serviceInfo, diskCheck);

      // 决定是否发送邮件
      let shouldSendEmail = false;
      let emailSubject = '';

      if (diskCheck.status === 'critical') {
        shouldSendEmail = true;
        emailSubject = '🔴 BWG 服务器磁盘空间严重不足';
      } else if (diskCheck.status === 'warning') {
        shouldSendEmail = true;
        emailSubject = '⚠️ BWG 服务器磁盘空间警告';
      } else {
        // 正常状态也发送日常报告（可选）
        const sendDailyReport = process.env.BWG_SEND_DAILY_REPORT === 'true';
        if (sendDailyReport) {
          shouldSendEmail = true;
          emailSubject = '✅ BWG 服务器每日检查报告';
        }
      }

      // 输出报告
      console.log('📄 Generated Report:');
      console.log('═'.repeat(80));
      console.log(report);
      console.log('═'.repeat(80));
      console.log('');

      // 发送邮件通知
      if (shouldSendEmail) {
        console.log('📧 Sending email notification...');
        const emailSent = await this.emailSender.sendEmail(emailSubject, report);

        if (emailSent) {
          console.log('✅ Email notification sent successfully');
        } else {
          console.log('⚠️ Email notification was not sent (check email configuration)');
        }
      } else {
        console.log('ℹ️ Email notification skipped (status is normal and daily report is disabled)');
        console.log('💡 Set BWG_SEND_DAILY_REPORT=true to enable daily reports');
      }

      console.log('');
      console.log('✅ BWG disk check completed successfully');

      // 如果磁盘使用率过高，返回非零退出码以便 GitHub Actions 可以标记为失败
      if (diskCheck.status === 'critical') {
        console.error('❌ CRITICAL: Disk usage is critically high!');
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ BWG disk check failed:', error.message);

      // 发送错误通知邮件
      const errorReport = `# ❌ BWG 磁盘检查失败

## 错误信息
${error.message}

## 发生时间
${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

## 可能的原因
- API 密钥配置错误
- 网络连接问题
- API 服务暂时不可用
- VEID 配置错误

## 建议操作
1. 检查 BWG_API_KEY 环境变量是否正确配置
2. 检查 BWG_VEID 是否正确
3. 验证网络连接是否正常
4. 访问 BWG 控制面板确认服务状态

---
*本报告由 AI Jarvis 自动生成*
`;

      await this.emailSender.sendEmail('❌ BWG 磁盘检查失败', errorReport);

      process.exit(1);
    }
  }
}

// 主程序
if (require.main === module) {
  const checker = new BWGDiskChecker();
  checker.run();
}

module.exports = BWGDiskChecker;
