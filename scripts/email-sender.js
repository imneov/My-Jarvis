/**
 * 邮件发送模块
 * 支持发送HTML格式的邮件通知
 */

const nodemailer = require('nodemailer');

class EmailSender {
  constructor() {
    this.emailService = process.env.EMAIL_SERVICE || 'gmail';
    this.emailUser = process.env.EMAIL_USER;
    this.emailPass = process.env.EMAIL_PASS;
    this.notificationEmail = process.env.NOTIFICATION_EMAIL;

    // 创建邮件传输器
    this.transporter = this.createTransporter();
  }

  /**
   * 创建邮件传输器
   * @returns {Object} nodemailer传输器对象
   */
  createTransporter() {
    if (!this.emailUser || !this.emailPass) {
      console.warn('⚠️ Email credentials not configured, emails will not be sent');
      return null;
    }

    try {
      return nodemailer.createTransporter({
        service: this.emailService,
        auth: {
          user: this.emailUser,
          pass: this.emailPass
        },
        secure: true,
        tls: {
          rejectUnauthorized: false
        }
      });
    } catch (error) {
      console.error('❌ Failed to create email transporter:', error.message);
      return null;
    }
  }

  /**
   * 将Markdown转换为HTML
   * @param {string} markdown - Markdown格式的文本
   * @returns {string} HTML格式的文本
   */
  markdownToHtml(markdown) {
    return markdown
      // 标题转换
      .replace(/^# (.*$)/gm, '<h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="color: #34495e; margin-top: 25px;">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 style="color: #7f8c8d; margin-top: 20px;">$1</h3>')

      // 粗体和斜体
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #2980b9;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')

      // 代码块
      .replace(/```[\s\S]*?```/g, '<pre style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007acc; overflow-x: auto;"><code>$&</code></pre>')
      .replace(/`([^`]+)`/g, '<code style="background-color: #f1f2f6; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')

      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3498db; text-decoration: none;">$1</a>')

      // 列表
      .replace(/^- (.*$)/gm, '<li style="margin: 5px 0;">$1</li>')
      .replace(/(<li.*<\/li>)/s, '<ul style="padding-left: 20px;">$1</ul>')

      // 分割线
      .replace(/^---$/gm, '<hr style="border: none; border-top: 2px solid #ecf0f1; margin: 20px 0;">')

      // 换行
      .replace(/\n\n/g, '</p><p style="margin: 10px 0;">')
      .replace(/\n/g, '<br>');
  }

  /**
   * 生成邮件HTML模板
   * @param {string} subject - 邮件主题
   * @param {string} content - 邮件内容(Markdown格式)
   * @returns {string} HTML格式的邮件内容
   */
  generateHtmlTemplate(subject, content) {
    const htmlContent = this.markdownToHtml(content);

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .content {
            background-color: #ffffff;
            padding: 30px;
            border: 1px solid #e1e8ed;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .footer {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
        .emoji {
            font-size: 1.2em;
        }
        .timestamp {
            color: #6c757d;
            font-size: 0.9em;
            text-align: right;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">🤖 AI Jarvis 智能助手</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${subject}</p>
    </div>

    <div class="content">
        <p style="margin: 10px 0;">
        ${htmlContent}
        </p>

        <div class="timestamp">
            发送时间: ${new Date().toLocaleString('zh-CN', {
              timeZone: 'Asia/Shanghai',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
        </div>
    </div>

    <div class="footer">
        <p>此邮件由 <strong>AI Jarvis</strong> 智能助手自动生成</p>
        <p>🔧 基于 Claude AI + GitHub Actions 驱动</p>
        <p>💡 让AI成为你的贴身助手，提升每一天的效率！</p>
    </div>
</body>
</html>`;
  }

  /**
   * 发送邮件
   * @param {string} subject - 邮件主题
   * @param {string} content - 邮件内容(支持Markdown)
   * @param {string} to - 收件人邮箱(可选，默认使用环境变量)
   * @returns {Promise<boolean>} 发送结果
   */
  async sendEmail(subject, content, to = null) {
    if (!this.transporter) {
      console.log('📧 Email transporter not available, content would be:');
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${content.substring(0, 200)}...`);
      return false;
    }

    const recipientEmail = to || this.notificationEmail;

    if (!recipientEmail) {
      console.error('❌ No recipient email configured');
      return false;
    }

    try {
      const htmlContent = this.generateHtmlTemplate(subject, content);

      const mailOptions = {
        from: `"AI Jarvis 🤖" <${this.emailUser}>`,
        to: recipientEmail,
        subject: `${subject} - ${new Date().toLocaleDateString('zh-CN')}`,
        text: content, // 纯文本版本
        html: htmlContent // HTML版本
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.log('✅ Email sent successfully');
      console.log(`📧 To: ${recipientEmail}`);
      console.log(`📝 Subject: ${subject}`);
      console.log(`🆔 Message ID: ${result.messageId}`);

      return true;

    } catch (error) {
      console.error('❌ Failed to send email:', error.message);

      // 记录详细错误信息用于调试
      if (error.code) {
        console.error(`Error Code: ${error.code}`);
      }
      if (error.response) {
        console.error(`SMTP Response: ${error.response}`);
      }

      return false;
    }
  }

  /**
   * 发送测试邮件
   * @returns {Promise<boolean>} 测试结果
   */
  async sendTestEmail() {
    const testContent = `
# 🧪 AI Jarvis 测试邮件

这是一封测试邮件，用于验证邮件发送功能是否正常工作。

## 系统状态
- ✅ AI任务生成器: 正常
- ✅ GitHub Actions: 正常
- ✅ 邮件发送: 正常

## 测试功能
- **Markdown渲染**: 支持 **粗体** 和 *斜体*
- **代码显示**: \`console.log('Hello World')\`
- **列表展示**:
  - 工作提醒 ✅
  - 学习计划 ✅
  - 健康建议 ✅
  - 市场分析 ✅

如果你收到这封邮件，说明AI Jarvis邮件系统工作正常！

---
*测试时间: ${new Date().toLocaleString('zh-CN')}*
`;

    return await this.sendEmail('🧪 AI Jarvis 系统测试', testContent);
  }

  /**
   * 验证邮件配置
   * @returns {Promise<boolean>} 配置验证结果
   */
  async verifyConfiguration() {
    if (!this.transporter) {
      console.log('❌ Email transporter not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email configuration verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email configuration verification failed:', error.message);
      return false;
    }
  }
}

module.exports = EmailSender;