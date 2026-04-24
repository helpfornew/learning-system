"""
个性化学习分析 API 处理器
"""

import json
import sqlite3
from datetime import datetime
from ..database import get_db
from ..config import logger


def handle_weekly_analysis_get(user_id, params):
    """获取用户的周分析历史"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    try:
        conn = get_db()
        c = conn.cursor()

        # 获取所有分析记录
        c.execute('''SELECT week_id, timestamp, total_mistakes, analyzed_mistakes,
                     module_stats, personalized_analysis
                     FROM weekly_analysis
                     WHERE user_id = ?
                     ORDER BY timestamp DESC''', (user_id,))
        rows = c.fetchall()
        conn.close()

        history = []
        for row in rows:
            history.append({
                'id': row[0],
                'timestamp': row[1],
                'totalMistakes': row[2],
                'analyzedMistakes': row[3],
                'moduleStats': json.loads(row[4]) if row[4] else [],
                'personalizedAnalysis': json.loads(row[5]) if row[5] else {}
            })

        return 200, {'success': True, 'data': history}
    except Exception as e:
        logger.error(f'获取周分析历史失败: {e}')
        return 500, {'success': False, 'message': str(e)}


def handle_weekly_analysis_post(user_id, data):
    """保存周分析结果"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    try:
        week_id = data.get('weekId')
        total_mistakes = data.get('totalMistakes', 0)
        analyzed_mistakes = data.get('analyzedMistakes', 0)
        module_stats = json.dumps(data.get('moduleStats', []))
        personalized_analysis = json.dumps(data.get('personalizedAnalysis', {}))

        conn = get_db()
        c = conn.cursor()

        # 使用 INSERT OR REPLACE 实现 UPSERT
        c.execute('''INSERT INTO weekly_analysis
                     (user_id, week_id, total_mistakes, analyzed_mistakes,
                      module_stats, personalized_analysis, timestamp)
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON CONFLICT(user_id, week_id) DO UPDATE SET
                     total_mistakes=excluded.total_mistakes,
                     analyzed_mistakes=excluded.analyzed_mistakes,
                     module_stats=excluded.module_stats,
                     personalized_analysis=excluded.personalized_analysis,
                     timestamp=excluded.timestamp''',
                  (user_id, week_id, total_mistakes, analyzed_mistakes,
                   module_stats, personalized_analysis, datetime.now().isoformat()))

        conn.commit()
        conn.close()

        return 200, {'success': True, 'message': '保存成功'}
    except Exception as e:
        logger.error(f'保存周分析失败: {e}')
        return 500, {'success': False, 'message': str(e)}


def handle_weekly_analysis_delete(user_id, week_id):
    """删除指定的周分析"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('DELETE FROM weekly_analysis WHERE user_id = ? AND week_id = ?',
                  (user_id, week_id))
        conn.commit()
        conn.close()
        return 200, {'success': True, 'message': '删除成功'}
    except Exception as e:
        logger.error(f'删除周分析失败: {e}')
        return 500, {'success': False, 'message': str(e)}
