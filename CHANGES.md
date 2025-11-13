# 变更说明 - BWG 磁盘监控功能

## 📝 变更概述

本次更新添加了 BandwagonHost (BWG) VPS 磁盘使用监控功能，可以每天自动检查服务器磁盘空间并在超过阈值时发送警告邮件。

## ✨ 新增功能

### 1. BWG 磁盘检查脚本 (`scripts/check-bwg-disk.js`)

**功能特性:**
- 通过 BWG API 获取服务器信息
- 检查磁盘使用率并与阈值比较
- 生成详细的 Markdown 格式报告
- 根据磁盘状态发送不同级别的邮件通知
- 包含服务器配置和流量使用信息

**核心能力:**
- ✅ 磁盘使用率计算和监控
- ⚠️ 警告阈值检测（默认 80%）
- 🔴 严重阈值检测（默认 90%）
- 📧 智能邮件通知策略
- 📊 详细的服务器状态报告
- 🔍 API 错误处理和故障通知

### 2. GitHub Actions 工作流更新

**文件:** `.github/workflows/daily-ai-tasks.yml`

**新增内容:**
- 添加 "Check BWG Disk Usage" 步骤
- 配置必要的环境变量
- 设置 `continue-on-error: true` 避免影响其他任务

### 3. 文档更新

**更新的文件:**
- `README.md` - 添加 BWG 监控功能说明和配置指南
- `package.json` - 添加 `npm run check:bwg` 脚本

**新增的文件:**
- `docs/BWG-MONITORING-SETUP.md` - 详细的配置和使用指南

## 🔧 配置要求

### 必需的 GitHub Secrets

```
BWG_API_KEY       # BWG API 密钥
BWG_VEID          # BWG VPS ID
```

### 可选的 GitHub Secrets（有默认值）

```
BWG_DISK_WARNING_THRESHOLD=80    # 警告阈值
BWG_DISK_CRITICAL_THRESHOLD=90   # 严重阈值
BWG_SEND_DAILY_REPORT=false      # 是否发送每日报告
```

### 已有的邮件配置 Secrets（必需）

```
EMAIL_SERVICE
EMAIL_USER
EMAIL_PASS
NOTIFICATION_EMAIL
```

## 📊 工作流程

1. **每天自动执行**
   - GitHub Actions 定时任务触发（cron: '0 8 * * *'）
   - 可通过 workflow_dispatch 手动触发

2. **磁盘检查流程**
   ```
   调用 BWG API → 获取服务器信息 → 计算磁盘使用率
   → 与阈值比较 → 生成报告 → 发送邮件（如需要）
   ```

3. **通知策略**
   - 磁盘使用 >= 90%: 🔴 严重警告 + 邮件 + 任务失败
   - 磁盘使用 >= 80%: ⚠️ 警告 + 邮件
   - 磁盘正常 + 启用日报: ✅ 正常报告 + 邮件
   - 磁盘正常 + 未启用日报: ℹ️ 不发送邮件

## 📧 邮件报告内容

每封报告包含：

- **服务器信息**: 主机名、位置、IP、系统等
- **磁盘使用情况**: 总容量、已使用、可用空间、使用率
- **流量使用情况**: 已用/总量、使用率、重置时间
- **服务器配置**: 内存、Swap、流量配额
- **操作建议**: 根据状态提供相应的处理建议

## 🧪 测试方法

### 本地测试

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

### GitHub Actions 测试

1. 进入仓库 Actions 标签页
2. 选择 "Daily AI Tasks" workflow
3. 点击 "Run workflow" 手动触发
4. 查看执行日志和结果

### API 连接测试

```bash
curl "https://api.64clouds.com/v1/getServiceInfo?veid=YOUR_VEID&api_key=YOUR_API_KEY"
```

## 🔍 技术实现细节

### API 调用

- **端点**: `https://api.64clouds.com/v1/getServiceInfo`
- **参数**: `veid`, `api_key`
- **超时**: 30 秒
- **错误处理**: 完整的错误捕获和通知机制

### 磁盘计算

```javascript
usagePercent = (usedDisk / planDisk) * 100
```

**注意**: API 响应中需要包含 `ve_used_disk_space_b` 字段。某些 BWG 套餐可能不提供此字段。

### 错误处理

- API 调用失败 → 发送错误通知邮件
- 邮件发送失败 → 控制台输出警告
- 严重磁盘使用 → 任务以失败状态退出（exit 1）

## 📈 使用场景

1. **生产环境监控**
   - 防止磁盘满导致服务故障
   - 及时发现异常磁盘使用

2. **资源管理**
   - 了解磁盘使用趋势
   - 规划存储空间升级

3. **故障预防**
   - 提前警告避免突发问题
   - 留出充足的处理时间

## 🚀 后续优化建议

1. **多 VPS 支持**
   - 使用 GitHub Actions Matrix 策略
   - 支持配置数组监控多个服务器

2. **历史数据存储**
   - 将检查结果保存到数据库
   - 生成使用趋势图表

3. **更多监控指标**
   - CPU 使用率
   - 内存使用率
   - 网络流量统计

4. **集成其他通知渠道**
   - Slack/Discord Webhook
   - 企业微信/钉钉机器人
   - SMS 短信通知

5. **自动化处理**
   - 自动清理临时文件
   - 自动扩容（如果 API 支持）
   - 自动备份重要数据

## 🔗 相关资源

- **BWG API 文档**: https://kiwivm.64clouds.com/api.html
- **配置指南**: `docs/BWG-MONITORING-SETUP.md`
- **项目 README**: `README.md`

## 📝 注意事项

1. **API Key 安全**
   - 使用 GitHub Secrets 存储
   - 不要提交到代码仓库
   - 定期轮换密钥

2. **阈值设置**
   - 根据实际情况调整
   - 生产环境建议更保守的阈值

3. **邮件频率**
   - 避免过度通知造成干扰
   - 建议使用默认策略（仅异常通知）

4. **API 限制**
   - BWG API 可能有调用频率限制
   - 每天一次检查是安全的频率

## ✅ 变更清单

- [x] 创建 BWG 磁盘检查脚本
- [x] 更新 GitHub Actions 工作流
- [x] 更新 README 文档
- [x] 更新 package.json 脚本
- [x] 创建详细配置指南
- [x] 添加错误处理和通知
- [x] 实现智能通知策略
- [x] 完善文档和注释

## 🎯 版本信息

- **版本**: 1.1.0
- **更新日期**: 2025-01-XX
- **兼容性**: Node.js >= 18.0.0
- **依赖**: axios, nodemailer

---

**问题反馈**: 如遇到问题，请在 GitHub Issues 中提出
