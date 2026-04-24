#!/usr/bin/env python3
"""
高考学习系统 - 工具 API 服务
为 Web 前端提供时间跟踪、智能提醒、数据备份的 API 接口

支持生产环境部署：
- 使用环境变量配置数据目录
- 支持多用户隔离
"""

import json
import os
import time
import sqlite3
import shutil
import tarfile
import zipfile
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any

# ============ 环境变量配置 ============
# 数据目录：优先使用环境变量，其次使用用户主目录
DATA_DIR = Path(os.environ.get('LEARNING_SYSTEM_DATA', Path.home() / '学习系统'))
PROGRESS_DIR = DATA_DIR / 'progress'
CONFIG_DIR = DATA_DIR / 'config'
BACKUP_DIR = DATA_DIR / 'backup'

# 确保目录存在
for directory in [PROGRESS_DIR, CONFIG_DIR, BACKUP_DIR]:
    directory.mkdir(parents=True, exist_ok=True)


# ============ 时间跟踪服务 ============

class TimeTrackerAPI:
    """学习时间跟踪 API"""

    def __init__(self):
        self.data_dir = PROGRESS_DIR
        self.db_path = self.data_dir / '学习时间.db'
        self.config_path = self.data_dir / 'tracking_config.json'
        self.init_database()
        self.load_config()

    def init_database(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

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
            "daily_goal_minutes": 480,
            "pomodoro_duration": 25,
            "break_duration": 5,
            "subjects": ["英语", "化学", "语文", "数学", "物理", "政治"],
            "reminder_interval": 30,
            "auto_save": True
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

    def get_today_stats(self) -> Dict:
        """获取今日统计"""
        today = datetime.now().date()

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT total_minutes, focus_minutes, break_count, task_completed, efficiency_avg
            FROM daily_stats WHERE date = ?
        ''', (today.isoformat(),))

        result = cursor.fetchone()

        stats = {
            "total_minutes": result[0] or 0,
            "focus_minutes": result[1] or 0,
            "break_count": result[2] or 0,
            "task_completed": result[3] or 0,
            "efficiency_avg": result[4] or 0
        } if result else {
            "total_minutes": 0,
            "focus_minutes": 0,
            "break_count": 0,
            "task_completed": 0,
            "efficiency_avg": 0
        }

        cursor.execute('''
            SELECT subject, SUM(duration_minutes) as total
            FROM study_sessions
            WHERE DATE(start_time) = ?
            GROUP BY subject
        ''', (today.isoformat(),))

        subject_stats = {row[0]: row[1] for row in cursor.fetchall() if row[1]}
        conn.close()

        goal_minutes = self.config["daily_goal_minutes"]
        return {
            "date": today.isoformat(),
            "stats": stats,
            "subjects": subject_stats,
            "goal_minutes": goal_minutes,
            "goal_percentage": min(100, (stats["total_minutes"] / goal_minutes) * 100) if goal_minutes > 0 else 0
        }

    def get_weekly_report(self) -> Dict:
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

        daily_data = [{
            "date": row[0],
            "minutes": row[1] or 0,
            "efficiency": row[2] or 0
        } for row in cursor.fetchall()]

        cursor.execute('''
            SELECT SUM(total_minutes), AVG(efficiency_avg)
            FROM daily_stats
            WHERE date BETWEEN ? AND ?
        ''', (start_date.isoformat(), end_date.isoformat()))

        weekly_total = cursor.fetchone()

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

    def start_session(self, subject: str, task_type: str = "学习") -> Dict:
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

        return {"session_id": session_id, "start_time": start_time.isoformat(), "subject": subject}

    def end_session(self, session_id: int, efficiency_score: int = 80, notes: str = "") -> Dict:
        """结束学习会话"""
        end_time = datetime.now()

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('SELECT start_time, subject FROM study_sessions WHERE id = ?', (session_id,))
        result = cursor.fetchone()

        if not result:
            conn.close()
            return {"success": False, "error": "会话不存在"}

        start_time = datetime.fromisoformat(result[0])
        subject = result[1]
        duration = int((end_time - start_time).total_seconds() / 60)

        cursor.execute('''
            UPDATE study_sessions
            SET end_time = ?, duration_minutes = ?, efficiency_score = ?, notes = ?
            WHERE id = ?
        ''', (end_time.isoformat(), duration, efficiency_score, notes, session_id))

        # 更新每日统计
        today = start_time.date()
        cursor.execute('SELECT total_minutes FROM daily_stats WHERE date = ?', (today.isoformat(),))
        stat_result = cursor.fetchone()

        if stat_result:
            cursor.execute('''
                UPDATE daily_stats SET total_minutes = ?
                WHERE date = ?
            ''', (stat_result[0] + duration, today.isoformat()))
        else:
            cursor.execute('''
                INSERT INTO daily_stats (date, total_minutes)
                VALUES (?, ?)
            ''', (today.isoformat(), duration))

        # 更新科目进度
        cursor.execute('''
            INSERT OR REPLACE INTO subject_progress (subject, date, minutes_studied)
            VALUES (?, ?, COALESCE((SELECT minutes_studied FROM subject_progress
                                    WHERE subject = ? AND date = ?), 0) + ?)
        ''', (subject, today.isoformat(), subject, today.isoformat(), duration))

        conn.commit()
        conn.close()

        return {"success": True, "duration_minutes": duration, "efficiency_score": efficiency_score}

    def get_config(self) -> Dict:
        """获取配置"""
        return self.config

    def update_config(self, new_config: Dict) -> Dict:
        """更新配置"""
        self.config.update(new_config)
        self.save_config()
        return self.config

    def get_suggestions(self) -> List[str]:
        """生成学习建议"""
        today_stats = self.get_today_stats()
        weekly_report = self.get_weekly_report()
        suggestions = []

        if today_stats["stats"]["total_minutes"] < 60:
            suggestions.append("今日学习时间不足 1 小时，建议增加学习时间")
        elif today_stats["goal_percentage"] < 50:
            suggestions.append(f"今日学习进度仅{today_stats['goal_percentage']:.1f}%，距离目标还有差距")

        subjects = today_stats.get("subjects", {})
        if subjects and len(subjects) >= 2:
            subject_list = sorted(subjects.items(), key=lambda x: x[1])
            min_subject, min_time = subject_list[0]
            max_subject, max_time = subject_list[-1]

            if max_time > min_time * 3 and max_time > 60:
                suggestions.append(f"{min_subject}学习时间偏少，建议加强")

        if today_stats["stats"]["efficiency_avg"] < 70:
            suggestions.append("学习效率偏低，建议调整学习方法或增加休息")

        if weekly_report["total_minutes"] < 2000:
            suggestions.append("本周总学习时间不足，建议制定更严格的学习计划")

        if not suggestions:
            suggestions.append("学习状态良好，继续保持！")

        return suggestions


# ============ 智能提醒服务 ============

class SmartReminderAPI:
    """智能提醒 API"""

    def __init__(self):
        self.config_dir = CONFIG_DIR
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.config_file = self.config_dir / "learning_system_config.json"
        self.reminder_enabled = True
        self.load_config()
        self.load_schedule()

    def load_config(self):
        """加载配置"""
        default_config = {
            "reminders": {
                "study_start": True,
                "break_time": True,
                "exercise_time": True,
                "subject_change": True,
                "daily_goal": True
            },
            "notification_method": "desktop",
            "reminder_advance": 5
        }

        if self.config_file.exists():
            with open(self.config_file, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
        else:
            self.config = default_config
            self.save_config()

    def save_config(self):
        """保存配置"""
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)

    def load_schedule(self):
        """加载学习计划"""
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
            {"time": "21:00", "task": "复盘 + 明日计划", "type": "学习", "reminder": "开始每日复盘和计划"},
            {"time": "21:40", "task": "洗漱", "type": "日常", "reminder": "洗漱时间"},
            {"time": "22:00", "task": "冥想·呼吸练习", "type": "锻炼", "reminder": "冥想时间，放松身心"},
            {"time": "22:20", "task": "睡觉", "type": "休息", "reminder": "该睡觉了，保证充足睡眠"}
        ]

    def get_schedule(self) -> List[Dict]:
        """获取时间表"""
        return self.schedule

    def get_current_task(self) -> Optional[Dict]:
        """获取当前任务"""
        now = datetime.now()
        current_time = now.strftime("%H:%M")

        for task in self.schedule:
            if task["time"] == current_time:
                return task

        return None

    def get_next_tasks(self, count: int = 3) -> List[Dict]:
        """获取接下来的任务"""
        now = datetime.now()
        current_minutes = now.hour * 60 + now.minute

        upcoming = []
        for task in self.schedule:
            task_parts = task["time"].split(":")
            task_minutes = int(task_parts[0]) * 60 + int(task_parts[1])

            if task_minutes >= current_minutes:
                upcoming.append({**task, "minutes_until": task_minutes - current_minutes})

        return upcoming[:count]

    def send_test_notification(self, title: str = "测试提醒", message: str = "这是一条测试消息") -> Dict:
        """发送测试通知"""
        try:
            subprocess.run([
                "notify-send",
                "-u", "normal",
                "-i", "applications-education",
                title,
                message
            ], check=False, capture_output=True)
            return {"success": True, "message": "通知已发送"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_config(self) -> Dict:
        """获取配置"""
        return self.config

    def update_config(self, new_config: Dict) -> Dict:
        """更新配置"""
        self.config.update(new_config)
        self.save_config()
        return self.config

    def toggle_reminder(self, enabled: bool) -> Dict:
        """启用/禁用提醒"""
        self.reminder_enabled = enabled
        return {"enabled": enabled}


# ============ 数据同步备份服务 ============

class DataSyncBackupAPI:
    """数据同步备份 API"""

    def __init__(self):
        self.study_dir = DATA_DIR
        self.backup_dir = BACKUP_DIR
        self.config_file = CONFIG_DIR / "同步配置.json"

        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.load_config()

    def load_config(self):
        """加载配置"""
        default_config = {
            "backup": {
                "enabled": True,
                "frequency": "daily",
                "keep_days": 30,
                "compress": True,
                "backup_locations": ["local"]
            },
            "sync": {
                "enabled": False,
                "services": [],
                "auto_sync": False,
                "sync_frequency": "daily"
            },
            "monitoring": {
                "disk_space_warning": 1024,
                "backup_size_warning": 1024
            }
        }

        if self.config_file.exists():
            with open(self.config_file, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
        else:
            self.config = default_config
            self.save_config()

    def save_config(self):
        """保存配置"""
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)

    def get_backup_files(self) -> List[str]:
        """获取需要备份的文件列表"""
        backup_files = []

        config_files = [
            self.study_dir / "配置" / "学习系统配置.json",
            self.study_dir / "配置" / "计划.md",
        ]

        data_files = [
            self.study_dir / "进度" / "学习时间.db",
            self.study_dir / "进度" / "跟踪配置.json"
        ]

        data_dirs = [
            self.study_dir / "资料",
            self.study_dir / "进度"
        ]

        for file in config_files + data_files:
            if file.exists():
                backup_files.append(str(file))

        for data_dir in data_dirs:
            if data_dir.exists():
                for root, dirs, files in os.walk(data_dir):
                    for file in files:
                        if not file.startswith('.'):
                            backup_files.append(str(Path(root) / file))

        return backup_files

    def create_backup(self, backup_type: str = "full") -> Dict:
        """创建备份"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"学习系统备份_{timestamp}_{backup_type}"
        backup_path = self.backup_dir / backup_name

        files_to_backup = self.get_backup_files()

        if not files_to_backup:
            return {"success": False, "error": "没有找到需要备份的文件"}

        total_size = sum(os.path.getsize(f) for f in files_to_backup if os.path.exists(f))

        backup_path.mkdir(parents=True, exist_ok=True)
        copied_files = []

        for file in files_to_backup:
            try:
                file_path = Path(file)
                relative_path = file_path.relative_to(self.study_dir)
                target_path = backup_path / relative_path
                target_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(file_path, target_path)
                copied_files.append(str(relative_path))
            except Exception as e:
                pass

        manifest = {
            "backup_name": backup_name,
            "backup_type": backup_type,
            "timestamp": datetime.now().isoformat(),
            "file_count": len(copied_files),
            "total_size": total_size,
            "files": copied_files
        }

        manifest_file = backup_path / "备份清单.json"
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)

        # 压缩备份
        if self.config["backup"].get("compress", True):
            compressed_path = self.compress_backup(backup_path)
            if compressed_path:
                shutil.rmtree(backup_path)
                backup_path = compressed_path

        return {
            "success": True,
            "backup_name": backup_name,
            "backup_path": str(backup_path),
            "file_count": len(copied_files),
            "total_size_mb": round(total_size / 1024 / 1024, 2)
        }

    def compress_backup(self, backup_path: Path) -> Optional[Path]:
        """压缩备份目录"""
        try:
            if shutil.which("tar"):
                tar_path = Path(str(backup_path) + ".tar.gz")
                with tarfile.open(tar_path, "w:gz") as tar:
                    tar.add(backup_path, arcname=backup_path.name)
                return tar_path
            elif shutil.which("zip"):
                zip_path = Path(str(backup_path) + ".zip")
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for root, dirs, files in os.walk(backup_path):
                        for file in files:
                            file_path = Path(root) / file
                            arcname = file_path.relative_to(backup_path.parent)
                            zipf.write(file_path, arcname)
                return zip_path
        except Exception as e:
            pass
        return backup_path

    def list_backups(self) -> List[Dict]:
        """列出所有备份"""
        backups = []

        for item in self.backup_dir.iterdir():
            if item.is_dir() or item.suffix in ['.tar.gz', '.zip', '.tgz']:
                backup_info = self.get_backup_info(item)
                if backup_info:
                    backups.append(backup_info)

        backups.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return backups

    def get_backup_info(self, backup_path) -> Optional[Dict]:
        """获取备份信息"""
        try:
            backup_path = Path(backup_path)

            if backup_path.suffix in ['.tar.gz', '.zip', '.tgz']:
                if backup_path.suffix == '.tar.gz':
                    with tarfile.open(backup_path, 'r:gz') as tar:
                        for member in tar.getmembers():
                            if member.name.endswith('备份清单.json'):
                                f = tar.extractfile(member)
                                if f:
                                    manifest = json.load(f)
                                    manifest["path"] = str(backup_path)
                                    manifest["size"] = backup_path.stat().st_size
                                    return manifest
                elif backup_path.suffix == '.zip':
                    with zipfile.ZipFile(backup_path, 'r') as zipf:
                        for name in zipf.namelist():
                            if name.endswith('备份清单.json'):
                                with zipf.open(name) as f:
                                    manifest = json.load(f)
                                    manifest["path"] = str(backup_path)
                                    manifest["size"] = backup_path.stat().st_size
                                    return manifest

            elif backup_path.is_dir():
                manifest_file = backup_path / "备份清单.json"
                if manifest_file.exists():
                    with open(manifest_file, 'r', encoding='utf-8') as f:
                        manifest = json.load(f)
                        manifest["path"] = str(backup_path)
                        manifest["size"] = sum(
                            f.stat().st_size for f in backup_path.rglob('*') if f.is_file()
                        )
                        return manifest
        except Exception as e:
            pass
        return None

    def delete_backup(self, backup_path: str) -> Dict:
        """删除备份"""
        try:
            path = Path(backup_path)
            if path.exists():
                if path.is_dir():
                    shutil.rmtree(path)
                else:
                    path.unlink()
                return {"success": True, "message": "备份已删除"}
            return {"success": False, "error": "备份不存在"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_config(self) -> Dict:
        """获取配置"""
        return self.config

    def update_config(self, new_config: Dict) -> Dict:
        """更新配置"""
        self.config.update(new_config)
        self.save_config()
        return self.config

    def check_disk_space(self) -> Dict:
        """检查磁盘空间"""
        total, used, free = shutil.disk_usage(self.backup_dir)
        free_mb = free // (1024 * 1024)
        warning_threshold = self.config["monitoring"].get("disk_space_warning", 1024)

        return {
            "free_mb": free_mb,
            "total_mb": total // (1024 * 1024),
            "used_mb": used // (1024 * 1024),
            "warning": free_mb < warning_threshold,
            "warning_threshold_mb": warning_threshold
        }


# ============ 单例实例 ============

_time_tracker = None
_reminder = None
_backup = None


def get_time_tracker() -> TimeTrackerAPI:
    """获取时间跟踪器实例"""
    global _time_tracker
    if _time_tracker is None:
        _time_tracker = TimeTrackerAPI()
    return _time_tracker


def get_reminder() -> SmartReminderAPI:
    """获取提醒服务实例"""
    global _reminder
    if _reminder is None:
        _reminder = SmartReminderAPI()
    return _reminder


def get_backup_service() -> DataSyncBackupAPI:
    """获取备份服务实例"""
    global _backup
    if _backup is None:
        _backup = DataSyncBackupAPI()
    return _backup
