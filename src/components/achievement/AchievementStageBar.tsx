import { Steps } from 'antd';
import type { Achievement } from '../../types';

const stages = ['成果填报', '预审', '投稿/申请', '正式材料', '成果生效'];

function currentStage(status: string) {
  if (status === '已生效') return 4;
  if (status.startsWith('正式')) return 3;
  if (status === '已投稿/已申请') return 2;
  if (status.includes('预审') || status === '允许投稿/申请') return 1;
  return 0;
}

export function AchievementStageBar({ achievement }: { achievement: Achievement }) {
  const current = currentStage(achievement.status);
  const error = achievement.status.includes('退回');
  return <Steps size="small" current={current} status={error ? 'error' : achievement.status === '已生效' ? 'finish' : 'process'} items={stages.map((title) => ({ title }))} />;
}
