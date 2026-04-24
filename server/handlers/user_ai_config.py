"""
用户 AI 配置 API 处理器
"""

import json
import sqlite3
from datetime import datetime
from ..database import get_db
from ..config import logger


def handle_ai_config_get(user_id, params):
    """获取用户的 AI 配置"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    try:
        conn = get_db()
        c = conn.cursor()

        # 获取所有 AI 配置
        c.execute('''SELECT provider, api_key, endpoint, model, enabled,
                     max_tokens, temperature, updated_at
                     FROM user_ai_config WHERE user_id = ?''', (user_id,))
        rows = c.fetchall()
        conn.close()

        configs = {}
        for row in rows:
            provider = row[0]
            configs[provider] = {
                'apiKey': row[1] or '',
                'endpoint': row[2] or '',
                'model': row[3] or '',
                'enabled': bool(row[4]),
                'maxTokens': row[5] or 2000,
                'temperature': row[6] or 0.7,
                'updatedAt': row[7]
            }

        return 200, {'success': True, 'data': configs}
    except Exception as e:
        logger.error(f'获取 AI 配置失败: {e}')
        return 500, {'success': False, 'message': str(e)}


def handle_ai_config_post(user_id, data):
    """保存 AI 配置"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    try:
        provider = data.get('provider')
        if not provider:
            return 400, {'success': False, 'message': '缺少 provider'}

        api_key = data.get('apiKey', '')
        endpoint = data.get('endpoint', '')
        model = data.get('model', '')
        enabled = 1 if data.get('enabled', True) else 0
        max_tokens = data.get('maxTokens', 2000)
        temperature = data.get('temperature', 0.7)

        conn = get_db()
        c = conn.cursor()

        # UPSERT 操作
        c.execute('''INSERT INTO user_ai_config
                     (user_id, provider, api_key, endpoint, model, enabled,
                      max_tokens, temperature, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON CONFLICT(user_id, provider) DO UPDATE SET
                     api_key=excluded.api_key,
                     endpoint=excluded.endpoint,
                     model=excluded.model,
                     enabled=excluded.enabled,
                     max_tokens=excluded.max_tokens,
                     temperature=excluded.temperature,
                     updated_at=excluded.updated_at''',
                  (user_id, provider, api_key, endpoint, model, enabled,
                   max_tokens, temperature, datetime.now().isoformat()))

        conn.commit()
        conn.close()

        return 200, {'success': True, 'message': '保存成功'}
    except Exception as e:
        logger.error(f'保存 AI 配置失败: {e}')
        return 500, {'success': False, 'message': str(e)}


def handle_ai_config_delete(user_id, provider):
    """删除指定的 AI 配置"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('DELETE FROM user_ai_config WHERE user_id = ? AND provider = ?',
                  (user_id, provider))
        conn.commit()
        conn.close()
        return 200, {'success': True, 'message': '删除成功'}
    except Exception as e:
        logger.error(f'删除 AI 配置失败: {e}')
        return 500, {'success': False, 'message': str(e)}
