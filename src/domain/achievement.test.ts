import { describe, expect, it } from 'vitest';
import { achievementMatchesIndicator, initialAchievementStatus, reviewActionFor } from './achievement';
import type { Achievement } from '../types';

describe('成果流程入口', () => {
  it.each(['学术论文', '发明专利', '软件著作权', '标准规范', '人才培养'] as const)('%s 从预审草稿开始', (type) => {
    expect(initialAchievementStatus(type)).toBe('预审草稿');
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

  it('补充材料仍按科研助理初审、技术负责人终审处理', () => {
    expect(reviewActionFor('补充初审中', '科研助理')).toBe('APPROVE_INITIAL');
    expect(reviewActionFor('补充终审中', '项目技术负责人')).toBe('APPROVE_FINAL');
  });
});

describe('成果与特殊指标匹配', () => {
  const base = { achievementType: '学术论文', indicatorDefinitionId: 'indicator-paper' } as Achievement;

  it('同一篇论文可同时计入普通论文、中文核心和广西电网第一作者指标', () => {
    const achievement = { ...base, isChineseCoreJournal: true, isPowerGridFirstAuthor: true };
    expect(achievementMatchesIndicator(achievement, 'indicator-paper', '学术论文')).toBe(true);
    expect(achievementMatchesIndicator(achievement, 'indicator-chinese-core-journal', '学术论文')).toBe(true);
    expect(achievementMatchesIndicator(achievement, 'indicator-power-grid-first-author-paper', '学术论文')).toBe(true);
  });
});
