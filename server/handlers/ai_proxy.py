"""AI分析代理处理器 - 真正调用DeepSeek/Qwen API"""
import json
import requests
from datetime import datetime
from ..config import logger
from ..database import get_db


def get_user_ai_config(user_id, provider):
    """从数据库获取用户的AI配置"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('''SELECT api_key, endpoint, model, enabled, max_tokens, temperature
                     FROM user_ai_config
                     WHERE user_id = ? AND provider = ? AND enabled = 1''',
                  (user_id, provider))
        row = c.fetchone()
        conn.close()

        if row:
            return {
                'apiKey': row[0],
                'endpoint': row[1],
                'model': row[2],
                'enabled': bool(row[3]),
                'maxTokens': row[4] or 2000,
                'temperature': row[5] or 0.7
            }
        return None
    except Exception as e:
        logger.error(f'[AI] 获取用户配置失败: {e}')
        return None


def call_deepseek_api(config, messages):
    """调用 DeepSeek API"""
    api_key = config.get('apiKey')
    endpoint = config.get('endpoint', 'https://api.deepseek.com/chat/completions')
    model = config.get('model', 'deepseek-chat')
    max_tokens = config.get('maxTokens', 2000)
    temperature = config.get('temperature', 0.7)

    if not api_key:
        raise ValueError('DeepSeek API密钥未配置')

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }

    payload = {
        'model': model,
        'messages': messages,
        'max_tokens': max_tokens,
        'temperature': temperature,
        'stream': False
    }

    logger.info(f'[AI] 调用 DeepSeek API: {endpoint}, model: {model}')

    response = requests.post(
        endpoint,
        headers=headers,
        json=payload,
        timeout=120  # 2分钟超时
    )

    response.raise_for_status()
    return response.json()


def call_qwen_api(config, messages):
    """调用通义千问 API"""
    api_key = config.get('apiKey')
    endpoint = config.get('endpoint', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions')
    model = config.get('model', 'qwen-max')
    max_tokens = config.get('maxTokens', 2000)
    temperature = config.get('temperature', 0.7)

    if not api_key:
        raise ValueError('通义千问 API密钥未配置')

    # 检查密钥格式
    if not api_key.startswith('sk-'):
        logger.warning(f'[AI] 通义千问 API密钥格式可能不正确: {api_key[:10]}...')

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }

    payload = {
        'model': model,
        'messages': messages,
        'max_tokens': max_tokens,
        'temperature': temperature,
        'stream': False
    }

    logger.info(f'[AI] 调用 Qwen API: {endpoint}')
    logger.debug(f'[AI] API Key前缀: {api_key[:15]}...')
    logger.debug(f'[AI] Model: {model}')

    response = requests.post(
        endpoint,
        headers=headers,
        json=payload,
        timeout=120  # 2分钟超时
    )

    response.raise_for_status()
    return response.json()


def handle_ai_analysis_proxy(user_id, data):
    """处理AI分析请求代理"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    try:
        # 获取请求参数
        provider = data.get('provider', 'deepseek')
        messages = data.get('messages', [])
        prompt = data.get('prompt', '')

        # 如果没有messages但有prompt，构建简单消息
        if not messages and prompt:
            messages = [{'role': 'user', 'content': prompt}]

        if not messages:
            return 400, {'success': False, 'message': '缺少消息内容'}

        # 从数据库获取用户配置
        config = get_user_ai_config(user_id, provider)

        if not config:
            # 尝试从请求中获取配置（兼容旧方式）
            config = {
                'apiKey': data.get('apiKey'),
                'endpoint': data.get('apiEndpoint'),
                'model': data.get('model'),
                'maxTokens': data.get('maxTokens', 2000),
                'temperature': data.get('temperature', 0.7)
            }

        if not config.get('apiKey'):
            return 400, {
                'success': False,
                'message': f'{provider} API密钥未配置，请先在设置中配置API密钥'
            }

        # 根据提供商调用不同API
        if provider == 'deepseek':
            result = call_deepseek_api(config, messages)
        elif provider in ('qwen', 'qianwen'):
            result = call_qwen_api(config, messages)
        else:
            return 400, {'success': False, 'message': f'不支持的AI提供商: {provider}'}

        logger.info(f'[AI] 用户 {user_id} {provider} AI分析成功')

        return 200, {
            'success': True,
            'data': result
        }

    except requests.exceptions.Timeout:
        logger.error('[AI] API调用超时')
        return 504, {'success': False, 'message': 'AI API调用超时，请稍后重试'}
    except requests.exceptions.RequestException as e:
        logger.error(f'[AI] API请求失败: {e}')
        return 502, {'success': False, 'message': f'AI API请求失败: {str(e)}'}
    except Exception as e:
        logger.error(f'[AI] 分析失败: {e}')
        return 500, {'success': False, 'message': str(e)}
