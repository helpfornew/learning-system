"""
复习历史记录 API - SM-2 间隔重复算法
"""

import json
from datetime import datetime, timedelta
from ..database import get_db
from ..config import logger


# ============ SM-2 间隔重复算法 ============

def _sm2_update(quality, review_count, interval_days, easiness_factor):
    """
    SM-2 间隔重复算法

    quality: 0-5 评分
        5 - 完美回忆
        4 - 正确回忆，有犹豫
        3 - 困难但正确
        2 - 错误，看到答案后记起
        1 - 错误，看到答案后似曾相识
        0 - 完全不记得

    返回: (new_interval, new_easiness_factor, new_review_count)
    """
    # 更新 easiness_factor
    ef = easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ef = max(1.3, ef)  # EF 最低 1.3

    # 计算新间隔
    if quality < 3:
        # 回忆失败：重置间隔，从头开始
        new_interval = 1
        new_count = 0
    else:
        new_count = review_count + 1
        if new_count == 1:
            new_interval = 1
        elif new_count == 2:
            new_interval = 6
        else:
            new_interval = round(interval_days * ef)

    return new_interval, ef, new_count


def _result_to_quality(result):
    """将前端的复习结果映射为 SM-2 quality 评分"""
    mapping = {
        'success': 4,      # 已掌握 - 正确回忆
        'difficult': 2,    # 较困难 - 错误但看到答案记起
        'forgotten': 1,    # 忘记了 - 完全不记得
    }
    return mapping.get(result, 3)


# ============ API 处理函数 ============

def handle_review_history_get(user_id, params=None):
    """
    获取复习历史记录（从 review_records 表查询真实数据）
    """
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    params = params or {}
    limit = min(int(params.get('limit', 20)), 100)
    offset = int(params.get('offset', 0))
    days = int(params.get('days', 30))

    try:
        conn = get_db()
        c = conn.cursor()

        since_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

        # 从 review_records 表查询真实复习记录
        c.execute('''
            SELECT rr.id, rr.mistake_id, rr.result, rr.quality, rr.reviewed_at,
                   m.content, m.subject_id, m.review_count
            FROM review_records rr
            JOIN mistakes m ON rr.mistake_id = m.id
            WHERE rr.user_id = ? AND rr.reviewed_at >= ?
            ORDER BY rr.reviewed_at DESC
            LIMIT ? OFFSET ?
        ''', (user_id, since_date, limit, offset))

        reviews = []
        for row in c.fetchall():
            content_preview = row[5][:50] + '...' if row[5] and len(row[5]) > 50 else (row[5] or '')
            result_map = {'success': 'mastered', 'difficult': 'reviewing', 'forgotten': 'forgotten'}
            reviews.append({
                'id': f"review_{row[0]}",
                'type': 'review',
                'item_id': row[1],
                'title': content_preview,
                'review_time': row[4],
                'result': result_map.get(row[2], row[2]),
                'raw_result': row[2],
                'quality': row[3],
                'review_count': row[7],
                'subject_id': row[6],
            })

        # 统计信息
        c.execute('''
            SELECT COUNT(*) FROM review_records
            WHERE user_id = ? AND reviewed_at >= ?
        ''', (user_id, since_date))
        total = c.fetchone()[0]

        c.execute('''
            SELECT COUNT(*) FROM review_records
            WHERE user_id = ? AND reviewed_at >= ? AND result = 'success'
        ''', (user_id, since_date))
        success_count = c.fetchone()[0]

        c.execute('''
            SELECT COUNT(DISTINCT date(reviewed_at)) FROM review_records
            WHERE user_id = ? AND reviewed_at >= date('now', '-7 days')
        ''', (user_id,))
        active_days = c.fetchone()[0] or 0

        # 待复习数量
        c.execute('''
            SELECT COUNT(*) FROM mistakes
            WHERE user_id = ? AND is_deleted = 0 AND review_count < 3
            AND (next_review_date IS NULL OR next_review_date <= date('now'))
        ''', (user_id,))
        due_count = c.fetchone()[0] or 0

        conn.close()

        stats = {
            'total_reviews': total,
            'mastered_count': success_count,
            'due_for_review': due_count,
            'active_days_last_week': active_days,
        }

        return 200, {
            'success': True,
            'data': {
                'reviews': reviews,
                'total': total,
                'limit': limit,
                'offset': offset,
                'stats': stats,
            }
        }

    except Exception as e:
        logger.error(f"获取复习历史记录失败: {e}")
        return 500, {'success': False, 'message': f'获取复习历史失败: {str(e)}'}


def handle_review_record_post(user_id, data):
    """
    记录一次复习 - 使用 SM-2 间隔重复算法更新复习调度
    """
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    mistake_id = data.get('mistake_id')
    if not mistake_id:
        return 400, {'success': False, 'message': 'mistake_id 不能为空'}

    result = data.get('result', 'success')
    quality = _result_to_quality(result)

    try:
        conn = get_db()
        c = conn.cursor()

        # 验证错题存在且属于该用户
        c.execute('''
            SELECT id, review_count, interval_days, easiness_factor
            FROM mistakes WHERE id = ? AND user_id = ? AND is_deleted = 0
        ''', (mistake_id, user_id))
        row = c.fetchone()
        if not row:
            conn.close()
            return 404, {'success': False, 'message': '错题不存在'}

        old_count = row[1] or 0
        old_interval = row[2] or 1
        old_ef = row[3] or 2.5

        # SM-2 算法计算新值
        new_interval, new_ef, new_count = _sm2_update(quality, old_count, old_interval, old_ef)
        next_review = (datetime.now() + timedelta(days=new_interval)).strftime('%Y-%m-%d')
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # 更新错题表
        c.execute('''
            UPDATE mistakes
            SET review_count = ?, last_review_date = ?,
                next_review_date = ?, easiness_factor = ?, interval_days = ?
            WHERE id = ?
        ''', (new_count, now[:10], next_review, round(new_ef, 2), new_interval, mistake_id))

        # 写入真实复习记录
        c.execute('''
            INSERT INTO review_records (user_id, mistake_id, result, quality, reviewed_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, mistake_id, result, quality, now))

        conn.commit()
        conn.close()

        return 200, {
            'success': True,
            'review_count': new_count,
            'next_review_date': next_review,
            'interval_days': new_interval,
            'easiness_factor': round(new_ef, 2),
            'message': '复习记录已更新'
        }

    except Exception as e:
        logger.error(f"记录复习失败: {e}")
        return 500, {'success': False, 'message': f'记录复习失败: {str(e)}'}


def handle_due_reviews_get(user_id, params=None):
    """
    获取到期待复习的错题

    按 next_review_date 排序，最早到期的优先。
    """
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    params = params or {}
    limit = min(int(params.get('limit', 10)), 50)

    try:
        conn = get_db()
        c = conn.cursor()

        today = datetime.now().strftime('%Y-%m-%d')

        # 查询到期的未掌握错题
        c.execute('''
            SELECT id, subject_id, content, correct_answer, wrong_answer,
                   knowledge_points, difficulty, review_count, next_review_date,
                   images_path, last_review_date, easiness_factor, interval_days
            FROM mistakes
            WHERE user_id = ? AND is_deleted = 0 AND review_count < 3
            AND (next_review_date IS NULL OR next_review_date <= ?)
            ORDER BY
                CASE WHEN next_review_date IS NULL THEN 0 ELSE 1 END,
                next_review_date ASC
            LIMIT ?
        ''', (user_id, today, limit))

        mistakes = []
        for row in c.fetchall():
            mistakes.append({
                'id': row[0],
                'subject_id': row[1],
                'content': row[2],
                'correct_answer': row[3],
                'wrong_answer': row[4],
                'knowledge_points': row[5],
                'difficulty': row[6],
                'review_count': row[7],
                'next_review': row[8],
                'images_path': row[9],
                'last_reviewed': row[10],
                'easiness_factor': row[11],
                'interval_days': row[12],
            })

        # 总到期数
        c.execute('''
            SELECT COUNT(*) FROM mistakes
            WHERE user_id = ? AND is_deleted = 0 AND review_count < 3
            AND (next_review_date IS NULL OR next_review_date <= ?)
        ''', (user_id, today))
        total_due = c.fetchone()[0] or 0

        conn.close()

        return 200, {
            'success': True,
            'data': {
                'mistakes': mistakes,
                'total_due': total_due,
                'today': today,
            }
        }

    except Exception as e:
        logger.error(f"获取到期复习失败: {e}")
        return 500, {'success': False, 'message': f'获取到期复习失败: {str(e)}'}
