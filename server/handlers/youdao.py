"""
有道智云题目识别API处理
"""

import base64
import json
import hmac
import hashlib
import urllib.request
import time
import requests
from datetime import datetime
from server.config import YOUDAO_APP_ID, YOUDAO_APP_SECRET, logger

def get_youdao_error_message(error_code):
    """获取有道 API 错误码对应的中文说明"""
    error_messages = {
        '0': '成功',
        '101': '参数错误（可能是图片格式/尺寸问题,或需要使用 input 参数）',
        '102': '词典不支持查询该词',
        '103': '语言不支持翻译',
        '104': '不支持的领域',
        '105': '不支持的语种',
        '106': '不支持的 API',
        '107': '图片大小超限（最大 10MB）',
        '108': '参数为空或非法',
        '109': '文件缺少语音',
        '110': '文件缺少视频',
        '111': '图片格式错误',
        '112': '语音时长超限',
        '113': '语音时长过短',
        '114': '视频时长超限',
        '115': '视频时长过短',
        '116': '图片像素过小或过大（要求 50-4096 像素）',
        '117': '请求超时',
        '118': '请求频率超限',
        '119': '并发超限',
        '201': '签名验证失败',
        '202': '解密失败',
        '203': '应用 ID 不存在',
        '204': '应用密钥不存在',
        '205': '账户不存在',
        '206': '时间戳无效（系统时间未同步）',
        '207': '超过套餐额度',
        '208': '服务已关闭',
        '209': '账户余额不足',
        '301': '服务器超时',
        '302': '服务器错误',
        '303': '网络错误',
        '304': '接口无权限',
        '305': '参数缺失',
        '306': '系统错误',
        '401': '欠费',
        '402': '余额不足',
        '403': '套餐包余量不足',
        '501': '文件下载失败',
        '502': '文件解码失败',
        '503': '文件识别失败',
        '15002': '图片过大（限制 1MB）',
        '17002': '图片过大（限制 1MB）',
        '12001': '图片尺寸过大',
        '12002': '图片 base64 解密失败',
        '12004': '图片为空',
        '12005': '不支持的识别图片类型',
    }
    return error_messages.get(error_code, f'未知错误码：{error_code}')




def process_image_for_youdao(image_base64):
    """处理图片用于有道API：HEIC转换、EXIF去除、格式标准化

    返回: (处理后的base64, 是否成功, 错误信息)
    """
    try:
        from PIL import Image, ExifTags
        import io
        import base64
        import imghdr

        # 解码 base64
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        image_bytes = base64.b64decode(image_base64)

        # 检测图片格式
        img_format = imghdr.what(None, image_bytes)
        print(f"[图片处理] 检测到图片格式: {img_format}")

        # 处理 HEIC 格式 (iPhone)
        if img_format == 'heic' or img_format is None:
            try:
                # 尝试使用 pillow-heif
                from pillow_heif import register_heif_opener
                register_heif_opener()
                print("[图片处理] HEIC 支持已加载")
            except ImportError:
                print("[图片处理] 警告: pillow-heif 未安装，HEIC 转换可能失败")
                print("[图片处理] 请运行: pip install pillow-heif")

        # 打开图片
        img = Image.open(io.BytesIO(image_bytes))

        # 去除 EXIF 信息并处理方向
        try:
            # 获取方向信息
            orientation = None
            if hasattr(img, '_getexif') and img._getexif():
                exif = img._getexif()
                if exif:
                    for tag_id, value in exif.items():
                        tag = ExifTags.TAGS.get(tag_id, tag_id)
                        if tag == 'Orientation':
                            orientation = value
                            break

            # 根据方向旋转图片
            if orientation:
                print(f"[图片处理] EXIF 方向: {orientation}")
                if orientation == 2:
                    img = img.transpose(Image.FLIP_LEFT_RIGHT)
                elif orientation == 3:
                    img = img.transpose(Image.ROTATE_180)
                elif orientation == 4:
                    img = img.transpose(Image.FLIP_TOP_BOTTOM)
                elif orientation == 5:
                    img = img.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.ROTATE_90)
                elif orientation == 6:
                    img = img.transpose(Image.ROTATE_270)
                elif orientation == 7:
                    img = img.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.ROTATE_270)
                elif orientation == 8:
                    img = img.transpose(Image.ROTATE_90)
        except Exception as e:
            print(f"[图片处理] EXIF 处理警告: {e}")

        # 转换为 RGB 模式（去除透明通道和调色板）
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
            print("[图片处理] 已转换为 RGB 模式")

        # 保存为 JPEG（去除所有 EXIF）
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=95, optimize=True)
        processed_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        print(f"[图片处理] 处理完成，原始大小: {len(image_bytes)/1024:.1f}KB，处理后: {len(buffer.getvalue())/1024:.1f}KB")
        return processed_base64, True, ""

    except ImportError as e:
        print(f"[图片处理] 缺少依赖: {e}")
        return image_base64, False, f"缺少图片处理库: {e}"
    except Exception as e:
        print(f"[图片处理] 处理失败: {e}")
        return image_base64, False, f"图片处理失败: {e}"




def compress_image_for_youdao(image_base64, max_size=800 * 1024):
    """压缩图片到指定大小以内（用于有道 API）

    有道 API 限制图片大小不超过 1MB,此函数将图片压缩到 800KB 以内。
    先调用 process_image_for_youdao 进行格式标准化。
    """
    try:
        from PIL import Image
        import io
        import base64

        # 先处理图片（HEIC转换、EXIF去除）
        processed_base64, success, error_msg = process_image_for_youdao(image_base64)
        if not success:
            print(f"[图片处理] 警告: {error_msg}，尝试直接压缩")

        # 使用处理后的图片
        image_base64 = processed_base64

        # 解码 Base64 图片
        image_bytes = base64.b64decode(image_base64)
        img = Image.open(io.BytesIO(image_bytes))

        # 转为 RGB 模式（处理 RGBA 图片）
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')

        original_size = len(image_bytes)

        # 方法 1：降低质量压缩
        quality = 85
        while quality >= 10:
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=quality, optimize=True)
            size = buffer.tell()
            if size <= max_size:
                print(f"[图片压缩] 质量={quality}, 大小={size/1024:.1f}KB (原始={original_size/1024:.1f}KB, 压缩比={size/original_size*100:.1f}%)")
                return base64.b64encode(buffer.getvalue()).decode('utf-8')
            quality -= 5

        # 方法 2：缩小尺寸 + 降低质量
        print("[图片压缩] 降低质量不够，开始缩小尺寸...")
        original_width, original_height = img.size  # 保存原始尺寸
        img = Image.open(io.BytesIO(image_bytes))  # 重新加载
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        
        # 尝试不同缩放比例
        for scale in [0.5, 0.4, 0.3, 0.25, 0.2, 0.15]:
            new_w = int(original_width * scale)
            new_h = int(original_height * scale)
            img_small = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            quality = 80
            while quality >= 30:
                buffer = io.BytesIO()
                img_small.save(buffer, format='JPEG', quality=quality, optimize=True)
                size = buffer.tell()
                if size <= max_size:
                    print(f"[图片压缩] 成功！尺寸={new_w}x{new_h}, 质量={quality}, 大小={size/1024:.1f}KB")
                    return base64.b64encode(buffer.getvalue()).decode('utf-8')
                quality -= 10

        # 无法压缩，返回最小尺寸图片（不是原始图片）
        print(f"[图片压缩] 警告：无法压缩到{max_size / 1024:.0f}KB 以内，返回最低质量图片")
        # 使用最低质量重新压缩
        quality = 5
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=quality, optimize=True)
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

    except ImportError:
        print("[图片压缩] 警告：Pillow 未安装,跳过压缩")
        return image_base64
    except Exception as e:
        print(f"[图片压缩] 警告：压缩失败 - {e}")
        return image_base64




def handle_youdao_segment_handler(handler, data):
    """有道智云题目智能切割 API 处理函数

    根据官方文档 (请求要点.txt):
    - q: Base64 编码的图片（必填）
    - imageType: 图片类型,1-单题,2-多题,3-整页（必填）
    - appKey: 应用 ID（必填）
    - salt: 随机 UUID（必填）
    - curtime: 当前时间戳（秒）（必填）
    - signType: 签名版本,固定为 'v3'（必填）
    - sign: SHA256(appKey + getInput(q) + salt + curtime + appSecret)（必填）
    - docType: 响应类型,固定为 'json'（必填）
    """
    try:
        import base64
        import hashlib
        import time
        import uuid

        image_data = data.get('image', '')

        print(f"[YoudaoAPI] 有道 API 收到请求,图片数据长度：{len(image_data) if image_data else 0}")

        if not image_data:
            handler.send_json({'success': False, 'message': '缺少图片数据'})
            return

        # 移除 base64 前缀
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]
            print(f"[YoudaoAPI] 移除 base64 前缀后数据长度：{len(image_data)}")

        # 确保 image_data 是 UTF-8 编码的字符串
        if isinstance(image_data, bytes):
            image_data = image_data.decode('utf-8')

        # 确保是标准 base64（移除可能的换行符）
        image_data = image_data.replace('\n', '').replace('\r', '').replace(' ', '')

        # 压缩图片（有道 API 限制图片大小不超过 1MB）
        print(f"[YoudaoAPI] 原始图片 Base64 长度：{len(image_data)} (约{len(image_data)*3/4/1024:.1f}KB)")
        image_data = compress_image_for_youdao(image_data, max_size=800 * 1024)
        print(f"[YoudaoAPI] 压缩后图片 Base64 长度：{len(image_data)} (约{len(image_data)*3/4/1024:.1f}KB)")

        # 如果有道 API 密钥未配置,返回空结果（前端将使用手动模式）
        if not YOUDAO_APP_SECRET:
            print("[YoudaoAPI] 有道 API 未配置,返回空切割结果")
            handler.send_json({
                'success': True,
                'segments': [],
                'message': '有道 API 未配置,请手动框选',
                'needManualCrop': True
            })
            return

        # 生成鉴权参数
        salt = str(uuid.uuid1())  # 随机 UUID
        cur_time = str(int(time.time()))  # 当前时间戳（秒）

        # 计算签名：sign = sha256(appKey + getInput(q) + salt + curtime + appSecret)
        # getInput 规则：长度<=20 返回原值,>20 返回 前 10 位 + 长度 + 后 10 位
        def get_input(s):
            if len(s) <= 20:
                return s
            return s[:10] + str(len(s)) + s[-10:]

        sign_str = YOUDAO_APP_ID + get_input(image_data) + salt + cur_time + YOUDAO_APP_SECRET
        sign = hashlib.sha256(sign_str.encode('utf-8')).hexdigest()

        # 构建请求参数
        params = {
            'q': image_data,         # Base64 编码的图片（必填）
            'imageType': '1',        # 固定为 1（切题服务仅支持此值）
            'docType': 'json',       # 返回格式（必填）
            'appKey': YOUDAO_APP_ID, # 应用 ID（必填）
            'salt': salt,            # 随机 UUID（必填）
            'curtime': cur_time,     # 当前时间戳,秒级（必填）
            'signType': 'v3',        # 签名版本,固定为 v3（必填）
            'sign': sign,            # SHA256 签名（必填）
        }

        print(f"[YoudaoAPI] 签名字符串构成：appKey={YOUDAO_APP_ID[:8]}... + getInput(q) + salt={salt[:8]}... + curtime={cur_time} + appSecret")
        print(f"[YoudaoAPI] getInput 输入长度={len(image_data)}, 输出长度={len(get_input(image_data))}")
        print(f"[YoudaoAPI] 计算得到的签名：{sign}")

        # 构建请求
        url = 'https://openapi.youdao.com/cut_question'
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}

        print(f"[YoudaoAPI] 发送请求到有道 API: {url}")
        response = requests.post(url, data=params, headers=headers, timeout=30)

        if response.status_code == 200:
            result = response.json()
            print(f"[YoudaoAPI] 有道 API 返回：errorCode={result.get('errorCode', '')}")
            error_code = result.get('errorCode', '')

            if error_code == '0':
                # 解析切割结果 - 有道 API 返回的是 Result (大写 R)
                result_data = result.get('Result') or result.get('result') or {}
                regions = result_data.get('regions', [])
                print(f"[YoudaoAPI] 识别到 {len(regions)} 个题目区域")
                segments = []

                for region in regions:
                    # boundingBox 格式：x1,y1,x2,y2,x3,y3,x4,y4（左上、右上、右下、左下）
                    bounding_box = region.get('boundingBox', '')
                    if bounding_box:
                        coords = list(map(int, bounding_box.split(',')))
                        if len(coords) >= 8:
                            # 计算边界框
                            x1, y1 = coords[0], coords[1]  # 左上
                            x2, y2 = coords[2], coords[3]  # 右上
                            x3, y3 = coords[4], coords[5]  # 右下
                            x4, y4 = coords[6], coords[7]  # 左下
                            # 计算宽度和高度（使用左上和右下坐标）
                            width = abs(x2 - x1)
                            height = abs(y3 - y1)
                            segments.append({
                                'x': min(x1, x4),
                                'y': min(y1, y2),
                                'width': width,
                                'height': height,
                                'questionText': ''
                            })

                handler.send_json({
                    'success': True,
                    'segments': segments,
                    'message': f'识别到 {len(segments)} 道题目'
                })
            else:
                error_msg = get_youdao_error_message(error_code)
                print(f"[ERROR] 有道 API 错误码 {error_code}: {error_msg}")

                # 图片过大,自动重试压缩
                if error_code == '15002':
                    print("[YoudaoAPI] 图片过大,尝试重新压缩...")
                    # 已经在上面压缩过了,这里直接返回手动模式
                    handler.send_json({
                        'success': True,
                        'segments': [],
                        'message': f'图片过大,请尝试裁剪后重新上传或使用手动框选功能',
                        'needManualCrop': True
                    })
                # 时间戳无效,可能是系统时间未同步
                elif error_code == '206':
                    print("[YoudaoAPI] 时间戳无效,请检查系统时间是否同步")
                    handler.send_json({
                        'success': False,
                        'message': '时间戳验证失败,请联系管理员同步服务器时间',
                        'segments': []
                    })
                # 签名验证失败
                elif error_code == '202':
                    print("[YoudaoAPI] 签名验证失败,检查 API 密钥配置")
                    handler.send_json({
                        'success': False,
                        'message': '签名验证失败,请检查有道 API 密钥配置',
                        'segments': []
                    })
                # 其他参数错误,返回手动模式
                elif error_code in ['101', '201', '203', '204', '205', '12001', '12002', '12004', '12005']:
                    handler.send_json({
                        'success': True,
                        'segments': [],
                        'message': f'智能识别失败：{error_msg},请使用手动框选功能',
                        'needManualCrop': True
                    })
                # 其他错误
                else:
                    handler.send_json({
                        'success': False,
                        'message': f'有道 API 错误：{error_msg}',
                        'segments': []
                    })
        else:
            print(f"[ERROR] 有道 API 请求失败：{response.status_code}")
            print(f"[ERROR] 响应内容：{response.text[:500] if response.text else '无'}")
            handler.send_json({
                'success': False,
                'message': f'有道 API 请求失败：{response.status_code}',
                'segments': []
            })

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] 有道 API 网络请求错误：{str(e)}")
        handler.send_json({
            'success': False,
            'message': '有道 API 网络请求错误：' + str(e),
            'segments': []
        })
    except Exception as e:
        print(f"[ERROR] 有道 API 处理错误：{str(e)}")
        import traceback
        traceback.print_exc()
        handler.send_json({
            'success': False,
            'message': '有道 API 处理错误：' + str(e),
            'segments': []
        })


# ============ HTTP 请求处理 ============

