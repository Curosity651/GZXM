import { Steps } from 'antd';
import type { Achievement } from '../../types';

const commonStages = ['成果填报', '预审', '正式材料', '成果生效'];
const paperPatentStages = ['成果填报', '预审', '投稿/申请', '正式材料', '见刊/授权补充', '成果生效'];

function currentStage(status: string, needsSupplement: boolean) {
  if (status === '已生效') return needsSupplement ? 5 : 3;
  if (status.startsWith('补充') || status.startsWith('待见刊') || status.startsWith('待授权')) return 4;
  if (status.startsWith('正式')) return needsSupplement ? 3 : 2;
  if (status === '已投稿/已申请') return 2;
  if (status.includes('预审') || status === '允许投稿/申请') return 1;
  return 0;
}

export function AchievementStageBar({ achievement }: { achievement: Achievement }) {
  const needsSupplement = achievement.achievementType === '学术论文' || achievement.achievementType === '发明专利';
  const stages = needsSupplement ? paperPatentStages : commonStages;
  const completed = achievement.status === '已生效' || achievement.countsToIndicator;
  const current = completed ? stages.length - 1 : currentStage(achievement.status, needsSupplement);
  const error = achievement.status.includes('退回');
  return <Steps size="small" current={current} status={error ? 'error' : completed ? 'finish' : 'process'} items={stages.map((title) => ({ title }))} />;
}
