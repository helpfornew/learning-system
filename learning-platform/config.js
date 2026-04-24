// API 配置
const API_BASE = '/learning/api';

// 其他配置
const CONFIG = {
    // API 基础地址
    apiBase: API_BASE,

    // Token 存储键名（与主系统统一）
    tokenKey: 'auth_token',
    usernameKey: 'user_info',
    userIdKey: 'user_id',

    // 请求超时时间（毫秒）
    requestTimeout: 10000,

    // 同步状态显示时间（毫秒）
    syncStatusDuration: 2000
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
