#!/usr/bin/env python3
"""
AI分析功能测试脚本
用于诊断AI分析失败的原因

使用方法:
    python3 test_ai_analysis.py
"""

import json
import sqlite3
import os
import requests
import sys
from datetime import datetime

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_status(message, status="info"):
    """打印带颜色的状态消息"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    if status == "success":
        print(f"[{timestamp}] {Colors.GREEN}✓{Colors.RESET} {message}")
    elif status == "error":
        print(f"[{timestamp}] {Colors.RED}✗{Colors.RESET} {message}")
    elif status == "warning":
        print(f"[{timestamp}] {Colors.YELLOW}⚠{Colors.RESET} {message}")
    else:
        print(f"[{timestamp}] {Colors.BLUE}ℹ{Colors.RESET} {message}")

def check_database():
    """检查数据库配置"""
    print("\n" + "="*60)
    print("步骤 1: 检查数据库配置")
    print("="*60)

    db_path = '/opt/learning-system/database/unified_learning.db'

    if not os.path.exists(db_path):
        print_status(f"数据库文件不存在: {db_path}", "error")
        return False

    print_status(f"数据库文件存在: {db_path}", "success")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 检查 users 表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if cursor.fetchone():
            print_status("users 表存在", "success")
        else:
            print_status("users 表不存在", "error")

        # 检查 user_preferences 表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_preferences'")
        if cursor.fetchone():
            print_status("user_preferences 表存在", "success")
        else:
            print_status("user_preferences 表不存在", "warning")

        # 检查用户数量
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print_status(f"数据库中用户数量: {user_count}", "info")

        # 检查是否有AI配置
        cursor.execute("SELECT user_id, key, value FROM user_preferences WHERE key LIKE '%ai%' OR key LIKE '%config%'")
        configs = cursor.fetchall()

        if configs:
            print_status(f"找到 {len(configs)} 条配置记录:", "success")
            for user_id, key, value in configs:
                print(f"    用户ID: {user_id}, 配置项: {key}")
                try:
                    config = json.loads(value)
                    if 'ai_config' in config:
                        ai_config = config.get('ai_config', {})
                        for provider, settings in ai_config.items():
                            if isinstance(settings, dict) and settings.get('apiKey'):
                                api_key = settings.get('apiKey', '')
                                masked_key = api_key[:8] + '...' if len(api_key) > 8 else '***'
                                print(f"      - {provider}: API密钥 {masked_key}")
                except:
                    print(f"      - 值: {value[:50]}...")
        else:
            print_status("未找到AI配置，需要在设置页面配置API密钥", "warning")

        conn.close()
        return True

    except Exception as e:
        print_status(f"数据库查询失败: {e}", "error")
        return False

def test_ai_api_directly():
    """直接测试AI API (不通过后端)"""
    print("\n" + "="*60)
    print("步骤 2: 直接测试AI API")
    print("="*60)

    # 尝试读取数据库中的API密钥
    db_path = '/opt/learning-system/database/unified_learning.db'
    api_key = None
    provider = None

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM user_preferences WHERE key = 'ai_config'")
        row = cursor.fetchone()

        if row:
            try:
                config = json.loads(row[0])
                ai_config = config.get('ai_config', {})

                # 优先检查千问
                if ai_config.get('qwen', {}).get('apiKey'):
                    api_key = ai_config['qwen']['apiKey']
                    provider = 'qwen'
                    print_status(f"从数据库找到通义千问配置", "success")
                # 然后检查DeepSeek
                elif ai_config.get('deepseek', {}).get('apiKey'):
                    api_key = ai_config['deepseek']['apiKey']
                    provider = 'deepseek'
                    print_status(f"从数据库找到DeepSeek配置", "success")
            except:
                pass

        conn.close()
    except Exception as e:
        print_status(f"读取数据库失败: {e}", "error")

    if not api_key:
        # 使用环境变量或手动输入
        api_key = os.environ.get('QIANWEN_API_KEY') or os.environ.get('DEEPSEEK_API_KEY')
        if api_key:
            print_status("使用环境变量中的API密钥", "info")
        else:
            print_status("未找到配置，跳过直接API测试", "warning")
            return

    # 测试通义千问
    if provider == 'qwen' or not provider:
        test_qwen_api(api_key)

    # 测试DeepSeek
    if provider == 'deepseek':
        test_deepseek_api(api_key)

def test_qwen_api(api_key):
    """测试通义千问API"""
    print("\n测试通义千问 API...")

    endpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
    model = "qwen-max"

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }

    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': '你是一个助手'},
            {'role': 'user', 'content': '你好，这是一个测试'}
        ],
        'max_tokens': 100,
        'temperature': 0.7
    }

    try:
        print(f"  请求端点: {endpoint}")
        print(f"  模型: {model}")
        response = requests.post(
            endpoint,
            headers=headers,
            json=payload,
            timeout=30
        )

        print(f"  响应状态码: {response.status_code}")

        if response.status_code in [200, 201]:
            data = response.json()
            if 'choices' in data:
                content = data['choices'][0].get('message', {}).get('content', '')
                print_status(f"API调用成功，返回内容: {content[:50]}...", "success")
            else:
                print_status(f"API返回格式异常: {data.keys()}", "warning")
        else:
            print_status(f"API调用失败: {response.status_code}", "error")
            try:
                error_data = response.json()
                print(f"  错误详情: {error_data}")
            except:
                print(f"  响应内容: {response.text[:200]}")

    except requests.exceptions.Timeout:
        print_status("API请求超时", "error")
    except requests.exceptions.ConnectionError:
        print_status("网络连接错误，无法连接到API端点", "error")
    except Exception as e:
        print_status(f"API请求异常: {e}", "error")

def test_deepseek_api(api_key):
    """测试DeepSeek API"""
    print("\n测试 DeepSeek API...")

    endpoint = "https://api.deepseek.com/chat/completions"
    model = "deepseek-chat"

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }

    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': '你是一个助手'},
            {'role': 'user', 'content': '你好，这是一个测试'}
        ],
        'max_tokens': 100,
        'temperature': 0.7
    }

    try:
        print(f"  请求端点: {endpoint}")
        print(f"  模型: {model}")
        response = requests.post(
            endpoint,
            headers=headers,
            json=payload,
            timeout=30
        )

        print(f"  响应状态码: {response.status_code}")

        if response.status_code in [200, 201]:
            data = response.json()
            if 'choices' in data:
                content = data['choices'][0].get('message', {}).get('content', '')
                print_status(f"API调用成功，返回内容: {content[:50]}...", "success")
            else:
                print_status(f"API返回格式异常: {data.keys()}", "warning")
        else:
            print_status(f"API调用失败: {response.status_code}", "error")
            try:
                error_data = response.json()
                print(f"  错误详情: {error_data}")
            except:
                print(f"  响应内容: {response.text[:200]}")

    except requests.exceptions.Timeout:
        print_status("API请求超时", "error")
    except requests.exceptions.ConnectionError:
        print_status("网络连接错误，无法连接到API端点", "error")
    except Exception as e:
        print_status(f"API请求异常: {e}", "error")

def test_backend_proxy():
    """测试后端代理服务"""
    print("\n" + "="*60)
    print("步骤 3: 测试后端代理服务")
    print("="*60)

    # 获取token
    db_path = '/opt/learning-system/database/unified_learning.db'
    token = None

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 查找第一个用户
        cursor.execute("SELECT id, username FROM users LIMIT 1")
        user = cursor.fetchone()

        if user:
            user_id, username = user
            print_status(f"找到用户: {username} (ID: {user_id})", "info")

            # 尝试从sessions表获取token
            cursor.execute("SELECT token FROM sessions WHERE user_id = ? LIMIT 1", (user_id,))
            session = cursor.fetchone()

            if session:
                token = session[0]
                print_status(f"找到会话token", "success")
            else:
                # 创建一个简单的token用于测试
                import hashlib
                token = hashlib.md5(f"test_{user_id}".encode()).hexdigest()
                print_status(f"创建测试token", "warning")
        else:
            print_status("数据库中没有用户", "error")

        conn.close()

    except Exception as e:
        print_status(f"读取数据库失败: {e}", "error")

    if not token:
        print_status("无法获取token，跳过代理测试", "warning")
        return

    # 测试后端代理
    backend_url = "http://localhost:8080"

    print(f"\n测试后端代理: {backend_url}/api/ai-analysis")

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }

    # 读取API配置
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM user_preferences WHERE key = 'ai_config'")
        row = cursor.fetchone()

        api_key = None
        if row:
            config = json.loads(row[0])
            ai_config = config.get('ai_config', {})
            if ai_config.get('qwen', {}).get('apiKey'):
                api_key = ai_config['qwen']['apiKey']
                endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
                model = 'qwen-max'
            elif ai_config.get('deepseek', {}).get('apiKey'):
                api_key = ai_config['deepseek']['apiKey']
                endpoint = 'https://api.deepseek.com/chat/completions'
                model = 'deepseek-chat'

        conn.close()

        if not api_key:
            print_status("后端数据库中没有配置API密钥", "warning")
            return

    except Exception as e:
        print_status(f"读取配置失败: {e}", "error")
        return

    payload = {
        'apiEndpoint': endpoint,
        'model': model,
        'maxTokens': 100,
        'temperature': 0.7,
        'messages': [
            {'role': 'system', 'content': '你是一个助手'},
            {'role': 'user', 'content': '你好，这是一个测试'}
        ]
    }

    try:
        print(f"  发送请求到后端代理...")
        response = requests.post(
            f"{backend_url}/api/ai-analysis",
            headers=headers,
            json=payload,
            timeout=60
        )

        print(f"  响应状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_status("后端代理测试成功！", "success")
            else:
                print_status(f"后端返回失败: {data.get('error')}", "error")
        elif response.status_code == 401:
            print_status("未授权（401），token无效或过期", "error")
        elif response.status_code == 404:
            print_status("后端API端点未找到（404），请确保服务器已启动", "error")
        else:
            print_status(f"请求失败: {response.status_code}", "error")

        try:
            print(f"\n  响应内容:\n  {json.dumps(response.json(), indent=2, ensure_ascii=False)[:500]}")
        except:
            print(f"\n  响应内容: {response.text[:200]}")

    except requests.exceptions.ConnectionError:
        print_status("无法连接到后端服务器，请确保 unified_server.py 正在运行", "error")
    except requests.exceptions.Timeout:
        print_status("后端请求超时", "error")
    except Exception as e:
        print_status(f"请求异常: {e}", "error")

def check_environment():
    """检查环境变量"""
    print("\n" + "="*60)
    print("步骤 4: 检查环境变量")
    print("="*60)

    env_vars = [
        'QIANWEN_API_KEY',
        'DEEPSEEK_API_KEY',
        'LEARNING_SYSTEM_DIR',
        'LEARNING_SYSTEM_PORT',
        'DEV_MODE'
    ]

    for var in env_vars:
        value = os.environ.get(var)
        if value:
            if 'KEY' in var:
                masked = value[:8] + '...' if len(value) > 8 else '***'
                print_status(f"{var}: {masked}", "success")
            else:
                print_status(f"{var}: {value}", "success")
        else:
            print(f"  {var}: 未设置")

def generate_report():
    """生成诊断报告"""
    print("\n" + "="*60)
    print("诊断报告")
    print("="*60)

    print("""
常见AI分析失败原因及解决方案:

1. 【未配置API密钥】
   症状: "未配置AI API密钥" 或 "未配置API密钥"
   解决: 在错题系统设置页面中配置AI提供商的API密钥

2. 【API密钥无效】
   症状: "API请求失败: 401" 或认证错误
   解决: 检查API密钥是否正确，可能需要重新生成

3. 【网络连接问题】
   症状: "网络请求错误" 或超时
   解决: 检查网络连接，确认可以访问通义千问/DeepSeek服务

4. 【后端服务器未启动】
   症状: "无法连接到后端服务器"
   解决: 运行 ./start_dev.sh 或 python3 unified_server.py 启动后端

5. 【用户未登录】
   症状: "未登录" 或 401 错误
   解决: 在系统中登录后再使用AI分析功能

6. 【响应解析错误】
   症状: AI返回了内容但无法解析
   解决: 可能是模型返回格式不符合预期，尝试更换模型

7. 【图像尺寸问题】
   症状: "图像尺寸过小"
   解决: 确保上传的图像宽高大于10像素

测试步骤建议:
1. 先运行本脚本检查配置
2. 确保后端服务器正在运行
3. 确保已登录系统
4. 检查API密钥是否有效
""")

def main():
    """主函数"""
    print("="*60)
    print("AI分析功能诊断工具")
    print("="*60)
    print(f"运行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # 运行所有检查
    check_database()
    check_environment()
    test_ai_api_directly()
    test_backend_proxy()
    generate_report()

    print("\n" + "="*60)
    print("诊断完成")
    print("="*60)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n已取消")
        sys.exit(0)
    except Exception as e:
        print(f"\n运行出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
