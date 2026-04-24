#!/usr/bin/env python3
"""
高考学习时间跟踪系统
监控学习时间、效率、进度
支持桌面弹窗提醒
"""

import json
import os
import time
import subprocess
from datetime import datetime, timedelta
import sqlite3
from pathlib import Path

class TimeTracker:
    def __init__(self):
        # 统一路径配置 - 与 Electron 应用保持一致
        self.data_dir = Path.home() / "学习系统" / "progress"
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.db_path = self.data_dir / "学习时间.db"
        self.config_path = self.data_dir / "tracking_config.json"

        self.init_database()
        self.load_config()

    def send_notification(self, title, message, urgency="normal"):
        """发送桌面通知"""
        try:
            # 使用 notify-send 发送桌面通知
            subprocess.run([
                "notify-send",
                "-u", urgency,
                "-i", "applications-education",
                "-t", "5000",  # 5 秒后自动消失
                title,
                message
            ], check=False, capture_output=True)
        except Exception as e:
            print(f"[通知] {title}: {message}")

        # 同时在终端输出
        print(f"\n🔔 {title}")
        print(f"   {message}")
        print("-" * 50)
    
    def init_database(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 创建学习时间表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS study_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                subject TEXT NOT NULL,
                task_type TEXT,
                duration_minutes INTEGER,
                efficiency_score INTEGER,
                notes TEXT
            )
        ''')
        
        # 创建每日统计表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS daily_stats (
                date DATE PRIMARY KEY,
                total_minutes INTEGER DEFAULT 0,
                focus_minutes INTEGER DEFAULT 0,
                break_count INTEGER DEFAULT 0,
                task_completed INTEGER DEFAULT 0,
                efficiency_avg INTEGER DEFAULT 0
            )
        ''')
        
        # 创建科目进度表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS subject_progress (
                subject TEXT,
                date DATE,
                minutes_studied INTEGER,
                tasks_completed INTEGER,
                PRIMARY KEY (subject, date)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def load_config(self):
        """加载配置"""
        default_config = {
            "daily_goal_minutes": 480,  # 8小时
            "pomodoro_duration": 25,
            "break_duration": 5,
            "subjects": ["英语", "化学", "语文", "数学", "物理", "政治"],
            "reminder_interval": 30,  # 分钟
            "auto_save": True,
            # 提醒设置
            "enable_notifications": True,
            "pomodoro_reminder": True,
            "rest_reminder": True,
            "daily_goal_reminder": True,
            "long_study_reminder": 45  # 学习 45 分钟后提醒休息
        }
        
        if self.config_path.exists():
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
        else:
            self.config = default_config
            self.save_config()
    
    def save_config(self):
        """保存配置"""
        with open(self.config_path, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)
    
    def start_session(self, subject, task_type="学习"):
        """开始学习会话"""
        start_time = datetime.now()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO study_sessions (start_time, subject, task_type)
            VALUES (?, ?, ?)
        ''', (start_time.isoformat(), subject, task_type))
        
        session_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ 开始{subject}学习会话 (ID: {session_id})")
        return session_id
    
    def end_session(self, session_id, efficiency_score=80, notes=""):
        """结束学习会话"""
        end_time = datetime.now()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 获取开始时间
        cursor.execute('SELECT start_time FROM study_sessions WHERE id = ?', (session_id,))
        result = cursor.fetchone()
        
        if result:
            start_time = datetime.fromisoformat(result[0])
            duration = (end_time - start_time).total_seconds() / 60  # 转换为分钟
            
            cursor.execute('''
                UPDATE study_sessions 
                SET end_time = ?, duration_minutes = ?, efficiency_score = ?, notes = ?
                WHERE id = ?
            ''', (end_time.isoformat(), int(duration), efficiency_score, notes, session_id))
            
            # 更新每日统计
            self.update_daily_stats(start_time.date(), int(duration))
            
            # 更新科目进度
            cursor.execute('SELECT subject FROM study_sessions WHERE id = ?', (session_id,))
            subject = cursor.fetchone()[0]
            self.update_subject_progress(subject, start_time.date(), int(duration))
            
            conn.commit()
            print(f"✅ 结束学习会话，时长: {int(duration)}分钟，效率: {efficiency_score}%")
        
        conn.close()
    
    def update_daily_stats(self, date, duration_minutes):
        """更新每日统计"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 检查是否已有今日记录
        cursor.execute('SELECT total_minutes FROM daily_stats WHERE date = ?', (date.isoformat(),))
        result = cursor.fetchone()
        
        if result:
            new_total = result[0] + duration_minutes
            cursor.execute('''
                UPDATE daily_stats 
                SET total_minutes = ?
                WHERE date = ?
            ''', (new_total, date.isoformat()))
        else:
            cursor.execute('''
                INSERT INTO daily_stats (date, total_minutes)
                VALUES (?, ?)
            ''', (date.isoformat(), duration_minutes))
        
        conn.commit()
        conn.close()
    
    def update_subject_progress(self, subject, date, duration):
        """更新科目进度"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO subject_progress (subject, date, minutes_studied)
            VALUES (?, ?, COALESCE((SELECT minutes_studied FROM subject_progress WHERE subject = ? AND date = ?), 0) + ?)
        ''', (subject, date.isoformat(), subject, date.isoformat(), duration))
        
        conn.commit()
        conn.close()
    
    def get_today_stats(self):
        """获取今日统计"""
        today = datetime.now().date()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT total_minutes, focus_minutes, break_count, task_completed, efficiency_avg
            FROM daily_stats WHERE date = ?
        ''', (today.isoformat(),))
        
        result = cursor.fetchone()
        
        if result:
            stats = {
                "total_minutes": result[0] or 0,
                "focus_minutes": result[1] or 0,
                "break_count": result[2] or 0,
                "task_completed": result[3] or 0,
                "efficiency_avg": result[4] or 0
            }
        else:
            stats = {
                "total_minutes": 0,
                "focus_minutes": 0,
                "break_count": 0,
                "task_completed": 0,
                "efficiency_avg": 0
            }
        
        # 获取今日各科目学习时间
        cursor.execute('''
            SELECT subject, SUM(duration_minutes) as total
            FROM study_sessions 
            WHERE DATE(start_time) = ?
            GROUP BY subject
        ''', (today.isoformat(),))
        
        subject_stats = {row[0]: row[1] for row in cursor.fetchall() if row[1]}
        
        conn.close()
        
        return {
            "date": today.isoformat(),
            "stats": stats,
            "subjects": subject_stats,
            "goal_minutes": self.config["daily_goal_minutes"],
            "goal_percentage": min(100, (stats["total_minutes"] / self.config["daily_goal_minutes"]) * 100) if self.config["daily_goal_minutes"] > 0 else 0
        }
    
    def get_weekly_report(self):
        """获取周报"""
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=6)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT date, total_minutes, efficiency_avg
            FROM daily_stats 
            WHERE date BETWEEN ? AND ?
            ORDER BY date
        ''', (start_date.isoformat(), end_date.isoformat()))
        
        daily_data = []
        for row in cursor.fetchall():
            daily_data.append({
                "date": row[0],
                "minutes": row[1] or 0,
                "efficiency": row[2] or 0
            })
        
        # 计算周总计
        cursor.execute('''
            SELECT SUM(total_minutes), AVG(efficiency_avg)
            FROM daily_stats 
            WHERE date BETWEEN ? AND ?
        ''', (start_date.isoformat(), end_date.isoformat()))
        
        weekly_total = cursor.fetchone()
        
        # 科目周统计
        cursor.execute('''
            SELECT subject, SUM(minutes_studied)
            FROM subject_progress
            WHERE date BETWEEN ? AND ?
            GROUP BY subject
        ''', (start_date.isoformat(), end_date.isoformat()))
        
        subject_weekly = {row[0]: row[1] for row in cursor.fetchall() if row[1]}
        
        conn.close()
        
        return {
            "week_start": start_date.isoformat(),
            "week_end": end_date.isoformat(),
            "total_minutes": weekly_total[0] or 0,
            "avg_efficiency": weekly_total[1] or 0,
            "daily_data": daily_data,
            "subject_totals": subject_weekly
        }
    
    def start_pomodoro(self, subject, duration=25):
        """开始番茄钟"""
        print(f"🍅 开始{subject}番茄钟 ({duration}分钟)")
        
        session_id = self.start_session(subject, "番茄钟")
        
        # 实际使用时这里应该有计时器
        # 这里简化为等待
        print(f"专注学习{duration}分钟...")
        time.sleep(duration * 60)  # 实际等待
        
        self.end_session(session_id, efficiency_score=85, notes="番茄钟完成")
        
        # 开始休息
        print(f"☕ 开始休息 (5分钟)")
        time.sleep(5 * 60)
        
        return True
    
    def generate_progress_report(self):
        """生成进度报告"""
        today_stats = self.get_today_stats()
        weekly_report = self.get_weekly_report()
        
        report = {
            "生成时间": datetime.now().isoformat(),
            "今日统计": today_stats,
            "周报": weekly_report,
            "建议": self.generate_suggestions(today_stats, weekly_report)
        }
        
        # 保存报告
        report_path = self.data_dir / f"进度报告_{datetime.now().strftime('%Y%m%d')}.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"📊 进度报告已生成: {report_path}")
        return report
    
    def generate_suggestions(self, today_stats, weekly_report):
        """生成学习建议"""
        suggestions = []
        
        # 检查今日学习时间
        if today_stats["stats"]["total_minutes"] < 60:
            suggestions.append("今日学习时间不足1小时，建议增加学习时间")
        elif today_stats["goal_percentage"] < 50:
            suggestions.append(f"今日学习进度仅{today_stats['goal_percentage']:.1f}%，距离目标还有差距")
        
        # 检查科目均衡
        subjects = today_stats.get("subjects", {})
        if subjects:
            subject_list = list(subjects.items())
            subject_list.sort(key=lambda x: x[1])
            
            if len(subject_list) >= 2:
                min_subject, min_time = subject_list[0]
                max_subject, max_time = subject_list[-1]
                
                if max_time > min_time * 3 and max_time > 60:
                    suggestions.append(f"{min_subject}学习时间偏少，建议加强")
        
        # 检查效率
        if today_stats["stats"]["efficiency_avg"] < 70:
            suggestions.append("学习效率偏低，建议调整学习方法或增加休息")
        
        # 检查周趋势
        if weekly_report["total_minutes"] < 2000:  # 每周约33小时
            suggestions.append("本周总学习时间不足，建议制定更严格的学习计划")
        
        if not suggestions:
            suggestions.append("学习状态良好，继续保持！")
        
        return suggestions

    def check_study_duration_and_remind(self):
        """检查学习时长并发送休息提醒"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        today = datetime.now().date()
        
        # 获取当前进行中的会话
        cursor.execute("""
            SELECT id, start_time, subject 
            FROM study_sessions 
            WHERE end_time IS NULL
        """)
        
        ongoing_sessions = cursor.fetchall()
        conn.close()
        
        long_study_reminder = self.config.get("long_study_reminder", 45)
        
        for session_id, start_time_str, subject in ongoing_sessions:
            start_time = datetime.fromisoformat(start_time_str)
            duration = (datetime.now() - start_time).total_seconds() / 60
            
            # 如果学习时长超过设定值，发送提醒
            if duration >= long_study_reminder:
                if self.config.get("enable_notifications") and self.config.get("rest_reminder"):
                    self.send_notification(
                        "☕ 休息提醒",
                        f"已经学习{int(duration)}分钟了，建议休息 5 分钟！",
                        "normal"
                    )

    def check_daily_goal_and_remind(self):
        """检查每日目标完成度并发送提醒"""
        if not self.config.get("enable_notifications") or not self.config.get("daily_goal_reminder"):
            return
        
        stats = self.get_today_stats()
        goal_percentage = stats["goal_percentage"]
        total_minutes = stats["stats"]["total_minutes"]
        goal_minutes = self.config.get("daily_goal_minutes", 480)
        
        # 当达到 25%、50%、75%、100% 时发送提醒
        checkpoints = [25, 50, 75, 100]
        
        # 检查是否刚达到某个里程碑（允许 5 分钟误差）
        for checkpoint in checkpoints:
            target_minutes = goal_minutes * checkpoint / 100
            if abs(total_minutes - target_minutes) <= 5:
                if checkpoint == 100:
                    self.send_notification(
                        "🎉 目标达成",
                        f"恭喜！今日学习目标已完成！总学习时间：{total_minutes}分钟",
                        "critical"
                    )
                else:
                    self.send_notification(
                        "📊 进度提醒",
                        f"今日学习进度已达{checkpoint}%！继续加油！",
                        "normal"
                    )
                break

    def start_monitoring(self, interval=60):
        """开始监控模式（后台运行，自动发送提醒）"""
        print("=" * 60)
        print("高考学习时间跟踪系统 - 监控模式")
        print("=" * 60)
        print(f"启动时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"提醒间隔：{interval}秒")
        print(f"桌面通知：{'已启用' if self.config.get('enable_notifications') else '已禁用'}")
        print("=" * 60)
        print("按 Ctrl+C 停止监控...\n")
        
        last_goal_check = 0
        
        try:
            while True:
                # 检查学习时长并提醒休息
                self.check_study_duration_and_remind()
                
                # 每分钟检查一次每日目标
                current_minute = datetime.now().minute
                if current_minute != last_goal_check:
                    self.check_daily_goal_and_remind()
                    last_goal_check = current_minute
                
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n👋 监控已停止")


def main():
    """主函数"""
    tracker = TimeTracker()
    
    print("=" * 50)
    print("高考学习时间跟踪系统")
    print("=" * 50)
    
    while True:
        print("\n请选择操作:")
        print("1. 开始学习会话")
        print("2. 开始番茄钟（带提醒）")
        print("3. 查看今日统计")
        print("4. 生成周报")
        print("5. 生成进度报告")
        print("6. 启动监控模式（自动提醒）")
        print("7. 测试桌面通知")
        print("8. 配置提醒设置")
        print("9. 退出")
        
        choice = input("请输入选择 (1-9): ").strip()
        
        if choice == "1":
            print("\n可选科目:", ", ".join(tracker.config["subjects"]))
            subject = input("请输入科目: ").strip()
            if subject in tracker.config["subjects"]:
                session_id = tracker.start_session(subject)
                input("按回车键结束会话...")
                notes = input("请输入学习笔记 (可选): ").strip()
                efficiency = input("请输入效率评分 (0-100, 默认80): ").strip()
                efficiency_score = int(efficiency) if efficiency.isdigit() else 80
                tracker.end_session(session_id, efficiency_score, notes)
            else:
                print("❌ 无效科目")
        
        elif choice == "2":
            print("\n可选科目:", ", ".join(tracker.config["subjects"]))
            subject = input("请输入科目: ").strip()
            if subject in tracker.config["subjects"]:
                duration = input("请输入番茄钟时长 (分钟, 默认25): ").strip()
                duration = int(duration) if duration.isdigit() else 25
                tracker.start_pomodoro(subject, duration)
            else:
                print("❌ 无效科目")
        
        elif choice == "3":
            stats = tracker.get_today_stats()
            print("\n" + "=" * 50)
            print(f"📊 今日统计 ({stats['date']})")
            print("=" * 50)
            print(f"总学习时间: {stats['stats']['total_minutes']}分钟")
            print(f"目标进度: {stats['goal_percentage']:.1f}% ({stats['goal_minutes']}分钟)")
            print(f"专注时间: {stats['stats']['focus_minutes']}分钟")
            print(f"休息次数: {stats['stats']['break_count']}次")
            print(f"任务完成: {stats['stats']['task_completed']}个")
            print(f"平均效率: {stats['stats']['efficiency_avg']}%")
            
            if stats['subjects']:
                print("\n📚 科目学习时间:")
                for subject, minutes in stats['subjects'].items():
                    print(f"  {subject}: {minutes}分钟")
        
        elif choice == "4":
            report = tracker.get_weekly_report()
            print("\n" + "=" * 50)
            print(f"📈 周报 ({report['week_start']} 至 {report['week_end']})")
            print("=" * 50)
            print(f"周总学习时间: {report['total_minutes']}分钟")
            print(f"周平均效率: {report['avg_efficiency']:.1f}%")
            
            print("\n📅 每日详情:")
            for day in report['daily_data']:
                print(f"  {day['date']}: {day['minutes']}分钟, 效率{day['efficiency']}%")
            
            if report['subject_totals']:
                print("\n📚 科目周总计:")
                for subject, minutes in report['subject_totals'].items():
                    print(f"  {subject}: {minutes}分钟")
        
        elif choice == "5":
            report = tracker.generate_progress_report()
            print("\n✅ 进度报告已生成")
            print("💡 学习建议:")
            for suggestion in report['建议']:
                print(f"  • {suggestion}")
        
        elif choice == "9":
            print("👋 退出系统")
            break
        
        else:
            print("❌ 无效选择")

if __name__ == "__main__":
    main()