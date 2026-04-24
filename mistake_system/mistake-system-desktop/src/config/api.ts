/**
 * API 配置
 *
 * 统一 API 入口 - 使用相对路径
 * - 账号 API: /account/api/*
 * - 错题 API: /api/mistakes/*
 * - 学习 API: /api/study-time/*
 * - 配置 API: /api/config
 *
 * 使用相对路径，页面和 API 来自同一后端服务器 (8080 或 80 端口)
 * - 开发模式：后端代理 /mistake/* 到 Vite，API 由后端直接处理
 * - 生产模式：后端直接提供静态文件和 API
 * - Electron：使用配置的服务器地址
 */

// 检测是否在 Electron 环境中
const isElectron = navigator.userAgent.includes('Electron')

// 从 Electron 配置获取服务器地址 (通过 preload.js 暴露)
let electronServerUrl: string | null = null
if (isElectron && window.electronAPI && window.electronAPI.getServerConfig) {
  try {
    const config = window.electronAPI.getServerConfig()
    electronServerUrl = (config as any)?.url || null
  } catch (e) {
    console.warn('[API Config] 无法获取 Electron 配置')
  }
}

// 统一 API 基础地址
// 浏览器环境使用相对路径，Electron 使用配置的服务器地址
export const API_BASE = isElectron && electronServerUrl ? electronServerUrl : ''

// API 端点（统一使用 /api/ 和 /account/ 前缀）
export const API_ENDPOINTS = {
  // 账号 API
  ACCOUNT_VERIFY: '/account/api/verify',
  ACCOUNT_LOGIN: '/account/api/login',
  ACCOUNT_REGISTER: '/account/api/register',
  ACCOUNT_LOGOUT: '/account/api/logout',

  // 错题 API
  MISTAKES: '/api/mistakes',

  // 学习 API
  STUDY_TIME: '/api/study-time',

  // 配置 API
  CONFIG: '/api/config',
  SCHEDULE: '/api/schedule',
}

// 简化的 API 调用函数
export const getApiBase = () => API_BASE
export const getAccountApiBase = () => API_BASE
export const getMistakeApiBase = () => API_BASE
export const getStudyApiBase = () => API_BASE

// 打印配置
console.log('[API Config] API_BASE:', API_BASE || '(空字符串，相对路径)')
console.log('[API Config] Electron 环境:', isElectron)
if (isElectron && electronServerUrl) {
  console.log('[API Config] Electron 服务器地址:', electronServerUrl)
}


// ============ 认证辅助函数 ============

/**
 * 从 localStorage 获取 token
 */
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * 保存认证信息
 */
export const saveAuthInfo = (token: string, userInfo?: any): void => {
  localStorage.setItem('auth_token', token);
  if (userInfo) {
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  }
};

/**
 * 清空认证信息
 */
export const clearAuthInfo = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
};

/**
 * 验证 token 有效性
 */
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/account/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    });
    return response.ok;
  } catch (error) {
    console.error('Token 验证失败:', error);
    return false;
  }
};

