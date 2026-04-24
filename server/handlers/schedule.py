"""日程/时间表 API 处理器"""
import json
from datetime import datetime
from ..database import get_db


def handle_schedule_get(user_id, params):
    """获取用户完整周时间表"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    day = params.get('day')  # 可选参数，获取某一天的时间表

    conn = get_db()
    cursor = conn.cursor()

    try:
        if day is not None:
            # 获取指定日期的时间表
            day = int(day)
            cursor.execute(
                'SELECT schedule_data FROM user_schedules WHERE user_id = ? AND day_of_week = ?',
                (user_id, day)
            )
            row = cursor.fetchone()
            if row:
                return 200, {'success': True, 'data': json.loads(row[0]), 'day': day, 'source': 'user'}
            else:
                # 返回默认时间表
                default = get_default_schedule_for_day(day)
                return 200, {'success': True, 'data': default, 'day': day, 'source': 'default'}
        else:
            # 获取整周时间表
            schedules = {}
            cursor.execute(
                'SELECT day_of_week, schedule_data FROM user_schedules WHERE user_id = ?',
                (user_id,)
            )
            rows = cursor.fetchall()
            for row in rows:
                schedules[str(row[0])] = json.loads(row[1])

            # 填充默认值
            for day in range(7):
                day_key = str(day)
                if day_key not in schedules:
                    schedules[day_key] = get_default_schedule_for_day(day)

            return 200, {'success': True, 'data': schedules, 'source': 'mixed'}
    except Exception as e:
        return 500, {'success': False, 'message': f'获取时间表失败: {str(e)}'}
    finally:
        conn.close()


def handle_schedule_post(user_id, data):
    """保存/更新用户时间表"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    day = data.get('day')  # 0-6
    schedule_items = data.get('schedule', [])  # 时间表项目数组

    if day is None or not isinstance(schedule_items, list):
        return 400, {'success': False, 'message': '参数错误: 需要 day (0-6) 和 schedule 数组'}

    try:
        day = int(day)
        if day < 0 or day > 6:
            return 400, {'success': False, 'message': 'day 必须在 0-6 之间'}
    except (ValueError, TypeError):
        return 400, {'success': False, 'message': 'day 必须是整数'}

    # 验证时间表数据格式
    for item in schedule_items:
        if not all(k in item for k in ['start', 'end', 'title']):
            return 400, {'success': False, 'message': '时间表项目必须包含 start, end, title 字段'}

    conn = get_db()
    cursor = conn.cursor()

    try:
        schedule_json = json.dumps(schedule_items, ensure_ascii=False)
        now = datetime.now().isoformat()

        # UPSERT 操作
        cursor.execute('''
            INSERT INTO user_schedules (user_id, day_of_week, schedule_data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, day_of_week) DO UPDATE SET
                schedule_data = excluded.schedule_data,
                updated_at = excluded.updated_at
        ''', (user_id, day, schedule_json, now, now))

        conn.commit()
        return 200, {'success': True, 'message': '时间表保存成功', 'day': day}
    except Exception as e:
        conn.rollback()
        return 500, {'success': False, 'message': f'保存失败: {str(e)}'}
    finally:
        conn.close()


def handle_schedule_today_get(user_id):
    """获取用户今日时间表"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    from datetime import datetime
    today = datetime.now().weekday()  # 0=周一, 6=周日 -> 需要转换
    # Python weekday: 0=周一, 6=周日
    # 我们的格式: 0=周日, 1=周一, ..., 6=周六
    day_of_week = (today + 1) % 7

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            'SELECT schedule_data FROM user_schedules WHERE user_id = ? AND day_of_week = ?',
            (user_id, day_of_week)
        )
        row = cursor.fetchone()

        if row:
            return 200, {'success': True, 'data': json.loads(row[0]), 'day': day_of_week, 'source': 'user'}
        else:
            default = get_default_schedule_for_day(day_of_week)
            return 200, {'success': True, 'data': default, 'day': day_of_week, 'source': 'default'}
    except Exception as e:
        return 500, {'success': False, 'message': f'获取今日时间表失败: {str(e)}'}
    finally:
        conn.close()


def handle_schedule_today_put(user_id, data):
    """更新今日时间表"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    from datetime import datetime
    today = datetime.now().weekday()
    day_of_week = (today + 1) % 7  # 转换为 0=周日格式

    schedule_items = data.get('schedule', [])

    if not isinstance(schedule_items, list):
        return 400, {'success': False, 'message': '参数错误: schedule 必须是数组'}

    # 验证数据
    for item in schedule_items:
        if not all(k in item for k in ['start', 'end', 'title']):
            return 400, {'success': False, 'message': '时间表项目必须包含 start, end, title 字段'}

    conn = get_db()
    cursor = conn.cursor()

    try:
        schedule_json = json.dumps(schedule_items, ensure_ascii=False)
        now = datetime.now().isoformat()

        cursor.execute('''
            INSERT INTO user_schedules (user_id, day_of_week, schedule_data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, day_of_week) DO UPDATE SET
                schedule_data = excluded.schedule_data,
                updated_at = excluded.updated_at
        ''', (user_id, day_of_week, schedule_json, now, now))

        conn.commit()
        return 200, {'success': True, 'message': '今日时间表更新成功', 'day': day_of_week}
    except Exception as e:
        conn.rollback()
        return 500, {'success': False, 'message': f'更新失败: {str(e)}'}
    finally:
        conn.close()


def handle_schedule_delete(user_id, day):
    """删除用户某天时间表（恢复默认）"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    try:
        day = int(day)
        if day < 0 or day > 6:
            return 400, {'success': False, 'message': 'day 必须在 0-6 之间'}
    except (ValueError, TypeError):
        return 400, {'success': False, 'message': 'day 必须是整数'}

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            'DELETE FROM user_schedules WHERE user_id = ? AND day_of_week = ?',
            (user_id, day)
        )
        conn.commit()

        if cursor.rowcount > 0:
            return 200, {'success': True, 'message': '时间表已删除'}
        else:
            return 404, {'success': False, 'message': '未找到该日期的自定义时间表'}
    except Exception as e:
        return 500, {'success': False, 'message': f'删除失败: {str(e)}'}
    finally:
        conn.close()


def get_default_schedule_for_day(day_of_week):
    """获取某天的默认时间表"""
    # 0=周日, 1=周一, ..., 6=周六

    # 基础时间表模板
    base_schedule = [
        {'start': '07:00', 'end': '07:20', 'title': '起床洗漱', 'desc': '清醒 + 喝水', 'subject': '⏰ 起床', 'tag': 'daily'},
        {'start': '07:20', 'end': '07:40', 'title': '🧘 晨间拉伸', 'desc': '猫牛式/下犬式/肩颈', 'subject': '锻炼', 'tag': 'exercise'},
        {'start': '07:40', 'end': '08:00', 'title': '🔵 英语磨耳朵', 'desc': '纯听，唤醒语感', 'subject': '英语', 'tag': '学习'},
        {'start': '08:00', 'end': '09:00', 'title': '早餐 + 备菜', 'desc': '做饭/吃 + 准备中午食材', 'subject': '🍽️ 早餐', 'tag': 'daily'},
        {'start': '09:00', 'end': '10:30', 'title': '🔴 化学分块输入', 'desc': '1 概念 +3 例题 +4 练习', 'subject': '化学', 'tag': '学习'},
        {'start': '10:30', 'end': '10:50', 'title': '☕ 休息', 'desc': '喝水 + 走动', 'subject': '休息', 'tag': '休息'},
        {'start': '10:50', 'end': '12:00', 'title': '🟡 数理刻意练习', 'desc': '模型思维：画示意图 + 边界条件', 'subject': '数学/物理', 'tag': '学习'},
        {'start': '12:00', 'end': '13:00', 'title': '做饭 + 午餐 + 洗碗', 'desc': '简单烹饪', 'subject': '🍲 午餐', 'tag': 'daily'},
        {'start': '13:00', 'end': '14:00', 'title': '午休', 'desc': '休息', 'subject': '😴 午休', 'tag': '休息'},
        {'start': '14:00', 'end': '15:00', 'title': '💻 AI 编程项目', 'desc': 'KDnuggets 文档 + 跑代码', 'subject': 'AI 项目', 'tag': '学习'},
        {'start': '15:00', 'end': '15:10', 'title': '📝 项目术语本', 'desc': '记下 3-5 个关键词', 'subject': '英语', 'tag': '学习'},
        {'start': '15:10', 'end': '16:30', 'title': '🟡 数理错题复盘', 'desc': '盲做→对比→费曼', 'subject': '数理', 'tag': '学习'},
        {'start': '16:30', 'end': '17:00', 'title': '🧘 微运动 + 深呼吸', 'desc': '靠墙拉伸 + 机动时间', 'subject': '锻炼', 'tag': 'exercise'},
        {'start': '17:00', 'end': '18:30', 'title': '🟢 政治/语文', 'desc': '背术语 + 选择题 / 文言文精读', 'subject': '政治/语文', 'tag': '学习'},
        {'start': '18:30', 'end': '19:30', 'title': '做饭 + 晚餐 + 洗碗', 'desc': '简单烹饪', 'subject': '🍲 晚餐', 'tag': 'daily'},
        {'start': '19:30', 'end': '20:00', 'title': '彻底放空', 'desc': '无手机', 'subject': '🧘 放空', 'tag': '休息'},
        {'start': '20:00', 'end': '21:00', 'title': '🟣 化学反刍', 'desc': '检索练习', 'subject': '化学', 'tag': '学习'},
        {'start': '21:00', 'end': '21:15', 'title': '休息', 'desc': '小憩', 'subject': '✨ 休息', 'tag': '休息'},
        {'start': '21:15', 'end': '22:00', 'title': '🔵 英语单词质检', 'desc': '只背项目遇到的词 + 高考核心词', 'subject': '英语', 'tag': '学习'},
        {'start': '22:00', 'end': '22:20', 'title': '🚿 洗漱', 'desc': '', 'subject': '洗漱', 'tag': 'daily'},
        {'start': '22:20', 'end': '22:30', 'title': '🧘 冥想', 'desc': '正念/身体扫描', 'subject': '冥想', 'tag': 'exercise'},
        {'start': '22:30', 'end': '23:00', 'title': '睡觉', 'desc': '22:30 休息', 'subject': '💤 睡觉', 'tag': '休息'},
    ]

    # 根据星期几调整部分科目
    if day_of_week == 0:  # 周日
        # 周测日
        for item in base_schedule:
            if '化学分块输入' in item['title']:
                item['title'] = '📊 周测·科目①'
                item['desc'] = '周测 70 分钟'
                item['subject'] = '周测'
            elif '数理刻意练习' in item['title']:
                item['title'] = '📊 周测·科目②'
                item['desc'] = '周测 70 分钟'
                item['subject'] = '周测'
            elif '政治/语文' in item['subject']:
                item['title'] = '📊 周测复盘'
                item['desc'] = '总结错题'
                item['subject'] = '复盘'
    elif day_of_week in [1, 3, 5]:  # 周一、三、五 - 单日(数学)
        for item in base_schedule:
            if '数理刻意练习' in item['title']:
                item['title'] = '🟡 数学刻意练习'
                item['subject'] = '数学'
            elif '数理错题复盘' in item['title']:
                item['title'] = '🟡 数学错题复盘'
                item['subject'] = '数学'
            elif item['subject'] == '政治/语文':
                item['title'] = '🟢 政治·术语 + 选择题'
                item['desc'] = '背 5 术语 +10 选择题'
                item['subject'] = '政治'
    elif day_of_week in [2, 4, 6]:  # 周二、四、六 - 双日(物理)
        for item in base_schedule:
            if '数理刻意练习' in item['title']:
                item['title'] = '🟡 物理刻意练习'
                item['subject'] = '物理'
            elif '数理错题复盘' in item['title']:
                item['title'] = '🟡 物理错题复盘'
                item['subject'] = '物理'
            elif item['subject'] == '政治/语文':
                item['title'] = '🟣 语文·文言文/古诗/素材'
                item['desc'] = '文言文精读/古诗鉴赏/作文素材'
                item['subject'] = '语文'

    return base_schedule
