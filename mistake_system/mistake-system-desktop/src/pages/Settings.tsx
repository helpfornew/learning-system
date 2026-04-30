import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  Divider,
  Row,
  Col,
  Tabs,
  message,
  Space,
  Spin,
  InputNumber
} from 'antd';
import {
  SaveOutlined,
  UserOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  BookOutlined
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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [serverConfig, setServerConfig] = useState<{
    url: string;
    enableCustomServer: boolean;
  } | null>(null);
  const [serverConfigLoading, setServerConfigLoading] = useState(false);
  const [learningConfig, setLearningConfig] = useState<any>(null);
  const [learningConfigLoading, setLearningConfigLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dueForReview, setDueForReview] = useState(0);

  const isElectron = () => {
    return window.electronAPI !== undefined;
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
          enableCustomServer: result.enableCustomServer ?? true
        });
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
      message.error(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'general',
      label: '通用设置',
      icon: <UserOutlined />,
      children: (
        <Form
          form={form}
          layout="vertical"
          onFinish={() => message.success('通用设置已保存')}
          initialValues={{
            theme: darkMode ? 'dark' : 'light',
            autoSave: true,
          }}
        >
          <Row gutter={32}>
            <Col xs={24} lg={12}>
              <Form.Item label="主题模式" name="theme">
                <Select onChange={(value) => onDarkModeChange(value === 'dark')}>
                  <Option value="light">浅色模式</Option>
                  <Option value="dark">深色模式</Option>
                  <Option value="auto">跟随系统</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item label="自动保存" name="autoSave" valuePropName="checked">
                <Switch />
              </Form.Item>
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
      key: 'learning',
      label: '学习配置',
      icon: <BookOutlined />,
      children: learningConfigLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ maxWidth: 800 }}>
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
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="目标高考日期" name="targetDate">
                  <Input type="date" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="倒计时天数" name="countdownDays">
                  <InputNumber min={0} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="总分目标" name="totalTarget">
                  <InputNumber min={0} max={750} style={{ width: '100%' }} addonAfter="分" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="当前总分" name="currentTotal">
                  <InputNumber min={0} max={750} style={{ width: '100%' }} addonAfter="分" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="每日学习时间" name="studyTime">
              <Input placeholder="例：6:00-22:20" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="单日科目" name="singleSubjects" help="用逗号分隔">
                  <Input placeholder="例：数学，政治" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="双日科目" name="doubleSubjects" help="用逗号分隔">
                  <Input placeholder="例：物理，语文" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Form.Item>
              <Space>
                <Button type="primary" onClick={handleSaveLearningConfig} icon={<SaveOutlined />} loading={loading}>
                  保存配置
                </Button>
              </Space>
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
        </div>
      ) : (
        <div style={{ maxWidth: 600 }}>
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
        </div>
      ) : (
        <div style={{ maxWidth: 600 }}>
          {!isElectron() ? (
            <p>此功能仅在 Electron 桌面客户端中可用</p>
          ) : (
            <Form layout="vertical">
              <Form.Item label="服务器地址">
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
              </Form.Item>
              <Divider />
              <Form.Item>
                <Space>
                  <Button type="primary" onClick={handleSaveServerConfig} icon={<SaveOutlined />} loading={loading}>
                    保存配置
                  </Button>
                  <Button onClick={loadServerConfig} disabled={loading}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="settings">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>系统设置</h1>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
};

export default Settings;
