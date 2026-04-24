""""配置 API 处理器"""
import json
from ..database import get_db

def handle_config_get(user_id):
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT key, value FROM user_preferences WHERE user_id = ?', (user_id,))
    rows = cursor.fetchall()
    conn.close()

    config = {r['key']: json.loads(r['value']) for r in rows}
    return 200, {'success': True, 'data': config}

def handle_config_post(user_id, data):
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    conn = get_db()
    cursor = conn.cursor()
    for key, value in data.items():
        cursor.execute('INSERT OR REPLACE INTO user_preferences (user_id, key, value) VALUES (?, ?, ?)',
                       (user_id, key, json.dumps(value)))
    conn.commit()
    conn.close()
    return 200, {'success': True}

def get_default_learning_config():
    return {
        'targetDate': '2026-06-07',
        'countdownDays': 90,
        'totalTarget': 540
    }

def get_default_ai_config():
    return {
        'provider': 'deepseek',
        'model': 'deepseek-chat'
    }
