# 变更日志

## [Unreleased]

### 🐛 Bug 修复
- 修复了 `nodemailer.createTransporter is not a function` 错误
  - 添加了 nodemailer 模块的安全导入检查
  - 改进了错误处理，避免在 nodemailer 不可用时崩溃

### ✨ 新功能
- **企业微信 Webhook 通知支持**
  - 添加了企业微信群机器人通知功能
  - 支持通过 `WECHAT_WEBHOOK_URL` 环境变量配置
  - 系统优先使用企业微信通知，如果未配置则回退到邮件通知
  - 智能格式化内容以适应企业微信文本消息格式

### 📝 文档更新
- 更新 README.md，添加企业微信配置说明
- 添加通知方式选择指南
- 补充常见问题和故障排除信息

### ⚙️ 配置变更
- GitHub Actions workflow 中添加 `WECHAT_WEBHOOK_URL` 环境变量支持
- 所有任务生成步骤现在都支持企业微信通知

### 🔧 技术改进
- 改进了通知系统的容错性
- 添加了更详细的日志输出
- 优化了企业微信消息内容格式化逻辑

---

## 升级指南

### 从旧版本升级

1. **配置企业微信 Webhook**（推荐）
   - 在 GitHub Secrets 中添加 `WECHAT_WEBHOOK_URL`
   - 值为企业微信群机器人的 Webhook URL

2. **保持邮件通知**（可选）
   - 如果已配置邮件，无需修改
   - 如果配置了企业微信，邮件配置可作为备用方案

3. **更新代码**
   - 拉取最新代码
   - 重新运行 GitHub Actions workflow

### 兼容性说明
- 完全向后兼容，无需修改现有配置
- 邮件通知功能保持不变
- 新增的企业微信功能为可选特性
