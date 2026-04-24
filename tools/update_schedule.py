#!/usr/bin/env python3
"""
更新用户时间表为新的7天冲刺周期
2天刷题 + 1天分析 + 3天突破 + 1天复盘
"""

import sqlite3
import json
import os
from datetime import datetime

DB_PATH = '/opt/learning-system/database/unified_learning.db'

# 周一：刷题日 - 英语+化学
monday_schedule = [
    { "start": "07:00", "end": "07:30", "title": "🌅 起床晨练", "desc": "洗漱+拉伸+早餐", "subject": "准备", "tag": "daily" },
    { "start": "07:30", "end": "08:00", "title": "🔵 英语单词", "desc": "背诵50个新词", "subject": "英语", "tag": "学习" },
    { "start": "08:00", "end": "10:00", "title": "🔵 英语阅读", "desc": "2篇阅读+1篇完形(限时)", "subject": "英语", "tag": "学习" },
    { "start": "10:00", "end": "10:15", "title": "☕ 休息", "desc": "喝水+走动", "subject": "休息", "tag": "休息" },
    { "start": "10:15", "end": "12:00", "title": "🔴 化学选择", "desc": "15道选择题(限时25分钟)", "subject": "化学", "tag": "学习" },
    { "start": "12:00", "end": "13:30", "title": "🍲 午餐+午休", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "13:30", "end": "15:30", "title": "🔴 化学大题", "desc": "实验/工业流程/反应原理", "subject": "化学", "tag": "学习" },
    { "start": "15:30", "end": "15:45", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "15:45", "end": "17:00", "title": "🔵 英语七选五", "desc": "2篇+总结技巧", "subject": "英语", "tag": "学习" },
    { "start": "17:00", "end": "18:00", "title": "🏃 锻炼", "desc": "跑步/跳绳", "subject": "锻炼", "tag": "exercise" },
    { "start": "18:00", "end": "19:00", "title": "🍲 晚餐", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "19:00", "end": "20:30", "title": "🟣 数学作业", "desc": "稳住中档题", "subject": "数学", "tag": "学习" },
    { "start": "20:30", "end": "21:00", "title": "📝 录入错题", "desc": "拍照+简单标注", "subject": "整理", "tag": "学习" },
    { "start": "21:00", "end": "22:00", "title": "🔵 单词复习", "desc": "复习今日单词", "subject": "英语", "tag": "学习" },
    { "start": "22:00", "end": "22:30", "title": "🚿 洗漱", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "22:30", "end": "23:00", "title": "💤 睡觉", "desc": "", "subject": "休息", "tag": "休息" },
]

# 周二：刷题日 - 英语+化学+语文
tuesday_schedule = [
    { "start": "07:00", "end": "07:30", "title": "🌅 起床晨练", "desc": "洗漱+拉伸+早餐", "subject": "准备", "tag": "daily" },
    { "start": "07:30", "end": "08:00", "title": "🔵 英语单词", "desc": "背诵50个新词", "subject": "英语", "tag": "学习" },
    { "start": "08:00", "end": "10:00", "title": "🔵 英语阅读", "desc": "2篇阅读+语法填空", "subject": "英语", "tag": "学习" },
    { "start": "10:00", "end": "10:15", "title": "☕ 休息", "desc": "喝水+走动", "subject": "休息", "tag": "休息" },
    { "start": "10:15", "end": "12:00", "title": "🔴 化学大题", "desc": "3道大题专项", "subject": "化学", "tag": "学习" },
    { "start": "12:00", "end": "13:30", "title": "🍲 午餐+午休", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "13:30", "end": "15:00", "title": "🟡 语文阅读", "desc": "现代文阅读2篇", "subject": "语文", "tag": "学习" },
    { "start": "15:00", "end": "15:15", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "15:15", "end": "16:30", "title": "🟡 语文古诗", "desc": "古诗鉴赏2篇", "subject": "语文", "tag": "学习" },
    { "start": "16:30", "end": "17:30", "title": "🏃 锻炼", "desc": "", "subject": "锻炼", "tag": "exercise" },
    { "start": "17:30", "end": "18:30", "title": "🍲 晚餐", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "18:30", "end": "19:30", "title": "⚪ 物理作业", "desc": "抓基础分", "subject": "物理", "tag": "学习" },
    { "start": "19:30", "end": "20:30", "title": "📝 录入错题", "desc": "拍照+标注", "subject": "整理", "tag": "学习" },
    { "start": "20:30", "end": "21:30", "title": "🔵 单词复习", "desc": "复习周一、二单词", "subject": "英语", "tag": "学习" },
    { "start": "21:30", "end": "22:00", "title": "🚿 洗漱", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "22:00", "end": "22:30", "title": "💤 睡觉", "desc": "", "subject": "休息", "tag": "休息" },
]

# 周三：分析日 - AI分析错题
wednesday_schedule = [
    { "start": "07:00", "end": "07:30", "title": "🌅 起床晨练", "desc": "洗漱+拉伸+早餐", "subject": "准备", "tag": "daily" },
    { "start": "07:30", "end": "08:30", "title": "🔵 单词复习", "desc": "复习本周单词", "subject": "英语", "tag": "学习" },
    { "start": "08:30", "end": "10:30", "title": "🤖 AI分析错题", "desc": "批量分析周一、二错题", "subject": "分析", "tag": "学习" },
    { "start": "10:30", "end": "10:45", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "10:45", "end": "12:00", "title": "📊 查看统计", "desc": "DataAnalysis页面分析", "subject": "分析", "tag": "学习" },
    { "start": "12:00", "end": "13:30", "title": "🍲 午餐+午休", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "13:30", "end": "15:00", "title": "📝 整理薄弱点", "desc": "导出TOP5知识点清单", "subject": "分析", "tag": "学习" },
    { "start": "15:00", "end": "15:15", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "15:15", "end": "17:00", "title": "📋 规划突破", "desc": "规划周四、五、六学习重点", "subject": "规划", "tag": "学习" },
    { "start": "17:00", "end": "18:00", "title": "🏃 锻炼", "desc": "", "subject": "锻炼", "tag": "exercise" },
    { "start": "18:00", "end": "19:00", "title": "🍲 晚餐", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "19:00", "end": "20:00", "title": "🟢 政治背诵", "desc": "1个单元知识点", "subject": "政治", "tag": "学习" },
    { "start": "20:00", "end": "21:00", "title": "🟣 数学练习", "desc": "保持手感", "subject": "数学", "tag": "学习" },
    { "start": "21:00", "end": "21:30", "title": "🚿 洗漱", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "21:30", "end": "22:00", "title": "💤 睡觉", "desc": "", "subject": "休息", "tag": "休息" },
]

# 周四：突破日 - 英语专项
thursday_schedule = [
    { "start": "07:00", "end": "07:30", "title": "🌅 起床晨练", "desc": "洗漱+拉伸+早餐", "subject": "准备", "tag": "daily" },
    { "start": "07:30", "end": "08:00", "title": "🔵 单词复习", "desc": "复习100个旧词", "subject": "英语", "tag": "学习" },
    { "start": "08:00", "end": "10:00", "title": "🔵 阅读专项", "desc": "针对薄弱题型5篇训练", "subject": "英语", "tag": "学习" },
    { "start": "10:00", "end": "10:15", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "10:15", "end": "12:00", "title": "🔵 技巧总结", "desc": "总结阅读做题技巧", "subject": "英语", "tag": "学习" },
    { "start": "12:00", "end": "13:30", "title": "🍲 午餐+午休", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "13:30", "end": "15:00", "title": "🔵 完形专项", "desc": "3篇完形+总结", "subject": "英语", "tag": "学习" },
    { "start": "15:00", "end": "15:15", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "15:15", "end": "16:30", "title": "🔵 作文模板", "desc": "背诵万能句型", "subject": "英语", "tag": "学习" },
    { "start": "16:30", "end": "17:30", "title": "🏃 锻炼", "desc": "", "subject": "锻炼", "tag": "exercise" },
    { "start": "17:30", "end": "18:30", "title": "🍲 晚餐", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "18:30", "end": "20:00", "title": "🔴 化学作业", "desc": "", "subject": "化学", "tag": "学习" },
    { "start": "20:00", "end": "21:00", "title": "🔵 错题重做", "desc": "重做错题检验", "subject": "英语", "tag": "学习" },
    { "start": "21:00", "end": "21:30", "title": "🚿 洗漱", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "21:30", "end": "22:00", "title": "💤 睡觉", "desc": "", "subject": "休息", "tag": "休息" },
]

# 周五：突破日 - 化学专项
friday_schedule = [
    { "start": "07:00", "end": "07:30", "title": "🌅 起床晨练", "desc": "洗漱+拉伸+早餐", "subject": "准备", "tag": "daily" },
    { "start": "07:30", "end": "08:00", "title": "🔴 方程式默写", "desc": "默写10个重要方程式", "subject": "化学", "tag": "学习" },
    { "start": "08:00", "end": "10:00", "title": "🔴 实验专题", "desc": "实验装置+现象总结", "subject": "化学", "tag": "学习" },
    { "start": "10:00", "end": "10:15", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "10:15", "end": "12:00", "title": "🔴 实验练习", "desc": "5道实验大题", "subject": "化学", "tag": "学习" },
    { "start": "12:00", "end": "13:30", "title": "🍲 午餐+午休", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "13:30", "end": "15:00", "title": "🔴 工业流程", "desc": "套路总结+3道练习", "subject": "化学", "tag": "学习" },
    { "start": "15:00", "end": "15:15", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "15:15", "end": "16:30", "title": "🔴 计算专题", "desc": "物质的量计算套路", "subject": "化学", "tag": "学习" },
    { "start": "16:30", "end": "17:30", "title": "🏃 锻炼", "desc": "", "subject": "锻炼", "tag": "exercise" },
    { "start": "17:30", "end": "18:30", "title": "🍲 晚餐", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "18:30", "end": "19:30", "title": "🔵 英语作业", "desc": "", "subject": "英语", "tag": "学习" },
    { "start": "19:30", "end": "20:30", "title": "🔴 错题重做", "desc": "重做错题检验", "subject": "化学", "tag": "学习" },
    { "start": "20:30", "end": "21:00", "title": "🔴 方程式复习", "desc": "今日默写复习", "subject": "化学", "tag": "学习" },
    { "start": "21:00", "end": "21:30", "title": "🚿 洗漱", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "21:30", "end": "22:00", "title": "💤 睡觉", "desc": "", "subject": "休息", "tag": "休息" },
]

# 周六：突破日 - 语文+政治
saturday_schedule = [
    { "start": "07:00", "end": "07:30", "title": "🌅 起床晨练", "desc": "洗漱+拉伸+早餐", "subject": "准备", "tag": "daily" },
    { "start": "07:30", "end": "08:30", "title": "🟡 古诗文背诵", "desc": "背诵1篇必背古诗文", "subject": "语文", "tag": "学习" },
    { "start": "08:30", "end": "10:00", "title": "🟡 作文素材", "desc": "积累3个万能素材", "subject": "语文", "tag": "学习" },
    { "start": "10:00", "end": "10:15", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "10:15", "end": "12:00", "title": "🟡 作文练习", "desc": "写1篇作文/列提纲", "subject": "语文", "tag": "学习" },
    { "start": "12:00", "end": "13:30", "title": "🍲 午餐+午休", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "13:30", "end": "15:00", "title": "🟡 阅读模板", "desc": "小说/古诗答题模板", "subject": "语文", "tag": "学习" },
    { "start": "15:00", "end": "15:15", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "15:15", "end": "17:00", "title": "🟢 政治背诵", "desc": "哲学/经济模块", "subject": "政治", "tag": "学习" },
    { "start": "17:00", "end": "18:00", "title": "🏃 锻炼", "desc": "", "subject": "锻炼", "tag": "exercise" },
    { "start": "18:00", "end": "19:00", "title": "🍲 晚餐", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "19:00", "end": "20:00", "title": "🟢 政治大题", "desc": "答题模板练习", "subject": "政治", "tag": "学习" },
    { "start": "20:00", "end": "21:00", "title": "🟣 数学/物理", "desc": "保持手感", "subject": "数理", "tag": "学习" },
    { "start": "21:00", "end": "21:30", "title": "🚿 洗漱", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "21:30", "end": "22:00", "title": "💤 睡觉", "desc": "", "subject": "休息", "tag": "休息" },
]

# 周日：复盘日 - 测验+规划
sunday_schedule = [
    { "start": "07:00", "end": "07:30", "title": "🌅 起床晨练", "desc": "洗漱+拉伸+早餐", "subject": "准备", "tag": "daily" },
    { "start": "07:30", "end": "08:00", "title": "🔵 单词复习", "desc": "复习本周所有单词", "subject": "英语", "tag": "学习" },
    { "start": "08:00", "end": "09:00", "title": "📊 英语小测", "desc": "1套阅读+完形", "subject": "测验", "tag": "学习" },
    { "start": "09:00", "end": "09:15", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "09:15", "end": "10:15", "title": "📊 化学小测", "desc": "15道选择+1道大题", "subject": "测验", "tag": "学习" },
    { "start": "10:15", "end": "10:30", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "10:30", "end": "12:00", "title": "📝 统计正确率", "desc": "录入错题，对比上周", "subject": "复盘", "tag": "学习" },
    { "start": "12:00", "end": "13:30", "title": "🍲 午餐+午休", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "13:30", "end": "15:00", "title": "📋 周总结", "desc": "总结本周学习效果", "subject": "复盘", "tag": "学习" },
    { "start": "15:00", "end": "15:15", "title": "☕ 休息", "desc": "", "subject": "休息", "tag": "休息" },
    { "start": "15:15", "end": "17:00", "title": "📅 下周规划", "desc": "根据薄弱点规划下周", "subject": "规划", "tag": "学习" },
    { "start": "17:00", "end": "18:00", "title": "🏃 锻炼", "desc": "", "subject": "锻炼", "tag": "exercise" },
    { "start": "18:00", "end": "19:00", "title": "🍲 晚餐", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "19:00", "end": "20:00", "title": "🟢 政治背诵", "desc": "", "subject": "政治", "tag": "学习" },
    { "start": "20:00", "end": "21:00", "title": "📚 自由复习", "desc": "薄弱点查漏补缺", "subject": "复习", "tag": "学习" },
    { "start": "21:00", "end": "21:30", "title": "🚿 洗漱", "desc": "", "subject": "休息", "tag": "daily" },
    { "start": "21:30", "end": "22:00", "title": "💤 睡觉", "desc": "", "subject": "休息", "tag": "休息" },
]

def update_schedules():
    """更新所有用户的时间表"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 获取所有用户ID
    cursor.execute('SELECT DISTINCT user_id FROM user_schedules')
    users = cursor.fetchall()

    if not users:
        print("没有找到用户时间表，创建默认用户(user_id=1)的时间表")
        users = [(1,)]

    schedules = {
        0: sunday_schedule,
        1: monday_schedule,
        2: tuesday_schedule,
        3: wednesday_schedule,
        4: thursday_schedule,
        5: friday_schedule,
        6: saturday_schedule,
    }

    now = datetime.now().isoformat()

    for (user_id,) in users:
        print(f"\n更新用户 {user_id} 的时间表...")

        # 删除旧的 timetable
        cursor.execute('DELETE FROM user_schedules WHERE user_id = ?', (user_id,))
        print(f"  删除了旧的时间表")

        # 插入新的 timetable
        for day, schedule in schedules.items():
            schedule_json = json.dumps(schedule, ensure_ascii=False)
            cursor.execute('''
                INSERT INTO user_schedules (user_id, day_of_week, schedule_data, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, day, schedule_json, now, now))
            day_names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
            print(f"  ✓ 插入 {day_names[day]} 时间表 ({len(schedule)} 个时段)")

    conn.commit()
    conn.close()
    print("\n✅ 所有用户时间表更新完成！")

if __name__ == '__main__':
    update_schedules()
