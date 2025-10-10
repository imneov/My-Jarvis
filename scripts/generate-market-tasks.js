/**
 * 市场分析任务生成器
 * 生成技术市场趋势分析和投资建议
 */

const AITaskGenerator = require('./ai-task-generator');
const EmailSender = require('./email-sender');

async function generateMarketTasks() {
  const generator = new AITaskGenerator();
  const emailSender = new EmailSender();

  try {
    const timeContext = generator.getTimeContext();
    const githubContext = await generator.getGitHubContext();

    // 提取关注的技术领域
    const technologies = [...new Set(githubContext.repos
      .map(repo => repo.language)
      .filter(lang => lang)
    )];

    const prompt = `
你是一位资深的技术市场分析师和投资顾问。请基于以下信息生成今天的市场分析和关注要点:

**时间背景:**
- 日期: ${timeContext.date} (${timeContext.dayOfWeek})
- 时段: ${timeContext.timeOfDay}

**技术关注领域:**
${technologies.length > 0 ? technologies.join(', ') : 'AI, Cloud Computing, Web Development'}

**分析维度要求:**
1. **技术趋势分析** - 当前热门技术和未来趋势
2. **市场机会识别** - 新兴市场和商业机会
3. **投资关注点** - 科技股和相关投资机会
4. **行业动态** - 重要公司动态和产品发布
5. **技能市场** - 技术人才需求和薪资趋势
6. **竞品分析** - 主要竞争对手和产品对比
7. **政策影响** - 相关政策对技术行业的影响

**特别关注:**
- AI和机器学习领域的最新进展
- 云计算和基础设施发展
- 开源项目和社区动态
- 全球科技公司财报和战略调整
- 新兴技术的商业化进程

**输出格式:**
\`\`\`json
{
  "market_summary": "今日市场概述",
  "key_trends": ["关键趋势1", "关键趋势2", "关键趋势3"],
  "analysis_tasks": [
    {
      "title": "分析任务标题",
      "category": "技术趋势/市场机会/投资关注/行业动态/技能市场/竞品分析/政策影响",
      "description": "详细分析内容和关注要点",
      "research_focus": ["具体研究重点1", "具体研究重点2"],
      "information_sources": ["推荐信息来源"],
      "time_requirement": "所需时间",
      "priority": "high/medium/low",
      "expected_insights": "期望获得的洞察",
      "action_items": ["具体行动建议"]
    }
  ],
  "watch_list": ["需要持续关注的公司/项目/技术"],
  "opportunity_alerts": ["潜在机会提醒"],
  "risk_warnings": ["风险警示"]
}
\`\`\`

**输出要求:**
- 提供3-4个具体的市场分析任务
- 关注与个人技能相关的市场动态
- 包含可操作的信息收集建议
- 平衡短期关注和长期趋势
- 考虑全球和本地市场差异

请确保分析建议具有实用性和前瞻性。
`;

    const taskData = await generator.generateTasks(prompt, 'market');

    const emailContent = `
# 📊 今日市场分析 - ${timeContext.date}

## 市场概览
- 分析重点: 技术市场趋势与机会
- 关注领域: ${technologies.join(', ') || 'AI, 云计算, 开发技术'}
- 生成时间: ${new Date().toLocaleString('zh-CN')}

## 今日分析任务

${taskData.tasks.map((task, index) => `
### ${index + 1}. ${task.title || '市场分析任务'}

**类别**: ${task.category || '综合分析'}
**优先级**: ${task.priority || 'medium'}
**所需时间**: ${task.time_requirement || '20-30分钟'}

**分析重点**:
${task.research_focus ? task.research_focus.map(focus => `- ${focus}`).join('\n') : '- 市场趋势分析'}

**详细内容**:
${task.description || '无详细描述'}

**信息来源建议**:
${task.information_sources ? task.information_sources.map(source => `- ${source}`).join('\n') : '- 行业报告和新闻'}

**期望洞察**:
${task.expected_insights || '获得市场动态理解'}

**行动建议**:
${task.action_items ? task.action_items.map(item => `- ${item}`).join('\n') : '- 持续关注相关动态'}

`).join('\n---\n')}

## 📈 持续关注清单
- AI大模型技术进展和商业化
- 云原生技术和容器生态
- Web3和区块链应用发展
- 开源项目和社区动态
- 科技巨头战略调整

## 🎯 机会提醒
- 关注新兴技术的早期投资机会
- 识别技能提升和转型方向
- 发现潜在的创业和合作机会
- 了解行业薪资和就业趋势

## ⚠️ 风险警示
- 技术泡沫和过度炒作风险
- 政策变化对行业的影响
- 市场竞争加剧的压力
- 技术更新换代的挑战

## AI市场分析详情
${taskData.ai_response}

---
*由AI Jarvis市场分析师生成 - 洞察趋势，把握机会！*
`;

    await emailSender.sendEmail(
      '📊 今日市场分析',
      emailContent
    );

    console.log('✅ Market analysis tasks generated and sent successfully');
    console.log(`Generated ${taskData.tasks.length} market analysis tasks`);

  } catch (error) {
    console.error('❌ Error generating market tasks:', error.message);

    const emailSender = new EmailSender();
    await emailSender.sendEmail(
      '🚨 市场分析生成失败',
      `市场分析生成过程中出现错误:\n\n${error.message}\n\n请检查系统配置。`
    );
  }
}

if (require.main === module) {
  generateMarketTasks();
}

module.exports = generateMarketTasks;