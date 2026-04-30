import React from 'react'
import { Menu, Button } from 'antd'
import {
  DashboardOutlined,
  BookOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SettingOutlined,
  PlusOutlined,
  BulbOutlined,
  HomeOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

interface SidebarProps {
  selectedMenu: string
  onMenuSelect: (key: string) => void
  darkMode: boolean
  onQuickInput?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ selectedMenu, onMenuSelect, darkMode, onQuickInput }) => {
  const menuItems: MenuProps['items'] = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '返回主页',
      style: { fontWeight: 'bold', color: '#1890FF' }
    },
    { type: 'divider' },
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘'
    },
    {
      key: 'mistakes',
      icon: <BookOutlined />,
      label: '错题本'
    },
    {
      key: 'analysis',
      icon: <BarChartOutlined />,
      label: '数据分析'
    },
    {
      key: 'personalized',
      icon: <BulbOutlined />,
      label: '个性化学习计划'
    },
    {
      key: 'review',
      icon: <CalendarOutlined />,
      label: '复习计划'
    },
    { type: 'divider' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置'
    }
  ]

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'home') {
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
          错题系统
        </div>
      </div>

      <div style={{ padding: '0 16px 16px 16px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={() => onQuickInput?.()}
          style={{
            height: '40px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          快速录入
        </Button>
      </div>

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
    </div>
  )
}

export default Sidebar
