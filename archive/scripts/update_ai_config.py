#!/usr/bin/env python3
"""
AI配置管理脚本
用于更新高考学习系统的AI配置，包括DeepSeek和通义千问(Qwen)配置
"""

import json
import sqlite3
from pathlib import Path
import argparse
import getpass

def get_database_path():
    """获取数据库路径"""
    base_dir = Path.home() / 'learning_system'
    db_dir = base_dir / 'database'
    unified_db = db_dir / 'unified_learning.db'
    return unified_db

def list_users(db_path):
    """列出所有用户"""
    if not db_path.exists():
        print(f"错误: 数据库不存在: {db_path}")
        return []

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT id, username FROM users')
        users = cursor.fetchall()
        return users
    except Exception as e:
        print(f"错误: 读取用户列表失败 - {e}")
        return []
    finally:
        conn.close()

def get_current_config(db_path, user_id=None):
    """获取AI配置，如果未指定用户ID，则尝试获取所有用户的配置"""
    if not db_path.exists():
        print(f"错误: 数据库不存在: {db_path}")
        return None

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        if user_id:
            cursor.execute('SELECT user_id, value FROM user_preferences WHERE user_id = ? AND key = ?', (user_id, 'ai_config'))
        else:
            cursor.execute('SELECT user_id, value FROM user_preferences WHERE key = ?', ('ai_config',))

        rows = cursor.fetchall()

        if rows:
            for user_id, config_json in rows:
                try:
                    config = json.loads(config_json)
                    return user_id, config
                except json.JSONDecodeError:
                    continue

        print("未找到现有的AI配置")
        return None
    except json.JSONDecodeError:
        print("错误: 配置数据不是有效的JSON格式")
        return None
    except Exception as e:
        print(f"错误: 读取配置失败 - {e}")
        return None
    finally:
        conn.close()

def update_ai_config(db_path, new_config, user_id):
    """更新AI配置"""
    if not db_path.exists():
        print(f"错误: 数据库不存在: {db_path}")
        return False

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 将配置转换为JSON字符串
        config_json = json.dumps(new_config, ensure_ascii=False, indent=2)

        # 检查是否已有配置
        cursor.execute('SELECT COUNT(*) FROM user_preferences WHERE user_id = ? AND key = ?', (user_id, 'ai_config'))
        count = cursor.fetchone()[0]

        if count > 0:
            # 更新现有配置
            cursor.execute('UPDATE user_preferences SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND key = ?',
                          (config_json, user_id, 'ai_config'))
            print(f"✅ 用户 {user_id} 的AI配置已更新")
        else:
            # 插入新配置
            cursor.execute('INSERT INTO user_preferences (user_id, key, value) VALUES (?, ?, ?)',
                          (user_id, 'ai_config', config_json))
            print(f"✅ 用户 {user_id} 的AI配置已创建")

        conn.commit()
        return True
    except Exception as e:
        print(f"错误: 更新配置失败 - {e}")
        return False
    finally:
        conn.close()

def list_current_config():
    """列出当前配置"""
    db_path = get_database_path()
    result = get_current_config(db_path)

    if result:
        user_id, config = result
        print(f"\n当前AI配置 (用户ID: {user_id}):")
        print("="*50)
        print(json.dumps(config, indent=2, ensure_ascii=False))
        print("="*50)
    else:
        print("当前没有有效的AI配置")

def update_provider_config(provider_name, api_key, user_id=None, api_endpoint=None, model=None, temperature=None, max_tokens=None):
    """更新特定提供商的配置"""
    db_path = get_database_path()

    if user_id is None:
        # 自动获取第一个有配置的用户ID
        result = get_current_config(db_path)
        if result:
            user_id, config = result
        else:
            # 如果没有配置，则使用默认用户ID 1
            user_id = 1
            config = {'ai_config': {}}
    else:
        result = get_current_config(db_path, user_id)
        if result:
            user_id, config = result

    # 确保配置结构存在
    if 'ai_config' not in config:
        config['ai_config'] = {}

    if provider_name not in config['ai_config']:
        config['ai_config'][provider_name] = {}

    # 更新配置
    if api_key:
        config['ai_config'][provider_name]['apiKey'] = api_key
    if api_endpoint:
        config['ai_config'][provider_name]['apiEndpoint'] = api_endpoint
    if model:
        config['ai_config'][provider_name]['model'] = model
    if temperature is not None:
        config['ai_config'][provider_name]['temperature'] = temperature
    if max_tokens:
        config['ai_config'][provider_name]['maxTokens'] = max_tokens

    # 确保必要字段存在
    if 'provider' not in config['ai_config'][provider_name]:
        config['ai_config'][provider_name]['provider'] = provider_name
    if 'enabled' not in config['ai_config'][provider_name]:
        config['ai_config'][provider_name]['enabled'] = True

    return update_ai_config(db_path, config, user_id)

def setup_interactive():
    """交互式配置设置"""
    print("高考学习系统 - AI配置向导")
    print("="*40)

    db_path = get_database_path()

    # 显示所有用户
    users = list_users(db_path)
    if users:
        print(f"\n检测到以下用户:")
        for uid, username in users:
            print(f"  ID: {uid}, 用户名: {username}")

        # 询问用户要为哪个用户配置
        print(f"\n当前将为用户ID '{users[0][0]}' 配置AI设置")
        user_choice = input(f"是否使用用户ID {users[0][0]}? (Y/n): ").strip().lower()
        if user_choice in ['n', 'no']:
            user_input = input("请输入要配置的用户ID: ").strip()
            try:
                target_user_id = int(user_input)
            except ValueError:
                print("无效的用户ID，使用默认用户ID 1")
                target_user_id = 1
        else:
            target_user_id = users[0][0]
    else:
        print("未检测到用户，将使用默认用户ID 1")
        target_user_id = 1

    result = get_current_config(db_path, target_user_id)

    if result:
        user_id, config = result
        print(f"检测到现有配置 (用户ID: {user_id})")
    else:
        print("未检测到现有配置，将创建新的配置")
        config = {'ai_config': {}}

    print("\n请选择要配置的AI提供商:")
    print("1. 通义千问 (Qwen)")
    print("2. DeepSeek")
    print("3. 两个都配置")

    choice = input("\n请输入选择 (1-3): ").strip()

    # 保存配置变更
    config_changed = False

    if choice in ['1', '3']:
        print("\n配置通义千问 (Qwen):")
        qwen_api_key = getpass.getpass("  请输入Qwen API密钥: ")
        qwen_endpoint = input("  请输入API端点 (留空使用默认): ").strip() or "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
        qwen_model = input("  请输入模型名称 (留空使用默认): ").strip() or "qwen-max"
        qwen_temp = input("  请输入温度值 (留空使用默认0.7): ").strip() or "0.7"
        qwen_temp = float(qwen_temp)
        qwen_max_tokens = input("  请输入最大Token数 (留空使用默认2000): ").strip() or "2000"
        qwen_max_tokens = int(qwen_max_tokens)

        config['ai_config']['qwen'] = {
            'provider': 'qwen',
            'apiKey': qwen_api_key,
            'apiEndpoint': qwen_endpoint,
            'model': qwen_model,
            'temperature': qwen_temp,
            'maxTokens': qwen_max_tokens,
            'enabled': True
        }
        config_changed = True

    if choice in ['2', '3']:
        print("\n配置DeepSeek:")
        deepseek_api_key = getpass.getpass("  请输入DeepSeek API密钥: ")
        deepseek_endpoint = input("  请输入API端点 (留空使用默认): ").strip() or "https://api.deepseek.com/chat/completions"
        deepseek_model = input("  请输入模型名称 (留空使用默认): ").strip() or "deepseek-chat"
        deepseek_temp = input("  请输入温度值 (留空使用默认0.7): ").strip() or "0.7"
        deepseek_temp = float(deepseek_temp)
        deepseek_max_tokens = input("  请输入最大Token数 (留空使用默认2000): ").strip() or "2000"
        deepseek_max_tokens = int(deepseek_max_tokens)

        config['ai_config']['deepseek'] = {
            'provider': 'deepseek',
            'apiKey': deepseek_api_key,
            'apiEndpoint': deepseek_endpoint,
            'model': deepseek_model,
            'temperature': deepseek_temp,
            'maxTokens': deepseek_max_tokens,
            'enabled': True
        }
        config_changed = True

    if config_changed:
        success = update_ai_config(db_path, config, target_user_id)
        if success:
            print(f"\n✅ 用户 {target_user_id} 的AI配置更新成功!")
        else:
            print("\n❌ AI配置更新失败!")
    else:
        print("未进行任何更改")

def main():
    parser = argparse.ArgumentParser(description='AI配置管理脚本')
    parser.add_argument('action', nargs='?', choices=['list', 'update-qwen', 'update-deepseek', 'setup'],
                       default='list', help='操作类型')
    parser.add_argument('--api-key', help='API密钥')
    parser.add_argument('--endpoint', help='API端点')
    parser.add_argument('--model', help='模型名称')
    parser.add_argument('--temperature', type=float, help='温度值')
    parser.add_argument('--max-tokens', type=int, help='最大Token数')
    parser.add_argument('--user-id', type=int, help='用户ID (可选，默认为第一个用户)')

    args = parser.parse_args()

    if args.action == 'list':
        list_current_config()
    elif args.action == 'setup':
        setup_interactive()
    elif args.action == 'update-qwen':
        if not args.api_key:
            print("错误: 更新Qwen配置需要提供API密钥 (--api-key)")
            return
        update_provider_config(
            'qwen',
            api_key=args.api_key,
            user_id=args.user_id,
            api_endpoint=args.endpoint,
            model=args.model,
            temperature=args.temperature,
            max_tokens=args.max_tokens
        )
    elif args.action == 'update-deepseek':
        if not args.api_key:
            print("错误: 更新DeepSeek配置需要提供API密钥 (--api-key)")
            return
        update_provider_config(
            'deepseek',
            api_key=args.api_key,
            user_id=args.user_id,
            api_endpoint=args.endpoint,
            model=args.model,
            temperature=args.temperature,
            max_tokens=args.max_tokens
        )

if __name__ == '__main__':
    main()