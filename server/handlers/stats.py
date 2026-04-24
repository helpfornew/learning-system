"""
用户统计数据 API
"""

import json
from datetime import datetime, timedelta
from ..database import get_db
from ..config import logger


def handle_stats_get(user_id):
    """
    获取用户统计数据

    返回:
        - total_mistakes: 错题总数
        - mastered_mistakes: 已掌握错题数
        - today_study_time: 今日学习时长（分钟）
        - streak_days: 连续学习天数
        - review_due_count: 今日待复习数量
    """
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    try:
        conn = get_db()
        c = conn.cursor()

        today = datetime.now().strftime('%Y-%m-%d')

        # 1. 错题统计
        c.execute('''
            SELECT COUNT(*),
                   SUM(CASE WHEN review_count >= 3 THEN 1 ELSE 0 END)
            FROM mistakes
            WHERE user_id = ? AND is_deleted = 0
        ''', (user_id,))
        row = c.fetchone()
        total_mistakes = row[0] or 0
        mastered_mistakes = row[1] or 0

        # 2. 今日学习时长
        c.execute('''
            SELECT SUM(duration) FROM study_time
            WHERE user_id = ? AND date = ?
        ''', (user_id, today))
        row = c.fetchone()
        today_study_time = int(row[0] or 0)  # 分钟

        # 3. 连续学习天数
        streak_days = _calculate_streak_days(c, user_id)

        # 4. 今日待复习数量（错题）
        c.execute('''
            SELECT COUNT(*) FROM mistakes
            WHERE user_id = ? AND is_deleted = 0
            AND (next_review_date IS NULL OR next_review_date <= ?)
        ''', (user_id, today))
        review_due_count = c.fetchone()[0] or 0

        conn.close()

        return 200, {
            'success': True,
            'data': {
                'total_mistakes': total_mistakes,
                'mastered_mistakes': mastered_mistakes,
                'today_study_time': today_study_time,
                'streak_days': streak_days,
                'review_due_count': review_due_count,
                'stats_date': today
            }
        }

    except Exception as e:
        logger.error(f"获取用户统计数据失败: {e}")
        return 500, {'success': False, 'message': f'获取统计数据失败: {str(e)}'}


def _calculate_streak_days(c, user_id):
    """计算连续学习天数"""
    try:
        # 获取最近90天的学习记录
        c.execute('''
            SELECT DISTINCT date FROM study_time
            WHERE user_id = ? AND date >= date('now', '-90 days')
            ORDER BY date DESC
        ''', (user_id,))

        study_dates = [row[0] for row in c.fetchall()]

        if not study_dates:
            return 0

        # 检查今天是否学习过
        today = datetime.now().strftime('%Y-%m-%d')
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')

        streak = 0
        check_date = today

        # 如果今天还没学习，从昨天开始算
        if today not in study_dates:
            check_date = yesterday

        # 计算连续天数
        while check_date in study_dates:
            streak += 1
            check_date = (datetime.strptime(check_date, '%Y-%m-%d') - timedelta(days=1)).strftime('%Y-%m-%d')

        return streak

    except Exception as e:
        logger.error(f"计算连续学习天数失败: {e}")
        return 0
