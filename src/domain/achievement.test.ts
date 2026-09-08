import { describe, expect, it } from 'vitest';
import { initialAchievementStatus, reviewActionFor } from './achievement';

describe('成果流程入口', () => {
  it.each(['学术论文', '发明专利', '软件著作权', '标准规范'] as const)('%s 从预审草稿开始', (type) => {
    expect(initialAchievementStatus(type)).toBe('预审草稿');
  });

  it('人才培养跳过预审并从正式成果草稿开始', () => {
    expect(initialAchievementStatus('人才培养')).toBe('正式成果草稿');
  });
});

describe('成果审批动作', () => {
  it('科研助理只处理初审状态', () => {
    expect(reviewActionFor('预审初审中', '科研助理')).toBe('APPROVE_INITIAL');
    expect(reviewActionFor('预审终审中', '科研助理')).toBeNull();
  });

  it('项目技术负责人只处理终审状态', () => {
    expect(reviewActionFor('正式终审中', '项目技术负责人')).toBe('APPROVE_FINAL');
    expect(reviewActionFor('正式初审中', '项目技术负责人')).toBeNull();
  });
});
