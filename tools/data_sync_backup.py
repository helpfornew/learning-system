#!/usr/bin/env python3
"""
高考学习系统数据同步与备份
自动备份学习数据，支持本地和云同步
"""

import json
import os
import shutil
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import hashlib
import tarfile
import zipfile

class DataSyncBackup:
    def __init__(self):
        self.home_dir = Path.home()
        self.study_dir = self.home_dir / "学习系统"
        self.backup_dir = self.study_dir / "备份"
        self.config_file = self.study_dir / "配置" / "同步配置.json"
        
        # 确保目录存在
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        self.load_config()
    
    def load_config(self):
        """加载配置"""
        default_config = {
            "backup": {
                "enabled": True,
                "frequency": "daily",  # hourly, daily, weekly
                "keep_days": 30,
                "compress": True,
                "backup_locations": ["local"]
            },
            "sync": {
                "enabled": False,
                "services": [],  # webdav, dropbox, google_drive
                "auto_sync": False,
                "sync_frequency": "daily"
            },
            "monitoring": {
                "disk_space_warning": 1024,  # MB
                "backup_size_warning": 1024  # MB
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
    
    def get_backup_files(self):
        """获取需要备份的文件列表"""
        backup_files = []
        
        # 重要配置文件
        config_files = [
            self.study_dir / "配置" / "学习系统配置.json",
            self.study_dir / "配置" / "计划.md",
            self.study_dir / "配置" / "资料库配置.json"
        ]
        
        # 学习数据文件
        data_files = [
            self.study_dir / "进度" / "学习时间.db",
            self.study_dir / "进度" / "跟踪配置.json"
        ]
        
        # 学习资料目录
        data_dirs = [
            self.study_dir / "资料",
            self.study_dir / "进度"
        ]
        
        # 收集文件
        for file in config_files:
            if file.exists():
                backup_files.append(file)
        
        for file in data_files:
            if file.exists():
                backup_files.append(file)
        
        # 收集目录中的文件
        for data_dir in data_dirs:
            if data_dir.exists():
                for root, dirs, files in os.walk(data_dir):
                    for file in files:
                        if not file.startswith('.'):  # 忽略隐藏文件
                            backup_files.append(Path(root) / file)
        
        return backup_files
    
    def calculate_backup_size(self, files):
        """计算备份文件总大小"""
        total_size = 0
        for file in files:
            if file.exists():
                total_size += file.stat().st_size
        return total_size
    
    def create_backup(self, backup_type="full"):
        """创建备份"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"学习系统备份_{timestamp}_{backup_type}"
        backup_path = self.backup_dir / backup_name
        
        # 获取需要备份的文件
        files_to_backup = self.get_backup_files()
        
        if not files_to_backup:
            print("⚠ 没有找到需要备份的文件")
            return None
        
        total_size = self.calculate_backup_size(files_to_backup)
        print(f"📊 备份统计: {len(files_to_backup)}个文件, 总大小: {total_size/1024/1024:.2f}MB")
        
        # 创建备份目录
        backup_path.mkdir(parents=True, exist_ok=True)
        
        # 复制文件
        copied_files = []
        for file in files_to_backup:
            try:
                # 保持目录结构
                relative_path = file.relative_to(self.study_dir)
                target_path = backup_path / relative_path
                target_path.parent.mkdir(parents=True, exist_ok=True)
                
                shutil.copy2(file, target_path)
                copied_files.append(str(relative_path))
                
            except Exception as e:
                print(f"⚠ 复制文件失败 {file}: {e}")
        
        # 创建备份清单
        manifest = {
            "backup_name": backup_name,
            "backup_type": backup_type,
            "timestamp": datetime.now().isoformat(),
            "file_count": len(copied_files),
            "total_size": total_size,
            "files": copied_files,
            "system_info": {
                "user": os.getenv("USER"),
                "hostname": os.uname().nodename,
                "system": os.uname().sysname
            }
        }
        
        manifest_file = backup_path / "备份清单.json"
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        
        # 压缩备份（如果启用）
        if self.config["backup"].get("compress", True):
            compressed_path = self.compress_backup(backup_path)
            if compressed_path:
                # 删除原始备份目录
                shutil.rmtree(backup_path)
                backup_path = compressed_path
        
        print(f"✅ 备份创建完成: {backup_path}")
        return backup_path
    
    def compress_backup(self, backup_path):
        """压缩备份目录"""
        try:
            if shutil.which("tar"):
                # 使用tar压缩
                tar_path = Path(str(backup_path) + ".tar.gz")
                with tarfile.open(tar_path, "w:gz") as tar:
                    tar.add(backup_path, arcname=backup_path.name)
                return tar_path
            elif shutil.which("zip"):
                # 使用zip压缩
                zip_path = Path(str(backup_path) + ".zip")
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for root, dirs, files in os.walk(backup_path):
                        for file in files:
                            file_path = Path(root) / file
                            arcname = file_path.relative_to(backup_path.parent)
                            zipf.write(file_path, arcname)
                return zip_path
            else:
                print("⚠ 未找到压缩工具，跳过压缩")
                return backup_path
        except Exception as e:
            print(f"⚠ 压缩失败: {e}")
            return backup_path
    
    def list_backups(self):
        """列出所有备份"""
        backups = []
        
        for item in self.backup_dir.iterdir():
            if item.is_dir() or item.suffix in ['.tar.gz', '.zip', '.tgz']:
                backup_info = self.get_backup_info(item)
                if backup_info:
                    backups.append(backup_info)
        
        # 按时间排序
        backups.sort(key=lambda x: x["timestamp"], reverse=True)
        return backups
    
    def get_backup_info(self, backup_path):
        """获取备份信息"""
        try:
            # 检查是否是压缩文件
            if backup_path.suffix in ['.tar.gz', '.zip', '.tgz']:
                # 对于压缩文件，尝试读取清单
                if backup_path.suffix == '.tar.gz':
                    import tarfile
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
                    import zipfile
                    with zipfile.ZipFile(backup_path, 'r') as zipf:
                        for name in zipf.namelist():
                            if name.endswith('备份清单.json'):
                                with zipf.open(name) as f:
                                    manifest = json.load(f)
                                    manifest["path"] = str(backup_path)
                                    manifest["size"] = backup_path.stat().st_size
                                    return manifest
            
            # 对于目录备份
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
            print(f"⚠ 读取备份信息失败 {backup_path}: {e}")
        
        return None
    
    def restore_backup(self, backup_path, restore_location=None):
        """恢复备份"""
        if restore_location is None:
            restore_location = self.study_dir
        
        restore_location = Path(restore_location)
        
        print(f"正在恢复备份: {backup_path}")
        print(f"恢复到: {restore_location}")
        
        # 确认恢复
        confirm = input("确认恢复备份？这将覆盖现有文件。(y/N): ")
        if confirm.lower() != 'y':
            print("恢复已取消")
            return False
        
        try:
            backup_path = Path(backup_path)
            
            # 处理压缩备份
            if backup_path.suffix in ['.tar.gz', '.zip', '.tgz']:
                if backup_path.suffix == '.tar.gz':
                    import tarfile
                    with tarfile.open(backup_path, 'r:gz') as tar:
                        # 提取到临时目录
                        temp_dir = self.backup_dir / "temp_restore"
                        if temp_dir.exists():
                            shutil.rmtree(temp_dir)
                        temp_dir.mkdir(parents=True)
                        
                        tar.extractall(temp_dir)
                        
                        # 找到备份目录
                        backup_dirs = list(temp_dir.iterdir())
                        if backup_dirs:
                            self._restore_from_dir(backup_dirs[0], restore_location)
                        
                        # 清理临时目录
                        shutil.rmtree(temp_dir)
                
                elif backup_path.suffix == '.zip':
                    import zipfile
                    with zipfile.ZipFile(backup_path, 'r') as zipf:
                        # 提取到临时目录
                        temp_dir = self.backup_dir / "temp_restore"
                        if temp_dir.exists():
                            shutil.rmtree(temp_dir)
                        temp_dir.mkdir(parents=True)
                        
                        zipf.extractall(temp_dir)
                        
                        # 找到备份目录
                        backup_dirs = list(temp_dir.iterdir())
                        if backup_dirs:
                            self._restore_from_dir(backup_dirs[0], restore_location)
                        
                        # 清理临时目录
                        shutil.rmtree(temp_dir)
            
            # 处理目录备份
            elif backup_path.is_dir():
                self._restore_from_dir(backup_path, restore_location)
            
            else:
                print("❌ 不支持的备份格式")
                return False
            
            print("✅ 备份恢复完成")
            return True
            
        except Exception as e:
            print(f"❌ 恢复失败: {e}")
            return False
    
    def _restore_from_dir(self, backup_dir, restore_location):
        """从目录恢复备份"""
        # 读取清单
        manifest_file = backup_dir / "备份清单.json"
        if not manifest_file.exists():
            print("⚠ 备份清单不存在，尝试直接恢复文件")
            # 直接复制所有文件
            shutil.copytree(backup_dir, restore_location, dirs_exist_ok=True)
            return
        
        with open(manifest_file, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        
        # 恢复文件
        for file_rel in manifest.get("files", []):
            source_file = backup_dir / file_rel
            target_file = restore_location / file_rel
            
            if source_file.exists():
                target_file.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_file, target_file)
                print(f"  ✓ 恢复: {file_rel}")
    
    def cleanup_old_backups(self):
        """清理旧备份"""
        keep_days = self.config["backup"].get("keep_days", 30)
        cutoff_date = datetime.now() - timedelta(days=keep_days)
        
        backups = self.list_backups()
        deleted_count = 0
        
        for backup in backups:
            backup_time = datetime.fromisoformat(backup["timestamp"])
            if backup_time < cutoff_date:
                try:
                    backup_path = Path(backup["path"])
                    if backup_path.exists():
                        if backup_path.is_dir():
                            shutil.rmtree(backup_path)
                        else:
                            backup_path.unlink()
                        print(f"🗑️ 删除旧备份: {backup_path.name}")
                        deleted_count += 1
                except Exception as e:
                    print(f"⚠ 删除备份失败 {backup['path']}: {e}")
        
        print(f"✅ 清理完成，删除了 {deleted_count} 个旧备份")
    
    def check_disk_space(self):
        """检查磁盘空间"""
        import shutil
        
        total, used, free = shutil.disk_usage(self.backup_dir)
        free_mb = free // (1024 * 1024)
        
        warning_threshold = self.config["monitoring"].get("disk_space_warning", 1024)
        
        if free_mb < warning_threshold:
            print(f"⚠ 磁盘空间不足: 仅剩 {free_mb}MB")
            return False
        
        return True
    
    def run_scheduled_backup(self):
        """运行计划备份"""
        if not self.config["backup"].get("enabled", True):
            print("备份功能已禁用")
            return
        
        # 检查磁盘空间
        if not self.check_disk_space():
            print("❌ 磁盘空间不足，跳过备份")
            return
        
        # 检查是否需要备份
        frequency = self.config["backup"].get("frequency", "daily")
        backups = self.list_backups()
        
        if backups:
            latest_backup = backups[0]
            latest_time = datetime.fromisoformat(latest_backup["timestamp"])
            now = datetime.now()
            
            if frequency == "hourly":
                # 每小时备份一次
                if (now - latest_time).total_seconds() < 3600:
                    print("最近已备份，跳过")
                    return
            elif frequency == "daily":
                # 每天备份一次
                if (now - latest_time).days < 1:
                    print("今天已备份，跳过")
                    return
            elif frequency == "weekly":
                # 每周备份一次
                if (now - latest_time).days < 7:
                    print("本周已备份，跳过")
                    return
        
        # 执行备份
        print("开始计划备份...")
        backup_path = self.create_backup("scheduled")
        
        if backup_path:
            # 清理旧备份
            self.cleanup_old_backups()
            
            print("✅ 计划备份完成")
            return backup_path
        
        return None

def main():
    """主函数"""
    sync_backup = DataSyncBackup()
    
    print("=" * 60)
    print("高考学习系统数据同步与备份")
    print("=" * 60)
    
    while True:
        print("\n请选择操作:")
        print("1. 创建完整备份")
        print("2. 列出所有备份")
        print("3. 恢复备份")
        print("4. 清理旧备份")
        print("5. 运行计划备份")
        print("6. 检查系统状态")
        print("7. 配置设置")
        print("8. 退出")
        
        choice = input("请输入选择 (1-8): ").strip()
        
        if choice == "1":
            print("创建完整备份...")
            backup_type = input("备份类型 (full/incremental, 默认full): ").strip() or "full"
            backup_path = sync_backup.create_backup(backup_type)
            if backup_path:
                print(f"备份创建成功: {backup_path}")
        
        elif choice == "2":
            backups = sync_backup.list_backups()
            print(f"\n找到 {len(backups)} 个备份:")
            print("-" * 80)
            for i, backup in enumerate(backups, 1):
                backup_time = datetime.fromisoformat(backup["timestamp"])
                size_mb = backup["size"] / (1024 * 1024)
                print(f"{i}. {backup['backup_name']}")
                print(f"   时间: {backup_time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"   大小: {size_mb:.2f}MB")
                print(f"   文件数: {backup['file_count']}")
                print()
        
        elif choice == "3":
            backups = sync_backup.list_backups()
            if not backups:
                print("没有可用的备份")
                continue
            
            print("选择要恢复的备份:")
            for i, backup in enumerate(backups, 1):
                backup_time = datetime.fromisoformat(backup["timestamp"])
                print(f"{i}. {backup['backup_name']} ({backup_time.strftime('%Y-%m-%d %H:%M')})")
            
            try:
                selection = int(input("请输入备份编号: ").strip())
                if 1 <= selection <= len(backups):
                    backup_path = backups[selection-1]["path"]
                    sync_backup.restore_backup(backup_path)
                else:
                    print("无效的备份编号")
            except ValueError:
                print("请输入有效的数字")
        
        elif choice == "4":
            print("清理旧备份...")
            sync_backup.cleanup_old_backups()
        
        elif choice == "5":
            print("运行计划备份...")
            backup_path = sync_backup.run_scheduled_backup()
            if backup_path:
                print(f"计划备份完成: {backup_path}")
        
        elif choice == "6":
            print("系统状态检查:")
            print("-" * 40)
            
            # 检查磁盘空间
            if sync_backup.check_disk_space():
                print("✅ 磁盘空间: 充足")
            else:
                print("⚠ 磁盘空间: 不足")
            
            # 检查备份数量
            backups = sync_backup.list_backups()
            print(f"📊 备份数量: {len(backups)}个")
            
            if backups:
                latest = backups[0]
                latest_time = datetime.fromisoformat(latest["timestamp"])
                age_days = (datetime.now() - latest_time).days
                print(f"📅 最新备份: {age_days}天前")
            
            # 检查配置
            config = sync_backup.config
            print(f"⚙️ 备份启用: {'是' if config['backup']['enabled'] else '否'}")
            print(f"🔄 备份频率: {config['backup']['frequency']}")
            print(f"🗑️ 保留天数: {config['backup']['keep_days']}天")
        
        elif choice == "7":
            print("当前配置:")
            print(json.dumps(sync_backup.config, ensure_ascii=False, indent=2))
            
            print("\n是否要修改配置? (y/n)")
            if input().strip().lower() == 'y':
                # 这里可以添加配置编辑功能
                print("配置编辑功能待实现")
                print("请手动编辑文件: ~/学习系统/配置/同步配置.json")
        
        elif choice == "8":
            print("退出系统")
            break
        
        else:
            print("无效选择")
        
        print("\n按回车键继续...")
        input()

if __name__ == "__main__":
    main()
