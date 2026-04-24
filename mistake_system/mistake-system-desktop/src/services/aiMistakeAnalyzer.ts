import { getQianwenConfig as getConfig } from './aiConfig';
import { getSubjectKnowledgePoints } from './standardKnowledgePoints';
import { API_BASE } from '../config/api';

interface MistakeItem {
  id: number;
  subject: string;
  question: string;
  answer: string;
  imagePath?: string;
}

interface AnalysisResult {
  success: boolean;
  knowledgePoints: string[];
  analysis: string;
  correctAnswer?: string;  // AI 返回的正确答案
  difficulty?: '简单' | '中等' | '困难';
  error?: string;
}

/**
 * 从 AI 返回的文本中提取标准知识点
 * 通过匹配标准知识点列表来提高准确性
 */
const extractKnowledgePoints = (text: string, subject: string): string[] => {
  const standardPoints = getSubjectKnowledgePoints(subject);
  const extractedPoints: string[] = [];

  // 首先尝试从 JSON 中提取 knowledge_points 或 knowledgePoints 数组
  try {
    const jsonRegex = /```json\s*\n?({[\s\S]*?})\s*\n?```|({[\s\S]*?})/i;
    const jsonMatch = text.match(jsonRegex);
    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[2];
      if (jsonString && typeof jsonString === 'string') {
        const trimmedString = jsonString.trim();
        if (trimmedString.startsWith('{') && trimmedString.endsWith('}')) {
          const jsonData = JSON.parse(trimmedString);
          // 支持两种字段名格式
          const aiPoints = jsonData.knowledge_points || jsonData.knowledgePoints || [];
          if (Array.isArray(aiPoints) && aiPoints.length > 0) {
            // AI 直接返回了知识点数组，直接使用
            console.log('[AI Analyzer] 从 JSON 中提取到知识点:', aiPoints);
            return aiPoints.slice(0, 5);
          }
        }
      }
    }
  } catch (e) {
    console.log('[AI Analyzer] JSON 解析失败，使用文本匹配方式');
  }

  if (standardPoints.length === 0) {
    // 如果没有标准知识点，返回空数组
    return [];
  }

  // 首先尝试从标准知识点列表中精确匹配
  for (const point of standardPoints) {
    // 检查知识点是否在 AI 返回的文本中出现
    if (text.includes(point)) {
      extractedPoints.push(point);
    } else {
      // 尝试部分匹配（去除括号内的说明）
      const simplifiedPoint = point.split('（')[0].split('(')[0].trim();
      if (simplifiedPoint.length > 2 && text.includes(simplifiedPoint)) {
        extractedPoints.push(point);
      }
    }
  }

  // 如果标准匹配没有找到，尝试从文本中提取常见关键词
  if (extractedPoints.length === 0) {
    // 提取加粗的知识点（**知识点**）
    const boldMatches = text.match(/\*\*([^*]+)\*\*/g);
    if (boldMatches) {
      for (const match of boldMatches) {
        const cleanText = match.replace(/\*\*/g, '').trim();
        // 检查是否是知识点（不是"选项"、"分析"等词）
        if (cleanText.length > 1 &&
            !cleanText.includes('选项') &&
            !cleanText.includes('分析') &&
            !cleanText.includes('题目')) {
          extractedPoints.push(cleanText);
        }
      }
    }
  }

  // 如果还是没有找到，尝试提取编号列表中的内容
  if (extractedPoints.length === 0) {
    const numberedMatches = text.match(/\d+\.\s*\*\*([^*]+)\*\*/g);
    if (numberedMatches) {
      for (const match of numberedMatches) {
        const cleanText = match.replace(/^\d+\.\s*\*\*|\*\*/g, '').trim();
        if (cleanText.length > 1 &&
            !cleanText.includes('选项') &&
            !cleanText.includes('分析')) {
          extractedPoints.push(cleanText);
        }
      }
    }
  }

  // 去重，保留最多 5 个知识点
  const uniquePoints = Array.from(new Set(extractedPoints));
  return uniquePoints.slice(0, 5);
};

// 获取图片的 base64 数据
const getImageBase64 = async (imagePath: string): Promise<string | null> => {
  try {
    // 构建完整的图片 URL
    const baseUrl = API_BASE || window.location.origin;
    const imageUrl = imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`;

    console.log('[AI Analyzer] 获取图片:', imageUrl);

    const response = await fetch(imageUrl, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      }
    });

    if (!response.ok) {
      console.error('[AI Analyzer] 获取图片失败:', response.status);
      return null;
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[AI Analyzer] 获取图片 base64 失败:', error);
    return null;
  }
};

// AI 分析单个错题
export const analyzeSingleMistake = async (mistake: MistakeItem, apiKey: string): Promise<AnalysisResult> => {
  try {
    console.log('[AI Analyzer] 开始分析错题:', { id: mistake.id, subject: mistake.subject, question: mistake.question?.substring(0, 50), imagePath: mistake.imagePath });

    // 获取对应科目的标准知识点列表
    const subjectKnowledgePoints = getSubjectKnowledgePoints(mistake.subject);
    console.log('[AI Analyzer] 科目:', mistake.subject, '知识点数量:', subjectKnowledgePoints.length);

    let knowledgePointsSection = '';
    if (subjectKnowledgePoints.length > 0) {
      knowledgePointsSection = `
【${mistake.subject}标准知识点列表】（请从以下列表中选择最匹配的 1-3 个知识点）
${subjectKnowledgePoints.join(' | ')}

⚠️ 注意：knowledgePoints 字段必须从上述列表中选择，不要自己创造知识点名称。`;
    } else {
      knowledgePointsSection = `
⚠️ 注意：请根据${mistake.subject}学科特点，分析题目考查的知识点。`;
    }

    const prompt = `请分析以下错题：${knowledgePointsSection}

【题目】${mistake.question}

【学生答案】${mistake.answer}

请严格按照以下 JSON 格式回复（不要添加\`\`\`json 等标记，必须返回完整 JSON）：
{
  "knowledgePoints": ["从上面列表中选择 1-3 个最匹配的知识点"],
  "correctAnswer": "这道题的正确答案（必填！如：A 或 120°或\\frac{\\sqrt{3}}{2}）",
  "analysis": "详细的题目分析和解题思路，解释为什么选这个答案",
  "difficulty": "简单或中等或困难"
}

要求：
1. knowledgePoints 必须从标准知识点列表中选择
2. correctAnswer 必填！必须给出明确的正确答案，不能为空
3. analysis 必须包含详细的分析过程，不能为空
4. difficulty 根据题目难度选择
5. 必须返回完整的 JSON 格式，不要遗漏任何字段`;

    const promptContent = [];

    // 如果有图片路径，获取图片并转换为 base64
    console.log('[AI Analyzer] 检查图片路径:', mistake.imagePath ? '有' : '无', mistake.imagePath?.substring(0, 100));

    if (mistake.imagePath) {
      // 检查图片是否是 base64 格式
      if (mistake.imagePath.startsWith('data:image')) {
        // 如果已经是 base64 格式，直接使用
        console.log('[AI Analyzer] 图片已是 base64 格式');
        promptContent.push({
          type: "image_url",
          image_url: {
            url: mistake.imagePath
          }
        });
      } else {
        // 如果是文件路径，需要获取图片并转换为 base64
        console.log('[AI Analyzer] 图片是文件路径，获取 base64 数据...');
        const imageBase64 = await getImageBase64(mistake.imagePath);
        if (imageBase64) {
          promptContent.push({
            type: "image_url",
            image_url: {
              url: imageBase64
            }
          });
          console.log('[AI Analyzer] 图片 base64 数据已添加，长度:', imageBase64.length);
        } else {
          console.warn('[AI Analyzer] 无法获取图片，将路径作为文本添加');
          promptContent.push({
            type: "text",
            text: `题目图片路径：${mistake.imagePath}`
          });
        }
      }
    } else {
      console.log('[AI Analyzer] 没有图片路径');
    }

    console.log('[AI Analyzer] promptContent 当前内容类型:', promptContent.map((item: any) => item.type));

    // 添加文字题目内容（如果有）
    if (mistake.question && mistake.question !== '无内容') {
      promptContent.push({
        type: "text",
        text: `题目：${mistake.question}`
      });
    } else {
      // 如果没有文字内容，至少添加提示 AI 需要分析图片
      promptContent.push({
        type: "text",
        text: "题目：请根据提供的图片分析这道题。"
      });
    }

    // 添加答案信息（如果有）
    if (mistake.answer && mistake.answer !== '无答案') {
      promptContent.push({
        type: "text",
        text: `答案：${mistake.answer}`
      });
    }

    const promptMessage = {
      role: 'user',
      content: promptContent
    };

    // 使用后端代理调用 AI API
    console.log('[AI-MistakeAnalyzer] 开始发送请求...');
    console.log('[AI-MistakeAnalyzer] API_BASE:', API_BASE);
    console.log('[AI-MistakeAnalyzer] Token:', localStorage.getItem('auth_token') ? '有' : '无');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[AI-MistakeAnalyzer] 请求超时 (300 秒)');
      controller.abort();
    }, 300000); // 5 分钟超时

    const systemPrompt = `你是通义千问视觉语言模型，专门用于分析高中教育内容。
重要规则：
1. 必须只返回 JSON 格式，不要有任何解释文字
2. knowledgePoints 必须从上面的标准知识点列表中选择 exact 匹配
3. 不要创造新的知识点名称
4. 如果题目涉及多个知识点，选择最核心的 1-3 个
5. correctAnswer 字段必填！必须给出题目的正确答案
6. 必须返回全部 4 个字段：knowledgePoints、correctAnswer、analysis、difficulty`;

    // 获取 token
    const token = localStorage.getItem('auth_token');
    
    // 获取配置中的模型名（如果配置了）
    const config = getConfig();
    const modelName = config.model || 'qwen3.5-plus';  // 优先使用配置，默认 qwen3.5-plus

    const response = await fetch(`${API_BASE}/api/ai-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      signal: controller.signal,  // 添加信号以支持超时
      body: JSON.stringify({
        provider: 'qwen',
        apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',  // 使用兼容模式端点以支持图像
        model: modelName,  // 使用配置或默认的 qwen3.5-plus 多模态模型
        maxTokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          promptMessage
        ]
      })
    });

    clearTimeout(timeoutId); // 请求成功后清除超时定时器

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`API 请求失败：${errorData.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      // 检查是否是 VIP 权限不足
      if (data.error && (data.error.includes('VIP') || data.error.includes('会员'))) {
        throw new Error(`权限不足：${data.error}`);
      }
      throw new Error(`AI 分析失败：${data.error || '未知错误'}`);
    }

    // 解析 AI 返回的结果
    const choices = data.data.choices || [];
    const text = choices[0]?.message?.content || choices[0]?.text || '';

    console.log('[AI-MistakeAnalyzer] AI 返回的文本:', text.substring(0, 200) + '...');

    // 首先尝试匹配 JSON 格式
    const jsonRegex = /```json\s*\n?({[\s\S]*?})\s*\n?```|({[\s\S]*?})/i;
    const jsonMatch = text.match(jsonRegex);

    console.log('[AI-MistakeAnalyzer] JSON 匹配结果:', !!jsonMatch);

    if (jsonMatch) {
      try {
        const jsonString = jsonMatch[1] || jsonMatch[2];
        console.log('[AI-MistakeAnalyzer] 提取的 JSON 字符串:', jsonString.substring(0, 200) + '...');
        if (jsonString && typeof jsonString === 'string') {
          const trimmedString = jsonString.trim();
          console.log('[AI-MistakeAnalyzer] 修剪后的字符串:', trimmedString.substring(0, 100) + '...');
          if ((trimmedString.startsWith('{') && trimmedString.endsWith('}')) ||
              (trimmedString.startsWith('[') && trimmedString.endsWith(']'))) {
            const jsonData = JSON.parse(trimmedString);
            console.log('[AI-MistakeAnalyzer] JSON 解析成功:', jsonData);
            // 支持两种字段名格式：knowledgePoints (驼峰) 和 knowledge_points (下划线)
            const knowledgePoints = Array.isArray(jsonData.knowledgePoints) ? jsonData.knowledgePoints :
                                   (Array.isArray(jsonData.knowledge_points) ? jsonData.knowledge_points : []);
            return {
              success: true,
              knowledgePoints: knowledgePoints,
              correctAnswer: typeof jsonData.correctAnswer === 'string' ? jsonData.correctAnswer :
                            (typeof jsonData.correct_answer === 'string' ? jsonData.correct_answer : ''),
              analysis: typeof jsonData.analysis === 'string' && jsonData.analysis.trim() !== '' ? jsonData.analysis :
                       (typeof jsonData.errorAnalysis === 'string' ? jsonData.errorAnalysis : ''),
              difficulty: typeof jsonData.difficulty === 'string' ? jsonData.difficulty : undefined
            };
          }
        }
      } catch (parseError) {
        console.warn('JSON 解析失败，使用备用方法:', parseError);
      }
    }

    // JSON 解析失败，使用文本提取方式
    if (text && text.trim() !== '') {
      // 使用新的知识点提取函数，从标准列表中匹配
      const knowledgePoints = extractKnowledgePoints(text, mistake.subject);

      // 尝试从文本中提取正确答案（匹配"正确答案是 A"或"答案：A"等格式）
      let correctAnswer = '';
      const answerPatterns = [
        /正确答案 (是 | 为 | ：|:)\s*([A-D]|[^\n，。]+)/i,
        /答案 (是 | 为 | ：|:)\s*([A-D]|[^\n，。]+)/i,
        /选 (项 | 择)?([A-D])/i,
        /正确选项 (是 | 为 | ：|:)\s*([A-D])/i
      ];
      for (const pattern of answerPatterns) {
        const match = text.match(pattern);
        if (match && match[2]) {
          correctAnswer = match[2].trim();
          break;
        }
      }

      // 尝试从文本中提取分析内容（去除知识点列表部分）
      let analysisText = text;
      // 如果文本包含"涉及的标准知识点列表"等字样，说明 AI 返回了知识点列表
      // 尝试提取分析部分（只保留前面的分析内容）
      const analysisMatch = text.match(/(这道题主要考查了 [\s\S]*?)(?:\n\n\*\*涉及的标准知识点|\n\n\*\*涉及的标准知识点|\n\n\[标准知识点|\Z)/);
      if (analysisMatch && analysisMatch[1]) {
        analysisText = analysisMatch[1].trim();
      }

      // 如果没有找到分析内容，使用整个文本
      if (!analysisText || analysisText.trim() === '') {
        analysisText = text;
      }

      return {
        success: true,
        knowledgePoints: knowledgePoints,
        correctAnswer: correctAnswer,
        analysis: analysisText,  // 确保 analysis 不为空
        difficulty: undefined
      };
    }

    return {
      success: false,
      knowledgePoints: [],
      correctAnswer: '',
      analysis: '',
      error: '无法解析 AI 返回的数据格式'
    };
  } catch (error) {
    console.error('AI 分析错题失败:', error);
    return {
      success: false,
      knowledgePoints: [],
      analysis: '',
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

// 批量分析错题 - 真正的并发控制
export const analyzeMistakesInBatch = async (
  mistakes: MistakeItem[],
  onProgress?: (completed: number, total: number, currentId?: number) => void
): Promise<AnalysisResult[]> => {
  const config = getConfig();
  if (!config.apiKey) {
    throw new Error('Qwen API 密钥未配置');
  }

  const concurrency = 15;
  const total = mistakes.length;

  console.log(`[AI Analyzer] 开始分析 ${total} 道错题，并发数：${concurrency}`);
  console.log(`[AI Analyzer] 题目ID列表: ${mistakes.map(m => m.id).join(', ')}`);

  const results: AnalysisResult[] = new Array(total);
  let completed = 0;

  // 创建所有任务的执行函数
  const executeTask = async (mistake: MistakeItem, index: number) => {
    const startTime = Date.now();
    try {
      console.log(`[AI Analyzer] [${index + 1}/${total}] 开始分析错题 ${mistake.id}`);
      const result = await analyzeSingleMistake(mistake, config.apiKey!);
      results[index] = result;
      const duration = Date.now() - startTime;
      console.log(`[AI Analyzer] [${index + 1}/${total}] 完成分析错题 ${mistake.id}，耗时 ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[AI Analyzer] [${index + 1}/${total}] 分析错题 ${mistake.id} 失败，耗时 ${duration}ms:`, error);
      results[index] = {
        success: false,
        knowledgePoints: [],
        analysis: '',
        error: error instanceof Error ? error.message : '分析失败'
      };
    }
    completed++;
    // 调用进度回调
    if (onProgress) {
      onProgress(completed, total, mistake.id);
    }
    console.log(`[AI Analyzer] 进度: ${completed}/${total}`);
  };

  // 使用标准的 Promise pool 模式
  const tasks = mistakes.map((mistake, index) => ({ mistake, index }));

  await new Promise<void>((resolve) => {
    let activeCount = 0;
    let taskIndex = 0;

    const runNext = () => {
      // 如果所有任务都已完成
      if (completed >= total) {
        resolve();
        return;
      }

      // 启动新任务直到达到并发上限或没有任务了
      while (activeCount < concurrency && taskIndex < total) {
        const { mistake, index } = tasks[taskIndex];
        taskIndex++;
        activeCount++;

        // 启动任务（不 await，让它在后台运行）
        executeTask(mistake, index).finally(() => {
          activeCount--;
          runNext(); // 完成后启动下一个
        });
      }
    };

    // 启动初始批次
    runNext();
  });

  console.log(`[AI Analyzer] 所有 ${total} 道错题分析完成`);
  return results;
};
