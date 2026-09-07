import dayjs from 'dayjs';
import type { WarningLevel } from '../types';

export const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD');
export const daysUntil = (date: string) => dayjs(date).diff(dayjs(), 'day');

export const levelLabel = (level: WarningLevel | null) => {
  switch (level) { case 'yellow': return '黄色预警'; case 'orange': return '橙色预警'; case 'red': return '红色预警'; default: return '正常'; }
};
export const levelColor = (level: WarningLevel | null) => {
  switch (level) { case 'yellow': return '#faad14'; case 'orange': return '#fa8c16'; case 'red': return '#f5222d'; default: return '#52c41a'; }
};

export const statusOptions = ['草稿', '已发布', '已调整', '已停用'];

export const paperTypeOptions: Array<'SCI' | 'EI' | '中文核心'> = ['SCI', 'EI', '中文核心'];
export const patentScopeOptions: Array<'国内' | '国际'> = ['国内', '国际'];
export const educationLevelOptions: Array<'博士' | '硕士'> = ['博士', '硕士'];

export const PAPER_STATUS_OPTIONS = ['撰写中', '已投稿', '已录用', '已正式刊出'] as const;
export const PATENT_STATUS_OPTIONS = ['申请材料准备中', '已申请', '已受理', '已授权'] as const;

// Re-export from services
export { mockFileService } from '../services/fileService';
