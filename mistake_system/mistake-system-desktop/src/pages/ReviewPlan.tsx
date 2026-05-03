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
  Alert,
  message,
  Empty
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
import { getDueReviews, getReviewHistory } from '../services/reviewService';
import { refreshMistakes } from '../services/dataService';
import dayjs from 'dayjs';

const { Option } = Select;

const ReviewPlan: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [todayReviews, setTodayReviews] = useState<any[]>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<any[]>([]);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [dueMistakes, setDueMistakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState<any>(null);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);

      // 并行获取数据
      const [dueData, historyData, allMistakes] = await Promise.all([
        getDueReviews(50),
        getReviewHistory(20, 0, 30),
        refreshMistakes()
      ]);

      setDueMistakes(dueData);

      // 按科目分组到期错题
      const reviewMap = new Map<string, any>();
      dueData.forEach((m: any) => {
        const subjectId = m.subject_id;
        const subjectNames = ['', '数学', '物理', '化学', '英语', '语文', '政治'];
        const subject = subjectNames[subjectId] || '未分类';
        const topic = m.knowledge_points || '待添加知识点';

        if (!reviewMap.has(subject)) {
          reviewMap.set(subject, {
            id: Math.random(),
            subject,
            topic,
            count: 0,
            completed: 0,
            priority: (m.difficulty || 2) >= 3 ? '高' : (m.difficulty || 2) >= 2 ? '中' : '低'
          });
        }
        reviewMap.get(subject)!.count += 1;
      });

      setTodayReviews(Array.from(reviewMap.values()));

      // 生成即将复习的任务（按 next_review_date 分组）
      const dateMap = new Map<string, any>();
      allMistakes.forEach((m: any) => {
        if ((m.review_count || 0) >= 3) return; // 已掌握跳过
        const date = m.next_review_date || dayjs().format('YYYY-MM-DD');
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, count: 0, subjects: new Set() });
        }
        const entry = dateMap.get(date)!;
        entry.count++;
        const subjectNames = ['', '数学', '物理', '化学', '英语', '语文', '政治'];
        entry.subjects.add(subjectNames[m.subject_id] || '未分类');
      });

      const upcoming = Array.from(dateMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 6)
        .map(item => ({
          ...item,
          subject: Array.from(item.subjects).join('、'),
          subjects: undefined
        }));

      setUpcomingReviews(upcoming);

      // 真实复习历史
      if (historyData?.reviews) {
        const history = historyData.reviews.map((r: any) => ({
          date: r.review_time?.split(' ')[0] || r.review_time,
          accuracy: r.result === 'mastered' ? 100 : r.result === 'reviewing' ? 60 : 20,
          completed: 1,
          result: r.result,
          title: r.title
        }));

        // 按日期聚合
        const dateAgg = new Map<string, { date: string; total: number; mastered: number }>();
        history.forEach((h: any) => {
          if (!dateAgg.has(h.date)) {
            dateAgg.set(h.date, { date: h.date, total: 0, mastered: 0 });
          }
          const agg = dateAgg.get(h.date)!;
          agg.total++;
          if (h.result === 'mastered') agg.mastered++;
        });

        const aggregated = Array.from(dateAgg.values())
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(agg => ({
            date: agg.date,
            accuracy: agg.total > 0 ? Math.round(agg.mastered / agg.total * 100) : 0,
            completed: agg.total,
            duration: `约${agg.total * 3}分钟`
          }));

        setReviewHistory(aggregated);
      }

      // 统计
      if (historyData?.stats) {
        setReviewStats(historyData.stats);
      }

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
    if (dueMistakes.length === 0) {
      message.info('暂无到期的复习题目');
      return;
    }
    // 触发导航到仪表盘并开始复习
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }));
    // 延迟触发开始复习事件
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('start-daily-review'));
    }, 500);
  };

  const handleAddPlan = () => {
    setIsModalVisible(true);
  };

  const handleDateSelect = (value: dayjs.Dayjs) => {
    setSelectedDate(value);
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
        <p style={{ color: '#666' }}>基于 SM-2 间隔重复算法，科学安排复习时间</p>
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
                disabled={dueMistakes.length === 0}
                loading={loading}
              >
                开始复习 {dueMistakes.length > 0 ? `(${dueMistakes.length}题)` : ''}
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

            {todayReviews.length > 0 ? (
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
                            percent={item.count > 0 ? Math.round((item.completed / item.count) * 100) : 0}
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
            ) : (
              <Empty description="暂无到期的复习任务" />
            )}
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
          <Card title="复习日程">
            {upcomingReviews.length > 0 ? (
              <Timeline
                items={upcomingReviews.map((item, index) => ({
                  key: index,
                  dot: <CalendarOutlined style={{ fontSize: '16px' }} />,
                  color: item.date === dayjs().format('YYYY-MM-DD') ? 'red' : 'blue',
                  children: (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {item.date}
                          {item.date === dayjs().format('YYYY-MM-DD') && (
                            <Tag color="red" style={{ marginLeft: 8 }}>今天</Tag>
                          )}
                        </div>
                        <div>{item.subject}</div>
                      </div>
                      <div>
                        <Tag color="blue">{item.count}题</Tag>
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无复习日程" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="复习历史"
            extra={reviewStats && <Tag>累计 {reviewStats.total_reviews} 次</Tag>}
          >
            {reviewHistory.length > 0 ? (
              <List
                dataSource={reviewHistory.slice(0, 7)}
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
                            fontWeight: 'bold',
                            fontSize: '12px'
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
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无复习记录" />
            )}
          </Card>
        </Col>
      </Row>

      <Alert
        style={{ marginTop: 24 }}
        message="复习策略"
        description={'系统采用 SM-2 间隔重复算法：首次复习间隔 1 天，第二次间隔 6 天，之后按记忆保持因子递增。答对间隔变长，答错重置为 1 天。标记"忘记了"会最短间隔。'}
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
          <Button key="submit" type="primary" onClick={() => { message.info('功能开发中'); setIsModalVisible(false); }}>
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
          <Form.Item label="优先级">
            <Select placeholder="请选择优先级">
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReviewPlan;
