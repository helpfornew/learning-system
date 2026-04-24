declare global {
  interface Window {
    electronAPI: {
      // 数据库操作
      databaseQuery: (sql: string, params?: any[]) => Promise<any>
      databaseExecute: (sql: string, params?: any[]) => Promise<any>
      getMistakes: (filters?: any) => Promise<any[]>
      addMistake: (mistake: any) => Promise<any>
      updateMistake: (id: number, updates: any) => Promise<any>
      deleteMistake: (id: number) => Promise<any>
      getStatistics: () => Promise<any>

      // 窗口控制
      openQuickInput: () => void
      closeQuickInput: () => void
      
      // 事件监听
      onStartTodayReview: (callback: () => void) => void
      onOpenDataAnalysis: (callback: () => void) => void
      
      // 工具函数
      showNotification: (title: string, body: string) => void
      
      // 获取应用信息
      getAppVersion: () => Promise<string>
      
      // 文件操作
      selectFile: (options: any) => Promise<string>
      saveFile: (content: string, options: any) => Promise<string>

      // 服务器配置
      getServerConfig: () => Promise<{ success: boolean; url?: string; enableCustomServer?: boolean; allowInsecureConnection?: boolean; error?: string }>
      saveServerConfig: (config: { url: string; enableCustomServer?: boolean; allowInsecureConnection?: boolean }) => Promise<{ success: boolean; error?: string }>

      // 摄像头权限
      requestCameraPermission: () => Promise<{ success: boolean; message?: string }>
    }

    nodeModules: {
      path: {
        join: (...args: string[]) => string
        basename: (path: string) => string
        dirname: (path: string) => string
      }
      fs: {
        readFileSync: (path: string, encoding: string) => string
        writeFileSync: (path: string, data: string) => void
        existsSync: (path: string) => boolean
      }
    }
  }
}

export {}
