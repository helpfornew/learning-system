import React, { useState, useEffect } from 'react'
import { Layout, ConfigProvider, theme, App as AntdApp, message, Button, Drawer } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import {
  BookOutlined,
  BarChartOutlined,
  CalendarOutlined,
  DashboardOutlined,
  SettingOutlined,
  MenuOutlined
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
import './styles/App.css'

const { Header, Content, Sider } = Layout

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark_mode');
    return saved !== null ? saved === 'true' : true;
  })
  const [quickInputVisible, setQuickInputVisible] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileSiderOpen, setMobileSiderOpen] = useState(false)

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
    const serverUrl = window.electronAPI?.getServerConfig?.()?.url ||
                      window.location.origin ||
                      'http://localhost:8080';
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `${serverUrl}/?needLogin=1&returnUrl=${currentUrl}`;
  }

  // 响应式检测
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

  // 保存深色模式设置到 localStorage
  useEffect(() => {
    localStorage.setItem('dark_mode', String(darkMode));
  }, [darkMode]);

  // 监听全局快捷键
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

  // 监听来自主进程的事件
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

  // 如果未登录，显示正在跳转
  if (!loading && !isLoggedIn) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a'
      }}>
        <div style={{ color: '#fff', fontSize: '20px', marginBottom: '20px' }}>
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
        backgroundColor: '#1a1a1a'
      }}>
        <div style={{ color: '#fff', fontSize: '20px' }}>
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
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>
        <Layout style={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
          {/* 移动端 Sider */}
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
              {/* 顶部导航栏由 Navbar.js 统一提供 */}
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
            <Sider
              collapsible
              collapsed={collapsed}
              onCollapse={setCollapsed}
              width={200}
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
            {/* 顶部导航栏由 Navbar.js 统一提供 */}
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
      </AntdApp>
    </ConfigProvider>
  )
}

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

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {user.username}
        </span>
      </div>
      <Button size="small" danger onClick={handleLogout}>
        退出
      </Button>
    </div>
  )
}

export default App
