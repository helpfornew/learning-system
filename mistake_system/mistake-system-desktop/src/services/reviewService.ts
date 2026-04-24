/**
 * 复习历史服务
 * 获取和记录错题复习历史
 */

import { API_BASE } from '../config/api';
import type { ApiResponse } from '../types';

const API_URL = `${API_BASE}/api`;

// 复习结果类型
export type ReviewResult = 'success' | 'difficult' | 'forgotten';

// 复习记录
export interface ReviewRecord {
  mistake_id: number;
  content: string;
  subject: string;
  subject_id: number;
  review_date: string;
  review_result: 'mastered' | 'reviewing' | 'forgotten';
  review_count: number;
  difficulty: number;
  next_review_date: string;
}

// 复习历史统计
export interface ReviewHistoryStats {
  total_reviews: number;
  mastered_count: number;
  due_for_review: number;
  active_days_last_week: number;
}

// 复习历史响应
export interface ReviewHistoryResponse {
  reviews: ReviewRecord[];
  total: number;
  limit: number;
  offset: number;
  stats: ReviewHistoryStats;
}

// 获取认证 Token
function getHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * 获取复习历史记录
 * @param limit 返回数量 (默认20)
 * @param offset 分页偏移 (默认0)
 * @param days 查询最近N天 (默认30)
 */
export async function getReviewHistory(
  limit: number = 20,
  offset: number = 0,
  days: number = 30
): Promise<ReviewHistoryResponse | null> {
  try {
    console.log('[ReviewService] 获取复习历史...');
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      days: days.toString()
    });

    const response = await fetch(`${API_URL}/review-history?${params}`, {
      headers: getHeaders()
    });

    if (response.ok) {
      const result: ApiResponse<ReviewHistoryResponse> = await response.json();
      if (result.success && result.data) {
        console.log('[ReviewService] 获取复习历史成功:', result.data);
        return result.data;
      }
    } else if (response.status === 401) {
      console.warn('[ReviewService] 未授权，请重新登录');
      handleAuthError();
      return null;
    } else {
      console.error('[ReviewService] 响应错误:', response.status);
    }
  } catch (error) {
    console.error('[ReviewService] 获取复习历史失败:', error);
  }

  return null;
}

/**
 * 记录错题复习
 * @param mistakeId 错题ID
 * @param result 复习结果
 * @param notes 备注（可选）
 */
export async function recordReview(
  mistakeId: number,
  result: ReviewResult,
  notes?: string
): Promise<boolean> {
  try {
    console.log('[ReviewService] 记录复习:', { mistakeId, result, notes });

    const response = await fetch(`${API_URL}/review-history`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        mistake_id: mistakeId,
        result,
        notes
      })
    });

    if (response.ok) {
      const result: ApiResponse = await response.json();
      if (result.success) {
        console.log('[ReviewService] 记录复习成功');
        // 触发复习记录更新事件
        window.dispatchEvent(new CustomEvent('review-recorded'));
        return true;
      }
    } else if (response.status === 401) {
      console.warn('[ReviewService] 未授权，请重新登录');
      handleAuthError();
      return false;
    } else {
      const errorText = await response.text();
      console.error('[ReviewService] 响应错误:', response.status, errorText);
    }
  } catch (error) {
    console.error('[ReviewService] 记录复习失败:', error);
  }

  return false;
}

/**
 * 获取最近复习记录
 * @param count 记录数量
 * @param days 最近N天
 */
export async function getRecentReviews(
  count: number = 10,
  days: number = 7
): Promise<ReviewRecord[]> {
  const history = await getReviewHistory(count, 0, days);
  return history?.reviews || [];
}

/**
 * 获取复习统计
 */
export async function getReviewStats(): Promise<ReviewHistoryStats | null> {
  const history = await getReviewHistory(1, 0, 30);
  return history?.stats || null;
}

/**
 * 获取待复习错题数量
 */
export async function getDueForReviewCount(): Promise<number> {
  const stats = await getReviewStats();
  return stats?.due_for_review || 0;
}

/**
 * 处理认证错误
 */
function handleAuthError() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
  const returnUrl = encodeURIComponent(window.location.href);
  const serverUrl = window.location.origin || 'http://localhost:8080';
  window.location.href = `${serverUrl}/?needLogin=1&returnUrl=${returnUrl}`;
}

export default {
  getReviewHistory,
  recordReview,
  getRecentReviews,
  getReviewStats,
  getDueForReviewCount
};
