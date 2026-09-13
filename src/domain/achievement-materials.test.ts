import { describe, expect, it } from 'vitest';
import { supplementMaterialRequirements } from './achievement-materials';

describe('论文与专利补充材料', () => {
  it('SCI 中文核心论文同时需要检索和核心期刊证明', () => {
    const requirements = supplementMaterialRequirements({ achievementType: '学术论文', paperType: 'SCI', isChineseCoreJournal: true });
    expect(requirements.map((item) => item.materialType)).toEqual(expect.arrayContaining([
      '正式刊出论文全文', '期刊封面、目录及见刊页', '项目标注页', '检索证明', '中文核心期刊认定证明',
    ]));
  });

  it('专利授权补充材料包含证书、公告、法律状态和权属证明', () => {
    const requirements = supplementMaterialRequirements({ achievementType: '发明专利' });
    expect(requirements).toHaveLength(4);
    expect(requirements.every((item) => item.required)).toBe(true);
  });
});
