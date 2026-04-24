#!/usr/bin/env python3
"""
拍照上传功能诊断脚本
用于排查摄像头和图片上传问题
"""

import os
import sys

def check_browser_environment():
    """检查浏览器环境是否支持摄像头"""
    print("\n" + "="*60)
    print("拍照上传功能诊断")
    print("="*60)

    print("""
拍照上传功能依赖浏览器的 getUserMedia API，需要满足以下条件：

1. **安全上下文要求** (必须)
   - HTTPS 协议，或
   - localhost / 127.0.0.1，或
   - file:// 协议（部分浏览器不支持摄像头）

2. **权限要求**
   - 浏览器必须授予摄像头权限
   - 操作系统必须允许浏览器访问摄像头

3. **硬件要求**
   - 设备必须有摄像头
   - 摄像头不能被其他程序占用

4. **Electron 桌面应用**
   - 需要启用 nodeIntegration
   - 需要 contextIsolation: false 或正确的 preload 脚本
""")

def common_issues():
    """常见问题及解决方案"""
    print("\n" + "="*60)
    print("常见问题及解决方案")
    print("="*60)

    issues = [
        ("❌ 错误：'当前环境不支持摄像头'", [
            "原因：不是 HTTPS 或 localhost",
            "解决：",
            "  1. 使用 http://localhost:8080 访问",
            "  2. 或者配置 HTTPS 证书",
            "  3. Electron 应用需要检查 main.js 配置"
        ]),
        ("❌ 错误：'摄像头权限被拒绝'", [
            "原因：用户点击了拒绝，或浏览器设置禁止",
            "解决：",
            "  1. 点击地址栏的摄像头图标，选择'允许'",
            "  2. 浏览器设置 → 隐私和安全 → 站点设置 → 摄像头",
            "  3. 找到 localhost:8080，改为'允许'"
        ]),
        ("❌ 错误：'未找到摄像头设备'", [
            "原因：设备没有摄像头，或驱动问题",
            "解决：",
            "  1. 检查设备管理器是否有摄像头",
            "  2. 更新摄像头驱动",
            "  3. 使用图片上传代替"
        ]),
        ("❌ 错误：'摄像头正在被其他程序使用'", [
            "原因：其他应用占用了摄像头",
            "解决：",
            "  1. 关闭其他使用摄像头的程序（Zoom、Teams、微信等）",
            "  2. 重启浏览器",
            "  3. 重启电脑"
        ]),
        ("❌ Electron 应用黑屏/无法拍照", [
            "原因：权限或配置问题",
            "解决：",
            "  1. 检查 electron/main.js 中的 webPreferences",
            "  2. 确保启用了 nodeIntegration: true",
            "  3. 添加 contextIsolation: false",
            "  4. 或使用 preload 脚本正确注入 API"
        ]),
    ]

    for title, solutions in issues:
        print(f"\n{title}")
        for line in solutions:
            print(f"  {line}")

def check_electron_config():
    """检查 Electron 配置"""
    print("\n" + "="*60)
    print("Electron 配置检查")
    print("="*60)

    electron_main = "/opt/learning-system/mistake_system/mistake-system-desktop/electron/main.js"

    if os.path.exists(electron_main):
        print(f"✅ 找到 Electron main.js: {electron_main}")
        with open(electron_main, 'r') as f:
            content = f.read()

        checks = [
            ("nodeIntegration", "nodeIntegration: true" in content or "nodeIntegration: !" in content),
            ("contextIsolation", "contextIsolation: false" in content or "contextIsolation: !" in content),
            ("webSecurity", "webSecurity: false" in content),
            ("allowRunningInsecureContent", "allowRunningInsecureContent: true" in content),
        ]

        print("\n配置检查：")
        for name, exists in checks:
            status = "✅ 已配置" if exists else "⚠️  未配置"
            print(f"  {name}: {status}")

        if not any(c[1] for c in checks[:2]):
            print("\n⚠️ 建议添加以下配置到 mainWindow:")
            print("""
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    }
            """)
    else:
        print(f"❌ 未找到 Electron main.js")

def test_image_upload():
    """测试图片上传功能"""
    print("\n" + "="*60)
    print("图片上传功能检查")
    print("="*60)

    print("""
如果只使用图片上传（不使用摄像头），需要：

1. **后端服务器运行**
   - unified_server.py 必须正在运行
   - 端口 8080 必须可访问

2. **上传接口可用**
   - POST /api/mistakes 支持 multipart/form-data
   - 支持文件上传

3. **存储目录权限**
   - /opt/learning-system/data/ 目录可写
   - 上传的图片存储在 uploads/ 子目录
""")

    # 检查目录权限
    data_dir = "/opt/learning-system/data"
    if os.path.exists(data_dir):
        print(f"✅ 数据目录存在: {data_dir}")
        if os.access(data_dir, os.W_OK):
            print(f"✅ 数据目录可写")
        else:
            print(f"❌ 数据目录不可写，需要权限: {data_dir}")
    else:
        print(f"❌ 数据目录不存在: {data_dir}")

def browser_devtools_guide():
    """浏览器开发者工具排查指南"""
    print("\n" + "="*60)
    print("浏览器开发者工具排查步骤")
    print("="*60)

    print("""
1. **打开开发者工具** (F12)

2. **Console 面板**
   - 查看是否有红色错误信息
   - 搜索 'Camera', 'getUserMedia', 'permission' 等关键词

3. **Network 面板**
   - 上传图片时查看请求是否成功
   - 检查返回的状态码 (200, 403, 413 等)

4. **Application/Storage 面板**
   - Local Storage → auth_token 是否存在
   - 没有 token 会导致上传失败

5. **Security 面板**
   - 查看是否是安全上下文 (Secure Context)
   - 如果不是，摄像头 API 会被禁用
""")

def quick_fix_guide():
    """快速修复指南"""
    print("\n" + "="*60)
    print("快速修复指南")
    print("="*60)

    print("""
方案 1: 使用 localhost 访问 (推荐开发测试)
   http://localhost:8080/mistake/

方案 2: 配置 HTTPS (生产环境)
   1. 准备 SSL 证书
   2. 修改 unified_server.py 启用 HTTPS
   3. 或使用 nginx 反向代理

方案 3: 禁用摄像头功能，只用图片上传
   如果摄像头确实无法使用，可以直接使用图片选择功能
   （点击"选择图片"按钮，从文件系统选择）

方案 4: Electron 应用修复
   修改 electron/main.js，添加权限请求：

   const { app, BrowserWindow } = require('electron');

   app.whenReady().then(() => {
     // 请求摄像头权限
     app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer');

     const mainWindow = new BrowserWindow({
       width: 1200,
       height: 800,
       webPreferences: {
         nodeIntegration: true,
         contextIsolation: false,
         webSecurity: false
       }
     });
   });
""")

def generate_report():
    """生成诊断报告"""
    print("\n" + "="*60)
    print("诊断总结")
    print("="*60)

    print("""
请按以下步骤排查：

1. **确认访问方式**
   - 确保使用 http://localhost:8080 访问
   - 不要使用 IP 地址（如 http://192.168.x.x）

2. **检查浏览器控制台**
   - F12 打开开发者工具
   - 查看 Console 中的错误信息
   - 告诉我们具体的错误

3. **尝试备用方案**
   - 使用"选择图片"按钮代替拍照
   - 从手机拍照后传到电脑上传

4. **如果以上都无效**
   - 提供浏览器版本和操作系统信息
   - 提供 Console 中的错误截图
""")

def main():
    check_browser_environment()
    common_issues()
    check_electron_config()
    test_image_upload()
    browser_devtools_guide()
    quick_fix_guide()
    generate_report()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n已取消")
        sys.exit(0)
