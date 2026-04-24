import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  Select,
  Button,
  message,
  Image,
  Space,
  Divider,
  Alert,
  Spin,
  Tag
} from 'antd';
import {
  UploadOutlined,
  CheckCircleOutlined,
  UndoOutlined,
  CameraOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { addMistake } from '../services/dataService';
import { smartSegmentQuestion, QuestionSegment } from '../services/youdaoApiService';

const { Option } = Select;

interface QuickInputModalProps {
  visible: boolean;
  onClose: () => void;
  darkMode: boolean;
}

// 单张图片的处理状态
interface ImageUploadItem {
  uid: string;
  file: File;
  base64: string;
  width: number;
  height: number;
  segments: QuestionSegment[];
  selectedSegments: number[];
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

// 手动框选区域
interface ManualSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

const QuickInputModal: React.FC<QuickInputModalProps> = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);

  // 批量图片上传状态
  const [imageItems, setImageItems] = useState<ImageUploadItem[]>([]);
  const [segmentLoading, setSegmentLoading] = useState(false);

  // 手动框选相关状态
  const [manualCropVisible, setManualCropVisible] = useState(false);
  const [manualCropImage, setManualCropImage] = useState<string>('');
  const [manualCropFile, setManualCropFile] = useState<File | null>(null);
  const [manualSelection, setManualSelection] = useState<ManualSelection | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{x: number, y: number} | null>(null);
  const manualImageRef = useRef<HTMLImageElement>(null);
  const manualContainerRef = useRef<HTMLDivElement>(null);

  // 摄像头相关状态
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  // 生成唯一 UID
  const generateUid = () => `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 检测是否是移动设备
  const isMobile = typeof window !== 'undefined' && (
    window.innerWidth < 768 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
  const modalWidth = isMobile ? '95vw' : 900;

  // 科目选择状态
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // 重置表单 - 使用 useCallback 避免依赖项问题
  const resetForm = useCallback(() => {
    setImageItems([]);
    setSelectedSubject(null);
    setManualCropVisible(false);
    setManualCropImage('');
    setManualCropFile(null);
    setManualSelection(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // 获取所有选中的题目总数
  const getTotalSelectedCount = () => {
    return imageItems.reduce((sum, item) => sum + item.selectedSegments.length, 0);
  };

  const totalSelected = getTotalSelectedCount();

  // 摄像头激活时确保视频播放
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      console.log('[Camera] useEffect: 确保视频播放');
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.error('[Camera] useEffect 播放失败:', e));
    }
  }, [cameraActive]);

  // 快捷键支持
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否在输入框中，如果是则不处理快捷键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // 科目快捷键：1-6 切换科目
      if (key >= '1' && key <= '6' && !ctrlOrCmd) {
        e.preventDefault();
        const subjectMap: Record<string, string> = {
          '1': '语文', '2': '数学', '3': '英语',
          '4': '物理', '5': '化学', '6': '政治'
        };
        setSelectedSubject(subjectMap[key]);
        message.info(`✓ 已选择 ${subjectMap[key]}`);
        return;
      }

      // 批量上传：Ctrl+U / Cmd+U
      if (key === 'u' && ctrlOrCmd) {
        e.preventDefault();
        if (selectedSubject && batchFileInputRef.current) {
          batchFileInputRef.current.click();
        }
        return;
      }

      // 撤销：Ctrl+Z / Cmd+Z
      if (key === 'z' && ctrlOrCmd) {
        e.preventDefault();
        resetForm();
        return;
      }

      // 保存：Ctrl+Enter / Cmd+Enter 或 Ctrl+S / Cmd+S
      if ((key === 'enter' && ctrlOrCmd) || (key === 's' && ctrlOrCmd)) {
        e.preventDefault();
        if (totalSelected > 0 && !loading) {
          handleConfirmAndSave();
        }
        return;
      }

      // 退出：Escape
      if (key === 'escape') {
        e.preventDefault();
        resetForm();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, selectedSubject, totalSelected, loading, onClose, resetForm]);

        // 从图片中裁剪指定区域
  const cropSegmentFromImage = (
    imageSrc: string,
    segment: { x: number; y: number; width: number; height: number }
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取 canvas 上下文'));
          return;
        }
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = segment.width;
        let height = segment.height;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, segment.x, segment.y, segment.width, segment.height, 0, 0, width, height);
        // 输出为 JPEG 格式，返回纯 base64 数据（移除头部）
        const base64WithHeader = canvas.toDataURL('image/jpeg', 0.85);
        const pureBase64 = base64WithHeader.split(',')[1];
        resolve(pureBase64);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      // 确保 imageSrc 有头部用于加载
      img.src = imageSrc.startsWith('data:') ? imageSrc : `data:image/jpeg;base64,${imageSrc}`;
    });
  };

  // 处理单张图片
  const processSingleImage = async (file: File) => {
    const uid = generateUid();
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageBase64WithHeader = e.target?.result as string;
      // 移除 base64 头部，只保留纯 base64 数据
      const imageBase64 = imageBase64WithHeader.split(',')[1] || imageBase64WithHeader;
      const img = document.createElement('img');
      img.onload = async () => {
        const newItem: ImageUploadItem = {
          uid,
          file,
          base64: imageBase64,  // 存储纯 base64 数据
          width: img.width,
          height: img.height,
          segments: [],
          selectedSegments: [],
          status: 'processing'
        };
        setImageItems(prev => [...prev, newItem]);
        await handleSmartSegment(uid, imageBase64);
      };
      img.src = imageBase64WithHeader;  // 预览需要完整头部
    };
    reader.readAsDataURL(file);
  };

  // 批量处理图片
  const handleBatchUpload = async (files: File[]) => {
    if (!selectedSubject) {
      message.warning('请先选择科目');
      return;
    }
    if (files.length === 0) return;

    setSegmentLoading(true);
    message.info(`开始处理 ${files.length} 张图片...`);

    for (const file of files) {
      await processSingleImage(file);
    }

    setSegmentLoading(false);
    message.success(`已添加 ${files.length} 张图片`);
  };

  // 智能切分题目
  const handleSmartSegment = async (uid: string, imageBase64: string) => {
    try {
      const result = await smartSegmentQuestion(imageBase64);

      // 请求成功且有识别结果
      if (result.success && result.segments.length > 0) {
        setImageItems(prev => prev.map(item =>
          item.uid === uid
            ? { ...item, segments: result.segments, status: 'done' as const }
            : item
        ));
        message.success(`识别到 ${result.segments.length} 道题目`);
        return;
      }

      // 请求成功但无结果（需要手动裁剪）
      if (result.success && result.segments.length === 0) {
        // HEIC 格式特殊提示
        if (result.errorType === 'HEIC_FORMAT') {
          message.warning({
            content: 'iPhone HEIC 格式需要转换，请使用手动框选',
            duration: 5,
          });
        } else {
          message.info(result.message || '未识别到题目区域，请使用手动框选');
        }

        setImageItems(prev => prev.map(item =>
          item.uid === uid
            ? { ...item, status: 'done' as const, errorMessage: result.message || '未识别到题目，请手动框选' }
            : item
        ));
        return;
      }

      // 请求失败（API 错误、服务器错误等）
      if (!result.success) {
        console.error('[QuickInput] 识别失败:', result.errorDetail);

        // 根据错误类型显示不同提示
        if (result.errorType === 'NETWORK_ERROR') {
          message.error('网络连接失败，请检查网络后重试');
        } else if (result.errorType === 'SERVER_ERROR') {
          message.warning('识别服务暂时不可用，请使用手动框选');
        } else {
          message.warning(result.message || '识别失败，请使用手动框选');
        }

        setImageItems(prev => prev.map(item =>
          item.uid === uid
            ? { ...item, status: 'error' as const, errorMessage: result.message || '识别失败' }
            : item
        ));
      }
    } catch (error: any) {
      console.error('[QuickInput] 智能切分异常:', error);
      setImageItems(prev => prev.map(item =>
        item.uid === uid
          ? { ...item, status: 'error' as const, errorMessage: '识别过程异常' }
          : item
      ));
      message.error('识别过程发生错误，请使用手动框选');
    }
  };

  // 处理图片上传（智能模式）
  const processImageFileSmart = (file: File) => {
    processSingleImage(file);
  };

  // 打开手动框选弹窗
  const openManualCrop = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageBase64 = e.target?.result as string;
      setManualCropImage(imageBase64);
      setManualCropFile(file);
      setManualSelection(null);
      setManualCropVisible(true);
    };
    reader.readAsDataURL(file);
  };

  // 从已上传的图片项打开手动框选
  const openManualCropFromItem = (item: ImageUploadItem) => {
    // 将纯 base64 转换为 data URL
    const imageBase64 = `data:image/jpeg;base64,${item.base64}`;
    setManualCropImage(imageBase64);
    // 从 base64 创建 File 对象
    const byteString = atob(item.base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'image/jpeg' });
    const file = new File([blob], `photo_${item.uid}.jpg`, { type: 'image/jpeg' });
    setManualCropFile(file);
    setManualSelection(null);
    setManualCropVisible(true);
  };

  // 处理手动框选的鼠标事件
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!manualContainerRef.current) return;
    const rect = manualContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setDrawStart({ x, y });
    setManualSelection({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !manualContainerRef.current) return;
    const rect = manualContainerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const width = Math.abs(currentX - drawStart.x);
    const height = Math.abs(currentY - drawStart.y);

    setManualSelection({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // 确认手动框选并保存
  const confirmManualCrop = async () => {
    if (!manualSelection || !manualCropFile || !selectedSubject) {
      message.warning('请先框选题目区域');
      return;
    }
    if (!manualImageRef.current) return;

    const img = manualImageRef.current;
    const imgRect = img.getBoundingClientRect();
    const containerRect = manualContainerRef.current?.getBoundingClientRect();

    if (!containerRect) return;

    // 计算图片实际尺寸与显示尺寸的比例
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;

    // 将框选区域转换为图片实际像素坐标
    const actualSelection = {
      x: Math.round(manualSelection.x * scaleX),
      y: Math.round(manualSelection.y * scaleY),
      width: Math.round(manualSelection.width * scaleX),
      height: Math.round(manualSelection.height * scaleY)
    };

    // 确保不超出图片边界
    actualSelection.x = Math.max(0, Math.min(actualSelection.x, img.naturalWidth));
    actualSelection.y = Math.max(0, Math.min(actualSelection.y, img.naturalHeight));
    actualSelection.width = Math.min(actualSelection.width, img.naturalWidth - actualSelection.x);
    actualSelection.height = Math.min(actualSelection.height, img.naturalHeight - actualSelection.y);

    if (actualSelection.width < 50 || actualSelection.height < 50) {
      message.warning('框选区域太小，请重新选择');
      return;
    }

    setLoading(true);
    try {
      // 读取文件并转换为 base64
      const imageBase64WithHeader = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('读取图片失败'));
        reader.readAsDataURL(manualCropFile);
      });

      const imageBase64 = imageBase64WithHeader.split(',')[1] || imageBase64WithHeader;

      const croppedImage = await cropSegmentFromImage(imageBase64, actualSelection);
      const subjectId = ['数学', '物理', '化学', '英语', '语文', '政治'].indexOf(selectedSubject) + 1;

      await addMistake({
        subject_id: subjectId,
        content: '',
        wrong_answer: '',
        correct_answer: '',
        error_reason: '',
        difficulty: 2,
        images_path: croppedImage,
        tags: [],
        created_at: new Date().toISOString()
      });

      message.success('错题保存成功');
      setManualCropVisible(false);
      setManualCropImage('');
      setManualCropFile(null);
      setManualSelection(null);
      onClose();
    } catch (error: any) {
      console.error('[ManualCrop] 保存失败:', error);
      message.error('保存失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 选择/取消选择题目区域
  const toggleSelectSegment = (uid: string, index: number) => {
    setImageItems(prev => prev.map(item => {
      if (item.uid !== uid) return item;
      const newSelected = item.selectedSegments.includes(index)
        ? item.selectedSegments.filter(i => i !== index)
        : [...item.selectedSegments, index];
      return { ...item, selectedSegments: newSelected };
    }));
  };

  // 确认并保存选中的题目
  const handleConfirmAndSave = async () => {
    if (totalSelected === 0 || !selectedSubject) {
      message.warning('请先选择科目和题目');
      return;
    }

    setLoading(true);
    try {
      const subjectId = ['数学', '物理', '化学', '英语', '语文', '政治'].indexOf(selectedSubject) + 1;
      let savedCount = 0;

      for (const item of imageItems) {
        if (item.selectedSegments.length === 0) continue;

        for (const index of item.selectedSegments) {
          const segment = item.segments[index];
          const croppedImage = await cropSegmentFromImage(item.base64, segment);

          await addMistake({
            subject_id: subjectId,
            content: '',
            wrong_answer: '',
            correct_answer: '',
            error_reason: '',
            difficulty: 2,
            images_path: croppedImage,
            tags: [],
            created_at: new Date().toISOString()
          });
          savedCount++;
        }
      }

      message.success(`成功保存 ${savedCount} 道错题`);
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('[QuickInput] 保存失败:', error);
      message.error('保存失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 删除单张图片
  const handleRemoveImage = (uid: string) => {
    setImageItems(prev => prev.filter(item => item.uid !== uid));
  };

  // 启动摄像头
  const startCamera = async () => {
    // 检查是否支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      message.error('当前环境不支持摄像头，请使用图片上传功能');
      console.log('[Camera] 不支持的原因：可能需要 HTTPS 环境');
      return;
    }

    // Electron 环境下先请求权限
    if (window.electronAPI?.requestCameraPermission) {
      console.log('[Camera] Electron 环境，请求系统权限...');
      const permission = await window.electronAPI.requestCameraPermission();
      console.log('[Camera] 权限结果:', permission);
      if (!permission.success) {
        message.warning('请在系统设置中允许应用访问摄像头');
      }
    }

    try {
      // 先尝试不带 facingMode 约束（兼容性更好）
      let constraints: MediaStreamConstraints = {
        video: true,
        audio: false
      };

      // 只在移动设备上尝试使用后置摄像头
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        constraints = {
          video: {
            facingMode: { ideal: 'environment' }  // 使用 ideal 而不是强制
          },
          audio: false
        };
      }

      console.log('[Camera] 请求摄像头，约束:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const videoTracks = stream.getVideoTracks();
      console.log('[Camera] 获取到视频轨道:', videoTracks.length);

      // 确保视频轨道启用
      videoTracks.forEach((track, index) => {
        console.log(`[Camera] 视频轨道 ${index}:`, track.label, 'enabled:', track.enabled);
        track.enabled = true;
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('[Camera] srcObject 已设置');

        // 等待视频准备好后再播放
        videoRef.current.onloadedmetadata = () => {
          console.log('[Camera] onloadedmetadata 触发');
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => console.log('[Camera] 视频播放成功'))
              .catch(e => console.error('[Camera] 视频播放失败:', e));
          }
        };
      }

      setCameraActive(true);
    } catch (error: any) {
      console.error('[Camera] 启动失败:', error);
      let errorMsg = '无法启动摄像头';
      if (error.name === 'NotAllowedError') {
        errorMsg = '摄像头权限被拒绝，请在浏览器地址栏点击相机图标允许访问';
      } else if (error.name === 'NotFoundError') {
        errorMsg = '未找到摄像头设备';
      } else if (error.name === 'NotReadableError') {
        errorMsg = '摄像头正在被其他程序使用';
      } else if (error.name === 'OverconstrainedError') {
        errorMsg = '摄像头不支持 requested 的设置（尝试使用前置摄像头）';
      } else if (error.message?.includes('HTTPS')) {
        errorMsg = '需要使用 HTTPS 或 localhost 才能使用摄像头';
      }
      message.error(errorMsg + '，请使用图片上传功能');
    }
  };

  // 关闭摄像头
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // 拍照
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        // 输出为 JPEG 格式，质量 0.85
        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        stopCamera();
        // 创建 File 对象
        const blob = dataURLToBlob(imageData);
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        processSingleImage(file);
      }
    }
  };

  // dataURL 转 Blob
  const dataURLToBlob = (dataURL: string): Blob => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  return (
    <Modal
      title="快速录入错题（支持批量上传）"
      open={visible}
      onCancel={() => { resetForm(); onClose(); }}
      width={modalWidth}
      style={isMobile ? { top: 0 } : {}}
      footer={null}
    >
      {/* 步骤 1: 选择科目 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          1. 选择科目（所有图片共用）
        </label>
        <Select
          value={selectedSubject || undefined}
          onChange={setSelectedSubject}
          placeholder="请先选择科目"
          size="large"
          style={{ width: '100%' }}
          disabled={imageItems.length > 0}
        >
          <Option value="数学">数学</Option>
          <Option value="物理">物理</Option>
          <Option value="化学">化学</Option>
          <Option value="英语">英语</Option>
          <Option value="语文">语文</Option>
          <Option value="政治">政治</Option>
        </Select>
        {imageItems.length > 0 && (
          <Alert
            message={`当前科目：${selectedSubject}`}
            description="如需更改科目，请先删除所有图片"
            type="info"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* 步骤 2: 上传图片 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          2. 拍照/上传图片
        </label>
        {!selectedSubject ? (
          <Alert
            message="请先选择科目"
            description="选择科目后才能上传图片"
            type="info"
            showIcon
          />
        ) : (
          <div>
            <Space wrap style={{ width: '100%', marginBottom: 12 }}>
              {/* 单张上传（手动框选） */}
              <Button
                icon={<PictureOutlined />}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) openManualCrop(file);
                  };
                  input.click();
                }}
                disabled={!selectedSubject}
                size="large"
              >
                单张上传（手动框选）
              </Button>

              {/* 批量上传（自动识别） */}
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => batchFileInputRef.current?.click()}
                disabled={!selectedSubject}
                size="large"
              >
                批量上传（自动识别）
              </Button>
              <input
                ref={batchFileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) handleBatchUpload(files);
                }}
              />

              {/* 摄像头 */}
              <Button
                icon={<CameraOutlined />}
                onClick={cameraActive ? stopCamera : startCamera}
                type={cameraActive ? 'primary' : 'default'}
                size="large"
                disabled={imageItems.length > 0}
              >
                {cameraActive ? '关闭摄像头' : '打开摄像头'}
              </Button>
            </Space>

            {/* 摄像头预览和拍照 */}
            {cameraActive && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  style={{
                    width: '100%',
                    maxHeight: 400,
                    backgroundColor: '#000',
                    borderRadius: '4px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                <Space style={{ marginTop: 12, justifyContent: 'center' }}>
                  <Button type="primary" size="large" onClick={takePhoto}>
                    拍照
                  </Button>
                  <Button size="large" onClick={stopCamera}>
                    取消
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 步骤 3: 选择题目区域 - 遍历所有图片 */}
      {imageItems.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <label style={{ display: 'block', marginBottom: 0, fontWeight: 500 }}>
              3. 为每张图片选择题目（已选 {totalSelected} 道）
            </label>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleConfirmAndSave}
              disabled={totalSelected === 0}
              loading={loading}
              size="large"
            >
              {loading ? '保存中...' : `保存 (${totalSelected}道)`}
            </Button>
          </div>

          {imageItems.map((item, imgIndex) => (
            <div key={item.uid} style={{
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: imgIndex < imageItems.length - 1 ? '1px solid #f0f0f0' : 'none'
            }}>
              {/* 图片标题和操作栏 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <span style={{ fontWeight: 500 }}>
                  图片 {imgIndex + 1}
                  {item.status === 'processing' && <Spin size="small" style={{ marginLeft: 8 }} />}
                  {item.status === 'done' && item.segments.length > 0 && (
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      已识别 {item.segments.length} 题
                    </Tag>
                  )}
                  {item.status === 'error' && (
                    <Tag color="red" style={{ marginLeft: 8 }}>识别失败</Tag>
                  )}
                  {item.status === 'done' && item.segments.length === 0 && (
                    <Tag color="orange" style={{ marginLeft: 8 }}>未识别到题目</Tag>
                  )}
                </span>
                <Space>
                  <span style={{ color: '#666', fontSize: 12 }}>
                    已选 {item.selectedSegments.length} 题
                  </span>
                  <Button
                    size="small"
                    danger
                    onClick={() => handleRemoveImage(item.uid)}
                    disabled={loading}
                  >
                    删除
                  </Button>
                </Space>
              </div>

              {/* 图片展示和选择区域 */}
              {item.status === 'processing' ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Spin tip="正在识别..." />
                </div>
              ) : (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  {/* 始终显示图片 */}
                  <Image
                    src={`data:image/jpeg;base64,${item.base64}`}
                    alt={`题目图片 ${imgIndex + 1}`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    preview={false}
                  />

                  {/* 无识别结果时显示提示和手动框选按钮 */}
                  {item.segments.length === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      zIndex: 10
                    }}>
                      <Alert
                        message={item.errorMessage || "未识别到题目区域"}
                        type={item.status === 'error' ? 'error' : 'warning'}
                        showIcon
                        style={{ marginBottom: 16, maxWidth: '80%' }}
                      />
                      <Button
                        type="primary"
                        onClick={() => openManualCropFromItem(item)}
                      >
                        手动框选题目
                      </Button>
                    </div>
                  )}

                  {/* 有识别结果时显示可选区域 */}
                  {item.segments.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none'
                    }}>
                      {item.segments.map((segment, segIndex) => {
                        const leftPercent = (segment.x / item.width) * 100;
                        const topPercent = (segment.y / item.height) * 100;
                        const widthPercent = (segment.width / item.width) * 100;
                        const heightPercent = (segment.height / item.height) * 100;
                        const isSelected = item.selectedSegments.includes(segIndex);

                        return (
                          <div
                            key={segIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectSegment(item.uid, segIndex);
                            }}
                            style={{
                              position: 'absolute',
                              left: `${leftPercent}%`,
                              top: `${topPercent}%`,
                              width: `${widthPercent}%`,
                              height: `${heightPercent}%`,
                              border: isSelected ? '3px solid #52c41a' : '3px solid #1890ff',
                              backgroundColor: isSelected ? 'rgba(82, 196, 26, 0.2)' : 'rgba(24, 144, 255, 0.2)',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              transition: 'all 0.2s ease',
                              zIndex: isSelected ? 10 : 5
                            }}
                            title={`题目 ${segIndex + 1}`}
                          >
                            <div style={{
                              position: 'absolute',
                              top: -10,
                              left: -10,
                              background: isSelected ? '#52c41a' : '#1890ff',
                              color: 'white',
                              borderRadius: '50%',
                              width: 28,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                              {segIndex + 1}
                            </div>
                            {isSelected && (
                              <div style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                background: '#52c41a',
                                color: 'white',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 14,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                              }}>
                                ✓
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {item.segments.length > 0 && (
                <Alert
                  message="点击题目区域即可选择/取消选择"
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 操作按钮 */}
      <Divider />
      <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button onClick={() => { resetForm(); onClose(); }}>
          取消
        </Button>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleConfirmAndSave}
          disabled={totalSelected === 0}
          loading={loading}
        >
          {loading ? '保存中...' : `保存 (${totalSelected}道)`}
        </Button>
      </Space>

      {/* 隐藏的 canvas 用于拍照 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* 手动框选弹窗 */}
      <Modal
        title="手动框选题目区域"
        open={manualCropVisible}
        onCancel={() => {
          setManualCropVisible(false);
          setManualCropImage('');
          setManualCropFile(null);
          setManualSelection(null);
        }}
        width={900}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setManualCropVisible(false);
              setManualCropImage('');
              setManualCropFile(null);
              setManualSelection(null);
            }}
          >
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={loading}
            disabled={!manualSelection || manualSelection.width < 50 || manualSelection.height < 50}
            onClick={confirmManualCrop}
          >
            确认保存
          </Button>
        ]}
      >
        <Alert
          message="操作说明"
          description="在图片上按住鼠标左键拖拽，框选题目区域。框选完成后点击确认保存。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div
          ref={manualContainerRef}
          style={{
            position: 'relative',
            display: 'inline-block',
            maxWidth: '100%',
            cursor: 'crosshair',
            userSelect: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={manualImageRef}
            src={manualCropImage}
            alt="待裁剪图片"
            style={{
              maxWidth: '100%',
              maxHeight: '60vh',
              display: 'block'
            }}
            draggable={false}
          />
          {manualSelection && manualSelection.width > 0 && manualSelection.height > 0 && (
            <div
              style={{
                position: 'absolute',
                left: manualSelection.x,
                top: manualSelection.y,
                width: manualSelection.width,
                height: manualSelection.height,
                border: '3px dashed #1890ff',
                backgroundColor: 'rgba(24, 144, 255, 0.1)',
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -25,
                  left: 0,
                  background: '#1890ff',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
              >
                {Math.round(manualSelection.width)} x {Math.round(manualSelection.height)}
              </div>
            </div>
          )}
        </div>
        {manualSelection && manualSelection.width > 0 && manualSelection.height > 0 && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Tag color="blue">
              已框选区域: {Math.round(manualSelection.width)} x {Math.round(manualSelection.height)} 像素
            </Tag>
          </div>
        )}
      </Modal>
    </Modal>
  );
};

export default QuickInputModal;