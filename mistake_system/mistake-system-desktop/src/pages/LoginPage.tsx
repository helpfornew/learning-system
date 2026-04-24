import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Tabs, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PoweroffOutlined } from '@ant-design/icons';
import { API_BASE, API_ENDPOINTS } from '../config/api';
import './LoginPage.css';

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;  // 添加 token 字段
  user?: {
    id: number;
    username: string;
    email: string;
    vip_level: number;
    expires_at: string;
  };
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // 检查是否已登录（非SSO模式，检查本地用户信息）
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setUserInfo(user);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('解析用户信息失败:', error);
      }
    }
  }, []);

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.ACCOUNT_LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password
        })
      });

      const result: LoginResponse = await response.json();

      if (result.success && result.user) {
        // 存储 auth_token 和 user_info
        if (result.token) {
          localStorage.setItem('auth_token', result.token);
        }
        localStorage.setItem('user_info', JSON.stringify(result.user));

        // 检查是否首次登录
        const isFirstLogin = !localStorage.getItem('has_welcomed');

        // 登录成功后刷新页面以加载主应用，而不是跳转到学习系统主页
        window.location.reload();
        message.success('登录成功！');
      } else {
        message.error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      message.error('网络连接失败，请检查账号服务器');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.ACCOUNT_REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          email: values.email
        })
      });

      const result: LoginResponse = await response.json();

      if (result.success && result.user) {
        // 存储 auth_token 和 user_info
        if (result.token) {
          localStorage.setItem('auth_token', result.token);
        }
        localStorage.setItem('user_info', JSON.stringify(result.user));
        message.success('注册并登录成功！赠送 30 天体验期');
        // 注册成功后刷新页面以加载主应用，而不是跳转到学习系统主页
        window.location.reload();
      } else {
        message.error(result.message || '注册失败');
      }
    } catch (error) {
      console.error('注册失败:', error);
      message.error('网络连接失败，请检查账号服务器');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      await fetch(`${API_BASE}${API_ENDPOINTS.ACCOUNT_LOGOUT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('退出登录失败:', error);
    } finally {
      localStorage.removeItem('user_info');
      localStorage.removeItem('auth_token');
      setIsLoggedIn(false);
      setUserInfo(null);
      message.success('已退出登录');
    }
  };

  if (isLoggedIn && userInfo) {
    const expiresAt = new Date(userInfo.expires_at);
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft <= 0;
    const isVip = userInfo.vip_level >= 1;

    return (
      <div className="login-page">
        <Card className="user-card" title="用户信息">
          <div className="user-info">
            <div className="avatar">
              <UserOutlined />
            </div>
            <h2>{userInfo.username}</h2>
            {userInfo.email && <p className="email">{userInfo.email}</p>}
            <div className="vip-badge">
              {isVip ? `VIP${userInfo.vip_level}` : '普通用户'}
            </div>
          </div>

          <div className="subscription-info">
            {isExpired ? (
              <Alert
                message="会员已过期，请续费或重新注册"
                type="error"
                showIcon
              />
            ) : (
              <>
                <Alert
                  message={`有效期剩余 ${daysLeft > 0 ? daysLeft : 0} 天`}
                  type={daysLeft > 7 ? 'success' : daysLeft > 0 ? 'warning' : 'error'}
                  showIcon
                />
                {isVip && (
                  <p style={{marginTop: '8px', fontSize: '13px'}}>
                    当前状态：VIP 用户，可使用 AI 分析等高级功能
                  </p>
                )}
              </>
            )}
            <p className="expires-at">
              到期时间：{expiresAt.toLocaleDateString('zh-CN')}
            </p>
          </div>

          <Button
            type="primary"
            danger
            icon={<PoweroffOutlined />}
            onClick={handleLogout}
            block
          >
            退出登录
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="login-page">
      <Card className="login-card" title="高考错题系统 - 用户登录">
        <Tabs
          defaultActiveKey="login"
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form
                  name="login"
                  onFinish={handleLogin}
                  autoComplete="off"
                  size="large"
                >
                  <Form.Item
                    name="username"
                    rules={[
                      { required: true, message: '请输入用户名' },
                      { min: 3, message: '用户名至少 3 个字符' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="用户名"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 6, message: '密码至少 6 个字符' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="密码"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      登录
                    </Button>
                  </Form.Item>

                  <div className="login-tip">
                    <p>首次登录自动注册，赠送 30 天体验期</p>
                  </div>
                </Form>
              )
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form
                  name="register"
                  onFinish={handleRegister}
                  autoComplete="off"
                  size="large"
                >
                  <Form.Item
                    name="username"
                    rules={[
                      { required: true, message: '请输入用户名' },
                      { min: 3, message: '用户名至少 3 个字符' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="用户名（至少 3 个字符）"
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    rules={[
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="邮箱（可选）"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 6, message: '密码至少 6 个字符' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="密码（至少 6 个字符）"
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirm"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '请确认密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'));
                        }
                      })
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="确认密码"
                    />
                  </Form.Item>

                  <Form.Item
                    name="invite_code"
                    rules={[
                      { required: true, message: '请输入邀请码' }
                    ]}
                  >
                    <Input
                      placeholder="请输入邀请码（必填）"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      注册（赠送 30 天 VIP）
                    </Button>
                  </Form.Item>
                </Form>
              )
            }
          ]}
        />
      </Card>

      <div className="login-features">
        <h3>🎓 高考错题系统 - 您的专属学习助手</h3>

        <div className="feature-grid">
          <div className="feature-item">
            <div className="feature-icon">📚</div>
            <h4>智能错题管理</h4>
            <p>拍照上传错题，AI 自动分析知识点和薄弱点</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <h4>数据分析看板</h4>
            <p>可视化图表展示学习进度，提分空间一目了然</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">📅</div>
            <h4>个性化学习计划</h4>
            <p>根据错题自动生成复习计划，科学安排学习时间</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">⏰</div>
            <h4>时间跟踪</h4>
            <p>记录各科学习时间，智能提醒休息和锻炼</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">🔔</div>
            <h4>智能提醒</h4>
            <p>复习提醒、休息提醒、锻炼提醒，劳逸结合更高效</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">☁️</div>
            <h4>数据云同步</h4>
            <p>多设备数据自动同步，随时随地查看学习进度</p>
          </div>
        </div>

        <div className="new-user-benefit">
          <h4>🎁 新用户福利</h4>
          <p>首次注册即赠送 <strong>30 天 VIP 体验期</strong>，享受所有高级功能！</p>
          <p style={{ fontSize: '13px', color: '#666' }}>
            💡 登录后还有详细的功能介绍和快捷键指南，帮助您快速上手
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
