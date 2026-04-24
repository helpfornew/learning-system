import React, { useState, useEffect } from 'react'
import { Layout, ConfigProvider, theme, App as AntdApp, message, Button, Modal, Card, Row, Col, Alert, Tag, Drawer } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudSyncOutlined,
  BellOutlined,
  BarChartOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  BulbOutlined,
  MenuOutlined,
  DashboardOutlined,
  SettingOutlined,
  HomeOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import ErrorBoundary from './components/ErrorBoundary'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import MistakeBook from './pages/MistakeBook'
import DataAnalysis from './pages/DataAnalysis'
import PersonalizedLearningPlan from './pages/PersonalizedLearningPlan'
import ReviewPlan from './pages/ReviewPlan'
import Settings from './pages/Settings'
import QuickInputModal from './components/QuickInputModal'
import { getAccountApiBase, verifyToken, saveAuthInfo } from './config/api'
import './styles/App.css'

const { Header, Content, Sider } = Layout

// 用户状态组件
const UserStatus: React.FC = () => {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      setUser(JSON.parse(userInfo))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user_info')
    window.location.reload()
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: '#ff4d4f' }}>未登录</span>
        <Button size="small" onClick={() => window.location.reload()}>
          登录
        </Button>
      </div>
    )
  }

  const expiresAt = new Date(user.expires_at)
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {user.username}
        </div>
        <div style={{ fontSize: '12px', color: daysLeft > 7 ? '#52c41a' : '#faad14' }}>
          剩余 {daysLeft > 0 ? daysLeft : 0} 天
        </div>
      </div>
      <Button size="small" danger onClick={handleLogout}>
        退出
      </Button>
    </div>
  )
}

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(false)
  const [quickInputVisible, setQuickInputVisible] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  // 响应式状态
  const [isMobile, setIsMobile] = useState(false)
  const [mobileSiderOpen, setMobileSiderOpen] = useState(false)

  // 检查是否首次登录并显示欢迎弹窗
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isFirstLogin = urlParams.get('first_login') === '1'

    if (isFirstLogin && isLoggedIn) {
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => setShowWelcome(true), 500)
    }
  }, [isLoggedIn])

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = async () => {
      const userInfo = localStorage.getItem('user_info');
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          if (user) {
            setIsLoggedIn(true);
          } else {
            localStorage.removeItem('user_info');
            redirectToLogin();
          }
        } catch (error) {
          console.error('解析用户信息失败:', error);
          localStorage.removeItem('user_info');
          redirectToLogin();
        }
      } else {
        redirectToLogin();
      }
      setLoading(false);
    }
    checkLoginStatus()
  }, [])

  // 未登录时跳转到学习系统主页登录页面
  const redirectToLogin = () => {
    // 获取服务器地址（Electron 环境使用配置，浏览器环境使用当前域名）
    const serverUrl = window.electronAPI?.getServerConfig?.()?.url ||
                      window.location.origin ||
                      'http://localhost:8080';
    // 跳转到学习系统主页，带上 returnUrl 参数以便登录后返回
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `${serverUrl}/?needLogin=1&returnUrl=${currentUrl}`;
  }

  // 响应式检测 - 监听屏幕尺寸变化
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setMobileSiderOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 监听全局快捷键 - 只在已登录时生效
  useEffect(() => {
    if (!isLoggedIn) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        setQuickInputVisible(true)
      }
      if (e.key === 'F3') {
        e.preventDefault()
        setSelectedMenu('review')
      }
      if (e.key === 'F4') {
        e.preventDefault()
        setSelectedMenu('analysis')
      }
      if (e.key === 'F5') {
        e.preventDefault()
        window.location.reload()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLoggedIn])

  // 监听打开快速上传弹窗的事件
  useEffect(() => {
    const handleOpenQuickUpload = () => {
      setQuickInputVisible(true)
    }

    window.addEventListener('open-quick-upload', handleOpenQuickUpload)
    return () => window.removeEventListener('open-quick-upload', handleOpenQuickUpload)
  }, [])

  // 监听来自主进程的事件 - 只在已登录时生效
  useEffect(() => {
    if (!isLoggedIn || !window.electronAPI) return

    window.electronAPI.onStartTodayReview(() => {
      setSelectedMenu('review')
      message.info('开始今日复习')
    })

    window.electronAPI.onOpenDataAnalysis(() => {
      setSelectedMenu('analysis')
      message.info('打开数据分析')
    })
  }, [isLoggedIn])

  // 如果未登录，显示正在跳转（实际重定向在 useEffect 中处理）
  if (!loading && !isLoggedIn) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)'
      }}>
        <div style={{ color: '#0f172a', fontSize: '20px', marginBottom: '20px' }}>
          未登录，正在跳转到登录页面...
        </div>
        <Button type="primary" size="large" onClick={() => window.location.reload()}>
          立即跳转
        </Button>
      </div>
    )
  }

  // 加载中
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)'
      }}>
        <div style={{ color: '#0f172a', fontSize: '20px' }}>
          正在加载...
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (selectedMenu) {
      case 'home':
        const serverUrl = window.electronAPI?.getServerConfig?.()?.url || window.location.origin;
        window.location.href = serverUrl;
        return null;
      case 'dashboard':
        return <Dashboard />
      case 'mistakes':
        return <MistakeBook onNavigate={(key) => setSelectedMenu(key)} />
      case 'analysis':
        return <DataAnalysis />
      case 'personalized':
        return <PersonalizedLearningPlan />
      case 'review':
        return <ReviewPlan />
      case 'settings':
        return <Settings darkMode={darkMode} onDarkModeChange={setDarkMode} />
      default:
        return <Dashboard />
    }
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#0ea5e9',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#0ea5e9',
          borderRadius: 8,
          colorBgBase: darkMode ? '#0f172a' : '#ffffff',
          colorTextBase: darkMode ? '#f8fafc' : '#0f172a',
        },
        components: {
          Layout: {
            headerBg: darkMode ? '#0f172a' : '#ffffff',
            siderBg: darkMode ? '#1e293b' : '#f8fafc',
          },
        },
      }}
    >
      <AntdApp>
        <Layout style={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
          {/* 移动端 Sider - 使用 Drawer + 底部导航 */}
          {isMobile ? (
            <>
              <Drawer
                placement="left"
                onClose={() => setMobileSiderOpen(false)}
                open={mobileSiderOpen}
                width={280}
                bodyStyle={{ padding: 0 }}
                header={null}
              >
                <Sidebar
                  selectedMenu={selectedMenu}
                  onMenuSelect={(key) => {
                    setSelectedMenu(key)
                    setMobileSiderOpen(false)
                  }}
                  darkMode={darkMode}
                  onQuickInput={() => {
                    setMobileSiderOpen(false)
                    setQuickInputVisible(true)
                  }}
                />
              </Drawer>
              {/* 移动端头部 */}
              <Header style={{
                padding: '0 16px',
                background: darkMode ? '#141414' : '#ffffff',
                borderBottom: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '56px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={() => setMobileSiderOpen(true)}
                    size="large"
                  />
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    高考错题系统
                  </span>
                </div>
                <UserStatus />
              </Header>
              {/* 移动端底部导航 */}
              <div className="mobile-bottom-nav">
                <div
                  className={`mobile-bottom-nav-item ${selectedMenu === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setSelectedMenu('dashboard')}
                >
                  <DashboardOutlined className="mobile-bottom-nav-icon" />
                  <span className="mobile-bottom-nav-label">首页</span>
                </div>
                <div
                  className={`mobile-bottom-nav-item ${selectedMenu === 'mistakes' ? 'active' : ''}`}
                  onClick={() => setSelectedMenu('mistakes')}
                >
                  <BookOutlined className="mobile-bottom-nav-icon" />
                  <span className="mobile-bottom-nav-label">错题</span>
                </div>
                <div
                  className={`mobile-bottom-nav-item ${selectedMenu === 'analysis' ? 'active' : ''}`}
                  onClick={() => setSelectedMenu('analysis')}
                >
                  <BarChartOutlined className="mobile-bottom-nav-icon" />
                  <span className="mobile-bottom-nav-label">分析</span>
                </div>
                <div
                  className={`mobile-bottom-nav-item ${selectedMenu === 'review' ? 'active' : ''}`}
                  onClick={() => setSelectedMenu('review')}
                >
                  <CalendarOutlined className="mobile-bottom-nav-icon" />
                  <span className="mobile-bottom-nav-label">复习</span>
                </div>
                <div
                  className={`mobile-bottom-nav-item ${selectedMenu === 'settings' ? 'active' : ''}`}
                  onClick={() => setSelectedMenu('settings')}
                >
                  <SettingOutlined className="mobile-bottom-nav-icon" />
                  <span className="mobile-bottom-nav-label">我的</span>
                </div>
              </div>
            </>
          ) : (
            /* 桌面端 Sider */
            <Sider
              collapsible
              collapsed={collapsed}
              onCollapse={setCollapsed}
              width={240}
              theme={darkMode ? 'dark' : 'light'}
              style={{ overflowY: 'auto' }}
            >
              <Sidebar
                selectedMenu={selectedMenu}
                onMenuSelect={setSelectedMenu}
                darkMode={darkMode}
                onQuickInput={() => setQuickInputVisible(true)}
              />
            </Sider>
          )}

          <Layout style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* 桌面端头部 */}
            {!isMobile && (
              <Header className="responsive-header" style={{
                padding: '0 24px',
                background: darkMode ? '#141414' : '#ffffff',
                borderBottom: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <div className="header-title" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {selectedMenu === 'dashboard' && '仪表盘'}
                    {selectedMenu === 'mistakes' && '错题本'}
                    {selectedMenu === 'upload' && '智能上传'}
                                    {selectedMenu === 'analysis' && '数据分析'}
                    {selectedMenu === 'personalized' && '个性化学习计划'}
                    {selectedMenu === 'aitools' && 'AI 工具'}
                    {selectedMenu === 'review' && '复习计划'}
                    {selectedMenu === 'settings' && '设置'}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <UserStatus />
                    <div className="responsive-hidden-mobile" style={{ fontSize: '12px', color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: navigator.userAgent.includes('Electron') ? '#e6f7ff' : '#fff7e6',
                        border: `1px solid ${navigator.userAgent.includes('Electron') ? '#91d5ff' : '#ffe58f'}`,
                        color: navigator.userAgent.includes('Electron') ? '#1890ff' : '#fa8c16'
                      }}>
                        {navigator.userAgent.includes('Electron') ? 'Electron' : 'Browser'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        按 F2 快速录入
                      </span>
                    </div>
                  </div>
                </div>
              </Header>
            )}
            <Content className={isMobile ? 'mobile-content-wrapper' : ''} style={{
              margin: isMobile ? '0' : '24px 16px',
              padding: isMobile ? '12px' : 24,
              overflow: 'auto',
              flex: 1
            }}>
              {renderContent()}
            </Content>
          </Layout>
        </Layout>

        <QuickInputModal
          visible={quickInputVisible}
          onClose={() => setQuickInputVisible(false)}
          darkMode={darkMode}
        />

        {/* 新用户欢迎弹窗 */}
        <Modal
          open={showWelcome}
          onCancel={() => setShowWelcome(false)}
          onOk={() => setShowWelcome(false)}
          width={isMobile ? '95%' : 700}
          footer={[
            <Button key="ok" type="primary" size={isMobile ? 'middle' : 'large'} onClick={() => setShowWelcome(false)}>
              开始学习之旅
            </Button>
          ]}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: isMobile ? '24px' : '32px', marginBottom: '16px' }}>
              <SafetyCertificateOutlined style={{ color: '#52c41a', marginRight: '12px' }} />
              <span>欢迎加入高考错题系统！</span>
            </div>
            <p style={{ fontSize: isMobile ? '14px' : '16px', color: '#666', marginBottom: '32px' }}>
              🎉 恭喜您成为我们的用户！接下来让我为您介绍系统的功能
            </p>

            <Row gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]}>
              <Col xs={24} sm={12}>
                <Card size="small" hoverable>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📚</div>
                    <h4 style={{ marginBottom: '8px' }}>错题管理</h4>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: 0 }}>
                      按 F2 快速录入错题，AI 自动分析知识点和薄弱点
                    </p>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card size="small" hoverable>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                    <h4 style={{ marginBottom: '8px' }}>数据分析</h4>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: 0 }}>
                      可视化图表展示学习进度，找出提分空间
                    </p>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card size="small" hoverable>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
                    <h4 style={{ marginBottom: '8px' }}>复习计划</h4>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: 0 }}>
                      智能生成复习计划，按 F3 开始今日复习
                    </p>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card size="small" hoverable>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏰</div>
                    <h4 style={{ marginBottom: '8px' }}>时间管理</h4>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: 0 }}>
                      记录各科学习时间，智能提醒休息和锻炼
                    </p>
                  </div>
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: '32px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '12px' }}>⌨️ 快捷键速览</h4>
              <Row gutter={[16, 8]}>
                <Col xs={12} sm={8}>
                  <Tag color="blue">F2</Tag> 快速录入错题
                </Col>
                <Col xs={12} sm={8}>
                  <Tag color="green">F3</Tag> 开始今日复习
                </Col>
                <Col xs={12} sm={8}>
                  <Tag color="purple">F4</Tag> 打开数据分析
                </Col>
                <Col xs={12} sm={8}>
                  <Tag color="orange">F5</Tag> 刷新页面
                </Col>
              </Row>
            </div>

            <Alert
              message="💡 温馨提示"
              description={
                <div>
                  <p style={{ marginBottom: '8px' }}>• 您的账号已赠送 30 天 VIP 体验期，可以在"设置"中查看和管理个人配置</p>
                  <p style={{ marginBottom: '8px' }}>• 学习配置支持多设备同步，修改后会保存到服务器</p>
                  <p>• 如有任何问题，请联系客服或在设置中查看帮助文档</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginTop: '20px' }}
            />
          </div>
        </Modal>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
