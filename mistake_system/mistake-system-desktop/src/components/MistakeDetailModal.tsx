import React from 'react';
import {
  Modal,
  Image,
  Card,
  Row,
  Col,
  Tag,
  Space,
  Button,
  Divider,
  Typography,
  Alert,
  Statistic,
  Progress
} from 'antd';
import {
  CloseOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  BookOutlined,
  CalendarOutlined,
  StarOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface MistakeDetailModalProps {
  visible: boolean;
  onClose: () => void;
  darkMode: boolean;
  mistake: any;
}

const MistakeDetailModal: React.FC<MistakeDetailModalProps> = ({
  visible,
  onClose,
  darkMode,
  mistake
}) => {
  if (!mistake) return null;

  // 处理图片路径，确保是有效的 Data URL
  const getImageSrc = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    // 如果已经是 Data URL，直接返回
    if (path.startsWith('data:')) return path;
    // 如果是 URL 或相对路径，直接返回
    if (path.startsWith('http') || path.startsWith('/')) return path;
    // 否则假设是 base64 数据，添加头部
    return `data:image/jpeg;base64,${path}`;
  };

  const {
    subject,
    topic,
    question,
    answer,
    difficulty,
    created_at,
    review_count = 0,
    last_reviewed,
    images_path,
    analysis  // 添加AI分析字段
  } = mistake;

  const difficultyText = ['未设置', '简单', '较易', '中等', '较难', '困难'][difficulty] || '中等';
  const difficultyColor = difficulty <= 2 ? 'green' : difficulty <= 3 ? 'blue' : 'red';

  // 计算掌握程度（根据复习次数）
  const masteryPercentage = Math.min(100, review_count * 25); // 每次复习增加25%

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      closeIcon={<CloseOutlined />}
    >
      <div style={{ padding: '24px 0' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {subject} · {topic}
            </Title>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color={difficultyColor}>{difficultyText}</Tag>
              <Tag icon={<BookOutlined />} color="default">题号: {mistake.id}</Tag>
              <Tag icon={<CalendarOutlined />} color="default">录入: {new Date(created_at).toLocaleDateString()}</Tag>
            </div>
          </div>
          <Space>
            <Button icon={<EditOutlined />} type="primary" ghost>
              编辑
            </Button>
            <Button icon={<DeleteOutlined />} danger>
              删除
            </Button>
          </Space>
        </div>

        <Row gutter={24}>
          {/* 左侧：统计信息 */}
          <Col span={8}>
            <Card size="small" title="掌握情况">
              <Statistic
                title="复习次数"
                value={review_count}
                suffix="次"
                valueStyle={{ color: review_count > 0 ? '#52c41a' : '#ccc' }}
              />

              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>掌握程度</span>
                  <span>{masteryPercentage}%</span>
                </div>
                <Progress percent={masteryPercentage} strokeColor={masteryPercentage >= 75 ? '#52c41a' : masteryPercentage >= 50 ? '#faad14' : '#f5222d'} />
              </div>

              {last_reviewed && (
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">上次复习: {new Date(last_reviewed).toLocaleString()}</Text>
                </div>
              )}
            </Card>

            <Card size="small" title="标签" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Tag color="blue">{subject}</Tag>
                {topic && <Tag color="orange">{topic}</Tag>}
                <Tag color="green">{difficultyText}</Tag>
              </div>
            </Card>
          </Col>

          {/* 右侧：题目内容和说明 */}
          <Col span={16}>
            <Card size="small" title="题目详情">
              <Row gutter={16}>
                <Col span={24}>
                  <Title level={5} style={{ marginBottom: 12 }}>
                    <Space>
                      <EyeOutlined />
                      <span>题目内容</span>
                    </Space>
                  </Title>
                  <Paragraph style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {question || '暂无题目内容'}
                  </Paragraph>
                </Col>

                {images_path && (
                  <Col span={24}>
                    <div style={{ marginBottom: 16 }}>
                      <Title level={5} style={{ marginBottom: 12 }}>
                        <Space>
                          <PictureOutlined />
                          <span>题目图片</span>
                        </Space>
                      </Title>
                      <Image
                        src={getImageSrc(images_path)}
                        alt="题目图片"
                        style={{ width: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        preview
                      />
                    </div>
                  </Col>
                )}

                <Col span={24}>
                  <Title level={5} style={{ marginBottom: 12 }}>
                    <StarOutlined />
                    <span style={{ marginLeft: 8 }}>正确答案</span>
                  </Title>
                  <Paragraph style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', backgroundColor: '#f6ffed', padding: 12, borderRadius: 6, border: '1px solid #b7eb8f' }}>
                    {answer || '暂无正确答案'}
                  </Paragraph>
                </Col>

                {analysis && (
                  <Col span={24}>
                    <Title level={5} style={{ marginBottom: 12 }}>
                      <span>🤖 AI分析</span>
                    </Title>
                    <Paragraph style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', backgroundColor: '#f0f9ff', padding: 12, borderRadius: 6, border: '1px solid #91d5ff' }}>
                      {analysis}
                    </Paragraph>
                  </Col>
                )}
              </Row>
            </Card>

            <Card size="small" title="复习建议" style={{ marginTop: 16 }}>
              <Paragraph>
                {review_count === 0
                  ? '这是您第一次查看这道题，建议仔细分析解题思路。'
                  : review_count < 3
                    ? '您已复习几次，但仍需加强对此知识点的理解。'
                    : '您已多次复习此题，掌握情况良好。'}
              </Paragraph>
              <Paragraph>
                建议将此类题型加入日常练习中，确保熟练掌握。
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default MistakeDetailModal;