#!/usr/bin/env python3
"""
高考学习智能提醒系统
基于学习计划和时间表发送提醒
"""

import json
import time
import sys
import argparse
from datetime import datetime, timedelta
import subprocess
import os
from pathlib import Path

class SmartReminder:
    def __init__(self):
        # 统一路径配置 - 与 Electron 应用保持一致
        self.config_dir = Path.home() / "学习系统" / "config"
        self.plan_file = self.config_dir / "计划.md"
        self.config_file = self.config_dir / "learning_system_config.json"

        self.load_config()
        self.load_schedule()
    
    def load_config(self):
        """加载配置"""
        if self.config_file.exists():
            with open(self.config_file, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
        else:
            self.config = {
                "reminders": {
                    "study_start": True,
                    "break_time": True,
                    "exercise_time": True,
                    "subject_change": True,
                    "daily_goal": True
                },
                "notification_method": "desktop",  # desktop, terminal, both
                "reminder_advance": 5  # 提前几分钟提醒
            }
    
    def load_schedule(self):
        """加载学习计划"""
        # 基于计划.md的固定时间表
        self.schedule = [
            {"time": "06:00", "task": "起床洗漱", "type": "日常", "reminder": "起床时间到了！开始新的一天！"},
            {"time": "06:20", "task": "晨间拉伸", "type": "锻炼", "reminder": "该做晨间拉伸了，激活身体！"},
            {"time": "06:40", "task": "英语磨耳朵 + 古诗文", "type": "学习", "reminder": "开始英语和语文双轨输入学习"},
            {"time": "07:30", "task": "早餐", "type": "餐饮", "reminder": "早餐时间，补充能量"},
            {"time": "08:00", "task": "化学分块输入", "type": "学习", "reminder": "开始化学学习，理论植入时间"},
            {"time": "09:45", "task": "数学/物理刻意练习", "type": "学习", "reminder": "开始数理学习，刻意练习时间"},
            {"time": "11:30", "task": "午餐", "type": "餐饮", "reminder": "午餐时间，好好休息"},
            {"time": "12:00", "task": "午休", "type": "休息", "reminder": "午休时间，恢复精力"},
            {"time": "13:00", "task": "英语单词质检", "type": "学习", "reminder": "开始英语单词复习"},
            {"time": "13:40", "task": "英语语法拆句子", "type": "学习", "reminder": "英语语法学习时间"},
            {"time": "14:00", "task": "数理错题复盘", "type": "学习", "reminder": "开始错题复盘，费曼讲解"},
            {"time": "15:30", "task": "微运动·肩颈放松", "type": "锻炼", "reminder": "该休息了，做做肩颈放松"},
            {"time": "16:00", "task": "政治/语文轮换", "type": "学习", "reminder": "开始文科学习时间"},
            {"time": "17:30", "task": "彻底放空", "type": "休息", "reminder": "学习结束，彻底放松时间"},
            {"time": "19:00", "task": "化学反刍", "type": "学习", "reminder": "晚上化学复习时间"},
            {"time": "20:00", "task": "休息", "type": "休息", "reminder": "短暂休息"},
            {"time": "20:15", "task": "英语听写 + 古诗默写", "type": "学习", "reminder": "开始晚间闭环学习"},
            {"time": "21:00", "task": "复盘+明日计划", "type": "学习", "reminder": "开始每日复盘和计划"},
            {"time": "21:40", "task": "洗漱", "type": "日常", "reminder": "洗漱时间"},
            {"time": "22:00", "task": "冥想·呼吸练习", "type": "锻炼", "reminder": "冥想时间，放松身心"},
            {"time": "22:30", "task": "睡觉", "type": "休息", "reminder": "该睡觉了，保证充足睡眠"}
        ]
    
    def send_notification(self, title, message, urgency="critical"):
        """发送通知"""
        methods = self.config.get("notification_method", "desktop")
        
        if "desktop" in methods or methods == "desktop":
            try:
                # 使用notify-send发送桌面通知
                subprocess.run([
                    "notify-send", 
                    "-u", urgency,
                    "-i", "applications-education",
                    title,
                    message
                ], check=False)
            except:
                pass  # 如果notify-send不可用，静默失败
        
        if "terminal" in methods or methods == "terminal":
            print(f"\n🔔 {title}")
            print(f"   {message}")
            print("-" * 50)
    
    def check_schedule(self):
        """检查时间表并发送提醒"""
        now = datetime.now()
        current_time = now.strftime("%H:%M")
        
        # 提前提醒时间（分钟）
        advance_minutes = self.config.get("reminder_advance", 5)
        
        for task in self.schedule:
            task_time = datetime.strptime(task["time"], "%H:%M")
            reminder_time = task_time - timedelta(minutes=advance_minutes)
            
            # 检查是否到了提醒时间
            if reminder_time.strftime("%H:%M") == current_time:
                self.send_notification(
                    "⏰ 学习提醒",
                    f"{advance_minutes}分钟后: {task['task']}\n{task['reminder']}",
                    "normal"
                )
            
            # 检查是否到了任务开始时间
            if task_time.strftime("%H:%M") == current_time:
                self.send_notification(
                    "🎯 任务开始",
                    f"现在开始: {task['task']}\n类型: {task['type']}",
                    "critical"
                )
    
    def check_study_duration(self):
        """检查学习时长，提醒休息"""
        # 这里可以集成时间跟踪系统的数据
        # 暂时使用简单的时间检查
        
        now = datetime.now()
        current_hour = now.hour
        
        # 学习时间段检查
        study_periods = [
            (8, 11.5),   # 上午学习
            (13, 17.5),  # 下午学习
            (19, 21)     # 晚上学习
        ]
        
        in_study = False
        for start, end in study_periods:
            if start <= current_hour < end:
                in_study = True
                break
        
        if in_study:
            # 每45分钟提醒休息（简化版）
            current_minute = now.minute
            if current_minute % 45 == 0:
                self.send_notification(
                    "☕ 休息提醒",
                    "已经学习了45分钟，建议休息5分钟！",
                    "normal"
                )
    
    def check_daily_goal(self):
        """检查每日目标完成情况"""
        # 这里可以集成时间跟踪系统的进度数据
        # 暂时使用时间估算
        
        now = datetime.now()
        current_hour = now.hour
        
        if current_hour == 21:  # 晚上9点检查
            self.send_notification(
                "📊 每日目标检查",
                "今天的学习即将结束，检查目标完成情况！",
                "critical"
            )
    
    def check_exercise_time(self):
        """检查锻炼时间"""
        exercise_times = ["06:20", "15:30", "22:00"]
        current_time = datetime.now().strftime("%H:%M")
        
        if current_time in exercise_times:
            self.send_notification(
                "💪 锻炼时间",
                "该进行锻炼/冥想了！保持身体健康！",
                "critical"
            )
    
    def emergency_reminder(self, message):
        """紧急提醒"""
        self.send_notification(
            "🚨 紧急提醒",
            message,
            "critical"
        )
    
    def start_monitoring(self):
        """开始监控"""
        print("=" * 60)
        print("高考学习智能提醒系统")
        print("=" * 60)
        print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"监控模式: {self.config.get('notification_method', 'desktop')}")
        print("=" * 60)
        
        try:
            while True:
                # 检查各种提醒
                self.check_schedule()
                self.check_study_duration()
                self.check_exercise_time()
                
                # 每小时检查一次每日目标
                if datetime.now().minute == 0:
                    self.check_daily_goal()
                
                # 每分钟检查一次
                time.sleep(60)
                
        except KeyboardInterrupt:
            print("\n👋 提醒系统已停止")
    
    def test_reminders(self):
        """测试所有提醒"""
        print("测试所有提醒类型...")
        
        # 测试通知
        self.send_notification("测试提醒", "这是一个测试提醒", "normal")
        time.sleep(1)
        
        self.send_notification("测试任务开始", "测试任务开始提醒", "critical")
        time.sleep(1)
        
        self.emergency_reminder("测试紧急提醒")
        
        print("\n✅ 提醒测试完成")

def main():
    """主函数"""
    reminder = SmartReminder()
    
    print("请选择操作:")
    print("1. 启动智能提醒监控")
    print("2. 测试提醒系统")
    print("3. 查看今日时间表")
    print("4. 配置提醒设置")
    print("5. 退出")
    
    choice = input("请输入选择 (1-5): ").strip()
    
    if choice == "1":
        reminder.start_monitoring()
    
    elif choice == "2":
        reminder.test_reminders()
    
    elif choice == "3":
        print("\n今日学习时间表:")
        print("=" * 60)
        for task in reminder.schedule:
            print(f"{task['time']} - {task['task']} ({task['type']})")
        print("=" * 60)
    
    elif choice == "4":
        print("\n当前配置:")
        print(json.dumps(reminder.config, ensure_ascii=False, indent=2))
        
        print("\n是否要修改配置? (y/n)")
        if input().strip().lower() == 'y':
            # 这里可以添加配置编辑功能
            print("配置编辑功能待实现")
    
    elif choice == "5":
        print("退出系统")
    
    else:
        print("无效选择")

def run_auto_mode():
    """自动模式 - 用于 systemd 服务"""
    reminder = SmartReminder()
    
    # 静默启动，只记录日志
    print(f"[{datetime.now()}] 智能提醒系统启动")
    
    try:
        while True:
            reminder.check_schedule()
            reminder.check_exercise_time()
            
            # 每小时检查一次每日目标
            if datetime.now().minute == 0:
                reminder.check_daily_goal()
            
            time.sleep(60)
            
    except KeyboardInterrupt:
        print(f"[{datetime.now()}] 智能提醒系统停止")
    except Exception as e:
        print(f"[{datetime.now()}] 错误：{e}")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='高考学习智能提醒系统')
    parser.add_argument('--auto', action='store_true', help='自动模式（后台运行）')
    parser.add_argument('--once', action='store_true', help='执行一次检查后退出')
    args = parser.parse_args()
    
    if args.auto:
        run_auto_mode()
        return
    
    if args.once:
        reminder = SmartReminder()
        reminder.check_schedule()
        reminder.check_exercise_time()
        print("检查完成")
        return
    
    reminder = SmartReminder()
    
    print("=" * 60)
    print("高考学习智能提醒系统")
    print("=" * 60)
    
    while True:
        print("\n请选择操作:")
        print("1. 启动智能提醒监控（桌面弹窗）")
        print("2. 测试桌面通知")
        print("3. 查看今日时间表")
        print("4. 立即发送测试提醒（最高级）")
        print("5. 配置提醒设置")
        print("6. 退出")
        
        choice = input("\n请输入选择 (1-6): ").strip()
        
        if choice == "1":
            reminder.start_monitoring()
        
        elif choice == "2":
            print("\n测试桌面通知...")
            reminder.test_reminders()
        
        elif choice == "3":
            print("\n今日学习时间表:")
            print("=" * 60)
            for task in reminder.schedule:
                print(f"{task['time']} - {task['task']} ({task['type']})")
            print("=" * 60)
        
        elif choice == "4":
            print("\n发送测试提醒（最高级）...")
            reminder.send_notification(
                "🚨 测试最高级提醒",
                "如果您看到这条消息，说明桌面弹窗提醒正常工作！",
                "critical"
            )
            print("✅ 提醒已发送")
        
        elif choice == "5":
            print("\n当前配置:")
            print(json.dumps(reminder.config, ensure_ascii=False, indent=2))
            
            print("\n是否要修改配置？(y/n)")
            if input().strip().lower() == 'y':
                # 修改通知方式
                method = input("通知方式 (desktop/terminal/both): ").strip()
                if method in ['desktop', 'terminal', 'both']:
                    reminder.config['notification_method'] = method
                
                # 修改提前提醒时间
                advance = input("提前提醒时间（分钟，默认 5）: ").strip()
                if advance.isdigit():
                    reminder.config['reminder_advance'] = int(advance)
                
                # 保存配置
                with open(reminder.config_file, 'w', encoding='utf-8') as f:
                    json.dump(reminder.config, f, ensure_ascii=False, indent=2)
                print("✅ 配置已保存")
        
        elif choice == "6":
            print("退出系统")
            break
        
        else:
            print("无效选择")

if __name__ == "__main__":
    main()