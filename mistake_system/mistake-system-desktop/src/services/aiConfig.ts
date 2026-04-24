/**
 * 统一 AI 配置服务
 *
 * 合并 deepseekConfig.ts 和 qianwenConfig.ts
 * 支持多个 AI 提供商的配置管理
 */

import { API_BASE } from '../config/api';

const API_URL = `${API_BASE}/api/ai-config`;

// ============ 类型定义 ============

export interface AIProviderConfig {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  provider?: string;
}

export interface QianwenConfig extends AIProviderConfig {}
export interface DeepseekConfig extends AIProviderConfig {}

// ============ 默认配置 ============

const defaultQianwenConfig: QianwenConfig = {
  apiKey: '',
  apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  model: 'qwen-max',
  enabled: false,
  maxTokens: 2000,
  temperature: 0.7,
  provider: 'qwen'
};

const defaultDeepseekConfig: DeepseekConfig = {
  apiKey: '',
  apiEndpoint: 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-chat',
  maxTokens: 2000,
  temperature: 0.7,
  enabled: false,
  provider: 'deepseek'
};

// ============ 缓存 ============

let qianwenCache: QianwenConfig | null = null;
let deepseekCache: DeepseekConfig | null = null;

// ============ Qwen 配置 API ============

export const getQianwenConfig = (): QianwenConfig => {
  if (qianwenCache !== null) {
    return qianwenCache;
  }

  const generalConfigStr = localStorage.getItem('llm_config');
  if (generalConfigStr) {
    try {
      const generalConfig = JSON.parse(generalConfigStr);
      if (generalConfig.provider === 'qwen' || generalConfig.provider === 'aliyun') {
        qianwenCache = {
          apiKey: generalConfig.apiKey || '',
          apiEndpoint: generalConfig.baseUrl || defaultQianwenConfig.apiEndpoint,
          model: generalConfig.model || defaultQianwenConfig.model,
          enabled: !!(generalConfig.apiKey),
          maxTokens: generalConfig.maxTokens || defaultQianwenConfig.maxTokens,
          temperature: generalConfig.temperature || defaultQianwenConfig.temperature,
          provider: 'qwen'
        };
        return qianwenCache;
      }
    } catch (e) {
      console.warn('[AIConfig] 加载通用配置失败:', e);
    }
  }

  return { ...defaultQianwenConfig };
};

export const loadQianwenConfig = async (): Promise<QianwenConfig> => {
  try {
    const response = await fetch(`${API_URL}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      }
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && result.data.qwen) {
        const qwenData = result.data.qwen;
        qianwenCache = {
          apiKey: qwenData.apiKey || '',
          apiEndpoint: qwenData.endpoint || defaultQianwenConfig.apiEndpoint,
          model: qwenData.model || defaultQianwenConfig.model,
          enabled: qwenData.enabled !== false,
          maxTokens: qwenData.maxTokens || defaultQianwenConfig.maxTokens,
          temperature: qwenData.temperature || defaultQianwenConfig.temperature,
          provider: 'qwen'
        };
        return qianwenCache;
      }
    }
  } catch (error) {
    console.error('[AIConfig] 千问配置 API 加载失败:', error);
  }

  return getQianwenConfig();
};

export const saveQianwenConfig = async (config: QianwenConfig): Promise<boolean> => {
  const payload = {
    provider: 'qwen',
    apiKey: config.apiKey,
    endpoint: config.apiEndpoint,
    model: config.model,
    enabled: config.enabled,
    maxTokens: config.maxTokens,
    temperature: config.temperature
  };

  try {
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      qianwenCache = config;
      // 同时保存到 localStorage 作为降级方案
      localStorage.setItem('llm_config', JSON.stringify(payload));
      return true;
    }
    return false;
  } catch (error) {
    console.error('[AIConfig] 保存千问配置失败:', error);
    // 失败时保存到 localStorage
    localStorage.setItem('llm_config', JSON.stringify(payload));
    return false;
  }
};

export const validateQianwenConfig = (config: QianwenConfig): boolean => {
  return !!(config.apiKey && config.apiEndpoint && config.model);
};

export const refreshQianwenConfig = (): void => {
  qianwenCache = null;
};

// ============ DeepSeek 配置 API ============

export const getDeepseekConfig = (): DeepseekConfig => {
  if (deepseekCache !== null) {
    return deepseekCache;
  }

  const generalConfigStr = localStorage.getItem('llm_config');
  if (generalConfigStr) {
    try {
      const generalConfig = JSON.parse(generalConfigStr);
      if (generalConfig.provider === 'deepseek') {
        deepseekCache = {
          apiKey: generalConfig.apiKey || '',
          apiEndpoint: generalConfig.baseUrl || defaultDeepseekConfig.apiEndpoint,
          model: generalConfig.model || defaultDeepseekConfig.model,
          enabled: !!(generalConfig.apiKey),
          maxTokens: generalConfig.maxTokens || defaultDeepseekConfig.maxTokens,
          temperature: generalConfig.temperature || defaultDeepseekConfig.temperature,
          provider: 'deepseek'
        };
        return deepseekCache;
      }
    } catch (e) {
      console.warn('[AIConfig] 加载通用配置失败:', e);
    }
  }

  return { ...defaultDeepseekConfig };
};

export const loadDeepseekConfig = async (): Promise<DeepseekConfig> => {
  try {
    const response = await fetch(`${API_URL}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      }
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && result.data.deepseek) {
        const deepseekData = result.data.deepseek;
        deepseekCache = {
          apiKey: deepseekData.apiKey || '',
          apiEndpoint: deepseekData.endpoint || defaultDeepseekConfig.apiEndpoint,
          model: deepseekData.model || defaultDeepseekConfig.model,
          enabled: deepseekData.enabled !== false,
          maxTokens: deepseekData.maxTokens || defaultDeepseekConfig.maxTokens,
          temperature: deepseekData.temperature || defaultDeepseekConfig.temperature,
          provider: 'deepseek'
        };
        return deepseekCache;
      }
    }
  } catch (error) {
    console.error('[AIConfig] DeepSeek 配置 API 加载失败:', error);
  }

  return getDeepseekConfig();
};

export const saveDeepseekConfig = async (config: DeepseekConfig): Promise<boolean> => {
  const payload = {
    provider: 'deepseek',
    apiKey: config.apiKey,
    endpoint: config.apiEndpoint,
    model: config.model,
    enabled: config.enabled,
    maxTokens: config.maxTokens,
    temperature: config.temperature
  };

  try {
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      deepseekCache = config;
      // 同时保存到 localStorage 作为降级方案
      localStorage.setItem('llm_config', JSON.stringify(payload));
      return true;
    }
    return false;
  } catch (error) {
    console.error('[AIConfig] 保存 DeepSeek 配置失败:', error);
    // 失败时保存到 localStorage
    localStorage.setItem('llm_config', JSON.stringify(payload));
    return false;
  }
};

export const validateDeepseekConfig = (config: DeepseekConfig): boolean => {
  return !!(config.apiKey && config.apiEndpoint && config.model);
};

export const refreshDeepseekConfig = (): void => {
  deepseekCache = null;
};

// ============ 向后兼容导出 ============
export const getConfig = getDeepseekConfig;
export const loadConfig = loadDeepseekConfig;
