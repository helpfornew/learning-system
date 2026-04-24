import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Result, Button } from 'antd'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
    this.setState({ error, errorInfo })

    // 可以在这里发送错误报告到服务器
  }

  public handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    // 刷新页面
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Result
          status="error"
          title="应用程序错误"
          subTitle={this.state.error?.message || '发生未知错误'}
          extra={[
            <Button type="primary" key="reload" onClick={this.handleReset}>
              重新加载
            </Button>,
            <Button key="details" onClick={() => {
              const errorText = `${this.state.error?.message}\n\n${this.state.errorInfo?.componentStack}`
              navigator.clipboard.writeText(errorText)
            }}>
              复制错误信息
            </Button>
          ]}
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
