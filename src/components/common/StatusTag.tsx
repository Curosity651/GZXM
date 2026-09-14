import { Tag } from 'antd';

const colors: Record<string, string> = {
  已生效: 'success', 已通过: 'success', 审批通过: 'success', 预审通过: 'cyan',
  '允许投稿/申请': 'cyan', '已投稿/已申请': 'blue',
  预审初审中: 'processing', 预审终审中: 'geekblue', 正式初审中: 'processing', 正式终审中: 'geekblue',
  初审中: 'processing', 终审中: 'geekblue', 已提交: 'processing', 审批中: 'processing',
  预审退回: 'error', 正式退回: 'error', 退回修改: 'error', 审批不通过: 'error',
  草稿: 'default', 预审草稿: 'default', 正式成果草稿: 'default', 未提交: 'warning',
  实施中: 'processing', 验收中: 'gold', 已完成: 'success', 筹备中: 'default',
};

export function StatusTag({ status }: { status: string }) {
  return <Tag color={colors[status] ?? 'default'}>{status}</Tag>;
}
