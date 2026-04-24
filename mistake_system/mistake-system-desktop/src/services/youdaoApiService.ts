/**
 * 有道智云题目识别 API 服务
 * 提供题目识别、智能切割功能
 *
 * API 文档：https://ai.youdao.com/DOCSIRMA/html/trans/aidoc/index.html
 */

import axios from 'axios';

/**
 * 题目切割区域接口
 */
export interface QuestionSegment {
  x: number;
  y: number;
  width: number;
  height: number;
  questionText: string;
}

export interface YoudaoRecognizeResult {
  success: boolean;
  segments: QuestionSegment[];
  originalImage: string;
  message?: string;
  /** API 不可用时，提示用户使用手动裁剪 */
  needManualCrop?: boolean;
  /** 错误类型，用于特殊处理 */
  errorType?: 'HEIC_FORMAT' | 'NETWORK_ERROR' | 'API_ERROR' | 'SERVER_ERROR';
  /** 原始错误信息 */
  errorDetail?: string;
  /** HTTP 状态码 */
  statusCode?: number;
}

/**
 * 智能切割题目图片
 * 调用后端代理 API 进行题目切割
 * @param imageBase64 - 原始图片的 base64 数据
 */
export async function smartSegmentQuestion(
  imageBase64: string
): Promise<YoudaoRecognizeResult> {
  try {
    const response = await axios.post('/api/youdao/segment', {
      image: imageBase64,
    });

    // 后端返回成功
    if (response.data.success) {
      // 有识别结果
      if (response.data.segments && response.data.segments.length > 0) {
        return {
          success: true,
          segments: response.data.segments || [],
          originalImage: imageBase64,
          message: response.data.message || `识别到 ${response.data.segments.length} 道题目`,
        };
      } else {
        // API 返回空结果，提示手动裁剪
        return {
          success: true, // 请求成功但无结果
          segments: [],
          originalImage: imageBase64,
          message: response.data.message || '未识别到题目，请使用手动框选',
          needManualCrop: true,
          errorType: response.data.errorType,
        };
      }
    } else {
      // 后端返回明确的错误
      console.error('[YoudaoApi] 后端返回错误:', response.data.message);
      return {
        success: false,
        segments: [],
        originalImage: imageBase64,
        message: response.data.message || '识别失败',
        needManualCrop: true,
        errorType: 'API_ERROR',
        errorDetail: response.data.message,
      };
    }
  } catch (error: any) {
    console.error('[YoudaoApi] 请求异常:', error.message);

    // 区分不同类型的错误
    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;
      const message = error.response.data?.message || `服务器错误 (${status})`;

      console.error(`[YoudaoApi] HTTP ${status}:`, message);

      return {
        success: false,
        segments: [],
        originalImage: imageBase64,
        message: `识别服务错误: ${message}`,
        needManualCrop: true,
        errorType: 'SERVER_ERROR',
        errorDetail: message,
        statusCode: status,
      };
    } else if (error.request) {
      // 请求发出但没有收到响应
      console.error('[YoudaoApi] 无响应:', error.request);
      return {
        success: false,
        segments: [],
        originalImage: imageBase64,
        message: '无法连接到识别服务，请检查网络或稍后重试',
        needManualCrop: true,
        errorType: 'NETWORK_ERROR',
        errorDetail: 'No response from server',
      };
    } else {
      // 请求配置错误
      return {
        success: false,
        segments: [],
        originalImage: imageBase64,
        message: '请求配置错误: ' + error.message,
        needManualCrop: true,
        errorType: 'API_ERROR',
        errorDetail: error.message,
      };
    }
  }
}

/**
 * 从原始图片中裁剪出指定区域
 * @param imageSrc - 原始图片 base64
 * @param segment - 裁剪区域
 */
export function cropSegmentFromImage(
  imageSrc: string,
  segment: { x: number; y: number; width: number; height: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法获取 canvas 上下文'));
        return;
      }

      canvas.width = segment.width;
      canvas.height = segment.height;

      ctx.drawImage(
        img,
        segment.x,
        segment.y,
        segment.width,
        segment.height,
        0,
        0,
        segment.width,
        segment.height
      );

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = imageSrc;
  });
}

export default {
  smartSegmentQuestion,
  cropSegmentFromImage,
};
