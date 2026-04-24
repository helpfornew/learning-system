/**
 * 统计数据服务
 * 获取用户学习统计数据
 */

import { API_BASE } from '../config/api';
import type { ApiResponse } from '../types';

const API_URL = `${API_BASE}/api`;

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

// 科目分布
export interface SubjectDistribution {
  [subject: string]: number;
}

// 周学习活动
export interface WeeklyActivity {
  date: string;
  duration: number;
}

// 词汇统计
export interface VocabularyStats {
  total: number;
  mastered: number;
}

// 用户统计数据
export interface UserStats {
  total_mistakes: number;
  mastered_mistakes: number;
  mastered_rate: number;
  review_today: number;
  study_time_today: number;
  study_streak: number;
  total_study_time: number;
  subject_distribution: SubjectDistribution;
  weekly_activity: WeeklyActivity[];
  vocabulary: VocabularyStats;
}

/**
 * 获取用户统计数据
 */
export async function getUserStats(): Promise<UserStats | null> {
  try {
    console.log('[StatsService] 获取用户统计数据...');
    const response = await fetch(`${API_URL}/stats`, {
      headers: getHeaders()
    });

    if (response.ok) {
      const result: ApiResponse<UserStats> = await response.json();
      if (result.success && result.data) {
        console.log('[StatsService] 获取统计数据成功:', result.data);
        return result.data;
      }
    } else if (response.status === 401) {
      console.warn('[StatsService] 未授权，请重新登录');
      handleAuthError();
      return null;
    } else {
      console.error('[StatsService] 响应错误:', response.status);
    }
  } catch (error) {
    console.error('[StatsService] 获取统计数据失败:', error);
  }

  return null;
}

/**
 * 获取今日学习时长（小时）
 */
export async function getTodayStudyTime(): Promise<number> {
  const stats = await getUserStats();
  return stats?.study_time_today || 0;
}

/**
 * 获取连续学习天数
 */
export async function getStudyStreak(): Promise<number> {
  const stats = await getUserStats();
  return stats?.study_streak || 0;
}

/**
 * 获取科目分布数据（用于图表）
 */
export async function getSubjectDistribution(): Promise<SubjectDistribution> {
  const stats = await getUserStats();
  return stats?.subject_distribution || {};
}

/**
 * 获取周学习活动数据
 */
export async function getWeeklyActivity(): Promise<WeeklyActivity[]> {
  const stats = await getUserStats();
  return stats?.weekly_activity || [];
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
  getUserStats,
  getTodayStudyTime,
  getStudyStreak,
  getSubjectDistribution,
  getWeeklyActivity
};
