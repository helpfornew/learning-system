"""
临时路由桥接 - 导入原始UnifiedHandler并与新模块化handler集成

TODO: Phase 3中完全重写路由逻辑
"""

import sys
from pathlib import Path

# 导入原始unified_server的UnifiedHandler（暂时用于过渡）
sys.path.insert(0, str(Path(__file__).parent.parent))

# 导入所有模块化的handler
from server.handlers import account, youdao
# TODO: 导入其他handlers

# 暂时保留原始UnifiedHandler用于功能完整性
# 后续将逐步迁移到模块化handler

print("[Router] 路由系统已初始化")
