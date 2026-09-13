import type { Achievement, AchievementType } from '../types';

export interface AchievementMaterialRequirement {
  materialType: string;
  description: string;
  required: boolean;
}

const FORMAL_REQUIREMENTS: Record<AchievementType, AchievementMaterialRequirement[]> = {
  学术论文: [
    { materialType: '论文定稿', description: '上传完整论文文件', required: true },
    { materialType: '录用通知或接收函', description: '能证明论文已被录用', required: true },
    { materialType: '项目标注页', description: '能看清项目名称或项目编号', required: true },
  ],
  发明专利: [
    { materialType: '专利受理通知书', description: '专利局出具的受理文件', required: true },
    { materialType: '专利申请文件', description: '请求书、说明书及权利要求书等', required: true },
    { materialType: '项目关联说明', description: '说明专利与课题的对应关系', required: true },
  ],
  软件著作权: [
    { materialType: '软件著作权证书', description: '登记机构颁发的证书', required: true },
    { materialType: '软件鉴别材料', description: '源程序及文档鉴别材料', required: true },
    { materialType: '著作权人证明', description: '用于核验著作权归属及排序', required: true },
  ],
  标准规范: [
    { materialType: '标准送审稿', description: '正式送审版本', required: true },
    { materialType: '送审或立项证明', description: '标准组织的送审、立项或发布证明', required: true },
  ],
  人才培养: [
    { materialType: '研究生学位论文证明材料', description: '学位论文、答辩或毕业证明', required: true },
  ],
};

export function formalMaterialRequirements(type: AchievementType): AchievementMaterialRequirement[] {
  return FORMAL_REQUIREMENTS[type];
}

export function supplementMaterialRequirements(achievement: Pick<Achievement, 'achievementType' | 'paperType' | 'isChineseCoreJournal'>): AchievementMaterialRequirement[] {
  if (achievement.achievementType === '学术论文') {
    const requirements: AchievementMaterialRequirement[] = [
      { materialType: '正式刊出论文全文', description: '页面完整、内容清晰的正式版论文', required: true },
      { materialType: '期刊封面、目录及见刊页', description: '可核验期刊、年卷期页和论文信息', required: true },
      { materialType: '项目标注页', description: '显示项目名称或项目编号的页面', required: true },
    ];
    if (['SCI', 'EI', 'CSCD'].includes(achievement.paperType ?? '')) {
      requirements.push({ materialType: '检索证明', description: `${achievement.paperType} 收录检索证明`, required: true });
    }
    if (achievement.isChineseCoreJournal) {
      requirements.push({ materialType: '中文核心期刊认定证明', description: '能证明该期刊属于中文核心期刊', required: true });
    }
    return requirements;
  }
  if (achievement.achievementType === '发明专利') {
    return [
      { materialType: '专利授权证书', description: '国家知识产权局颁发的授权证书', required: true },
      { materialType: '授权公告文本', description: '包含授权公告号和专利全文', required: true },
      { materialType: '法律状态证明', description: '可核验当前专利权有效状态', required: true },
      { materialType: '专利权属证明', description: '用于核验专利权人及排序', required: true },
    ];
  }
  return [];
}
