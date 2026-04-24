/**
 * 配置服务 - 使用后端 API 获取配置数据
 * 支持按用户存储和获取配置
 */

import { API_BASE } from '../config/api';

interface LearningConfig {
  "系统信息": {
    "名称": string
    "版本": string
    "目标高考日期": string
    "倒计时天数": number
  }
  "学习目标": {
    "总分目标": number
    "当前总分": number
    "各科目标": Record<string, { "当前": number; "目标": number; "提分": number }>
  }
  "时间管理": {
    "每日学习时间": string
    "单日科目": string[]
    "双日科目": string[]
  }
}

// 内存缓存
let configCache: LearningConfig | null = null;

class ConfigService {
  /**
   * 获取 Token（移除SSO功能）
   */
  private getToken(): string | null {
    // 在非SSO模式下，不再使用认证token
    return null;
  }

  /**
   * 从 API 加载配置（支持用户配置）
   */
  async loadConfig(): Promise<LearningConfig | null> {
    if (configCache !== null) {
      console.log('[ConfigService] 使用缓存配置');
      return configCache;
    }

    try {
      console.log('[ConfigService] 从 API 获取配置...');

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      // 在非SSO模式下，不再添加认证头
      const response = await fetch(`${API_BASE}/api/config`, { headers });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          configCache = result.data;
          console.log('[ConfigService] 配置加载成功', result.source ? `(来源：${result.source})` : '');
          return configCache;
        }
      }
    } catch (error) {
      console.error('[ConfigService] API 失败:', error);
    }

    // API 失败，返回默认配置
    return this.getDefaultConfig();
  }

  /**
   * 保存用户配置
   */
  async saveConfig(config: LearningConfig): Promise<boolean> {
    // 在非SSO模式下，直接保存配置，不再检查token
    try {
      console.log('[ConfigService] 保存用户配置...');

      const response = await fetch(`${API_BASE}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // 在非SSO模式下，不再发送认证头
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          configCache = config;
          console.log('[ConfigService] 配置保存成功');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('[ConfigService] 保存配置失败:', error);
      return false;
    }
  }

  /**
   * 刷新配置缓存
   */
  async refreshConfig(): Promise<LearningConfig | null> {
    configCache = null;
    return this.loadConfig();
  }

  /**
   * 清除配置缓存
   */
  clearCache() {
    configCache = null;
    console.log('[ConfigService] 配置缓存已清除');
  }

  /**
   * 默认配置
   */
  private getDefaultConfig(): LearningConfig {
    return {
      "系统信息": {
        "名称": "高考错题系统",
        "版本": "1.0.0",
        "目标高考日期": "2026-06-07",
        "倒计时天数": 90
      },
      "学习目标": {
        "总分目标": 540,
        "当前总分": 376,
        "各科目标": {
          "语文": { "当前": 78, "目标": 95, "提分": 17 },
          "数学": { "当前": 88, "目标": 110, "提分": 22 },
          "英语": { "当前": 50, "目标": 95, "提分": 45 },
          "物理": { "当前": 50, "目标": 75, "提分": 25 },
          "化学": { "当前": 55, "目标": 80, "提分": 25 },
          "政治": { "当前": 55, "目标": 85, "提分": 30 }
        }
      },
      "时间管理": {
        "每日学习时间": "6:00-22:20",
        "单日科目": ["数学", "政治"],
        "双日科目": ["物理", "语文"]
      }
    };
  }

  /**
   * 获取配置（同步方法，使用缓存）
   */
  getConfig(): LearningConfig {
    if (!configCache) {
      console.warn('[ConfigService] 配置未加载，返回默认配置');
      return this.getDefaultConfig();
    }
    return configCache;
  }

  getLearningGoals() {
    const config = this.getConfig();
    return config["学习目标"] || null;
  }

  getCountdownDays() {
    const config = this.getConfig();
    return config["系统信息"]?.["倒计时天数"] || 0;
  }

  getSubjectGoals() {
    const config = this.getConfig();
    return config["学习目标"]?.["各科目标"] || {};
  }

  getTodaySchedule() {
    const config = this.getConfig();
    const today = new Date().getDay();
    const isWeekend = today === 0 || today === 6;

    if (isWeekend) {
      return { type: 'weekend', subjects: [] };
    }

    const dayOfWeek = today === 0 ? 7 : today;
    const singleDaySubjects = config["时间管理"]?.["单日科目"] || [];
    const doubleDaySubjects = config["时间管理"]?.["双日科目"] || [];

    return {
      type: dayOfWeek % 2 === 1 ? 'single' : 'double',
      subjects: dayOfWeek % 2 === 1 ? singleDaySubjects : doubleDaySubjects
    };
  }
}

export default new ConfigService();
