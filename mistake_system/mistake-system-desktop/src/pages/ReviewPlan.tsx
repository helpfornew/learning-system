import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Progress,
  Timeline,
  List,
  Tag,
  Badge,
  Calendar,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Alert
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { refreshMistakes } from '../services/dataService';
import dayjs from 'dayjs';

const { Option } = Select;

const ReviewPlan: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [todayReviews, setTodayReviews] = useState<any[]>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<any[]>([]);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      console.log('[ReviewPlan] 从 API 刷新错题数据');
      const mistakes = await refreshMistakes();
      console.log('[ReviewPlan] 获取到错题数:', mistakes.length);

      // 按科目分组，统计待复习错题
      const reviewMap = new Map<string, any>();
      mistakes.forEach((m: any) => {
        const subject = m.subject_name || m.subject || '未分类';
        const isNeedReview = (m.review_count || 0) < 3;

        if (isNeedReview) {
          if (!reviewMap.has(subject)) {
            reviewMap.set(subject, {
              id: Math.random(),
              subject,
              topic: m.knowledge_points || m.topic || '待添加知识点',
              count: 0,
              completed: 0,
              priority: (m.difficulty || 3) === 3 ? '高' : (m.difficulty || 3) === 2 ? '中' : '低'
            });
          }
          reviewMap.get(subject)!.count += 1;
        }
      });

      setTodayReviews(Array.from(reviewMap.values()));

      // 生成即将��习的任务
      const upcoming = Array.from(reviewMap.values())
        .slice(0, 4)
        .map((item, index) => ({
          ...item,
          date: dayjs().add(index + 1, 'day').format('YYYY-MM-DD')
        }));

      setUpcomingReviews(upcoming);

      // 生成复习历史
      const history = [
        { date: dayjs().format('YYYY-MM-DD'), accuracy: 85, duration: '45分钟', completed: 5 },
        { date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), accuracy: 80, duration: '50分钟', completed: 6 },
        { date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), accuracy: 75, duration: '40分钟', completed: 4 },
        { date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'), accuracy: 70, duration: '35分钟', completed: 3 }
      ];

      setReviewHistory(history);

      console.log('[ReviewPlan] 加载完成，待复习科目数:', reviewMap.size);
    } catch (error) {
      console.error('[ReviewPlan] 加载复习数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalToday = todayReviews.reduce((sum, item) => sum + item.count, 0);
  const completedToday = todayReviews.reduce((sum, item) => sum + item.completed, 0);
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const handleStartReview = () => {
    Modal.confirm({
      title: '开始今日复习',
      content: '确定要开始今日复习吗？系统将按照优先级顺序展示错题。',
      okText: '开始复习',
      cancelText: '取消',
      onOk() {
        console.log('开始复习');
        // 这里开始复习流程
      },
    });
  };

  const handleAddPlan = () => {
    setIsModalVisible(true);
  };

  const handleDateSelect = (value: dayjs.Dayjs) => {
    setSelectedDate(value);
    console.log('选择日期:', value.format('YYYY-MM-DD'));
  };

  const cellRender = (current: dayjs.Dayjs) => {
    const dateStr = current.format('YYYY-MM-DD');
    const hasReview = upcomingReviews.some(item => item.date === dateStr);
    
    if (hasReview) {
      return (
        <div style={{ position: 'relative' }}>
          <div style={{ 
            position: 'absolute', 
            top: 2, 
            right: 2,
            width: 6, 
            height: 6, 
            backgroundColor: '#1890ff',
            borderRadius: '50%'
          }} />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="review-plan">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>复习计划</h1>
        <p style={{ color: '#666' }}>科学安排复习时间，巩固学习成果</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title="今日复习任务"
            extra={
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStartReview}
                disabled={completedToday === totalToday}
                loading={loading}
              >
                开始复习
              </Button>
            }
          >
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>今日进度</span>
                <span>{completedToday}/{totalToday} 题</span>
              </div>
              <Progress
                percent={progressPercent}
                strokeColor={progressPercent >= 80 ? '#52c41a' : progressPercent >= 50 ? '#faad14' : '#ff4d4f'}
              />
            </div>

            <List
              dataSource={todayReviews}
              loading={loading}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      size="small"
                      icon={<PlayCircleOutlined />}
                      disabled={item.completed === item.count}
                    >
                      复习
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge
                        count={item.count}
                        style={{ backgroundColor: item.completed === item.count ? '#52c41a' : '#1890ff' }}
                      />
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8 }}>{item.subject} - {item.topic}</span>
                        <Tag color={
                          item.priority === '高' ? 'red' : 
                          item.priority === '中' ? 'orange' : 'green'
                        }>
                          {item.priority}优先级
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <Progress 
                          percent={Math.round((item.completed / item.count) * 100)} 
                          size="small" 
                          style={{ width: 200 }}
                          strokeColor={item.completed === item.count ? '#52c41a' : '#1890ff'}
                        />
                        <span style={{ marginLeft: 8, fontSize: '12px', color: '#666' }}>
                          {item.completed}/{item.count} 完成
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="复习日历">
            <Calendar
              fullscreen={false}
              cellRender={cellRender}
              onSelect={handleDateSelect}
              headerRender={({ value, onChange }) => (
                <div style={{ padding: 8, textAlign: 'center' }}>
                  <Button 
                    type="text" 
                    onClick={() => onChange(value.subtract(1, 'month'))}
                  >
                    上月
                  </Button>
                  <span style={{ margin: '0 16px' }}>
                    {value.format('YYYY年 MM月')}
                  </span>
                  <Button 
                    type="text" 
                    onClick={() => onChange(value.add(1, 'month'))}
                  >
                    下月
                  </Button>
                </div>
              )}
            />
            <div style={{ marginTop: 16 }}>
              <Button 
                type="dashed" 
                block 
                icon={<PlusOutlined />}
                onClick={handleAddPlan}
              >
                添加复习计划
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="即将复习">
            <Timeline
              items={upcomingReviews.map((item, index) => ({
                key: index,
                dot: <CalendarOutlined style={{ fontSize: '16px' }} />,
                color: 'blue',
                children: (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.date}</div>
                      <div>{item.subject} - {item.topic}</div>
                    </div>
                    <div>
                      <Tag color="blue">{item.count}题</Tag>
                      <Button type="link" size="small" icon={<EditOutlined />} />
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="复习历史" 
            extra={<Button type="link">查看全部</Button>}
          >
            <List
              dataSource={reviewHistory}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%',
                        backgroundColor: item.accuracy >= 85 ? '#f6ffed' : item.accuracy >= 75 ? '#fff7e6' : '#fff1f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${item.accuracy >= 85 ? '#b7eb8f' : item.accuracy >= 75 ? '#ffd591' : '#ffa39e'}`
                      }}>
                        <span style={{ 
                          color: item.accuracy >= 85 ? '#52c41a' : item.accuracy >= 75 ? '#fa8c16' : '#ff4d4f',
                          fontWeight: 'bold'
                        }}>
                          {item.accuracy}%
                        </span>
                      </div>
                    }
                    title={`${item.date} 复习记录`}
                    description={
                      <Space>
                        <span>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {item.duration}
                        </span>
                        <span>
                          <CheckCircleOutlined style={{ marginRight: 4 }} />
                          完成 {item.completed} 题
                        </span>
                      </Space>
                    }
                  />
                  <div>
                    <Button type="link" size="small" icon={<ExclamationCircleOutlined />}>
                      详情
                    </Button>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Alert
        style={{ marginTop: 24 }}
        message="复习建议"
        description="根据艾宾浩斯遗忘曲线，建议在以下时间点进行复习：学习后20分钟、1小时、9小时、1天、2天、6天、31天。系统已根据此规律自动安排复习计划。"
        type="info"
        showIcon
      />

      <Modal
        title="添加复习计划"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary">
            保存计划
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="科目" required>
                <Select placeholder="请选择科目">
                  <Option value="数学">数学</Option>
                  <Option value="物理">物理</Option>
                  <Option value="化学">化学</Option>
                  <Option value="英语">英语</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="知识点" required>
                <Input placeholder="请输入知识点" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="开始日期" required>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="复习周期" required>
                <Select placeholder="请选择复习周期">
                  <Option value="daily">每日</Option>
                  <Option value="weekly">每周</Option>
                  <Option value="monthly">每月</Option>
                  <Option value="custom">自定义</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="错题数量">
            <Input type="number" placeholder="请输入错题数量" />
          </Form.Item>
          <Form.Item label="优先级">
            <Select placeholder="请选择优先级">
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>
          <Form.Item label="备注">
            <Input.TextArea placeholder="请输入备注信息" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReviewPlan;
