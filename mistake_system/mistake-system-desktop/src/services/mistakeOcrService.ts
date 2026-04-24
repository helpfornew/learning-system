/**
 * 错题OCR和分析服务 - 混合方案
 * 1. 用户上传图片
 * 2. 调用千问AI进行OCR识别
 * 3. 用户确认识别结果
 * 4. 自动提取知识点
 */

import { getQianwenConfig as getConfig } from './aiConfig';

/**
 * OCR识别结果
 */
export interface OCRResult {
  success: boolean;
  question?: string;  // 题目内容
  subject?: string;   // 科目
  difficulty?: string; // 难度
  analysis?: string;   // 分析
  rawText?: string;   // 原始识别文本
  message: string;
  confidence: number; // 置信度 0-1
}

/**
 * 知识点提取结果
 */
export interface KnowledgeExtraction {
  knowledgePoints: string[];
  tags: string[];
  chapter?: string;
  difficulty: string;
  learningPath?: string;
}

/**
 * 步骤1: 图片OCR识别 - 识别题目内容
 */
export const ocrImageWithQianwen = async (
  imageBase64: string
): Promise<OCRResult> => {
  const config = getConfig();

  // 如果未配置千问AI，返回错误
  if (!config.enabled || !config.apiKey) {
    return {
      success: false,
      message: '千问AI未配置，请先在设置中配置API密钥',
      confidence: 0
    };
  }

  try {
    console.log('[OCR] 开始识别图片...');

    // 调用千问AI进行识别
    const result = await analyzeWithQianwen(
      imageBase64,
      `请识别这张图片中的题目内容，并以以下格式返回：
题目内容：[题目的具体内容]
科目：[数学/物理/化学/英语/语文等]
难度：[简单/中等/困难]
分析：[题目分析]`
    );

    if (result.success) {
      const data = result.data;
      return {
        success: true,
        question: data.analysis || '',
        subject: data.subject,
        difficulty: data.difficulty,
        analysis: data.analysis,
        rawText: data.rawResponse,
        message: 'OCR识别成功',
        confidence: data.confidence || 0.85
      };
    } else {
      return {
        success: false,
        message: 'OCR识别失败',
        confidence: 0
      };
    }
  } catch (error) {
    console.error('[OCR] 识别失败:', error);
    return {
      success: false,
      message: `识别失败: ${error instanceof Error ? error.message : '未知错误'}`,
      confidence: 0
    };
  }
};

/**
 * 步骤2: 知识点提取 - 从题目内容提取知识点
 */
export const extractKnowledgePoints = async (
  questionText: string,
  subject: string
): Promise<KnowledgeExtraction> => {
  const config = getConfig();

  // 如果未配置千问AI，使用本地提取
  if (!config.enabled || !config.apiKey) {
    return localExtractKnowledgePoints(questionText, subject);
  }

  try {
    console.log('[Knowledge] 开始提取知识点...');

    // 调用千问AI提取知识点
    const result = await analyzeWithQianwen(
      '',
      `根据以下题目内容和科目，提取相关知识点、标签和学习路径。
题目：${questionText}
科目：${subject}

请以以下格式返回：
知识点：[知识点1, 知识点2, 知识点3]
标签：[标签1, 标签2]
难度：[简单/中等/困难]
学习路径：[路径描述]`
    );

    if (result.success) {
      const data = result.data;
      return {
        knowledgePoints: data.keyPoints || extractKeywordsLocal(questionText),
        tags: data.suggestedTags || [],
        difficulty: data.difficulty || '中等',
        chapter: data.chapter,
        learningPath: data.learningPath
      };
    } else {
      // 失败时使用本地提取
      return localExtractKnowledgePoints(questionText, subject);
    }
  } catch (error) {
    console.error('[Knowledge] 提取失败:', error);
    // 失败时使用本地提取
    return localExtractKnowledgePoints(questionText, subject);
  }
};

/**
 * 本地知识点提取（当AI不可用时的降级方案）
 */
const localExtractKnowledgePoints = (
  questionText: string,
  subject: string
): KnowledgeExtraction => {
  const keywords = extractKeywordsLocal(questionText);

  const difficultyKeywords = {
    '简单': ['基本', '简单', '初级'],
    '中等': ['求', '计算', '分析'],
    '困难': ['证明', '推导', '复杂', '综合']
  };

  let difficulty = '中等';
  for (const [level, keywords_list] of Object.entries(difficultyKeywords)) {
    if (keywords_list.some(kw => questionText.includes(kw))) {
      difficulty = level;
      break;
    }
  }

  const subjectTags: Record<string, string[]> = {
    '数学': ['函数', '几何', '代数', '数列', '三角'],
    '物理': ['力学', '电磁', '光学', '热学', '原子'],
    '化学': ['氧化还原', '有机', '物质结构', '化学平衡'],
    '英语': ['语法', '词汇', '阅读', '写作', '听力'],
    '语文': ['古文', '现代文', '写作', '文学', '修辞']
  };

  const tags = subjectTags[subject] || [];

  return {
    knowledgePoints: keywords.slice(0, 5),
    tags: tags.slice(0, 3),
    difficulty,
    learningPath: `基础知识 → 核心知识点 → 综合应用 → 拓展深化`
  };
};

/**
 * 本地关键词提取
 */
const extractKeywordsLocal = (text: string): string[] => {
  // 常见数学关键词
  const mathKeywords = [
    '函数', '导数', '积分', '数列', '几何', '三角函数',
    '方程', '不等式', '向量', '矩阵', '概率', '统计'
  ];

  // 常见物理关键词
  const physicsKeywords = [
    '力', '运动', '能量', '功率', '压强', '浮力',
    '电场', '磁场', '电流', '电压', '光', '波'
  ];

  // 常见化学关键词
  const chemistryKeywords = [
    '原子', '分子', '化学键', '反应', '溶液', '酸碱',
    '氧化', '还原', '有机', '无机', '离子', '电解'
  ];

  const allKeywords = [
    ...mathKeywords,
    ...physicsKeywords,
    ...chemistryKeywords,
    '基本概念', '原理', '定律', '性质', '分类', '应用'
  ];

  const found = allKeywords.filter(kw => text.includes(kw));
  return found.length > 0 ? found : ['待补充知识点'];
};

/**
 * 完整流程：从图片到知识点
 */
export const processImageToMistake = async (
  imageBase64: string
): Promise<{
  ocr: OCRResult;
  knowledge: KnowledgeExtraction | null;
}> => {
  // 步骤1: OCR识别
  console.log('[Process] 步骤1: OCR识别...');
  const ocrResult = await ocrImageWithQianwen(imageBase64);

  if (!ocrResult.success) {
    return {
      ocr: ocrResult,
      knowledge: null
    };
  }

  // 步骤2: 知识点提取
  console.log('[Process] 步骤2: 知识点提取...');
  const knowledge = await extractKnowledgePoints(
    ocrResult.question || ocrResult.rawText || '',
    ocrResult.subject || '未知'
  );

  return {
    ocr: ocrResult,
    knowledge
  };
};

export default {
  ocrImageWithQianwen,
  extractKnowledgePoints,
  processImageToMistake
};
