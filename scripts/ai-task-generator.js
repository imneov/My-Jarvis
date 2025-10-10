/**
 * AI任务生成器核心模块
 * 使用Claude API生成个性化任务
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class AITaskGenerator {
  constructor() {
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    this.githubToken = process.env.GITHUB_TOKEN;
    this.tasksDir = path.join(__dirname, '../tasks');
    this.ensureTasksDir();
  }

  async ensureTasksDir() {
    try {
      await fs.mkdir(this.tasksDir, { recursive: true });
    } catch (error) {
      console.log('Tasks directory already exists or created');
    }
  }

  /**
   * 调用Claude API生成任务
   * @param {string} prompt - 任务生成提示词
   * @param {string} category - 任务类别
   * @returns {Object} 生成的任务数据
   */
  async generateTasks(prompt, category) {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.anthropicApiKey}`,
            'Content-Type': 'application/json',
            'x-api-key': this.anthropicApiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const aiResponse = response.data.content[0].text;

      // 保存AI响应到文件
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${category}-${timestamp}.json`;

      const taskData = {
        category,
        generated_at: new Date().toISOString(),
        ai_response: aiResponse,
        tasks: this.parseTasksFromResponse(aiResponse)
      };

      await fs.writeFile(
        path.join(this.tasksDir, filename),
        JSON.stringify(taskData, null, 2)
      );

      return taskData;
    } catch (error) {
      console.error(`Error generating ${category} tasks:`, error.message);
      return {
        category,
        generated_at: new Date().toISOString(),
        error: error.message,
        tasks: []
      };
    }
  }

  /**
   * 从AI响应中解析任务列表
   * @param {string} response - AI响应文本
   * @returns {Array} 解析出的任务列表
   */
  parseTasksFromResponse(response) {
    try {
      // 尝试提取JSON格式的任务
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // 如果没有JSON，尝试解析列表格式
      const lines = response.split('\n');
      const tasks = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.match(/^[-*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
          const taskText = trimmed.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
          if (taskText.length > 0) {
            tasks.push({
              id: Date.now() + Math.random(),
              title: taskText,
              completed: false,
              priority: 'medium',
              estimated_time: '15-30分钟'
            });
          }
        }
      }

      return tasks;
    } catch (error) {
      console.error('Error parsing tasks from response:', error.message);
      return [{
        id: Date.now(),
        title: '解析AI响应时出错，请检查响应格式',
        completed: false,
        priority: 'high',
        estimated_time: '5分钟'
      }];
    }
  }

  /**
   * 获取GitHub活动数据用于上下文
   */
  async getGitHubContext() {
    if (!this.githubToken) {
      return { repos: [], recent_activity: [] };
    }

    try {
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          sort: 'updated',
          per_page: 10
        }
      });

      return {
        repos: response.data.map(repo => ({
          name: repo.name,
          language: repo.language,
          updated_at: repo.updated_at,
          description: repo.description
        })),
        recent_activity: []
      };
    } catch (error) {
      console.error('Error fetching GitHub context:', error.message);
      return { repos: [], recent_activity: [] };
    }
  }

  /**
   * 获取当前日期和时间上下文
   */
  getTimeContext() {
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('zh-CN', { weekday: 'long' });
    const date = now.toLocaleDateString('zh-CN');
    const hour = now.getHours();

    let timeOfDay = '早晨';
    if (hour >= 12 && hour < 18) {
      timeOfDay = '下午';
    } else if (hour >= 18) {
      timeOfDay = '晚上';
    }

    return {
      date,
      dayOfWeek,
      timeOfDay,
      hour,
      isWeekend: now.getDay() === 0 || now.getDay() === 6
    };
  }
}

module.exports = AITaskGenerator;