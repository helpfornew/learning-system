import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Button,
  Space,
  Alert,
  Card,
  Tooltip,
  message,
  Radio,
  Typography
} from 'antd';
import {
  CloseOutlined,
  CheckOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ScissorOutlined,
  UndoOutlined,
  ReloadOutlined,
  DesktopOutlined,
  MobileOutlined
} from '@ant-design/icons';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const { Text } = Typography;

interface ImageCropModalProps {
  visible: boolean;
  onClose: () => void;
  onCrop: (croppedImage: string) => void;
  imageSrc: string;
  darkMode: boolean;
}

// 检测是否是移动设备
const isMobileDevice = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// 裁剪模式类型
type DragMode = 'crop' | 'move' | 'none';

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  visible,
  onClose,
  onCrop,
  imageSrc,
  darkMode
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragMode, setDragMode] = useState<DragMode>('crop');
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [cropData, setCropData] = useState<any>(null);

  // 初始化 Cropper
  useEffect(() => {
    if (visible && imageSrc && imageRef.current) {
      // 销毁之前的 cropper 实例
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }

      const img = imageRef.current;

      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setImageLoaded(true);

        // 等待 DOM 渲染完成后初始化 cropper
        setTimeout(() => {
          initCropper();
        }, 100);
      };

      img.src = imageSrc;
    }

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [visible, imageSrc]);

  // 初始化 Cropper 实例
  const initCropper = () => {
    if (!imageRef.current || !containerRef.current) return;

    // 销毁旧实例
    if (cropperRef.current) {
      cropperRef.current.destroy();
    }

    const cropper = new Cropper(imageRef.current, {
      aspectRatio: NaN, // 自由裁剪
      viewMode: 1, // 限制裁剪框不能超出图片
      dragMode: isMobileDevice ? 'move' : 'crop', // 移动端默认移动，电脑端默认裁剪
      autoCropArea: 0.8, // 自动裁剪区域占 80%
      restore: false,
      guides: true, // 显示裁剪框辅助线
      center: true, // 显示中心十字线
      cropBoxMovable: true, // 裁剪框可移动
      cropBoxResizable: true, // 裁剪框可调整大小
      toggleDragModeOnDblclick: false, // 禁用双击切换拖拽模式
      minCropBoxWidth: 50,
      minCropBoxHeight: 50,
      background: true, // 显示网格背景
      responsive: true,
      checkCrossOrigin: false,
      ready() {
        // 初始化完成后保存裁剪数据
        const data = cropper.getData();
        setCropData(data);
        setScale(data.scaleX || 1);
      },
      cropend() {
        // 裁剪结束时保存数据
        const data = cropper.getData();
        setCropData(data);
      }
    });

    cropperRef.current = cropper;
  };

  // 暗色模式样式覆盖
  useEffect(() => {
    if (!visible) return;

    // 添加暗色模式样式
    const styleId = 'cropper-dark-mode-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .cropper-container {
          background-color: ${darkMode ? '#1a1a1a' : '#e8e8e8'} !important;
        }
        .cropper-view-box {
          outline-color: ${darkMode ? '#40a9ff' : '#1890ff'} !important;
        }
        .cropper-line-point-n, .cropper-line-point-s,
        .cropper-line-point-e, .cropper-line-point-w {
          background-color: ${darkMode ? '#40a9ff' : '#1890ff'} !important;
        }
        .cropper-point {
          background-color: ${darkMode ? '#40a9ff' : '#1890ff'} !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      // 清理样式（可选，保持在文档中以便重用）
    };
  }, [visible, darkMode]);

  // 切换拖拽模式（电脑端右键功能）
  const handleToggleDragMode = () => {
    if (cropperRef.current) {
      const newMode: DragMode = dragMode === 'crop' ? 'move' : 'crop';
      cropperRef.current.setDragMode(newMode);
      setDragMode(newMode);
    }
  };

  // 缩放
  const handleZoomIn = () => {
    if (cropperRef.current) {
      cropperRef.current.zoom(0.1);
      updateScale();
    }
  };

  const handleZoomOut = () => {
    if (cropperRef.current) {
      cropperRef.current.zoom(-0.1);
      updateScale();
    }
  };

  const handleSliderChange = (value: number) => {
    if (cropperRef.current) {
      cropperRef.current.zoomTo(value);
      setScale(value);
    }
  };

  // 更新缩放比例
  const updateScale = () => {
    if (cropperRef.current) {
      const data = cropperRef.current.getData();
      if (data) {
        setScale(data.scaleX || 1);
      }
    }
  };

  // 旋转
  const handleRotateLeft = () => {
    if (cropperRef.current) {
      cropperRef.current.rotate(-90);
      setRotation(prev => (prev - 90) % 360);
    }
  };

  const handleRotateRight = () => {
    if (cropperRef.current) {
      cropperRef.current.rotate(90);
      setRotation(prev => (prev + 90) % 360);
    }
  };

  // 重置
  const handleResetCrop = () => {
    if (cropperRef.current) {
      cropperRef.current.reset();
      setRotation(0);
      setDragMode('crop');
      const data = cropperRef.current.getData();
      setCropData(data);
      setScale(1);
    }
  };

  // 执行裁剪
  const handleCrop = () => {
    if (!cropperRef.current) return;

    try {
      // 获取裁剪后的 canvas
      const canvas = cropperRef.current.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });

      if (!canvas) {
        message.error('裁剪失败，请重试');
        return;
      }

      // 转换为 base64
      const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
      onCrop(croppedImage);
      onClose();
      message.success('裁剪完成！');
    } catch (error) {
      console.error('裁剪失败:', error);
      message.error('裁剪失败，请重试');
    }
  };

  // 键盘快捷键
  useEffect(() => {
    if (!visible || isMobileDevice) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleCrop();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResetCrop();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleToggleDragMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  return (
    <Modal
      title={
        <Space>
          <ScissorOutlined />
          <span>错题图片框选</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={isMobileDevice ? '95vw' : 1000}
      style={isMobileDevice ? { top: 0, margin: 0 } : {}}
      footer={[
        <Button key="close" onClick={onClose} icon={<CloseOutlined />}>
          取消
        </Button>,
        <Button key="reset" onClick={handleResetCrop} icon={<UndoOutlined />}>
          重置
        </Button>,
        <Button
          key="crop"
          type="primary"
          onClick={handleCrop}
          icon={<CheckOutlined />}
        >
          确认裁剪
        </Button>
      ]}
      styles={{
        body: {
          backgroundColor: darkMode ? '#141414' : '#ffffff',
          padding: isMobileDevice ? '12px' : '16px'
        }
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Alert
          message={
            <Space>
              {isMobileDevice ? <MobileOutlined /> : <DesktopOutlined />}
              <span>
                {isMobileDevice
                  ? '双指缩放图片，单指拖动裁剪区域或图片'
                  : '左键拖动调整裁剪框，右键拖动移动图片，空格键切换模式'
                }
              </span>
            </Space>
          }
          type="info"
          showIcon
        />
      </div>

      <Card
        ref={containerRef}
        style={{
          marginBottom: 16,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: darkMode ? '#000' : '#f5f5f5'
        }}
      >
        <div style={{
          width: '100%',
          height: isMobileDevice ? 350 : 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: darkMode ? '#1a1a1a' : '#e8e8e8',
          position: 'relative'
        }}>
          <img
            ref={imageRef}
            src={imageSrc}
            alt="待裁剪图片"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block'
            }}
            crossOrigin="anonymous"
          />
        </div>
      </Card>

      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Tooltip title="放大">
              <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
            </Tooltip>
            <Tooltip title="缩小">
              <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
            </Tooltip>
            <div style={{ width: 120 }}>
              <Radio.Group
                value={scale}
                onChange={(e) => handleSliderChange(e.target.value)}
                size="small"
              >
                <Radio.Button value={0.5}>50%</Radio.Button>
                <Radio.Button value={1}>100%</Radio.Button>
                <Radio.Button value={1.5}>150%</Radio.Button>
                <Radio.Button value={2}>200%</Radio.Button>
              </Radio.Group>
            </div>
          </Space>

          <Space wrap>
            <Tooltip title="向左旋转">
              <Button icon={<RotateLeftOutlined />} onClick={handleRotateLeft} />
            </Tooltip>
            <Tooltip title="向右旋转">
              <Button icon={<RotateRightOutlined />} onClick={handleRotateRight} />
            </Tooltip>
            <Tooltip title="切换拖拽模式">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleToggleDragMode}
              >
                {dragMode === 'crop' ? '裁剪' : '移动'}
              </Button>
            </Tooltip>
          </Space>
        </Space>
      </Card>

      {/* 裁剪信息 */}
      {cropData && (
        <Card size="small" title="裁剪信息">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <div>
              <Text strong>原始尺寸:</Text>
              <div style={{ marginTop: 4, fontSize: 13 }}>
                {imageDimensions.width} × {imageDimensions.height}
              </div>
            </div>
            <div>
              <Text strong>裁剪尺寸:</Text>
              <div style={{ marginTop: 4, fontSize: 13 }}>
                {Math.round(cropData.width)} × {Math.round(cropData.height)}
              </div>
            </div>
            <div>
              <Text strong>裁剪位置:</Text>
              <div style={{ marginTop: 4, fontSize: 13 }}>
                X: {Math.round(cropData.x)}, Y: {Math.round(cropData.y)}
              </div>
            </div>
            <div>
              <Text strong>缩放比例:</Text>
              <div style={{ marginTop: 4, fontSize: 13 }}>
                {((cropData.scaleX || 1) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </Card>
      )}

      <Alert
        style={{ marginTop: 16 }}
        message="裁剪建议"
        description={
          <div style={{ fontSize: 13 }}>
            1. 确保框选完整的错题内容，包括题目和选项
            <br />
            2. 尽量排除无关的背景干扰
            <br />
            3. 保持图片清晰，避免过度缩放
            <br />
            4. 裁剪后系统将使用框选区域进行 AI 分析
            <br />
            5. {isMobileDevice ? '双指可缩放图片' : '按 Enter 键快速确认裁剪，空格键切换裁剪/移动模式'}
          </div>
        }
        type="warning"
        showIcon
      />
    </Modal>
  );
};

export default ImageCropModal;
