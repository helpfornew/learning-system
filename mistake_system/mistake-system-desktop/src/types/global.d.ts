// 全局 Window 类型扩展

interface Window {
  // Electron API 暴露
  electronAPI?: {
    getServerConfig: () => { url: string } | null;
  };
  // 全局服务器 URL 配置（允许外部设置）
  serverUrl?: string;
}
