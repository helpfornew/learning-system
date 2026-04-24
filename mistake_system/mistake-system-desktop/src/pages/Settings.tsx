import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  Slider,
  Divider,
  Row,
  Col,
  Tabs,
  Upload,
  message,
  Alert,
  Space,
  Tag,
  Spin,
  InputNumber,
  Collapse
} from 'antd';
import {
  SaveOutlined,
  UploadOutlined,
  DownloadOutlined,
  UserOutlined,
  BellOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  CloudServerOutlined,
  ClockCircleOutlined,
  BookOutlined,
  ApiOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  CaretRightOutlined
} from '@ant-design/icons';
import configService from '../services/configService';
import { getUserStats } from '../services/statsService';
import { getDueForReviewCount } from '../services/reviewService';
import type { UserStats } from '../services/statsService';

const { Option } = Select;

interface SettingsProps {
  darkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ darkMode, onDarkModeChange }) => {
  const [form] = Form.useForm();
  const [learningForm] = Form.useForm();
  const [llmForm] = Form.useForm();
  const [qwenForm] = Form.useForm();  // 为通义千问配置添加表单实例
  const [deepseekForm] = Form.useForm();  // 为DeepSeek配置添加表单实例
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [serverConfig, setServerConfig] = useState<{
    url: string;
    enableCustomServer: boolean;
    allowInsecureConnection: boolean;
  } | null>(null);
  const [serverConfigLoading, setServerConfigLoading] = useState(false);
  const [learningConfig, setLearningConfig] = useState<any>(null);
  const [learningConfigLoading, setLearningConfigLoading] = useState(false);
  const [llmConfig, setLlmConfig] = useState<any>(null);
  const [llmConfigLoading, setLlmConfigLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dueForReview, setDueForReview] = useState(0);

  // 检测是否在 Electron 环境中
  const isElectron = () => {
    return window.electronAPI !== undefined;
  };

  // 获取API基础URL
  const getApiBase = () => {
    if (window.electronAPI && window.electronAPI.getServerConfig) {
      try {
        const config = window.electronAPI.getServerConfig();
        if (config.success && config.url) {
          return config.url;
        }
      } catch (e) {
        console.warn('无法从Electron获取服务器配置');
      }
    }

    if (navigator.userAgent.includes('Electron')) {
      return 'http://localhost:8080';
    }

    return `${window.location.protocol}//${window.location.host}`;
  };

  // 加载服务器配置
  useEffect(() => {
    if (isElectron()) {
      loadServerConfig();
    }
  }, []);

  // 加载学习配置
  useEffect(() => {
    loadLearningConfig();
  }, []);

  // 加载大语言模型配置
  useEffect(() => {
    loadLlmConfig();
    loadQwenConfig();
    loadDeepseekConfig();
  }, []);

  // 加载统计数据
  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    setStatsLoading(true);
    try {
      const [stats, dueCount] = await Promise.all([
        getUserStats(),
        getDueForReviewCount()
      ]);
      if (stats) {
        setUserStats(stats);
      }
      setDueForReview(dueCount);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadServerConfig = async () => {
    setServerConfigLoading(true);
    try {
      const result = await window.electronAPI.getServerConfig();
      if (result.success) {
        setServerConfig({
          url: result.url || '',
          enableCustomServer: result.enableCustomServer ?? true,
          allowInsecureConnection: result.allowInsecureConnection ?? false
        });
      } else {
        message.warning('无法读取服务器配置');
      }
    } catch (error) {
      console.error('加载服务器配置失败:', error);
    } finally {
      setServerConfigLoading(false);
    }
  };

  const loadLearningConfig = async () => {
    setLearningConfigLoading(true);
    try {
      await configService.loadConfig();
      const config = configService.getConfig();
      setLearningConfig(config);
      learningForm.setFieldsValue({
        countdownDays: config["系统信息"]?.["倒计时天数"],
        targetDate: config["系统信息"]?.["目标高考日期"],
        totalTarget: config["学习目标"]?.["总分目标"],
        currentTotal: config["学习目标"]?.["当前总分"],
        studyTime: config["时间管理"]?.["每日学习时间"],
        singleSubjects: config["时间管理"]?.["单日科目"]?.join(','),
        doubleSubjects: config["时间管理"]?.["双日科目"]?.join(',')
      });
    } catch (error) {
      console.error('加载学习配置失败:', error);
    } finally {
      setLearningConfigLoading(false);
    }
  };

  const loadLlmConfig = async () => {
    setLlmConfigLoading(true);
    try {
      // 从本地存储加载大语言模型配置
      const llmConfigStr = localStorage.getItem('llm_config');
      let config = null;

      if (llmConfigStr) {
        config = JSON.parse(llmConfigStr);
      } else {
        // 默认配置
        config = {
          provider: 'openai',
          apiKey: '',
          model: 'gpt-4o',
          baseUrl: 'https://api.openai.com/v1',
          temperature: 0.7,
          maxTokens: 2048
        };
      }

      setLlmConfig(config);
      llmForm.setFieldsValue(config);
    } catch (error) {
      console.error('加载大语言模型配置失败:', error);
      message.error('加载大语言模型配置失败');
    } finally {
      setLlmConfigLoading(false);
    }
  };

  // 加载通义千问配置
  const loadQwenConfig = async () => {
    try {
      const configService = await import('../services/aiConfig');
      const config = await configService.loadQianwenConfig();
      qwenForm.setFieldsValue({
        qwen: {
          enabled: config.enabled || false,
          apiKey: config.apiKey || '',
          apiEndpoint: config.apiEndpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
          model: config.model || 'qwen-max',
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 2000
        }
      });
    } catch (error) {
      console.error('加载通义千问配置失败:', error);
    }
  };

  // 加载DeepSeek配置
  const loadDeepseekConfig = async () => {
    try {
      const configService = await import('../services/aiConfig');
      const config = await configService.loadDeepseekConfig();
      deepseekForm.setFieldsValue({
        deepseek: {
          enabled: config.enabled || false,
          apiKey: config.apiKey || '',
          apiEndpoint: config.apiEndpoint || 'https://api.deepseek.com/chat/completions',
          model: config.model || 'deepseek-chat',
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 2000
        }
      });
    } catch (error) {
      console.error('加载DeepSeek配置失败:', error);
    }
  };

  const handleSaveServerConfig = async () => {
    if (!serverConfig) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.saveServerConfig(serverConfig);
      if (result.success) {
        message.success('服务器配置已保存，请重启应用生效');
      } else {
        message.error('保存失败：' + result.error);
      }
    } catch (error) {
      console.error('保存服务器配置失败:', error);
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLearningConfig = async () => {
    setLoading(true);
    try {
      const values = await learningForm.validateFields();
      const config: any = {
        "系统信息": {
          "名称": "高考错题系统",
          "版本": "2.0.0",
          "目标高考日期": values.targetDate,
          "倒计时天数": values.countdownDays
        },
        "学习目标": {
          "总分目标": values.totalTarget,
          "当前总分": values.currentTotal,
          "各科目标": learningConfig?.["学习目标"]?.["各科目标"] || {}
        },
        "时间管理": {
          "每日学习时间": values.studyTime,
          "单日科目": values.singleSubjects?.split(',').map((s: string) => s.trim()).filter(Boolean),
          "双日科目": values.doubleSubjects?.split(',').map((s: string) => s.trim()).filter(Boolean)
        }
      };

      const success = await configService.saveConfig(config);
      if (success) {
        message.success('学习配置已保存');
        setLearningConfig(config);
      } else {
        message.error('保存失败，请重试');
      }
    } catch (error: any) {
      console.error('保存学习配置失败:', error);
      message.error(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLlmConfig = async () => {
    setLoading(true);
    try {
      const values = await llmForm.validateFields();

      // 保存配置到本地存储
      const configToSave = {
        ...values
      };

      localStorage.setItem('llm_config', JSON.stringify(configToSave));

      message.success('大语言模型配置已保存');
      setLlmConfig(configToSave);
    } catch (error: any) {
      console.error('保存大语言模型配置失败:', error);
      message.error(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存通义千问配置
  const handleSaveQwenConfig = async () => {
    setLoading(true);
    try {
      const values = await qwenForm.validateFields();

      // 保存配置到 qianwenConfig 服务
      const configService = await import('../services/aiConfig');
      const success = await configService.saveQianwenConfig({
        enabled: values.qwen?.enabled || false,
        apiKey: values.qwen?.apiKey || '',
        apiEndpoint: values.qwen?.apiEndpoint || 'https://dashscope.aliyuncs.com/api/v1',
        model: values.qwen?.model || 'qwen-max',
        temperature: values.qwen?.temperature || 0.7,
        maxTokens: values.qwen?.maxTokens || 2000
      });

      if (success) {
        message.success('通义千问配置已保存');
      } else {
        message.error('保存失败，请重试');
      }
    } catch (error: any) {
      console.error('保存通义千问配置失败:', error);
      message.error(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存DeepSeek配置
  const handleSaveDeepseekConfig = async () => {
    setLoading(true);
    try {
      const values = await deepseekForm.validateFields();

      // 保存配置到 deepseekConfig 服务
      const configService = await import('../services/aiConfig');
      const success = await configService.saveDeepseekConfig({
        enabled: values.deepseek?.enabled || false,
        apiKey: values.deepseek?.apiKey || '',
        apiEndpoint: values.deepseek?.apiEndpoint || 'https://api.deepseek.com/chat/completions',
        model: values.deepseek?.model || 'deepseek-chat',
        temperature: values.deepseek?.temperature || 0.7,
        maxTokens: values.deepseek?.maxTokens || 2000
      });

      if (success) {
        message.success('DeepSeek配置已保存');
      } else {
        message.error('保存失败，请重试');
      }
    } catch (error: any) {
      console.error('保存DeepSeek配置失败:', error);
      message.error(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 数据导入导出处理函数
  const handleImport = (info: any) => {
    if (info.file.status === 'done') {
      message.success('数据导入成功');
      // 可以在这里添加导入后刷新页面或更新状态的逻辑
      window.location.reload();
    } else if (info.file.status === 'error') {
      message.error('数据导入失败');
    }
  };

  const handleExport = () => {
    try {
      // 导出学习配置
      const config = configService.getConfig();
      const configStr = JSON.stringify(config, null, 2);
      const blob = new Blob([configStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `learning_config_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      message.success('配置导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('配置导出失败');
    }
  };



  // 通知设置数据
  const notificationSettings = [
    { key: 'dailyReminder', label: '每日学习提醒', default: true },
    { key: 'reviewNotification', label: '复习提醒', default: true },
    { key: 'achievement', label: '成就解锁通知', default: true },
    { key: 'systemUpdate', label: '系统更新通知', default: false },
  ];

  // 复习设置数据
  const reviewSettings = [
    { key: 'dailyGoal', label: '每日复习目标', default: 10, min: 1, max: 50, step: 1 },
    { key: 'reviewInterval', label: '复习间隔倍数', default: 1.5, min: 1, max: 3, step: 0.1 },
    { key: 'autoReviewTime', label: '自动复习时间', default: '20:00' },
    { key: 'smartReview', label: '智能复习模式', default: true },
  ];

  const tabItems = [
    {
      key: 'general',
      label: '通用设置',
      icon: <UserOutlined />,
      children: (
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            // 通用设置表单的提交处理
            console.log('通用设置已提交:', values);
            message.success('通用设置已保存');
          }}
          initialValues={{
            username: '学生用户',
            language: 'zh-CN',
            theme: darkMode ? 'dark' : 'light',
            autoSave: true,
            fontSize: 14,
          }}
        >
          <Row gutter={32}>
            <Col xs={24} lg={12}>
              <Form.Item label="用户名" name="username">
                <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
              </Form.Item>

              <Form.Item label="界面语言" name="language">
                <Select>
                  <Option value="zh-CN">简体中文</Option>
                  <Option value="en-US">English</Option>
                  <Option value="ja-JP">日本語</Option>
                </Select>
              </Form.Item>

              <Form.Item label="主题模式" name="theme">
                <Select onChange={(value) => onDarkModeChange(value === 'dark')}>
                  <Option value="light">浅色模式</Option>
                  <Option value="dark">深色模式</Option>
                  <Option value="auto">跟随系统</Option>
                </Select>
              </Form.Item>

              <Form.Item label="字体大小" name="fontSize">
                <Slider
                  min={12}
                  max={20}
                  marks={{ 12: '小', 16: '中', 20: '大' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item label="自动保存" name="autoSave" valuePropName="checked">
                <Switch />
              </Form.Item>
              <div style={{ marginBottom: 16 }}>
                <span style={{ display: 'block', marginBottom: 8 }}>数据备份</span>
                <Space>
                  <Upload
                    accept=".json,.xlsx,.csv"
                    showUploadList={false}
                    customRequest={({ file, onSuccess }) => {
                      setTimeout(() => {
                        onSuccess?.({ status: 'success' });
                      }, 1000);
                    }}
                    onChange={handleImport}
                  >
                    <Button icon={<UploadOutlined />}>导入数据</Button>
                  </Upload>
                  <Button icon={<DownloadOutlined />} onClick={handleExport}>
                    导出数据
                  </Button>
                </Space>
              </div>

              <Alert
                style={{ marginTop: 24 }}
                message="数据安全提示"
                description="定期备份数据可以防止数据丢失。建议每周备份一次重要数据。"
                type="info"
                showIcon
              />
            </Col>
          </Row>

          <Divider />

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'qwen-config',
      label: '通义千问API',
      icon: <ApiOutlined />,
      children: (
        <Form
          form={qwenForm}
          layout="vertical"
          initialValues={{
            qwen: {
              enabled: false,
              apiKey: '',
              apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
              model: 'qwen-max',
              temperature: 0.7,
              maxTokens: 2000
            }
          }}
        >
          <h3 style={{ marginBottom: 16 }}>通义千问 (Qwen) API 配置</h3>
          <Alert
            message="配置说明"
            description="为通义千问API配置专用的API密钥和设置。通义千问特别适合中文内容的理解和生成。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form.Item label="启用通义千问API" name={['qwen', 'enabled']} valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            label="API密钥"
            name={['qwen', 'apiKey']}
            rules={[{ required: false, message: '请输入通义千问API密钥' }]}
            extra="通义千问API密钥，可从阿里云获取"
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          <Form.Item
            label="API端点"
            name={['qwen', 'apiEndpoint']}
          >
            <Input placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="模型"
                name={['qwen', 'model']}
                extra="可手动输入模型名称，如 qwen-max、qwen-plus 等"
              >
                <Input placeholder="请输入模型名称，如 qwen-max" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="最大Token数"
                name={['qwen', 'maxTokens']}
              >
                <InputNumber
                  min={100}
                  max={8000}
                  style={{ width: '100%' }}
                  addonAfter="tokens"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="温度参数"
            name={['qwen', 'temperature']}
          >
            <Slider
              min={0}
              max={1}
              step={0.1}
              marks={{ 0: '精确', 0.5: '平衡', 1: '创造' }}
            />
          </Form.Item>

          <Divider />
          <Space>
            <Button type="primary" onClick={handleSaveQwenConfig}>保存通义千问配置</Button>
            <Button>重置</Button>
          </Space>
        </Form>
      ),
    },
    {
      key: 'deepseek-config',
      label: 'DeepSeek API',
      icon: <ApiOutlined />,
      children: (
        <Form
          form={deepseekForm}
          layout="vertical"
          initialValues={{
            deepseek: {
              enabled: false,
              apiKey: '',
              apiEndpoint: 'https://api.deepseek.com/chat/completions',
              model: 'deepseek-chat',
              temperature: 0.7,
              maxTokens: 2000
            }
          }}
        >
          <h3 style={{ marginBottom: 16 }}>DeepSeek API 配置</h3>
          <Alert
            message="配置说明"
            description="为DeepSeek API配置专用的API密钥和设置。DeepSeek在编程和逻辑推理方面表现优异。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form.Item label="启用DeepSeek API" name={['deepseek', 'enabled']} valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            label="API密钥"
            name={['deepseek', 'apiKey']}
            rules={[{ required: false, message: '请输入DeepSeek API密钥' }]}
            extra="DeepSeek API密钥，可从DeepSeek官网获取"
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          <Form.Item
            label="API端点"
            name={['deepseek', 'apiEndpoint']}
          >
            <Input placeholder="https://api.deepseek.com/chat/completions" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="模型"
                name={['deepseek', 'model']}
                extra="可手动输入模型名称，如 deepseek-chat、deepseek-coder 等"
              >
                <Input placeholder="请输入模型名称，如 deepseek-chat" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="最大Token数"
                name={['deepseek', 'maxTokens']}
              >
                <InputNumber
                  min={100}
                  max={8000}
                  style={{ width: '100%' }}
                  addonAfter="tokens"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="温度参数"
            name={['deepseek', 'temperature']}
          >
            <Slider
              min={0}
              max={1}
              step={0.1}
              marks={{ 0: '精确', 0.5: '平衡', 1: '创造' }}
            />
          </Form.Item>

          <Divider />
          <Space>
            <Button type="primary" onClick={handleSaveDeepseekConfig}>保存DeepSeek配置</Button>
            <Button>重置</Button>
          </Space>
        </Form>
      ),
    },
    {
      key: 'notifications',
      label: '通知设置',
      icon: <BellOutlined />,
      children: (
        <div style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>通知偏好</h3>
          {notificationSettings.map(item => (
            <div key={item.key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <span>{item.label}</span>
              <Switch defaultChecked={item.default} />
            </div>
          ))}

          <Divider />

          <h3 style={{ marginBottom: 16 }}>通知时间</h3>
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="每日提醒时间">
                  <Select defaultValue="20:00">
                    <Option value="08:00">08:00 早上</Option>
                    <Option value="12:00">12:00 中午</Option>
                    <Option value="18:00">18:00 傍晚</Option>
                    <Option value="20:00">20:00 晚上</Option>
                    <Option value="22:00">22:00 睡前</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="提醒频率">
                  <Select defaultValue="daily">
                    <Option value="daily">每日</Option>
                    <Option value="weekly">每周</Option>
                    <Option value="biweekly">每两周</Option>
                    <Option value="monthly">每月</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      ),
    },
    {
      key: 'review',
      label: '复习设置',
      icon: <SecurityScanOutlined />,
      children: (
        <div style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>复习参数配置</h3>
          {reviewSettings.map(item => (
            <div key={item.key} style={{ marginBottom: 24 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8
              }}>
                <span>{item.label}</span>
                <Tag color="blue">{item.default}{item.key === 'dailyGoal' ? '题' : item.key === 'reviewInterval' ? '倍' : ''}</Tag>
              </div>
              {item.key === 'smartReview' ? (
                <Switch defaultChecked={item.default} />
              ) : item.key === 'autoReviewTime' ? (
                <Select defaultValue={item.default} style={{ width: '100%' }}>
                  <Option value="08:00">08:00</Option>
                  <Option value="12:00">12:00</Option>
                  <Option value="18:00">18:00</Option>
                  <Option value="20:00">20:00</Option>
                  <Option value="22:00">22:00</Option>
                </Select>
              ) : (
                <Slider
                  min={item.min as number}
                  max={item.max as number}
                  step={item.step || 1}
                  defaultValue={item.default as number}
                  marks={{
                    [item.min as number]: (item.min as number).toString(),
                    [item.default as number]: (item.default as number).toString(),
                    [item.max as number]: (item.max as number).toString()
                  }}
                />
              )}
            </div>
          ))}

          <Divider />

          <h3 style={{ marginBottom: 16 }}>复习算法</h3>
          <Form layout="vertical">
            <Form.Item label="复习间隔算法">
              <Select defaultValue="ebbinghaus">
                <Option value="ebbinghaus">艾宾浩斯遗忘曲线</Option>
                <Option value="sm2">SM-2 算法</Option>
                <Option value="custom">自定义算法</Option>
              </Select>
            </Form.Item>
            <Form.Item label="难度权重">
              <Slider
                min={0}
                max={100}
                defaultValue={60}
                marks={{ 0: '低', 50: '中', 100: '高' }}
              />
            </Form.Item>
            <Form.Item label="错题重复阈值">
              <Input type="number" defaultValue="3" addonAfter="次" />
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'data',
      label: '数据管理',
      icon: <DatabaseOutlined />,
      children: statsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin />
          <div style={{ marginTop: 12 }}>加载统计数据...</div>
        </div>
      ) : (
        <div style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>数据统计</h3>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                    {userStats?.total_mistakes || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>总错题数</div>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                    {Math.round(userStats?.total_study_time || 0)}分钟
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>累计学习时长</div>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
                    {userStats?.mastered_mistakes || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>已掌握错题</div>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fa8c16' }}>
                    {dueForReview}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>待复习错题</div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* 学习统计 */}
          {userStats && (
            <>
              <Divider />
              <h3 style={{ marginBottom: 16 }}>学习统计</h3>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={12}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#13c2c2' }}>
                        {Math.round(userStats.study_time_today || 0)}分钟
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>今日学习时长</div>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#eb2f96' }}>
                        {userStats.study_streak || 0}天
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>连续学习天数</div>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                        {Math.round(userStats.mastered_rate || 0)}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>掌握率</div>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
                        {userStats.vocabulary?.total || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>词汇总数</div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          <Divider />

          <h3 style={{ marginBottom: 16 }}>数据操作</h3>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button block icon={<DownloadOutlined />} onClick={handleExport}>
              导出所有数据 (JSON 格式)
            </Button>
            <Upload
              accept=".json"
              showUploadList={false}
              customRequest={({ file, onSuccess }) => {
                setTimeout(() => {
                  onSuccess?.({ status: 'success' });
                }, 1000);
              }}
              onChange={handleImport}
              style={{ width: '100%' }}
            >
              <Button block icon={<UploadOutlined />}>
                导入数据文件
              </Button>
            </Upload>
            <Button block danger icon={<DatabaseOutlined />}>
              清空所有数据
            </Button>
          </Space>

          <Alert
            style={{ marginTop: 24 }}
            message="警告"
            description="清空数据操作不可逆，请谨慎操作。建议先导出备份。"
            type="warning"
            showIcon
          />
        </div>
      ),
    },
    {
      key: 'about',
      label: '关于',
      icon: <GlobalOutlined />,
      children: (
        <div style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>高考错题系统</h3>
          <p style={{ marginBottom: 16, color: '#666' }}>
            一款专为高考学生设计的错题管理桌面应用，帮助您高效整理、复习错题，提升学习效率。
          </p>

          <div style={{ marginBottom: 24 }}>
            <h4>版本信息</h4>
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: 16,
              borderRadius: 6,
              marginTop: 8
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>应用版本</span>
                <span>v1.0.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Electron 版本</span>
                <span>28.0.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>React 版本</span>
                <span>18.3.1</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>数据库版本</span>
                <span>SQLite 3.42.0</span>
              </div>
            </div>
          </div>

          <Divider />

          <h4 style={{ marginBottom: 8 }}>技术支持</h4>
          <p style={{ color: '#666', marginBottom: 16 }}>
            如有问题或建议，请联系我们：
            <br />
            📧 邮箱：support@mistake-system.com
            <br />
            🌐 网站：https://mistake-system.com
          </p>

          <Alert
            message="开源协议"
            description="本项目基于 MIT 协议开源，欢迎贡献代码。"
            type="info"
            showIcon
          />
        </div>
      ),
    },
    {
      key: 'server',
      label: '服务器',
      icon: <CloudServerOutlined />,
      children: serverConfigLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>加载配置...</div>
        </div>
      ) : (
        <div style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>服务器配置</h3>
          {!isElectron() ? (
            <Alert
              message="提示"
              description="此功能仅在 Electron 桌面客户端中可用"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          ) : (
            <>
              <Alert
                message="配置说明"
                description={
                  <div>
                    <p>配置服务器地址后需要重启应用才能生效。</p>
                    <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                      <li>生产环境：使用 HTTPS 协议，如 https://your-domain.com</li>
                      <li>本地测试：使用 HTTP 协议，如 http://localhost:8080</li>
                    </ul>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form layout="vertical">
                <Form.Item label="服务器地址" required>
                  <Input
                    value={serverConfig?.url || ''}
                    onChange={(e) => setServerConfig({ ...serverConfig, url: e.target.value } as any)}
                    placeholder="https://your-domain.com"
                    size="large"
                    disabled={!serverConfig?.enableCustomServer}
                  />
                </Form.Item>

                <Form.Item label="允许自定义服务器">
                  <Switch
                    checked={serverConfig?.enableCustomServer || false}
                    onChange={(checked) => setServerConfig({ ...serverConfig, enableCustomServer: checked } as any)}
                  />
                  <span style={{ marginLeft: 8, color: '#666' }}>
                    关闭后将使用默认服务器地址
                  </span>
                </Form.Item>

                <Form.Item label="允许不安全连接">
                  <Switch
                    checked={serverConfig?.allowInsecureConnection || false}
                    onChange={(checked) => setServerConfig({ ...serverConfig, allowInsecureConnection: checked } as any)}
                  />
                  <span style={{ marginLeft: 8, color: '#666' }}>
                    允许使用 HTTP 协议（不推荐）
                  </span>
                </Form.Item>

                <Divider />

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      onClick={handleSaveServerConfig}
                      icon={<SaveOutlined />}
                      loading={loading}
                      size="large"
                    >
                      保存配置
                    </Button>
                    <Button
                      onClick={loadServerConfig}
                      disabled={loading}
                    >
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Form>

              <Alert
                message="注意"
                description="如果您是客户，请联系管理员获取正确的服务器地址。不要随意修改此配置。"
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            </>
          )}
        </div>
      ),
    },
    {
      key: 'learning',
      label: '学习配置',
      icon: <BookOutlined />,
      children: learningConfigLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>加载配置...</div>
        </div>
      ) : (
        <div style={{ maxWidth: 800 }}>
          <h3 style={{ marginBottom: 16 }}>个性化学习配置</h3>
          <Alert
            message="说明"
            description="您的学习配置会保存到服务器，在不同设备间同步。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form
            form={learningForm}
            layout="vertical"
            initialValues={{
              targetDate: learningConfig?.["系统信息"]?.["目标高考日期"] || '2026-06-07',
              countdownDays: learningConfig?.["系统信息"]?.["倒计时天数"] || 90,
              totalTarget: learningConfig?.["学习目标"]?.["总分目标"] || 540,
              currentTotal: learningConfig?.["学习目标"]?.["当前总分"] || 376,
              studyTime: learningConfig?.["时间管理"]?.["每日学习时间"] || '6:00-22:20',
              singleSubjects: learningConfig?.["时间管理"]?.["单日科目"]?.join(',') || '数学，政治',
              doubleSubjects: learningConfig?.["时间管理"]?.["双日科目"]?.join(',') || '物理，语文'
            }}
          >
            <Divider orientation="left">系统信息</Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="目标高考日期"
                  name="targetDate"
                  rules={[{ required: true, message: '请选择高考日期' }]}
                >
                  <Input type="date" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="倒计时天数"
                  name="countdownDays"
                  rules={[{ required: true, message: '请输入天数' }]}
                >
                  <InputNumber min={0} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">学习目标</Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="总分目标"
                  name="totalTarget"
                  rules={[{ required: true, message: '请输入目标分数' }]}
                >
                  <InputNumber min={0} max={750} style={{ width: '100%' }} addonAfter="分" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="当前总分"
                  name="currentTotal"
                  rules={[{ required: true, message: '请输入当前分数' }]}
                >
                  <InputNumber min={0} max={750} style={{ width: '100%' }} addonAfter="分" />
                </Form.Item>
              </Col>
            </Row>

            <Alert
              message="提示"
              description="各科目标可在首页查看，暂时不支持修改"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Divider orientation="left">时间管理</Divider>

            <Form.Item
              label="每日学习时间"
              name="studyTime"
              rules={[{ required: true, message: '请输入学习时间' }]}
            >
              <Input placeholder="例：6:00-22:20" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="单日科目"
                  name="singleSubjects"
                  help="周一、三、五、日学习的科目，用逗号分隔"
                  rules={[{ required: true, message: '请输入科目' }]}
                >
                  <Input placeholder="例：数学，政治" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="双日科目"
                  name="doubleSubjects"
                  help="周二、四、六学习的科目，用逗号分隔"
                  rules={[{ required: true, message: '请输入科目' }]}
                >
                  <Input placeholder="例：物理，语文" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  onClick={handleSaveLearningConfig}
                  icon={<SaveOutlined />}
                  loading={loading}
                  size="large"
                >
                  保存配置
                </Button>
                <Button
                  onClick={loadLearningConfig}
                  disabled={loading}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      ),
    },
  ];

  return (
    <div className="settings">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>系统设置</h1>
        <p style={{ color: '#666' }}>个性化配置系统参数，优化使用体验</p>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
};

export default Settings;
