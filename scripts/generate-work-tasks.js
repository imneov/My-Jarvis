/**
 * 工作提醒任务生成器
 * 基于GitHub活动和工作模式生成个性化工作任务
 */

const AITaskGenerator = require('./ai-task-generator');
const EmailSender = require('./email-sender');

async function generateWorkTasks() {
  const generator = new AITaskGenerator();
  const emailSender = new EmailSender();

  try {
    // 获取上下文信息
    const timeContext = generator.getTimeContext();
    const githubContext = await generator.getGitHubContext();

    // 构建工作任务生成提示词
    const prompt = `
你是一个专业的工作效率顾问。请基于以下信息为我生成今天的工作提醒任务:

**时间上下文:**
- 日期: ${timeContext.date}
- 星期: ${timeContext.dayOfWeek}
- 时段: ${timeContext.timeOfDay}
- 是否周末: ${timeContext.isWeekend ? '是' : '否'}

**GitHub项目上下文:**
${githubContext.repos.map(repo => `- ${repo.name} (${repo.language}) - ${repo.description || '无描述'}`).join('\n')}

**任务类型要求:**
1. 代码审查和质量检查
2. 项目进度跟踪和里程碑检查
3. 技术债务清理提醒
4. 文档更新和维护
5. 团队协作和沟通
6. 学习和技能提升
7. 工具和环境优化

**输出格式要求:**
请以JSON格式返回，包含3-5个具体的工作任务，每个任务包含:
- title: 任务标题(简洁明了)
- description: 详细描述(包含具体行动步骤)
- priority: 优先级(high/medium/low)
- estimated_time: 预估时间
- category: 任务类别
- actionable_steps: 具体执行步骤数组

\`\`\`json
{
  "summary": "今日工作重点概述",
  "total_tasks": 4,
  "estimated_total_time": "2-3小时",
  "tasks": [
    {
      "title": "检查项目X的Pull Request",
      "description": "审查昨天提交的PR，确保代码质量和最佳实践",
      "priority": "high",
      "estimated_time": "30分钟",
      "category": "代码审查",
      "actionable_steps": [
        "打开GitHub检查待审查的PR",
        "仔细检查代码逻辑和架构",
        "提供建设性反馈和改进建议"
      ]
    }
  ]
}
\`\`\`

请确保任务具体可执行，避免过于抽象的描述。考虑当前是${timeContext.timeOfDay}，调整任务的紧急程度和工作强度。
`;

    // 生成任务
    const taskData = await generator.generateTasks(prompt, 'work');

    // 发送邮件通知
    const emailContent = `
# 📋 今日工作提醒 - ${timeContext.date}

## 任务概要
- 总任务数: ${taskData.tasks.length}
- 生成时间: ${new Date().toLocaleString('zh-CN')}

## 今日工作任务

${taskData.tasks.map((task, index) => `
### ${index + 1}. ${task.title || '未命名任务'}
**优先级**: ${task.priority || 'medium'}
**预估时间**: ${task.estimated_time || '未知'}
**描述**: ${task.description || '无描述'}

${task.actionable_steps ? '**执行步骤**:\n' + task.actionable_steps.map((step, i) => `${i + 1}. ${step}`).join('\n') : ''}
`).join('\n---\n')}

## AI原始建议
${taskData.ai_response}

---
*此邮件由AI Jarvis系统自动生成*
`;

    await emailSender.sendEmail(
      '📋 今日工作提醒',
      emailContent
    );

    console.log('✅ Work tasks generated and sent successfully');
    console.log(`Generated ${taskData.tasks.length} work tasks`);

  } catch (error) {
    console.error('❌ Error generating work tasks:', error.message);

    // 发送错误通知邮件
    const emailSender = new EmailSender();
    await emailSender.sendEmail(
      '🚨 工作任务生成失败',
      `工作任务生成过程中出现错误:\n\n${error.message}\n\n请检查系统配置和日志。`
    );
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateWorkTasks();
}

module.exports = generateWorkTasks;