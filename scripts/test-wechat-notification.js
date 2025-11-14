/**
 * 企业微信通知测试脚本
 * 用于验证企业微信 Webhook 配置是否正确
 */

const EmailSender = require('./email-sender');

async function testWechatNotification() {
  console.log('🧪 开始测试企业微信通知功能...\n');

  // 检查环境变量
  if (!process.env.WECHAT_WEBHOOK_URL) {
    console.error('❌ 错误：未配置 WECHAT_WEBHOOK_URL 环境变量');
    console.log('💡 请设置环境变量：');
    console.log('   export WECHAT_WEBHOOK_URL="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=your-key"');
    process.exit(1);
  }

  console.log('✅ 检测到企业微信 Webhook 配置');
  console.log(`📱 Webhook URL: ${process.env.WECHAT_WEBHOOK_URL.substring(0, 60)}...\n`);

  const emailSender = new EmailSender();

  // 测试消息内容
  const testContent = `
# 🧪 AI Jarvis 测试消息

这是一条测试消息，用于验证企业微信通知功能是否正常工作。

## 系统状态
- ✅ AI任务生成器: 正常
- ✅ GitHub Actions: 正常
- ✅ 企业微信通知: 测试中...

## 功能特性
- **Markdown支持**: 自动转换为纯文本格式
- **实时通知**: 即时推送到企业微信群
- **可靠性高**: 比邮件更稳定

如果你在企业微信中收到这条消息，说明配置成功！

---
*测试时间: ${new Date().toLocaleString('zh-CN')}*
`;

  try {
    console.log('📤 正在发送测试消息...');
    const result = await emailSender.sendWechatNotification(
      '🧪 AI Jarvis 系统测试',
      testContent
    );

    if (result) {
      console.log('\n✅ 测试成功！');
      console.log('📱 请检查你的企业微信群，确认是否收到测试消息');
      console.log('\n💡 下一步：');
      console.log('   1. 确认消息格式是否符合预期');
      console.log('   2. 如果收到消息，可以开始使用 AI Jarvis 了');
      console.log('   3. 如果没有收到，请检查 Webhook URL 是否正确');
    } else {
      console.log('\n❌ 测试失败');
      console.log('💡 故障排查：');
      console.log('   1. 检查 Webhook URL 是否正确');
      console.log('   2. 确认群机器人是否被移除');
      console.log('   3. 查看上方的错误日志');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    console.error('详细信息:', error);
    process.exit(1);
  }
}

// 执行测试
testWechatNotification();
