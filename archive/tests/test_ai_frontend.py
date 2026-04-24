#!/usr/bin/env python3
"""
AI分析前端调用测试脚本
模拟前端调用后端AI分析API
"""

import json
import sqlite3
import requests
import sys

DB_PATH = '/opt/learning-system/database/unified_learning.db'
BASE_URL = 'http://localhost:8080'

def get_test_user_token():
    """获取测试用户的token"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # 获取第一个用户
        cursor.execute("SELECT id, username FROM users LIMIT 1")
        user = cursor.fetchone()
        if not user:
            print("❌ 数据库中没有用户")
            return None

        user_id, username = user
        print(f"✓ 找到用户: {username} (ID: {user_id})")

        # 获取或创建会话
        cursor.execute("SELECT token FROM sessions WHERE user_id = ? LIMIT 1", (user_id,))
        session = cursor.fetchone()

        if session:
            token = session[0]
            print(f"✓ 找到现有会话token")
        else:
            # 创建新会话
            import hashlib
            import time
            token = hashlib.sha256(f"{user_id}_{time.time()}".encode()).hexdigest()
            cursor.execute("""
                INSERT INTO sessions (user_id, token, created_at, expires_at)
                VALUES (?, ?, datetime('now'), datetime('now', '+7 days'))
            """, (user_id, token))
            conn.commit()
            print(f"✓ 创建新会话token")

        conn.close()
        return token

    except Exception as e:
        print(f"❌ 获取token失败: {e}")
        return None

def get_ai_config():
    """从数据库获取AI配置"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM user_preferences WHERE key = 'ai_config'")
        row = cursor.fetchone()
        conn.close()

        if row:
            config = json.loads(row[0])
            ai_config = config.get('ai_config', {})

            # 优先使用通义千问
            if ai_config.get('qwen', {}).get('apiKey'):
                return {
                    'provider': 'qwen',
                    'apiKey': ai_config['qwen']['apiKey'],
                    'endpoint': 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
                    'model': ai_config['qwen'].get('model', 'qwen-max')
                }

            # 其次使用DeepSeek
            if ai_config.get('deepseek', {}).get('apiKey'):
                return {
                    'provider': 'deepseek',
                    'apiKey': ai_config['deepseek']['apiKey'],
                    'endpoint': 'https://api.deepseek.com/chat/completions',
                    'model': ai_config['deepseek'].get('model', 'deepseek-chat')
                }

        return None

    except Exception as e:
        print(f"❌ 获取AI配置失败: {e}")
        return None

def test_server_running():
    """测试服务器是否运行"""
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print("✓ 后端服务器运行正常")
            return True
    except:
        pass

    print("❌ 后端服务器未运行")
    print("   请运行: python3 unified_server.py")
    return False

def test_ai_analysis(token, ai_config):
    """测试AI分析API"""
    print("\n" + "="*60)
    print("测试 AI 分析 API")
    print("="*60)

    # 构造错题分析请求
    payload = {
        "apiEndpoint": ai_config['endpoint'],
        "model": ai_config['model'],
        "maxTokens": 2000,
        "temperature": 0.7,
        "messages": [
            {
                "role": "system",
                "content": "你是通义千问视觉语言模型，专门用于分析高中教育内容。必须只返回 JSON 格式。"
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """请分析以下错题：
【数学标准知识点列表】（请从以下列表中选择最匹配的 1-3 个知识点）
函数与方程 | 三角函数 | 平面向量 | 数列 | 不等式

【题目】已知函数 f(x) = x² - 2x + 3，求 f(2) 的值

【学生答案】5

请严格按照以下 JSON 格式回复：
{
  "knowledgePoints": ["函数与方程"],
  "correctAnswer": "3",
  "analysis": "将x=2代入f(x)=x²-2x+3，得f(2)=4-4+3=3",
  "difficulty": "简单"
}"""
                    }
                ]
            }
        ]
    }

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }

    try:
        print(f"发送请求到: {BASE_URL}/api/ai-analysis")
        print(f"使用模型: {ai_config['model']}")
        print(f"提供商: {ai_config['provider']}")
        print()

        response = requests.post(
            f"{BASE_URL}/api/ai-analysis",
            headers=headers,
            json=payload,
            timeout=120
        )

        print(f"响应状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ AI分析成功！")
                print("\n返回数据:")
                print(json.dumps(data, indent=2, ensure_ascii=False)[:800])
                return True
            else:
                print(f"❌ AI分析失败: {data.get('error')}")
                return False
        elif response.status_code == 401:
            print("❌ 未授权 (401)，token无效")
            return False
        elif response.status_code == 404:
            print("❌ API端点未找到 (404)")
            return False
        else:
            print(f"❌ 请求失败: {response.status_code}")
            try:
                print(f"响应: {response.text[:500]}")
            except:
                pass
            return False

    except requests.exceptions.Timeout:
        print("❌ 请求超时（超过120秒）")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ 连接错误")
        return False
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return False

def test_wrong_answer_analysis():
    """测试错题分析场景（模拟前端调用）"""
    print("\n" + "="*60)
    print("模拟前端错题分析调用")
    print("="*60)

    token = get_test_user_token()
    if not token:
        return False

    ai_config = get_ai_config()
    if not ai_config:
        print("❌ 未配置AI API密钥")
        return False

    print(f"✓ 使用AI配置: {ai_config['provider']}")
    return test_ai_analysis(token, ai_config)

def main():
    print("="*60)
    print("AI分析功能测试工具")
    print("="*60)

    # 检查服务器
    if not test_server_running():
        print("\n⚠️  请先启动后端服务器:")
        print("   python3 unified_server.py")
        return 1

    # 测试错题分析
    if test_wrong_answer_analysis():
        print("\n" + "="*60)
        print("✅ 所有测试通过！AI分析功能正常")
        print("="*60)
        return 0
    else:
        print("\n" + "="*60)
        print("❌ AI分析测试失败")
        print("="*60)
        return 1

if __name__ == '__main__':
    sys.exit(main())
