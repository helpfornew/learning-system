"""
复习历史记录 API
"""

import json
from datetime import datetime, timedelta
from ..database import get_db
from ..config import logger


def handle_review_history_get(user_id, params=None):
    """
    获取复习历史记录

    参数:
        user_id: 用户ID
        params: 查询参数
            - limit: 返回记录数量（默认 20）
            - days: 查询最近多少天（默认 30）

    返回:
        - review_history: 复习历史列表
            - id: 记录ID
            - type: 类型（mistake）
            - item_id: 错题ID
            - title: 标题/内容摘要
            - review_time: 复习时间
            - result: 复习结果（success/failed）
            - review_count: 复习次数
    """
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    params = params or {}
    limit = int(params.get('limit', 20))
    days = int(params.get('days', 30))

    # 限制最大返回数量
    limit = min(limit, 100)

    try:
        conn = get_db()
        c = conn.cursor()

        # 计算日期范围
        since_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

        review_history = []

        # 1. 获取错题复习记录（基于 last_review_date 和 review_count）
        c.execute('''
            SELECT id, content, last_review_date, review_count, subject_id
            FROM mistakes
            WHERE user_id = ? AND is_deleted = 0
            AND last_review_date IS NOT NULL
            AND last_review_date >= ?
            ORDER BY last_review_date DESC
            LIMIT ?
        ''', (user_id, since_date, limit))

        for row in c.fetchall():
            content_preview = row[1][:50] + '...' if row[1] and len(row[1]) > 50 else (row[1] or '')

            # 根据复习次数判断结果（3次以上认为掌握）
            review_count = row[3] or 0
            result = 'success' if review_count >= 3 else 'in_progress'

            review_history.append({
                'id': f"mistake_{row[0]}",
                'type': 'mistake',
                'item_id': row[0],
                'title': content_preview,
                'review_time': row[2],
                'result': result,
                'review_count': review_count,
                'subject_id': row[4]
            })

        conn.close()

        # 按复习时间排序
        review_history.sort(key=lambda x: x['review_time'], reverse=True)

        # 限制返回数量
        review_history = review_history[:limit]

        # 统计信息
        stats = {
            'total_records': len(review_history),
            'mistake_count': len(review_history),
            'success_count': sum(1 for r in review_history if r['result'] == 'success'),
            'in_progress_count': sum(1 for r in review_history if r['result'] == 'in_progress'),
            'query_days': days
        }

        return 200, {
            'success': True,
            'data': {
                'review_history': review_history,
                'stats': stats
            }
        }

    except Exception as e:
        logger.error(f"获取复习历史记录失败: {e}")
        return 500, {'success': False, 'message': f'获取复习历史失败: {str(e)}'}
