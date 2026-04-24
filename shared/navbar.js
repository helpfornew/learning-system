/**
 * 高考学习系统 - 统一导航栏组件
 * 依赖: auth.js
 */

(function(global) {
    'use strict';

    // 导航配置
    const NAV_CONFIG = {
        // 导航项目
        items: [
            { id: 'home', label: '首页', icon: '🏠', url: '/', active: false },
            { id: 'learning', label: '学习平台', icon: '📚', url: '/learning/', active: false },
            { id: 'mistake', label: '错题系统', icon: '📝', url: '/mistake/', active: false },
            { id: 'wordcard', label: '单词卡', icon: '🔤', url: '/wordcard/', active: false },
            { id: 'tools', label: '工具中心', icon: '🛠️', url: '/tools', active: false },
        ],

        // 系统名称映射
        systemNames: {
            'home': '高考学习系统',
            'learning': '学习平台',
            'mistake': '错题系统',
            'wordcard': '单词卡',
            'tools': '工具中心'
        }
    };

    /**
     * 统一导航栏组件
     */
    const Navbar = {
        // 当前激活的系统
        currentSystem: 'home',

        // 容器元素
        container: null,

        /**
         * 初始化导航栏
         * @param {string} systemId - 当前系统标识
         * @param {HTMLElement} container - 容器元素 (可选)
         */
        init(systemId, container) {
            this.currentSystem = systemId || 'home';
            this.container = container || document.getElementById('unified-navbar');

            if (!this.container) {
                // 自动创建导航栏容器
                this.container = document.createElement('div');
                this.container.id = 'unified-navbar';
                document.body.insertBefore(this.container, document.body.firstChild);
            }

            this.render();
            this.bindEvents();

            // 加载用户信息
            this.loadUserInfo();

            return this;
        },

        /**
         * 渲染导航栏
         */
        render() {
            const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
            const isLoggedIn = !!user;

            const navItemsHtml = NAV_CONFIG.items.map(item => {
                const isActive = item.id === this.currentSystem;
                return `
                    <li class="nav-item">
                        <a href="${item.url}" class="nav-link ${isActive ? 'active' : ''}" data-nav="${item.id}">
                            <span class="icon">${item.icon}</span>
                            <span>${item.label}</span>
                        </a>
                    </li>
                `;
            }).join('');

            const userHtml = isLoggedIn ? `
                <div class="user-dropdown" id="user-dropdown">
                    <div class="user-info" id="user-menu-trigger">
                        <div class="user-avatar">${this.getAvatarText(user)}</div>
                        <span class="user-name">${user.username || '用户'}</span>
                        <span>▼</span>
                    </div>
                    <div class="dropdown-menu" id="dropdown-menu">
                        <a href="/profile" class="dropdown-item">
                            <span>👤</span> 个人中心
                        </a>
                        <a href="/settings" class="dropdown-item">
                            <span>⚙️</span> 设置
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item text-danger" id="logout-btn">
                            <span>🚪</span> 退出登录
                        </a>
                    </div>
                </div>
            ` : `
                <div class="auth-buttons">
                    <a href="/?action=login" class="btn-navbar btn-navbar-outline">登录</a>
                    <a href="/?action=register" class="btn-navbar btn-navbar-primary">注册</a>
                </div>
            `;

            const systemName = NAV_CONFIG.systemNames[this.currentSystem] || '高考学习系统';

            this.container.innerHTML = `
                <nav class="unified-navbar">
                    <div class="navbar-brand">
                        <a href="/" class="navbar-logo">
                            <span class="navbar-logo-icon">📖</span>
                            <span class="navbar-logo-text">高考学习</span>
                        </a>
                        <span class="system-badge">${systemName}</span>
                    </div>

                    <button class="navbar-toggle" id="navbar-toggle">☰</button>

                    <ul class="navbar-nav" id="navbar-nav">
                        ${navItemsHtml}
                    </ul>

                    <div class="navbar-user">
                        ${userHtml}
                    </div>
                </nav>
            `;

            // 加载样式
            this.loadStyles();
        },

        /**
         * 加载样式
         */
        loadStyles() {
            if (document.getElementById('unified-navbar-styles')) {
                return;
            }

            const link = document.createElement('link');
            link.id = 'unified-navbar-styles';
            link.rel = 'stylesheet';
            link.href = '/shared/navbar.css';
            document.head.appendChild(link);
        },

        /**
         * 绑定事件
         */
        bindEvents() {
            // 移动端菜单切换
            const toggle = this.container.querySelector('#navbar-toggle');
            const nav = this.container.querySelector('#navbar-nav');

            if (toggle && nav) {
                toggle.addEventListener('click', () => {
                    nav.classList.toggle('show');
                });
            }

            // 用户下拉菜单
            const userTrigger = this.container.querySelector('#user-menu-trigger');
            const dropdown = this.container.querySelector('#dropdown-menu');

            if (userTrigger && dropdown) {
                userTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('show');
                });

                // 点击外部关闭
                document.addEventListener('click', () => {
                    dropdown.classList.remove('show');
                });
            }

            // 登出按钮
            const logoutBtn = this.container.querySelector('#logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await this.handleLogout();
                });
            }

            // 认证过期事件监听
            window.addEventListener('auth:expired', () => {
                this.render();
            });
        },

        /**
         * 加载用户信息
         */
        async loadUserInfo() {
            if (typeof Auth === 'undefined') {
                console.warn('Auth 模块未加载');
                return;
            }

            if (Auth.isLoggedIn()) {
                const result = await Auth.verifyToken();
                if (result.valid) {
                    this.render();
                }
            }
        },

        /**
         * 获取头像文字
         * @param {Object} user
         * @returns {string}
         */
        getAvatarText(user) {
            if (!user) return '?';
            if (user.username) {
                return user.username.charAt(0).toUpperCase();
            }
            return 'U';
        },

        /**
         * 处理登出
         */
        async handleLogout() {
            if (typeof Auth !== 'undefined') {
                await Auth.logout();
            }

            // 清除本地存储
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');

            // 刷新页面或跳转到首页
            window.location.href = '/';
        },

        /**
         * 更新当前系统
         * @param {string} systemId
         */
        setSystem(systemId) {
            this.currentSystem = systemId;
            this.render();
        },

        /**
         * 添加自定义导航项
         * @param {Object} item
         */
        addNavItem(item) {
            NAV_CONFIG.items.push(item);
            this.render();
        },

        /**
         * 移除导航项
         * @param {string} itemId
         */
        removeNavItem(itemId) {
            NAV_CONFIG.items = NAV_CONFIG.items.filter(item => item.id !== itemId);
            this.render();
        }
    };

    // 暴露到全局
    global.Navbar = Navbar;

    // 同时支持 CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Navbar;
    }

})(typeof window !== 'undefined' ? window : global);
