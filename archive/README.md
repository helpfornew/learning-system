# Archive 目录

此目录存放项目开发过程中的辅助文件、测试文件、文档和旧版本备份。

## 目录结构

- `scripts/` - 构建脚本、工具脚本和辅助脚本
  - 构建脚本: build_frontend.sh, start_dev.sh
  - 维护脚本: system_heal.sh, clean_qwen_api.py
  - 数据库脚本: create_unified_database.py, import_cards.py, update_ai_config.py
  - SSH工具: ssh_connect.py, upload_files.py 等

- `tests/` - 测试脚本和测试数据
  - test_ai_analysis.py - AI分析测试
  - test_ai_frontend.py - 前端AI测试
  - test_camera_upload.py - 相机上传测试

- `docs/` - 开发文档和指南
  - DEVELOPMENT_MODE.md - 开发模式说明
  - HEIC_FORMAT_GUIDE.md - HEIC格式指南
  - MOBILE_UPLOAD_GUIDE.md - 移动端上传指南
  - WORDCARD_INTEGRATION.md - 单词卡集成说明
  - 客户端安装与日志.md
  - 客户端打包配置指南.md
  - 请求要点.txt

- `backup/` - 旧版本备份
  - unified_server.py.backup - 原始备份
  - unified_server.py.pre-refactor - 重构前备份
  - unified_server_new.py/old.py - 新旧版本对比

- `deployl/` - 旧部署文件和配置
  - 各种部署脚本和配置文件

- 其他文件
  - 1.jpg - 测试图片
  - ai_analysis_result.txt - AI分析结果样本
  - mobile_upload.html - 移动端上传测试页面
  - server.log - 旧日志文件
