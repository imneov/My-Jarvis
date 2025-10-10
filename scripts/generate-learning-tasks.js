/**
 * 学习计划任务生成器
 * 基于技术趋势和个人技能栈生成学习建议
 */

const AITaskGenerator = require('./ai-task-generator');
const EmailSender = require('./email-sender');

async function generateLearningTasks() {
  const generator = new AITaskGenerator();
  const emailSender = new EmailSender();

  try {
    const timeContext = generator.getTimeContext();
    const githubContext = await generator.getGitHubContext();

    // 提取技术栈信息
    const technologies = [...new Set(githubContext.repos
      .map(repo => repo.language)
      .filter(lang => lang)
    )];

    const prompt = `
你是一个资深的技术学习顾问和职业发展专家。请基于以下信息为我制定今天的学习计划:

**个人技术栈:**
${technologies.length > 0 ? technologies.join(', ') : '通用技术栈'}

**当前项目:**
${githubContext.repos.slice(0, 5).map(repo => `- ${repo.name}: ${repo.description || '无描述'}`).join('\n')}

**时间上下文:**
- 日期: ${timeContext.date} (${timeContext.dayOfWeek})
- 时段: ${timeContext.timeOfDay}
- 是否周末: ${timeContext.isWeekend ? '是' : '否'}

**学习方向要求:**
1. 技术深度学习 - 深入当前使用的技术栈
2. 新技术探索 - 了解行业前沿技术趋势
3. 软技能提升 - 提升编程思维和系统设计能力
4. 实践项目 - 通过项目巩固所学知识
5. 社区参与 - 参与开源项目或技术讨论
6. 读书学习 - 阅读技术书籍或文档
7. 视频学习 - 观看高质量技术视频

**输出要求:**
请以JSON格式返回3-4个学习任务，考虑工作日/周末的不同安排:

\`\`\`json
{
  "learning_theme": "今日学习主题",
  "focus_area": "重点学习领域",
  "total_time": "总学习时间",
  "tasks": [
    {
      "title": "学习任务标题",
      "description": "详细学习内容和目标",
      "type": "深度学习/新技术探索/实践项目/阅读学习",
      "difficulty": "beginner/intermediate/advanced",
      "estimated_time": "预估时间",
      "resources": ["推荐资源链接或来源"],
      "learning_goals": ["具体学习目标1", "具体学习目标2"],
      "success_criteria": "如何判断学习成功"
    }
  ],
  "bonus_activities": ["可选的额外学习活动"],
  "weekly_goals": "本周学习目标提醒"
}
\`\`\`

**特别要求:**
- 如果是周末，可以安排更长时间的深度学习
- 如果是工作日，安排短时间高效学习
- 结合当前项目需求，推荐实用的学习内容
- 提供具体的学习资源和路径
- 设定可衡量的学习目标

请确保学习计划既有挑战性又切实可行。
`;

    const taskData = await generator.generateTasks(prompt, 'learning');

    const emailContent = `
# 📚 今日学习计划 - ${timeContext.date}

## 学习概览
- 学习主题: ${taskData.tasks.length > 0 ? '个性化技术提升' : '基础学习'}
- 预计总时间: ${timeContext.isWeekend ? '2-3小时' : '1-1.5小时'}
- 生成时间: ${new Date().toLocaleString('zh-CN')}

## 今日学习任务

${taskData.tasks.map((task, index) => `
### ${index + 1}. ${task.title || '学习任务'}

**类型**: ${task.type || '综合学习'}
**难度**: ${task.difficulty || '中等'}
**时间**: ${task.estimated_time || '30分钟'}

**学习目标**:
${task.learning_goals ? task.learning_goals.map(goal => `- ${goal}`).join('\n') : '- 掌握相关技术概念'}

**详细内容**:
${task.description || '无详细描述'}

**推荐资源**:
${task.resources ? task.resources.map(resource => `- ${resource}`).join('\n') : '- 根据内容自行搜索优质资源'}

**成功标准**:
${task.success_criteria || '能够理解和应用所学内容'}

`).join('\n---\n')}

## 本周学习目标提醒
- 持续提升${technologies.join('、')}技术栈
- 关注行业新技术趋势
- 通过实践项目巩固理论知识

## AI学习建议详情
${taskData.ai_response}

---
*由AI Jarvis学习助手生成 - 让每一天都有进步！*
`;

    await emailSender.sendEmail(
      '📚 今日学习计划',
      emailContent
    );

    console.log('✅ Learning tasks generated and sent successfully');
    console.log(`Generated ${taskData.tasks.length} learning tasks`);

  } catch (error) {
    console.error('❌ Error generating learning tasks:', error.message);

    const emailSender = new EmailSender();
    await emailSender.sendEmail(
      '🚨 学习计划生成失败',
      `学习计划生成过程中出现错误:\n\n${error.message}\n\n请检查系统配置。`
    );
  }
}

if (require.main === module) {
  generateLearningTasks();
}

module.exports = generateLearningTasks;