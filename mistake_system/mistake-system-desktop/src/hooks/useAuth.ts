/**
 * 用户认证 Hook
 * 封装用户登录状态管理和认证相关操作
 */

import { useState, useEffect, useCallback } from 'react';
import type { User, AuthState } from '../types';

const USER_INFO_KEY = 'user_info';
const AUTH_TOKEN_KEY = 'auth_token';

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    user: null,
    token: null,
    loading: true,
  });

  // 检查登录状态
  const checkLoginStatus = useCallback(() => {
    try {
      const userInfo = localStorage.getItem(USER_INFO_KEY);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);

      if (userInfo && token) {
        const user = JSON.parse(userInfo) as User;
        setState({
          isLoggedIn: true,
          user,
          token,
          loading: false,
        });
        return true;
      } else {
        setState({
          isLoggedIn: false,
          user: null,
          token: null,
          loading: false,
        });
        return false;
      }
    } catch (error) {
      console.error('解析用户信息失败:', error);
      setState({
        isLoggedIn: false,
        user: null,
        token: null,
        loading: false,
      });
      return false;
    }
  }, []);

  // 初始化时检查登录状态
  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  // 登录
  const login = useCallback((user: User, token: string) => {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setState({
      isLoggedIn: true,
      user,
      token,
      loading: false,
    });
  }, []);

  // 登出
  const logout = useCallback(() => {
    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setState({
      isLoggedIn: false,
      user: null,
      token: null,
      loading: false,
    });
  }, []);

  // 获取剩余天数
  const getDaysLeft = useCallback(() => {
    if (!state.user?.expires_at) return 0;
    const expiresAt = new Date(state.user.expires_at);
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  }, [state.user]);

  // 重定向到登录页
  const redirectToLogin = useCallback(() => {
    const serverUrl = window.electronAPI?.getServerConfig?.()?.url ||
                      window.location.origin ||
                      'http://localhost:8080';
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `${serverUrl}/?needLogin=1&returnUrl=${currentUrl}`;
  }, []);

  return {
    ...state,
    login,
    logout,
    getDaysLeft,
    redirectToLogin,
    checkLoginStatus,
  };
}

export default useAuth;
