import React, { useState, useEffect } from 'react'
import { Menu, Button, Tooltip, Divider } from 'antd'
import {
  DashboardOutlined,
  BookOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SettingOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  MoonOutlined,
  SunOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  HomeOutlined,
  UploadOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

interface SidebarProps {
  selectedMenu: string
  onMenuSelect: (key: string) => void
  darkMode: boolean
  onQuickInput?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ selectedMenu, onMenuSelect, darkMode, onQuickInput }) => {
  // 高考倒计时（2026 年 6 月 7 日）
  const [gaokaoDays, setGaokaoDays] = useState(() => {
    const now = new Date()
    const gaokao = new Date('2026-06-07')
    const diff = gaokao.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const gaokao = new Date('2026-06-07')
      const diff = gaokao.getTime() - now.getTime()
      setGaokaoDays(Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }, 1000 * 60 * 60) // 每小时更新一次

    return () => clearInterval(timer)
  }, [])

  const menuItems: MenuProps['items'] = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '返回主页',
      title: '返回学习系统主页',
      style: { fontWeight: 'bold', color: '#1890FF' }
    },
    {
      type: 'divider'
    },
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      title: '仪表盘 (Ctrl+1)'
    },
    {
      key: 'mistakes',
      icon: <BookOutlined />,
      label: '错题本',
      title: '错题本 (Ctrl+2)'
    },
    {
      key: 'analysis',
      icon: <BarChartOutlined />,
      label: '数据分析',
      title: '数据分析 (Ctrl+3)'
    },
    {
      key: 'personalized',
      icon: <BulbOutlined />,
      label: '个性化学习计划',
      title: '个性化学习计划 (Ctrl+5)'
    },
    {
      key: 'review',
      icon: <CalendarOutlined />,
      label: '复习计划',
      title: '复习计划 (Ctrl+4)'
    },
    {
      type: 'divider'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      title: '设置 (Ctrl+,)'
    }
  ]

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'home') {
      // 返回主页：优先使用 Electron 配置，否则使用当前域名
      const serverUrl = window.electronAPI?.getServerConfig?.()?.url || window.location.origin;
      window.location.href = serverUrl;
      return;
    }
    onMenuSelect(e.key)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '16px 0'
    }}>
      {/* Logo 区域 */}
      <div style={{
        padding: '0 24px 16px 24px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: darkMode ? '#fff' : '#1890FF',
          marginBottom: '4px'
        }}>
          高考错题系统
        </div>
        <div style={{
          fontSize: '12px',
          color: darkMode ? '#8c8c8c' : '#666',
          marginBottom: '8px'
        }}>
          🎯 距离 2026 年高考还有 <span style={{ fontWeight: 'bold', color: darkMode ? '#fff' : '#1890FF' }}>{gaokaoDays}</span> 天
        </div>
        <div style={{
          fontSize: '11px',
          color: darkMode ? '#595959' : '#999'
        }}>
          2026 年 6 月 7 日
        </div>
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* 快速操作按钮 */}
      <div style={{ padding: '0 16px 16px 16px' }}>
        <Tooltip title="快速录入错题 (F2)" placement="right">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            block
            onClick={() => {
              onQuickInput?.()
            }}
            style={{
              height: '40px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            快速录入
          </Button>
        </Tooltip>
      </div>

      {/* 主菜单 */}
      <Menu
        selectedKeys={[selectedMenu]}
        onClick={handleMenuClick}
        items={menuItems}
        mode="inline"
        theme={darkMode ? 'dark' : 'light'}
        style={{
          flex: 1,
          borderRight: 'none',
          fontSize: '14px'
        }}
      />

      {/* 底部区域 */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <Tooltip title="帮助文档" placement="right">
            <Button
              type="text"
              icon={<QuestionCircleOutlined />}
              size="small"
              style={{ color: darkMode ? '#8c8c8c' : '#666' }}
            />
          </Tooltip>

          <Tooltip title={darkMode ? "切换到亮色模式" : "切换到暗色模式"} placement="left">
            <Button
              type="text"
              icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
              size="small"
              style={{ color: darkMode ? '#8c8c8c' : '#666' }}
              onClick={() => {
                // 切换暗色模式逻辑在 Settings 组件中处理
                onMenuSelect('settings')
              }}
            />
          </Tooltip>
        </div>

        {/* 返回主页面按钮 */}
        <Button
          type="default"
          icon={<HomeOutlined />}
          block
          onClick={() => {
            const serverUrl = window.electronAPI?.getServerConfig?.()?.url || window.location.origin;
            window.location.href = serverUrl;
          }}
          style={{
            height: '36px',
            fontSize: '12px',
            marginBottom: '12px'
          }}
        >
          返回主页面
        </Button>

        {/* 快捷键提示 */}
        <div style={{
          fontSize: '11px',
          color: darkMode ? '#595959' : '#bfbfbf',
          textAlign: 'center'
        }}>
          <div>F2: 快速录入</div>
          <div>F3: 今日复习</div>
          <div>F4: 数据分析</div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
