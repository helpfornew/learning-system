/**
 * 统一数据服务 - 支持账号系统，每个账号数据隔离
 * 支持 Web 浏览器和 Electron 两个环境
 */

import { API_BASE } from '../config/api';
import type { Mistake, MistakeInput, MistakeUpdate, ApiResponse } from '../types';

// 获取当前用户的 token
function getUserToken(): string | null {
  return localStorage.getItem('auth_token');
}

const API_URL = `${API_BASE}/api`;

// 内存缓存，避免重复请求
let cache: Mistake[] | null = null;

/**
 * 获取请求头（包含认证 token）
 */
function getHeaders(): HeadersInit {
  const token = getUserToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * 获取所有错题 - 直接从 API 获取
 */
export async function getMistakes(): Promise<Mistake[]> {
  // 有缓存直接返回
  if (cache !== null) {
    console.log('[DataService] 使用缓存数据，数量:', cache.length);
    return cache;
  }

  try {
    console.log('[DataService] 从 API 获取错题...');
    console.log('[DataService] API URL:', `${API_URL}/mistakes`);
    const response = await fetch(`${API_URL}/mistakes`, {
      headers: getHeaders()
    });

    console.log('[DataService] 响应状态:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('[DataService] 响应数据:', result);
      if (result.success && Array.isArray(result.data)) {
        cache = result.data;
        console.log('[DataService] 从 API 获取成功，数量:', cache.length);
        return cache;
      } else {
        console.warn('[DataService] 响应格式异常:', result);
      }
    } else if (response.status === 401) {
      console.warn('[DataService] 未授权，请重新登录');
      // 401 未授权，跳转到统一登录页面
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      // 构建返回地址
      const returnUrl = encodeURIComponent(window.location.href);
      const serverUrl = window.location.origin || 'http://localhost:8080';
      window.location.href = `${serverUrl}/?needLogin=1&returnUrl=${returnUrl}`;
      return [];
    } else {
      console.error('[DataService] 响应错误:', response.status);
    }
  } catch (error) {
    console.error('[DataService] API 失败:', error);
  }

  return [];
}

/**
 * 刷新缓存 - 强制从 API 重新获取
 */
export async function refreshMistakes(): Promise<Mistake[]> {
  cache = null;  // 清除缓存
  return getMistakes();
}

/**
 * 清除缓存 - 在数据更新后调用
 */
export function clearCache() {
  cache = null;
  console.log('[DataService] 缓存已清除，下次获取时将重新请求 API');
}

/**
 * 添加错题
 */
export async function addMistake(mistake: MistakeInput): Promise<ApiResponse> {
  try {
    console.log('[DataService] Adding mistake...');
    const response = await fetch(`${API_URL}/mistakes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(mistake)
    });

    console.log('[DataService] 响应状态:', response.status);

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('[DataService] Added mistake via API');
        // 清除缓存，下次获取时重新请求
        clearCache();
        // 触发自定义事件，通知其他组件数据已更新
        window.dispatchEvent(new CustomEvent('mistakes-updated'));
        return result;
      } else {
        console.error('[DataService] API 返回失败:', result);
        throw new Error(result.message || '添加失败');
      }
    } else if (response.status === 401) {
      console.error('[DataService] 未授权，请重新登录');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      // 跳转到统一登录页面
      const returnUrl = encodeURIComponent(window.location.href);
      const serverUrl = window.location.origin || 'http://localhost:8080';
      window.location.href = `${serverUrl}/?needLogin=1&returnUrl=${returnUrl}`;
      throw new Error('请先登录');
    } else {
      const errorText = await response.text();
      console.error('[DataService] API 错误:', response.status, errorText);
      throw new Error(`服务器错误：${response.status}`);
    }
  } catch (error) {
    console.error('[DataService] API 失败:', error);
    throw error;
  }
}

/**
 * 更新错题
 */
export async function updateMistake(id: number, updates: MistakeUpdate): Promise<ApiResponse> {
  try {
    console.log('[DataService] Updating mistake...');
    const response = await fetch(`${API_URL}/mistakes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('[DataService] Updated mistake via API');
        // 清除缓存
        clearCache();
        // 触发更新事件
        window.dispatchEvent(new CustomEvent('mistakes-updated'));
        return result;
      }
    } else if (response.status === 401) {
      console.error('[DataService] 未授权，请重新登录');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      // 跳转到统一登录页面
      const returnUrl = encodeURIComponent(window.location.href);
      const serverUrl = window.location.origin || 'http://localhost:8080';
      window.location.href = `${serverUrl}/?needLogin=1&returnUrl=${returnUrl}`;
      return { success: false, error: '请先登录' };
    }
  } catch (error) {
    console.error('[DataService] API 失败:', error);
  }

  return { success: false, error: 'API 不可用' };
}

/**
 * 删除错题
 */
export async function deleteMistake(id: number): Promise<ApiResponse> {
  try {
    console.log('[DataService] Deleting mistake...');
    const response = await fetch(`${API_URL}/mistakes/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('[DataService] Deleted mistake via API');
        // 清除缓存
        clearCache();
        // 触发更新事件
        window.dispatchEvent(new CustomEvent('mistakes-updated'));
        return result;
      }
    } else if (response.status === 401) {
      console.error('[DataService] 未授权，请重新登录');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      // 跳转到统一登录页面
      const returnUrl = encodeURIComponent(window.location.href);
      const serverUrl = window.location.origin || 'http://localhost:8080';
      window.location.href = `${serverUrl}/?needLogin=1&returnUrl=${returnUrl}`;
      return { success: false, error: '请先登录' };
    }
  } catch (error) {
    console.error('[DataService] API 失败:', error);
  }

  return { success: false, error: 'API 不可用' };
}
