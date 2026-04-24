#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新局域网 IP 配置
自动获取本机局域网 IP 并更新到相关配置文件中
"""

import json
import socket
import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)  # learning_system 目录
CONFIG_FILE = os.path.join(BASE_DIR, 'config.json')
HOME_PAGE_FILE = os.path.join(BASE_DIR, 'config', 'index.html')

def get_lan_ip():
    """获取本机局域网 IP 地址"""
    try:
        # 创建一个 UDP socket 来获取本机 IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # 不需要真正连接，只是用来获取本地 IP
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        print(f"获取 IP 失败：{e}")
        return '192.168.1.1'

def update_config_json(lan_ip):
    """更新 config.json 中的局域网 IP"""
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        config = json.load(f)

    old_ip = config.get('网络配置', {}).get('局域网 IP', '')
    config['网络配置']['局域网 IP'] = lan_ip

    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

    print(f"✓ config.json: {old_ip} -> {lan_ip}")
    return config

def update_home_page(lan_ip):
    """更新主页 HTML 中的错题系统链接"""
    with open(HOME_PAGE_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # 替换 localhost 或旧 IP 为新 IP
    pattern = r"window\.open\('http://[\d\.]+:5173', '_blank'\)"
    replacement = f"window.open('http://{lan_ip}:5173', '_blank')"

    new_content = re.sub(pattern, replacement, content)

    if new_content != content:
        with open(HOME_PAGE_FILE, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✓ index.html: 错题系统链接已更新为 http://{lan_ip}:5173")
    else:
        print(f"✓ index.html: 已经是最新配置")

def main():
    print("=" * 50)
    print("  局域网 IP 配置更新工具")
    print("=" * 50)

    # 获取当前局域网 IP
    lan_ip = get_lan_ip()
    print(f"\n检测到局域网 IP: {lan_ip}")

    # 读取当前配置
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        config = json.load(f)

    current_ip = config.get('网络配置', {}).get('局域网 IP', '')
    print(f"当前配置 IP: {current_ip}")

    if lan_ip == current_ip:
        print("\n✓ IP 配置已是最新，无需更新")
    else:
        print(f"\n开始更新配置...")
        # 更新 config.json
        update_config_json(lan_ip)
        # 更新主页 HTML
        update_home_page(lan_ip)
        print("\n✓ 配置更新完成!")

    # 显示访问地址
    print("\n" + "=" * 50)
    print("  访问地址")
    print("=" * 50)
    print(f"  主页：http://{lan_ip}:8080")
    print(f"  错题系统：http://{lan_ip}:5173")
    print(f"  错题 API: http://{lan_ip}:3001")
    print(f"  学习 API: http://{lan_ip}:8000")
    print("=" * 50)

if __name__ == '__main__':
    main()
