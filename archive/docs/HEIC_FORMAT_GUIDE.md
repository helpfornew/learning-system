# iPhone HEIC 格式问题说明

## 问题描述

iPhone 默认使用 **HEIC/HEIF** 格式存储照片，这种格式在部分浏览器和后端处理时可能出现问题。

### 症状

- 上传 iPhone 照片时提示格式错误
- 图片无法预览或处理
- 后端日志显示 `ConnectionResetError` 或格式不支持

## 解决方案

### 方案 1：更改 iPhone 相机格式（推荐）

**操作步骤：**

1. 打开 **设置** → **相机**
2. 点击 **格式**
3. 选择 **兼容性最佳**（使用 JPEG 格式）

![设置路径](https://support.apple.com/library/content/dam/edam/applecare/images/en_US/iOS/ios15-iphone13-pro-camera-formats.png)

**效果：**
- ✅ 新拍摄的照片将使用 JPEG 格式
- ✅ 兼容性更好，所有功能正常
- ⚠️ 照片文件会稍大一些

---

### 方案 2：安装 HEIC 支持库（服务器端）

如果需要在服务器端处理 HEIC 格式，安装以下库：

```bash
# 自动安装脚本
./install_heic_support.sh

# 或手动安装
pip3 install pillow-heif

# 系统依赖（Ubuntu/Debian）
sudo apt-get install libheif-examples libheif-dev
```

**安装后重启服务器：**
```bash
python3 unified_server.py
```

---

### 方案 3：截图代替拍照

iPhone **截图**（同时按电源键+音量上）自动使用 PNG 格式，不会有兼容性问题。

**操作步骤：**
1. 打开相机胶卷
2. 找到要上传的照片
3. 截图（电源键 + 音量上）
4. 上传截图

---

### 方案 4：使用移动端上传页面

访问专门的移动端上传页面，会自动检测和处理格式：

```
http://your-server-ip:8080/mobile/
```

**特点：**
- 自动检测 HEIC 格式
- 提供格式转换提示
- 优化的移动端界面

---

## 技术说明

### 支持的图片格式

| 格式 | 浏览器支持 | 后端支持 | 建议 |
|------|-----------|---------|------|
| JPEG | ✅ 完美 | ✅ 完美 | **推荐** |
| PNG | ✅ 完美 | ✅ 完美 | **推荐** |
| HEIC/HEIF | ⚠️ 部分 | ⚠️ 需安装库 | iPhone 默认，需转换 |
| WebP | ✅ 良好 | ✅ 良好 | 可用 |

### 有道 API 限制

- 最大图片大小：**1MB**
- 支持格式：**JPEG, PNG**（HEIC 需转换）
- 建议尺寸：**宽度不超过 1920px**

### 后端自动处理

后端已添加以下处理逻辑：

1. **格式检测**：自动检测 HEIC 格式
2. **格式转换**：安装 pillow-heif 后自动转换为 JPEG
3. **错误提示**：未安装库时提示用户手动处理
4. **降级策略**：格式不支持时自动启用手动框选

## 常见问题

### Q: 更改相机格式后，旧照片还是 HEIC 吗？

**A:** 是的，只有新拍摄的照片会使用 JPEG 格式。旧照片仍然是 HEIC，需要截图或转换。

### Q: 安装 pillow-heif 后还需要改相机格式吗？

**A:** 建议还是更改，因为：
- HEIC 处理需要额外计算资源
- JPEG 兼容性更好
- 文件大小更易于网络传输

### Q: 安卓手机有这个问题吗？

**A:** 大多数安卓手机默认使用 JPEG 格式，没有这个问题。部分新安卓机可能使用 HEIF，但较少见。

### Q: 如何批量转换已有的 HEIC 照片？

**A:** 可以使用以下方法：

1. **iPhone 快捷指令**：创建自动化批量转换
2. **电脑软件**：使用 iMazing、CopyTrans 等工具
3. **在线转换**：使用在线 HEIC 转 JPEG 工具

## 相关文件

- 安装脚本：`install_heic_support.sh`
- 移动端页面：`mobile_upload.html`
- 后端处理：`unified_server.py` (compress_image_for_youdao 函数)

## 参考链接

- [Apple 支持：在 iPhone 上使用 HEIF 或 HEVC 媒体](https://support.apple.com/zh-cn/HT207022)
- [Pillow-HEIF 文档](https://github.com/bigcat88/pillow_heif)
