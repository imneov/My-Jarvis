# BWG VPS 磁盘监控配置指南

## 📋 功能概述

BWG (BandwagonHost) VPS 磁盘监控功能可以帮助你：
- 每天自动检查 VPS 磁盘使用情况
- 在磁盘使用率达到警告或严重阈值时发送邮件提醒
- 生成详细的服务器状态报告，包括磁盘、流量、配置等信息
- 避免因磁盘空间不足导致的服务故障

## 🔧 配置步骤

### 1. 获取 BWG API Key 和 VEID

#### 获取 API Key

1. 登录你的 BandwagonHost 账户: https://bwh88.net/clientarea.php
2. 点击菜单 **Services** > **My Services**
3. 选择你要监控的 VPS 服务
4. 点击 **KiwiVM Control Panel** 按钮
5. 在左侧菜单中找到 **API** 或者在控制面板首页查看
6. 复制你的 API Key（格式类似：`private_CNMz0jMlTwoUC1DqGHR4dZr8`）

#### 获取 VEID

VEID 是你的 VPS 唯一标识符，有几种方式可以找到：

**方法 1：从 URL 获取**
- 在 KiwiVM Control Panel 中，查看浏览器地址栏
- URL 类似：`https://kiwivm.64clouds.com/main.php?veid=666722`
- `veid=` 后面的数字就是你的 VEID

**方法 2：从控制面板获取**
- 在 KiwiVM Control Panel 首页可以看到 VEID 信息
- 通常显示为 "VE ID: 666722"

### 2. 配置 GitHub Secrets

在你的 GitHub 仓库中添加以下 Secrets：

1. 进入仓库 **Settings** > **Secrets and variables** > **Actions**
2. 点击 **New repository secret** 添加以下变量：

#### 必需的 Secrets

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `BWG_API_KEY` | BWG API 密钥 | `private_CNMz0jMlTwoUC1DqGHR4dZr8` |
| `BWG_VEID` | BWG VPS ID | `666722` |

#### 可选的 Secrets（使用默认值）

| Secret 名称 | 说明 | 默认值 | 推荐值 |
|------------|------|--------|--------|
| `BWG_DISK_WARNING_THRESHOLD` | 磁盘警告阈值（百分比） | `80` | 70-85 |
| `BWG_DISK_CRITICAL_THRESHOLD` | 磁盘严重阈值（百分比） | `90` | 85-95 |
| `BWG_SEND_DAILY_REPORT` | 是否发送每日正常报告 | `false` | `true`/`false` |

### 3. 配置邮件通知

确保已经配置了邮件发送相关的 Secrets（如果还没有配置）：

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `EMAIL_SERVICE` | 邮件服务商 | `gmail` |
| `EMAIL_USER` | 发送邮箱 | `your-email@gmail.com` |
| `EMAIL_PASS` | 邮箱应用密码 | `abcd efgh ijkl mnop` |
| `NOTIFICATION_EMAIL` | 接收通知的邮箱 | `your-notification@gmail.com` |

## 📊 阈值配置建议

### 警告阈值 (Warning Threshold)
- **推荐值**: 70-80%
- **说明**: 达到此阈值时会发送警告邮件，提醒你注意磁盘空间
- **适用场景**:
  - 生产环境建议设置为 70%，留出充足的处理时间
  - 测试环境可以设置为 80%

### 严重阈值 (Critical Threshold)
- **推荐值**: 85-90%
- **说明**: 达到此阈值时会发送严重警告邮件，并建议立即处理
- **适用场景**:
  - 数据库服务器建议设置为 85%
  - 一般应用服务器可以设置为 90%

### 每日报告设置
- **建议**: 设置为 `false`（仅在异常时接收通知）
- **如果设置为 `true`**: 即使磁盘状态正常，也会每天发送报告
- **适用场景**: 需要详细监控服务器状态的生产环境

## 🔔 通知策略

### 发送邮件的情况

1. **磁盘使用率 >= 严重阈值**
   - 邮件主题: 🔴 BWG 服务器磁盘空间严重不足
   - 邮件内容: 包含严重警告和立即处理建议
   - 行为: GitHub Action 会以失败状态结束（exit code 1）

2. **磁盘使用率 >= 警告阈值**
   - 邮件主题: ⚠️ BWG 服务器磁盘空间警告
   - 邮件内容: 包含警告提示和预防性建议

3. **磁盘状态正常 + 启用每日报告**
   - 邮件主题: ✅ BWG 服务器每日检查报告
   - 邮件内容: 包含当前状态和常规建议

4. **API 调用失败**
   - 邮件主题: ❌ BWG 磁盘检查失败
   - 邮件内容: 包含错误信息和故障排查建议

### 不发送邮件的情况

- 磁盘状态正常 + 未启用每日报告

## 📧 邮件报告内容

邮件报告包含以下信息：

### 服务器信息
- 主机名
- 节点位置和数据中心
- IP 地址
- 操作系统
- 计划类型

### 磁盘使用情况
- 总容量
- 已使用空间
- 可用空间
- 使用率百分比

### 流量使用情况
- 已使用流量
- 总流量配额
- 使用率
- 下次重置时间

### 服务器配置
- 内存大小
- Swap 大小
- 每月流量配额

### 操作建议
根据磁盘状态提供相应的处理建议

## 🧪 测试配置

### 方法 1: 使用 npm 命令测试（本地）

```bash
# 设置环境变量
export BWG_API_KEY="your-api-key"
export BWG_VEID="666722"
export EMAIL_SERVICE="gmail"
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-app-password"
export NOTIFICATION_EMAIL="your-notification@gmail.com"

# 运行检查
npm run check:bwg
```

### 方法 2: 在 GitHub Actions 中手动触发

1. 进入仓库的 **Actions** 标签页
2. 选择 **Daily AI Tasks** workflow
3. 点击 **Run workflow** 按钮
4. 选择分支并点击 **Run workflow**
5. 等待执行完成，查看日志

### 方法 3: 测试 API 连接

使用 curl 测试 API 是否可访问：

```bash
curl "https://api.64clouds.com/v1/getServiceInfo?veid=YOUR_VEID&api_key=YOUR_API_KEY"
```

## 🐛 故障排查

### 问题 1: API 调用失败

**症状**: 收到 "BWG 磁盘检查失败" 邮件，错误信息显示 API 请求失败

**可能原因**:
- API Key 配置错误
- VEID 配置错误
- 网络连接问题
- BWG API 服务暂时不可用

**解决方案**:
1. 验证 API Key 格式是否正确（应该以 `private_` 开头）
2. 确认 VEID 是纯数字
3. 使用 curl 命令测试 API 是否可访问
4. 检查 GitHub Actions 日志查看详细错误信息

### 问题 2: 没有收到邮件

**可能原因**:
- 邮件配置错误
- 磁盘状态正常且未启用每日报告
- 邮件被标记为垃圾邮件

**解决方案**:
1. 检查邮件配置的 Secrets 是否正确
2. 检查垃圾邮件文件夹
3. 设置 `BWG_SEND_DAILY_REPORT=true` 强制发送报告
4. 使用 `npm run test:email` 测试邮件配置

### 问题 3: 磁盘使用率显示为 0%

**可能原因**:
BWG API 响应中可能没有 `ve_used_disk_space_b` 字段

**解决方案**:
这是 API 限制，某些 BWG 套餐可能不提供实时磁盘使用信息。你可以：
1. 联系 BWG 客服确认 API 支持情况
2. 使用其他监控工具补充（如 Zabbix、Prometheus）
3. 通过 SSH 登录服务器手动检查

### 问题 4: GitHub Actions 执行失败

**可能原因**:
- 缺少必需的 Secrets
- workflow 文件语法错误
- Node.js 依赖安装失败

**解决方案**:
1. 确认所有必需的 Secrets 都已配置
2. 检查 `.github/workflows/daily-ai-tasks.yml` 语法
3. 查看 Actions 日志中的详细错误信息
4. 确保仓库启用了 GitHub Actions

## 📈 高级配置

### 自定义检查时间

在 `.github/workflows/daily-ai-tasks.yml` 中修改 cron 表达式：

```yaml
on:
  schedule:
    # 每天早上 8:00 UTC (北京时间 16:00)
    - cron: '0 8 * * *'

    # 每天凌晨 2:00 UTC (北京时间 10:00)
    # - cron: '0 2 * * *'

    # 每 6 小时检查一次
    # - cron: '0 */6 * * *'
```

### 监控多个 VPS

如果你有多个 BWG VPS 需要监控，可以：

1. **方案 1**: 为每个 VPS 创建单独的脚本和 workflow
2. **方案 2**: 修改脚本支持配置数组（需要修改代码）
3. **方案 3**: 使用 GitHub Actions Matrix 策略

示例（方案 3）：

```yaml
strategy:
  matrix:
    vps:
      - veid: "666722"
        name: "VPS-1"
      - veid: "888888"
        name: "VPS-2"

steps:
  - name: Check BWG Disk - ${{ matrix.vps.name }}
    env:
      BWG_VEID: ${{ matrix.vps.veid }}
      BWG_API_KEY: ${{ secrets.BWG_API_KEY }}
      # ... 其他环境变量
```

### 集成到监控系统

你可以将检查结果发送到其他监控系统：

1. **Slack**: 添加 Slack Webhook 通知
2. **Prometheus**: 导出 metrics
3. **Grafana**: 可视化历史数据
4. **PagerDuty**: 关键告警通知

## 📝 最佳实践

1. **设置合理的阈值**
   - 根据服务器用途和重要性调整
   - 留出充足的处理时间

2. **定期查看报告**
   - 即使是正常报告也要定期检查
   - 了解磁盘使用趋势

3. **及时清理磁盘**
   - 不要等到严重警告才处理
   - 建立定期清理计划

4. **监控多个指标**
   - 除了磁盘，也关注流量、内存等
   - 建立全面的监控体系

5. **保留历史数据**
   - 保存历史报告用于分析
   - 了解资源使用模式

6. **设置告警升级机制**
   - 严重告警同时通知多个渠道
   - 建立应急响应流程

## 🔗 相关资源

- [BandwagonHost 官网](https://bwh88.net/)
- [BWG API 文档](https://kiwivm.64clouds.com/api.html)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Node.js Axios 文档](https://axios-http.com/)

## 💡 常见问题

**Q: 为什么要监控磁盘？**
A: 磁盘满会导致服务崩溃、数据库无法写入、日志停止等严重问题。提前预警可以避免这些问题。

**Q: 多久检查一次合适？**
A: 建议每天检查一次。如果是高负载服务器，可以增加到每 6 小时或每 3 小时一次。

**Q: 收到警告后应该怎么做？**
A: 立即登录服务器检查，清理不需要的文件，必要时升级套餐。邮件中会包含详细的处理建议。

**Q: 这会占用很多 API 配额吗？**
A: 不会。BWG API 通常没有严格的配额限制，每天一次的检查不会造成任何问题。

**Q: 可以关闭邮件通知吗？**
A: 不建议完全关闭。你可以调整阈值或只在严重情况下接收通知。

---

如有其他问题，欢迎在 [Issues](https://github.com/your-username/My-Jarvis/issues) 中提出。
