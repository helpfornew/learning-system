#!/usr/bin/env python3
"""
AI配置清理脚本
删除高考学习系统数据库中老的API端点配置，只保留支持多模态请求的兼容模式端点
"""

import json
import sqlite3
from pathlib import Path

def get_database_path():
    """获取数据库路径"""
    base_dir = Path.home() / 'learning_system'
    db_dir = base_dir / 'database'
    unified_db = db_dir / 'unified_learning.db'
    return unified_db

def clean_qwen_api_endpoints():
    """清理Qwen API端点配置，删除老的不支持图像的端点"""
    db_path = get_database_path()

    if not db_path.exists():
        print(f"错误: 数据库不存在: {db_path}")
        return False

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 获取当前配置
        cursor.execute('SELECT user_id, value FROM user_preferences WHERE key = ?', ('ai_config',))
        row = cursor.fetchone()

        if not row:
            print("错误: 未找到AI配置")
            return False

        user_id, config_json = row
        config = json.loads(config_json)

        # 更新Qwen配置
        if 'ai_config' in config and 'qwen' in config['ai_config']:
            old_endpoint = config['ai_config']['qwen'].get('apiEndpoint', '')
            print(f"当前Qwen API端点: {old_endpoint}")

            # 检查是否为老的API端点
            if 'text-generation/generation' in old_endpoint:
                # 替换为兼容模式端点
                config['ai_config']['qwen']['apiEndpoint'] = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
                print("✅ 已替换为兼容模式端点: https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions")
            else:
                print("✅ 当前端点已是兼容模式，无需修改")
        else:
            print("错误: 未找到Qwen配置")
            return False

        # 更新数据库
        new_config_json = json.dumps(config, ensure_ascii=False, indent=2)
        cursor.execute('UPDATE user_preferences SET value = ? WHERE user_id = ? AND key = ?',
                      (new_config_json, user_id, 'ai_config'))

        conn.commit()
        print("✅ Qwen API端点配置已更新")
        return True

    except Exception as e:
        print(f"错误: 更新配置失败 - {e}")
        return False
    finally:
        conn.close()

def show_current_config():
    """显示当前AI配置"""
    db_path = get_database_path()

    if not db_path.exists():
        print(f"错误: 数据库不存在: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT user_id, value FROM user_preferences WHERE key = ?', ('ai_config',))
        row = cursor.fetchone()

        if row:
            user_id, config_json = row
            config = json.loads(config_json)

            print(f"\n当前AI配置 (用户ID: {user_id}):")
            print("="*50)

            if 'ai_config' in config:
                if 'qwen' in config['ai_config']:
                    qwen_cfg = config['ai_config']['qwen']
                    print(f"Qwen配置:")
                    print(f"  模型: {qwen_cfg.get('model', 'N/A')}")
                    print(f"  API端点: {qwen_cfg.get('apiEndpoint', 'N/A')}")

                if 'deepseek' in config['ai_config']:
                    deepseek_cfg = config['ai_config']['deepseek']
                    print(f"DeepSeek配置:")
                    print(f"  模型: {deepseek_cfg.get('model', 'N/A')}")
                    print(f"  API端点: {deepseek_cfg.get('apiEndpoint', 'N/A')}")

            print("="*50)
        else:
            print("未找到AI配置")

    except Exception as e:
        print(f"错误: 读取配置失败 - {e}")
    finally:
        conn.close()

def main():
    print("高考学习系统 - Qwen API端点清理工具")
    print("="*40)

    # 显示当前配置
    show_current_config()

    # 询问是否要更新
    response = input("\n是否要删除老的API端点并更新为兼容模式端点？(y/N): ").strip().lower()

    if response in ['y', 'yes']:
        success = clean_qwen_api_endpoints()
        if success:
            print("\n✅ 更新完成！")
            show_current_config()
        else:
            print("\n❌ 更新失败！")
    else:
        print("操作已取消")
        show_current_config()

if __name__ == '__main__':
    main()