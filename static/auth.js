/**
 * 高考学习系统 - 统一认证模块
 * 供各子系统引入使用
 */

(function(global) {
    'use strict';

    const AUTH_CONFIG = {
        // Token 存储键名
        TOKEN_KEY: 'auth_token',
        USER_KEY: 'user_info',
        USER_ID_KEY: 'user_id',

        // API 基础地址
        API_BASE: '',

        // 登录页面地址
        LOGIN_URL: '/',

        // 认证检查间隔 (毫秒)
        CHECK_INTERVAL: 60000, // 1分钟
    };

    /**
     * 统一认证模块
     */
    const Auth = {
        // 当前用户信息缓存
        _currentUser: null,
        _checkIntervalId: null,

        /**
         * 获取存储的 Token
         * @returns {string|null}
         */
        getToken() {
            try {
                return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
            } catch (e) {
                console.warn('localStorage 不可用:', e);
                return null;
            }
        },

        /**
         * 设置 Token
         * @param {string} token
         */
        setToken(token) {
            try {
                if (token) {
                    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
                } else {
                    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
                }
            } catch (e) {
                console.warn('localStorage 不可用:', e);
            }
        },

        /**
         * 获取当前用户信息
         * @returns {Object|null}
         */
        getUser() {
            if (this._currentUser) {
                return this._currentUser;
            }
            try {
                const userJson = localStorage.getItem(AUTH_CONFIG.USER_KEY);
                return userJson ? JSON.parse(userJson) : null;
            } catch (e) {
                return null;
            }
        },

        /**
         * 设置当前用户信息
         * @param {Object} user
         */
        setUser(user) {
            this._currentUser = user;
            try {
                if (user) {
                    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
                    if (user.id) {
                        localStorage.setItem(AUTH_CONFIG.USER_ID_KEY, user.id.toString());
                    }
                } else {
                    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
                    localStorage.removeItem(AUTH_CONFIG.USER_ID_KEY);
                }
            } catch (e) {
                console.warn('localStorage 不可用:', e);
            }
        },

        /**
         * 获取用户ID
         * @returns {string|null}
         */
        getUserId() {
            const user = this.getUser();
            return user ? user.id : null;
        },

        /**
         * 检查是否已登录
         * @returns {boolean}
         */
        isLoggedIn() {
            return !!this.getToken();
        },

        /**
         * 异步验证 Token 有效性
         * @returns {Promise<Object>}
         */
        async verifyToken() {
            const token = this.getToken();
            if (!token) {
                return { valid: false, user: null };
            }

            try {
                const response = await fetch('/account/api/user', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        this.setUser(data.data);
                        return { valid: true, user: data.data };
                    }
                }

                // 只有 401 明确表示 token 无效时才清除本地存储
                if (response.status === 401) {
                    this.clearAuth();
                }
                return { valid: false, user: null };
            } catch (error) {
                console.error('Token 验证失败:', error);
                return { valid: false, user: null, error: error.message };
            }
        },

        /**
         * 要求登录，未登录时跳转到登录页
         * @param {string} redirectUrl - 登录成功后跳转地址
         * @returns {Promise<boolean>}
         */
        async requireAuth(redirectUrl) {
            const result = await this.verifyToken();

            if (!result.valid) {
                // 保存当前页面地址，登录后返回
                const returnUrl = redirectUrl || window.location.href;
                this.setReturnUrl(returnUrl);

                // 跳转到登录页
                window.location.href = AUTH_CONFIG.LOGIN_URL;
                return false;
            }

            return true;
        },

        /**
         * 检查认证状态（同步）
         * @returns {boolean}
         */
        checkAuth() {
            return this.isLoggedIn();
        },

        /**
         * 登录
         * @param {string} username
         * @param {string} password
         * @returns {Promise<Object>}
         */
        async login(username, password) {
            try {
                const response = await fetch('/account/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (data.success && data.token) {
                    this.setToken(data.token);
                    this.setUser(data.user);
                    return { success: true, user: data.user };
                }

                return { success: false, message: data.message || '登录失败' };
            } catch (error) {
                console.error('登录请求失败:', error);
                return { success: false, message: '网络错误，请稍后重试' };
            }
        },

        /**
         * 注册
         * @param {Object} userData
         * @returns {Promise<Object>}
         */
        async register(userData) {
            try {
                const response = await fetch('/account/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (data.success && data.token) {
                    this.setToken(data.token);
                    this.setUser(data.user);
                    return { success: true, user: data.user };
                }

                return { success: false, message: data.message || '注册失败' };
            } catch (error) {
                console.error('注册请求失败:', error);
                return { success: false, message: '网络错误，请稍后重试' };
            }
        },

        /**
         * 登出
         * @returns {Promise<boolean>}
         */
        async logout() {
            const token = this.getToken();

            try {
                if (token) {
                    await fetch('/account/api/logout', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ token })
                    });
                }
            } catch (error) {
                console.warn('登出请求失败:', error);
            }

            this.clearAuth();
            return true;
        },

        /**
         * 清除认证信息
         */
        clearAuth() {
            this._currentUser = null;
            this.setToken(null);
            this.setUser(null);
        },

        /**
         * 获取登录后返回的 URL
         * @returns {string|null}
         */
        getReturnUrl() {
            try {
                const url = sessionStorage.getItem('auth_return_url');
                sessionStorage.removeItem('auth_return_url');
                return url;
            } catch (e) {
                return null;
            }
        },

        /**
         * 设置登录后返回的 URL
         * @param {string} url
         */
        setReturnUrl(url) {
            try {
                sessionStorage.setItem('auth_return_url', url);
            } catch (e) {
                console.warn('sessionStorage 不可用:', e);
            }
        },

        /**
         * 跳转到登录后返回的 URL
         */
        redirectToReturnUrl() {
            const returnUrl = this.getReturnUrl();
            if (returnUrl && returnUrl !== window.location.href) {
                window.location.href = returnUrl;
            } else {
                // 默认跳转到首页
                window.location.href = '/';
            }
        },

        /**
         * 启动自动检查
         * 定期检查登录状态，发现未登录时跳转
         */
        startAutoCheck() {
            this.stopAutoCheck();
            this._checkIntervalId = setInterval(async () => {
                const result = await this.verifyToken();
                if (!result.valid) {
                    console.log('认证已过期，需要重新登录');
                    // 可以在这里触发事件通知页面
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('auth:expired'));
                    }
                }
            }, AUTH_CONFIG.CHECK_INTERVAL);
        },

        /**
         * 停止自动检查
         */
        stopAutoCheck() {
            if (this._checkIntervalId) {
                clearInterval(this._checkIntervalId);
                this._checkIntervalId = null;
            }
        },

        /**
         * 带认证的 fetch 请求
         * @param {string} url
         * @param {Object} options
         * @returns {Promise<Response>}
         */
        async fetchWithAuth(url, options = {}) {
            const token = this.getToken();

            const headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
            };

            const response = await fetch(url, {
                ...options,
                headers
            });

            // 如果返回 401，清除认证并触发事件
            if (response.status === 401) {
                this.clearAuth();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('auth:expired'));
                }
            }

            return response;
        }
    };

    // 暴露到全局
    global.Auth = Auth;

    // 同时支持 CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Auth;
    }

})(typeof window !== 'undefined' ? window : global);
