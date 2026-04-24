#!/usr/bin/env python3
"""
高考学习系统 - 邀请码管理工具

用法:
    python3 manage_invite_codes.py create [选项]     # 创建邀请码
    python3 manage_invite_codes.py list              # 列出所有邀请码
    python3 manage_invite_codes.py disable <代码>    # 禁用邀请码
    python3 manage_invite_codes.py enable <代码>     # 启用邀请码
    python3 manage_invite_codes.py delete <代码>     # 删除邀请码
"""

import sqlite3
import secrets
import sys
import os
from datetime import datetime, timedelta

# 数据库路径 - 支持环境变量或默认路径
DB_PATH = os.environ.get(
    'LEARNING_SYSTEM_DB',
    os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'unified_learning.db')
)

def get_db():
    """获取数据库连接"""
    if not os.path.exists(DB_PATH):
        print(f"错误：数据库不存在 {DB_PATH}")
        print(f"提示：请先运行 python3 unified_server.py 创建数据库")
        print(f"      或通过环境变量 LEARNING_SYSTEM_DB 指定数据库路径")
        sys.exit(1)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_invite_code(code=None, max_uses=0, days=365, remark=''):
    """创建邀请码"""
    conn = get_db()
    cursor = conn.cursor()

    # 如果没有指定 code，自动生成
    if not code:
        code = 'INV' + secrets.token_hex(4).upper()

    expires_at = datetime.now() + timedelta(days=days)

    try:
        cursor.execute('''
            INSERT INTO invite_codes (code, max_uses, current_uses, expires_at, remark)
            VALUES (?, ?, 0, ?, ?)
        ''', (code, max_uses, expires_at.strftime('%Y-%m-%d %H:%M:%S'), remark))
        conn.commit()

        print(f"\n✓ 邀请码创建成功")
        print(f"  代码：{code}")
        print(f"  最大使用次数：{'无限' if max_uses == 0 else max_uses}")
        print(f"  有效期：{days} 天")
        print(f"  过期时间：{expires_at.strftime('%Y-%m-%d')}")
        print(f"  备注：{remark or '无'}")
        print()
    except sqlite3.IntegrityError:
        print(f"错误：邀请码 '{code}' 已存在")
        sys.exit(1)
    finally:
        conn.close()

def list_invite_codes():
    """列出所有邀请码"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM invite_codes ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        print("暂无邀请码")
        return

    print(f"\n{'代码':<20} {'使用次数':<12} {'最大次数':<12} {'状态':<8} {'过期时间':<14} {'备注':<20}")
    print("-" * 90)

    now = datetime.now()
    for row in rows:
        expires = datetime.strptime(row['expires_at'], '%Y-%m-%d %H:%M:%S')
        is_expired = now > expires

        if row['is_active'] == 0:
            status = '已禁用'
        elif is_expired:
            status = '已过期'
        else:
            status = '有效'

        max_uses = '无限' if row['max_uses'] == 0 else str(row['max_uses'])
        uses = f"{row['current_uses']}/{max_uses}"

        print(f"{row['code']:<20} {uses:<12} {max_uses:<12} {status:<8} {row['expires_at'][:10]:<14} {row['remark'] or '':<20}")

    print(f"\n共 {len(rows)} 个邀请码")
    print()

def disable_invite_code(code):
    """禁用邀请码"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('UPDATE invite_codes SET is_active = 0 WHERE code = ?', (code,))
    conn.commit()

    if cursor.rowcount > 0:
        print(f"✓ 邀请码 '{code}' 已禁用")
    else:
        print(f"错误：未找到邀请码 '{code}'")

    conn.close()

def enable_invite_code(code):
    """启用邀请码"""
    conn = get_db()
    cursor = conn.cursor()

    # 先检查是否过期
    cursor.execute('SELECT expires_at FROM invite_codes WHERE code = ?', (code,))
    row = cursor.fetchone()

    if not row:
        print(f"错误：未找到邀请码 '{code}'")
        conn.close()
        return

    expires = datetime.strptime(row['expires_at'], '%Y-%m-%d %H:%M:%S')
    if datetime.now() > expires:
        print(f"警告：邀请码已过期 ({expires.strftime('%Y-%m-%d')})，确定要启用吗？")
        confirm = input("确认启用 (y/N): ")
        if confirm.lower() != 'y':
            conn.close()
            return

    cursor.execute('UPDATE invite_codes SET is_active = 1 WHERE code = ?', (code,))
    conn.commit()

    if cursor.rowcount > 0:
        print(f"✓ 邀请码 '{code}' 已启用")
    else:
        print(f"错误：未找到邀请码 '{code}'")

    conn.close()

def delete_invite_code(code):
    """删除邀请码"""
    conn = get_db()
    cursor = conn.cursor()

    # 先显示邀请码信息确认
    cursor.execute('SELECT * FROM invite_codes WHERE code = ?', (code,))
    row = cursor.fetchone()

    if not row:
        print(f"错误：未找到邀请码 '{code}'")
        conn.close()
        return

    print(f"即将删除邀请码:")
    print(f"  代码：{row['code']}")
    print(f"  使用次数：{row['current_uses']}/{row['max_uses'] if row['max_uses'] > 0 else '无限'}")
    print(f"  备注：{row['remark'] or '无'}")
    print()

    confirm = input("确定删除吗？(y/N): ")
    if confirm.lower() != 'y':
        print("已取消")
        conn.close()
        return

    cursor.execute('DELETE FROM invite_codes WHERE code = ?', (code,))
    conn.commit()

    print(f"✓ 邀请码 '{code}' 已删除")
    conn.close()

def print_help():
    """打印帮助信息"""
    print(__doc__)

def main():
    if len(sys.argv) < 2:
        print_help()
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == 'create':
        # 解析选项
        code = None
        max_uses = 0
        days = 365
        remark = ''

        i = 2
        while i < len(sys.argv):
            if sys.argv[i] == '--code' and i + 1 < len(sys.argv):
                code = sys.argv[i + 1]
                i += 2
            elif sys.argv[i] == '--max' and i + 1 < len(sys.argv):
                max_uses = int(sys.argv[i + 1])
                i += 2
            elif sys.argv[i] == '--days' and i + 1 < len(sys.argv):
                days = int(sys.argv[i + 1])
                i += 2
            elif sys.argv[i] == '--remark' and i + 1 < len(sys.argv):
                remark = sys.argv[i + 1]
                i += 2
            else:
                i += 1

        create_invite_code(code, max_uses, days, remark)

    elif command == 'list':
        list_invite_codes()

    elif command == 'disable':
        if len(sys.argv) < 3:
            print("错误：请指定邀请码")
            print("用法：python3 manage_invite_codes.py disable <代码>")
            sys.exit(1)
        disable_invite_code(sys.argv[2])

    elif command == 'enable':
        if len(sys.argv) < 3:
            print("错误：请指定邀请码")
            print("用法：python3 manage_invite_codes.py enable <代码>")
            sys.exit(1)
        enable_invite_code(sys.argv[2])

    elif command == 'delete':
        if len(sys.argv) < 3:
            print("错误：请指定邀请码")
            print("用法：python3 manage_invite_codes.py delete <代码>")
            sys.exit(1)
        delete_invite_code(sys.argv[2])

    elif command in ['help', '-h', '--help']:
        print_help()

    else:
        print(f"未知命令：{command}")
        print_help()
        sys.exit(1)

if __name__ == '__main__':
    main()
