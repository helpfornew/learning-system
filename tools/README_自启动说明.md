# 高考学习智能提醒系统 - 开机自启动设置

## 快速设置

运行以下命令：

```bash
cd ~/learning_system/tools
./setup_autostart.sh
```

## 手动设置

如果自动脚本无法运行，可以手动执行以下步骤：

### 1. 复制服务文件

```bash
mkdir -p ~/.config/systemd/user
cp gaokao-reminder.service ~/.config/systemd/user/
```

### 2. 启用服务

```bash
systemctl --user daemon-reload
systemctl --user enable gaokao-reminder.service
systemctl --user start gaokao-reminder.service
```

### 3. 检查状态

```bash
systemctl --user status gaokao-reminder.service
```

## 服务管理命令

| 命令 | 说明 |
|------|------|
| `systemctl --user status gaokao-reminder` | 查看服务状态 |
| `systemctl --user stop gaokao-reminder` | 停止服务 |
| `systemctl --user restart gaokao-reminder` | 重启服务 |
| `systemctl --user disable gaokao-reminder` | 禁用开机自启 |
| `journalctl --user -u gaokao-reminder -f` | 查看日志 |

## 注意事项

1. **需要图形界面**：提醒系统需要图形界面才能显示桌面通知
2. **登录后启动**：服务在用户登录到图形界面后自动启动
3. **notify-send**：确保系统已安装 `notify-send` 命令

## 测试通知

```bash
# 测试桌面通知
notify-send "测试" "如果您看到这条消息，通知系统正常工作"
```

## 手动运行

如果不想使用开机自启，可以手动运行：

```bash
# 自动模式（后台运行）
python3 smart_reminder.py --auto

# 执行一次检查
python3 smart_reminder.py --once

# 交互模式
python3 smart_reminder.py
```
