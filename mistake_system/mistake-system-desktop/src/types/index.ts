/**
 * 错题系统统一类型定义
 */

// ==================== 用户相关 ====================

export interface User {
  id: number;
  username: string;
  email?: string;
  expires_at: string;
  vip_level?: number;
  created_at?: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

// ==================== 错题相关 ====================

export type Subject = '数学' | '物理' | '化学' | '英语' | '语文' | '政治' | '未知';

export type Difficulty = '简单' | '中等' | '困难';

export type ReviewStatus = '待复习' | '复习中' | '已掌握';

export interface Mistake {
  id: number;
  user_id?: number;
  subject_id: number;
  subject?: Subject;
  content: string;
  question?: string;
  wrong_answer: string;
  correct_answer: string;
  error_reason: string;
  difficulty: number;
  difficulty_label?: Difficulty;
  images_path?: string | null;
  tags?: string[];
  created_at?: string;
  createTime?: string;
  knowledge_points?: string;
  topic?: string;
  mastery_level?: number;
  review_count?: number;
  last_reviewed?: string;
  lastReview?: string;
  next_review?: string;
  nextReview?: string;
  analysis?: string;
  review_status?: ReviewStatus;
  status?: ReviewStatus;
  knowledge_modules?: string[];
  analyzed?: boolean;
}

export interface MistakeInput {
  subject_id: number;
  content: string;
  wrong_answer: string;
  correct_answer: string;
  error_reason: string;
  difficulty: number;
  images_path?: string | null;
  tags?: string[];
  created_at?: string;
}

export interface MistakeUpdate {
  knowledge_points?: string;
  topic?: string;
  analysis?: string;
  difficulty?: number;
  correct_answer?: string;
  mastery_level?: number;
  review_count?: number;
  last_reviewed?: string;
  next_review?: string;
  review_status?: ReviewStatus;
}

export interface MistakeStats {
  total: number;
  pendingReview: number;
  mastered: number;
  needsAnalysis: number;
}

// ==================== 复习相关 ====================

export interface ReviewSession {
  id: number;
  date: string;
  accuracy: number;
  duration: string;
  completed: number;
}

export interface ReviewPlan {
  id: number;
  subject: Subject;
  topic: string;
  count: number;
  completed: number;
  priority: '高' | '中' | '低';
  date?: string;
}

export interface ReviewProgress {
  total: number;
  completed: number;
  percent: number;
}

// ==================== 数据分析相关 ====================

export interface KnowledgeModule {
  module: string;
  count: number;
  percentage: number;
  level: 'high' | 'medium' | 'low';
}

export interface ChartData {
  timeline: Array<{ month: string; count: number }>;
  subjectDistribution: Array<{ name: string; value: number }>;
  difficultyDistribution: Array<{ name: string; value: number }>;
}

export interface AnalysisStats {
  totalMistakes: number;
  analyzedMistakes: number;
  moduleCount: number;
}

// ==================== 配置相关 ====================

export interface ServerConfig {
  url: string;
  enableCustomServer: boolean;
  allowInsecureConnection: boolean;
}

export interface LearningGoals {
  总分目标: number;
  当前总分: number;
  各科目标?: Record<string, number>;
}

export interface TimeManagement {
  每日学习时间: string;
  单日科目: string[];
  双日科目: string[];
}

export interface SystemInfo {
  名称: string;
  版本: string;
  目标高考日期: string;
  倒计时天数: number;
}

export interface LearningConfig {
  系统信息: SystemInfo;
  学习目标: LearningGoals;
  时间管理: TimeManagement;
}

export interface LLMConfig {
  provider: 'openai' | 'deepseek' | 'qwen';
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
  enabled?: boolean;
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}

// ==================== AI 分析相关 ====================

export interface AIAnalysisResult {
  success: boolean;
  knowledgePoints: string[];
  analysis: string;
  difficulty?: Difficulty;
  correctAnswer?: string;
}

export interface QuestionSegment {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ==================== 图片上传相关 ====================

export interface ImageUploadItem {
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

// ==================== Dashboard 相关 ====================

export interface TodayStats {
  totalMistakes: number;
  reviewedToday: number;
  reviewAccuracy: number;
  upcomingReviews: number;
}

export interface RecentMistake {
  key: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  lastReview: string;
  nextReview: string;
  status: ReviewStatus;
}

// ==================== 组件 Props 类型 ====================

export interface MistakeBookProps {
  onNavigate?: (key: string) => void;
}

export interface QuickInputModalProps {
  visible: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export interface SidebarProps {
  selectedMenu: string;
  onMenuSelect: (key: string) => void;
  darkMode: boolean;
  onQuickInput?: () => void;
}

export interface SettingsProps {
  darkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
}
