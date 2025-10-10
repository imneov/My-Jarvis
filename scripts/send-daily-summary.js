/**
 * 每日汇总邮件发送器
 * 汇总当天所有AI生成的任务并发送综合报告
 */

const fs = require('fs').promises;
const path = require('path');
const EmailSender = require('./email-sender');

async function sendDailySummary() {
  const emailSender = new EmailSender();

  try {
    // 获取今天的日期
    const today = new Date().toISOString().split('T')[0];
    const tasksDir = path.join(__dirname, '../tasks');

    // 读取今天生成的所有任务文件
    const taskFiles = await getAllTodayTasks(tasksDir, today);

    if (taskFiles.length === 0) {
      console.log('📭 No tasks generated today, skipping summary email');
      return;
    }

    // 汇总任务数据
    const summary = await compileDailySummary(taskFiles);

    // 生成汇总邮件内容
    const emailContent = generateSummaryEmail(summary, today);

    // 发送汇总邮件
    await emailSender.sendEmail(
      '📋 AI Jarvis 每日任务汇总',
      emailContent
    );

    console.log('✅ Daily summary email sent successfully');

  } catch (error) {
    console.error('❌ Error sending daily summary:', error.message);

    // 发送错误通知
    const emailSender = new EmailSender();
    await emailSender.sendEmail(
      '🚨 每日汇总邮件发送失败',
      `每日汇总邮件发送过程中出现错误:\n\n${error.message}\n\n请检查系统配置。`
    );
  }
}

/**
 * 获取今天生成的所有任务文件
 * @param {string} tasksDir - 任务目录路径
 * @param {string} today - 今天的日期(YYYY-MM-DD)
 * @returns {Array} 任务文件数据数组
 */
async function getAllTodayTasks(tasksDir, today) {
  try {
    // 确保任务目录存在
    await fs.mkdir(tasksDir, { recursive: true });

    const files = await fs.readdir(tasksDir);
    const todayFiles = files.filter(file => file.includes(today) && file.endsWith('.json'));

    const taskFiles = [];

    for (const file of todayFiles) {
      try {
        const filePath = path.join(tasksDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const taskData = JSON.parse(content);
        taskFiles.push(taskData);
      } catch (error) {
        console.error(`Error reading task file ${file}:`, error.message);
      }
    }

    return taskFiles;
  } catch (error) {
    console.error('Error reading tasks directory:', error.message);
    return [];
  }
}

/**
 * 编译每日任务汇总数据
 * @param {Array} taskFiles - 任务文件数组
 * @returns {Object} 汇总数据
 */
async function compileDailySummary(taskFiles) {
  const summary = {
    totalTasks: 0,
    categories: {},
    highlights: [],
    timeEstimate: '0分钟',
    priorityBreakdown: { high: 0, medium: 0, low: 0 },
    generationErrors: []
  };

  for (const taskFile of taskFiles) {
    const category = taskFile.category;

    // 初始化类别
    if (!summary.categories[category]) {
      summary.categories[category] = {
        taskCount: 0,
        tasks: [],
        hasError: false,
        error: null
      };
    }

    // 处理错误情况
    if (taskFile.error) {
      summary.categories[category].hasError = true;
      summary.categories[category].error = taskFile.error;
      summary.generationErrors.push(`${category}: ${taskFile.error}`);
      continue;
    }

    // 统计任务
    const tasks = taskFile.tasks || [];
    summary.totalTasks += tasks.length;
    summary.categories[category].taskCount = tasks.length;
    summary.categories[category].tasks = tasks;

    // 统计优先级
    for (const task of tasks) {
      const priority = task.priority || 'medium';
      if (summary.priorityBreakdown[priority] !== undefined) {
        summary.priorityBreakdown[priority]++;
      }

      // 收集亮点任务
      if (priority === 'high' || task.title?.includes('重要') || task.title?.includes('紧急')) {
        summary.highlights.push({
          category,
          title: task.title,
          priority: priority
        });
      }
    }
  }

  // 计算总预估时间(简单估算)
  const avgTimePerTask = 25; // 平均每个任务25分钟
  const totalMinutes = summary.totalTasks * avgTimePerTask;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    summary.timeEstimate = `${hours}小时${minutes}分钟`;
  } else {
    summary.timeEstimate = `${minutes}分钟`;
  }

  return summary;
}

/**
 * 生成汇总邮件内容
 * @param {Object} summary - 汇总数据
 * @param {string} today - 今天的日期
 * @returns {string} 邮件内容
 */
function generateSummaryEmail(summary, today) {
  const weekday = new Date().toLocaleDateString('zh-CN', { weekday: 'long' });

  const content = `
# 📋 AI Jarvis 每日任务汇总 - ${today}

欢迎回到新的一天！你的AI助手已经为你准备好了今天的任务清单。

## 📊 今日概览

- **总任务数**: ${summary.totalTasks} 个
- **预估总时间**: ${summary.timeEstimate}
- **生成时间**: ${new Date().toLocaleString('zh-CN')}
- **星期**: ${weekday}

### 优先级分布
- 🔴 高优先级: ${summary.priorityBreakdown.high} 个
- 🟡 中优先级: ${summary.priorityBreakdown.medium} 个
- 🟢 低优先级: ${summary.priorityBreakdown.low} 个

## 🎯 重点关注任务

${summary.highlights.length > 0 ?
  summary.highlights.map((task, index) =>
    `${index + 1}. **${task.title}** (${task.category} - ${task.priority}优先级)`
  ).join('\n') :
  '今日没有特别标记的高优先级任务，可以按计划稳步推进。'
}

## 📋 分类任务详情

${Object.entries(summary.categories).map(([category, data]) => {
  const categoryNames = {
    'work': '💼 工作提醒',
    'learning': '📚 学习计划',
    'health': '💪 健康建议',
    'market': '📊 市场分析'
  };

  const categoryName = categoryNames[category] || `📌 ${category}`;

  if (data.hasError) {
    return `### ${categoryName} ❌
**状态**: 生成失败
**错误**: ${data.error}
**建议**: 请检查系统配置或手动创建该类型任务`;
  }

  return `### ${categoryName} (${data.taskCount} 个任务)

${data.tasks.map((task, index) => `
**${index + 1}. ${task.title || '未命名任务'}**
- 优先级: ${task.priority || 'medium'}
- 预估时间: ${task.estimated_time || '未知'}
- 描述: ${task.description || '无描述'}
${task.actionable_steps ? '- 步骤: ' + task.actionable_steps.join(' → ') : ''}
`).join('\n')}`;
}).join('\n\n')}

${summary.generationErrors.length > 0 ? `
## ⚠️ 错误提醒

以下类别的任务生成遇到问题:
${summary.generationErrors.map(error => `- ${error}`).join('\n')}

请检查相关配置或联系管理员。
` : ''}

## 💡 使用建议

1. **晨间规划**: 建议优先处理高优先级任务
2. **时间管理**: 可以将任务分解到不同时间段
3. **灵活调整**: 根据实际情况调整任务顺序和时间
4. **及时反馈**: 完成任务后可以记录心得和改进建议

## 🎯 今日格言

> "每一天都是一个新的开始，每一个任务都是向目标迈进的一步。让AI成为你的伙伴，一起创造更高效的一天！"

---

**系统信息**:
- 任务生成时间: ${new Date().toLocaleString('zh-CN')}
- 系统版本: AI Jarvis v1.0
- 运行环境: GitHub Actions + Claude AI

祝你今天工作顺利，学习愉快！🚀

---
*由 AI Jarvis 智能助手生成*
`;

  return content;
}

// 如果直接运行此脚本
if (require.main === module) {
  sendDailySummary();
}

module.exports = sendDailySummary;