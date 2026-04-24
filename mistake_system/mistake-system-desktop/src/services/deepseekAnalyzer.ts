import { getDeepseekConfig } from './aiConfig';
import { API_BASE } from '../config/api';

interface MistakeItem {
  id: number;
  subject_id: number;
  content: string;
  correct_answer: string;
  wrong_answer?: string;
  error_reason?: string;
  knowledge_points?: string;
  topic?: string;
  difficulty: number;
  review_count: number;
  next_review?: string;
  created_at: string;
  subject?: string;
}

export interface WeeklyAnalysisResult {
  id: string;
  timestamp: string;
  totalMistakes: number;
  analyzedMistakes: number;
  moduleStats: Array<{ module: string; count: number }>;
  personalizedAnalysis: PersonalizedAnalysis;
}

interface PersonalizedAnalysis {
  summary: string;
  modules: Array<{ name: string; count: number; percentage: number }>;
  suggestions: string;
  plan: string;
}

// 获取当前周ID（年-周）
export const getCurrentWeekId = (): string => {
  const now = new Date();
  const target = new Date(now.valueOf());
  const dayNr = (now.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const jan4 = new Date(target.getFullYear(), 0, 4);
  const jan4DayNr = (jan4.getDay() + 6) % 7;
  const jan4Date = new Date(jan4.getFullYear(), 0, 4 - jan4DayNr);
  const weekNum = Math.ceil((((target.getTime() - jan4Date.getTime()) / 86400000) + 1) / 7);
  const year = target.getFullYear();
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
};

/**
 * 修复后的个性化学习分析 - 使用后端代理而非直接API调用
 * 这解决了安全问题：API key 不再暴露在浏览器中
 */
export const analyzePersonalizedLearningPlan = async (
  mistakes: MistakeItem[],
  apiKey: string
): Promise<PersonalizedAnalysis | null> => {
  try {
    const analyzedMistakes = mistakes.filter(m =>
      (m.knowledge_points && m.knowledge_points !== '待分析') ||
      (m.topic && m.topic !== '待分析')
    );

    if (analyzedMistakes.length === 0) {
      return null;
    }

    // 统计知识点频率
    const moduleMap = new Map<string, number>();
    analyzedMistakes.forEach(m => {
      const topics = [
        ...(m.knowledge_points ? m.knowledge_points.split(',') : []),
        ...(m.topic && m.topic !== '待分析' ? m.topic.split(',') : [])
      ];

      topics.forEach(topic => {
        const trimmedTopic = topic.trim();
        if (trimmedTopic && trimmedTopic !== '待分析') {
          moduleMap.set(trimmedTopic, (moduleMap.get(trimmedTopic) || 0) + 1);
        }
      });
    });

    const sortedModules = Array.from(moduleMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        percentage: parseFloat(((count / analyzedMistakes.length) * 100).toFixed(2))
      }));

    // 构建提示词
    const subjects = ['', '数学', '物理', '化学', '英语', '语文', '政治'];
    const difficultyLabels = ['', '简单', '较易', '中等', '较难', '困难'];

    const mistakeSummary = analyzedMistakes.slice(0, 20).map(m => ({
      subject: subjects[m.subject_id] || '未知',
      topic: m.knowledge_points || m.topic || '待分析',
      difficulty: difficultyLabels[m.difficulty] || '中等',
      reviewCount: m.review_count
    }));

    const prompt = `根据学生的错题统计，生成个性化学习分析和建议。

错题统计：
- 总错题数：${analyzedMistakes.length}
- 高频知识点：${sortedModules.map(m => `${m.name}(${m.count}次)`).join('、')}

错题详情示例：${JSON.stringify(mistakeSummary.slice(0, 5))}

请返回以下JSON格式的分析结果：
{
  "summary": "总体学习状态分析",
  "modules": [{"name": "知识点", "count": 数字, "percentage": 百分比}],
  "suggestions": "具体学习建议",
  "plan": "后续学习计划"
}`;

    // 使用后端代理而非直接调用 DeepSeek API
    // 这保护了 API key 并保持与其他AI服务的一致性
    const response = await fetch(`${API_BASE}/api/ai-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify({
        prompt,
        provider: 'deepseek',
        model: 'deepseek-chat'
      })
    });

    if (!response.ok) {
      throw new Error(`后端 AI 分析请求失败: ${response.statusText}`);
    }

    const data = await response.json();

    // 处理后端包装后的响应结构
    const apiResponse = data.data || data;
    const aiResponse = apiResponse.choices?.[0]?.message?.content || apiResponse.content;

    if (!aiResponse) {
      console.error('[DeepSeekAnalyzer] AI 响应为空:', data);
      return {
        summary: 'AI 分析返回为空',
        modules: sortedModules,
        suggestions: '请检查 AI 配置或稍后重试',
        plan: '无法生成学习计划'
      };
    }

    // 解析 JSON 响应
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```|(\{[\s\S]*\})/);
    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[2];
      return JSON.parse(jsonString);
    }

    return {
      summary: aiResponse,
      modules: sortedModules,
      suggestions: '无法解析 AI 响应',
      plan: '请查看完整分析'
    };
  } catch (error) {
    console.error('[DeepSeekAnalyzer] 分析失败:', error);
    return null;
  }
};

// 周分析历史管理 - 改为使用后端 API
export const saveWeeklyAnalysis = async (analysis: WeeklyAnalysisResult): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/weekly-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify({
        weekId: analysis.id,
        totalMistakes: analysis.totalMistakes,
        analyzedMistakes: analysis.analyzedMistakes,
        moduleStats: analysis.moduleStats,
        personalizedAnalysis: analysis.personalizedAnalysis
      })
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('[DeepSeekAnalyzer] 保存周分析失败:', error);
    // 降级到 localStorage
    const history = JSON.parse(localStorage.getItem('weekly_analysis_history') || '{}');
    history[analysis.id] = analysis;
    localStorage.setItem('weekly_analysis_history', JSON.stringify(history));
    return false;
  }
};

export const getWeeklyAnalysisHistory = async (): Promise<Record<string, WeeklyAnalysisResult>> => {
  try {
    const response = await fetch(`${API_BASE}/api/weekly-analysis`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      }
    });

    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      // 转换为 Record 格式
      const history: Record<string, WeeklyAnalysisResult> = {};
      result.data.forEach((item: WeeklyAnalysisResult) => {
        history[item.id] = item;
      });
      return history;
    }
    // 降级到 localStorage
    return JSON.parse(localStorage.getItem('weekly_analysis_history') || '{}');
  } catch (error) {
    console.error('[DeepSeekAnalyzer] 获取周分析历史失败:', error);
    // 降级到 localStorage
    return JSON.parse(localStorage.getItem('weekly_analysis_history') || '{}');
  }
};

export const deleteWeeklyAnalysis = async (weekId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/weekly-analysis/${weekId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      }
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('[DeepSeekAnalyzer] 删除周分析失败:', error);
    // 降级到 localStorage
    const history = JSON.parse(localStorage.getItem('weekly_analysis_history') || '{}');
    delete history[weekId];
    localStorage.setItem('weekly_analysis_history', JSON.stringify(history));
    return false;
  }
};
