# Requirements-Aligned Frontend Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有科研成果前端模型改造成符合已确认开发文档的单一重点项目、课题核心粒度、四角色、两级审批、月季报和多层归档 Mock 原型。

**Architecture:** 保留 React、TypeScript、Ant Design、Zustand 和 localStorage，以纯函数承载权限、状态机、截止日期和统计口径，以 store actions 承载 Mock 业务流转，以按业务域拆分的页面完成演示。页面只使用统一 store/selectors，不直接依赖 Mock 常量，方便未来替换为 API service。

**Tech Stack:** React 19、TypeScript 6、Vite 8、Ant Design 6、React Router 7、Zustand 5、dayjs、Vitest 4。

**Spec:** `C:/Users/86178/Desktop/GZXM/GZXM重点项目科研管理系统开发文档.md`

## Global Constraints

- 系统只管理一个固定重点项目，不提供多项目列表。
- 科研指标、成果和月季报均以课题为核心粒度。
- 每个课题一个独立课题牵头单位账号，参与单位无账号。
- 固定四角色：系统管理员、项目技术负责人、科研助理、课题牵头单位。
- 论文、专利、软著、标准先预审再正式审批；人才培养跳过预审。
- 课题业务审批为科研助理初审、项目技术负责人终审。
- 项目公共材料由科研助理提交、项目技术负责人终审。
- 自筹项目仅用于归档，类型为科技项目、技改项目、基建项目。
- 仅正式成果或材料终审通过后计入完成统计。
- 本期仅实现前端 Mock，不接入真实后端和文件存储。

---

### Task 1: Domain Model, Permissions, and Workflow Rules

**Files:**
- Modify: `package.json`
- Replace: `src/types/index.ts`
- Create: `src/domain/permissions.ts`
- Create: `src/domain/workflows.ts`
- Create: `src/domain/reporting.ts`
- Create: `src/domain/archive.ts`
- Test: `src/domain/domain.test.ts`

**Interfaces:**
- Produces: `canViewPage(role, page)`, `canPerform(role, action)`, `filterByTopicScope(user, records)`, `nextAchievementStatus(status, action)`, `reportDeadline(type, year, period)`, `archiveCompletion(requirements, submissions)`.

- [ ] **Step 1: Write failing domain tests**

```ts
it('does not give the system administrator business approval actions', () => {
  expect(canPerform('系统管理员', 'achievement.final.approve')).toBe(false);
});

it('moves formal final approval to effective and countable', () => {
  expect(nextAchievementStatus('正式终审中', 'APPROVE_FINAL')).toBe('已生效');
});

it('uses February month-end when the month has no thirtieth day', () => {
  expect(reportDeadline('MONTHLY', 2027, 2)).toBe('2027-02-28');
});

it('counts only applicable requirements with final-approved submissions', () => {
  expect(archiveCompletion(requirements, submissions)).toEqual({ required: 2, completed: 1, rate: 50 });
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/domain/domain.test.ts --reporter=verbose`

Expected: FAIL because domain modules do not exist.

- [ ] **Step 3: Implement the types and pure domain functions**

Define role, user, topic, topic-scoped indicator, two-stage achievement status, approval record, report task, progress report, archive template, self-funded project, archive submission, warning and audit types. Implement literal permission maps and exhaustive workflow transitions that throw on invalid actions.

- [ ] **Step 4: Run domain and legacy tests**

Run: `npx vitest run src/domain/domain.test.ts src/utils/core.test.ts --reporter=verbose`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json src/types src/domain
git commit -m "feat: define approved research management domain"
```

### Task 2: Mock Seed and Application Store

**Files:**
- Replace: `src/data/mock.ts`
- Replace: `src/store/index.ts`
- Modify: `src/services/auth.ts`
- Test: `src/store/store.test.ts`

**Interfaces:**
- Consumes: domain types and workflow transition functions from Task 1.
- Produces: `useAppStore`, `createInitialState`, typed actions for achievement/report/archive submission and approval, topic-scoped selectors, reset and login actions.

- [ ] **Step 1: Write failing store tests**

```ts
it('keeps topic accounts scoped to exactly one topic', () => {
  const state = createInitialState();
  expect(visibleTopics(state.users.find(u => u.username === 'topic01')!, state.topics).map(t => t.id)).toEqual(['t1']);
});

it('records both approval levels before an achievement becomes effective', () => {
  const store = createTestStore();
  store.getState().reviewAchievement('ach-pre', 'APPROVE_INITIAL', 'assistant', '通过');
  expect(store.getState().achievements[0].status).toBe('预审终审中');
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/store/store.test.ts --reporter=verbose`

Expected: FAIL because new state factory/actions do not exist.

- [ ] **Step 3: Implement the normalized Mock seed and actions**

Seed one project, five topics, new role users, topic-level indicators, achievements covering multiple workflow states, monthly/quarterly tasks, project public and topic archive requirements, three self-funded project types, approval records and warnings. Use immutable actions and record an `ApprovalRecord` on every approval.

- [ ] **Step 4: Run store and domain tests**

Run: `npx vitest run src/domain/domain.test.ts src/store/store.test.ts --reporter=verbose`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data src/store src/services
git commit -m "feat: add workflow-aware mock application state"
```

### Task 3: Navigation, Login, Workbench, Topic Indicators, and Monitoring

**Files:**
- Modify: `src/App.tsx`
- Replace: `src/components/layout/AppLayout.tsx`
- Modify: `src/components/AuthGuard.tsx`
- Replace: `src/pages/LoginPage.tsx`
- Replace: `src/pages/HomePage.tsx`
- Replace: `src/pages/indicator/IndicatorConfigPage.tsx`
- Replace: `src/pages/monitoring/IndicatorMonitoringPage.tsx`
- Replace: `src/pages/warning/WarningRulePage.tsx`
- Create: `src/components/common/PageHeader.tsx`
- Create: `src/components/common/StatusTag.tsx`
- Test: `src/domain/monitoring.test.ts`

**Interfaces:**
- Consumes: permission map, topic-scope selectors, topic indicators and approved achievements.
- Produces: role-filtered navigation, role workbench, topic-only indicator configuration and monitoring views.

- [ ] **Step 1: Write failing monitoring tests**

Test that pre-review and in-review achievements do not count, while `已生效` achievements do; test that topic users only receive their topic summary.

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/domain/monitoring.test.ts --reporter=verbose`

Expected: FAIL because target summary functions are missing.

- [ ] **Step 3: Implement summary functions and pages**

Create leaf-page permission metadata, recursively remove inaccessible empty menu groups, display new demo accounts, show role-specific workbench cards, configure indicators only by topic/type/node, and show project plus topic progress without unit-level indicator allocation.

- [ ] **Step 4: Verify tests and build**

Run: `npx vitest run --reporter=verbose && npm run build`

Expected: all tests PASS and build exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components src/pages/LoginPage.tsx src/pages/HomePage.tsx src/pages/indicator src/pages/monitoring src/pages/warning src/domain
git commit -m "feat: align navigation workbench and indicators with topic scope"
```

### Task 4: Achievement Pre-review and Formal Approval

**Files:**
- Replace: `src/pages/achievement/AchievementEntryPage.tsx`
- Replace: `src/pages/achievement/AchievementApprovalPage.tsx`
- Modify: `src/components/achievement/AchievementForm.tsx`
- Create: `src/pages/achievement/AchievementQueryPage.tsx`
- Create: `src/components/common/ApprovalTimeline.tsx`
- Test: `src/domain/achievement.test.ts`

**Interfaces:**
- Consumes: achievement workflow and store actions.
- Produces: topic submission workbench, initial/final review queues, formal material completion flow and read-only lifecycle query.

- [ ] **Step 1: Write failing achievement tests**

Test that four normal achievement types begin in pre-review draft, talent begins in formal draft, only the correct role can perform each approval, and only `已生效` counts to indicators.

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/domain/achievement.test.ts --reporter=verbose`

Expected: FAIL for missing creation/eligibility helpers.

- [ ] **Step 3: Implement achievement pages and helpers**

Preserve existing category-specific fields where practical, add pre-review/formal-stage prompts, display signature/unit/project-marking checks, enforce role-specific approval buttons, and show immutable approval/version history.

- [ ] **Step 4: Verify tests and build**

Run: `npx vitest run --reporter=verbose && npm run build`

Expected: all tests PASS and build exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages/achievement src/components/achievement src/components/common src/domain
git commit -m "feat: add achievement pre-review and formal approval"
```

### Task 5: Monthly and Quarterly Reporting

**Files:**
- Create: `src/pages/report/ReportManagementPage.tsx`
- Create: `src/pages/report/ReportApprovalPage.tsx`
- Create: `src/components/report/ReportForm.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/AppLayout.tsx`
- Test: `src/domain/reporting-flow.test.ts`

**Interfaces:**
- Consumes: `reportDeadline`, report store actions and data-scope helpers.
- Produces: monthly/quarterly task lists, six-field form, overdue flag, initial/final approval and report statistics.

- [ ] **Step 1: Write failing report-flow tests**

Test task uniqueness, overdue calculation independent of approval state, returned-report editability, and final-approved inclusion in progress statistics.

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/domain/reporting-flow.test.ts --reporter=verbose`

Expected: FAIL for missing report-flow helpers.

- [ ] **Step 3: Implement reporting pages**

Use the six confirmed template fields, separate monthly and quarterly tabs, show deadline and overdue tags, restrict topic users to their own task, and expose initial/final actions by role.

- [ ] **Step 4: Verify tests and build**

Run: `npx vitest run --reporter=verbose && npm run build`

Expected: all tests PASS and build exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages/report src/components/report src/App.tsx src/components/layout src/domain
git commit -m "feat: add topic monthly and quarterly reporting"
```

### Task 6: Project Public, Topic National, and Self-funded Archives

**Files:**
- Replace: `src/pages/archive/ArchiveCatalogPage.tsx`
- Replace: `src/pages/archive/MaterialUploadPage.tsx`
- Replace: `src/pages/archive/MaterialQueryPage.tsx`
- Replace: `src/pages/archive/ArchiveMonitoringPage.tsx`
- Create: `src/pages/archive/ProjectPublicArchivePage.tsx`
- Create: `src/pages/archive/TopicArchivePage.tsx`
- Create: `src/pages/archive/SelfFundedProjectPage.tsx`
- Create: `src/pages/archive/ArchiveApprovalPage.tsx`
- Create: `src/components/archive/RequirementChecklist.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/AppLayout.tsx`
- Test: `src/domain/archive-flow.test.ts`

**Interfaces:**
- Consumes: archive completion helpers, Mock templates and store actions.
- Produces: three archive paths, conditional applicability, self-funded project creation/type templates, initial/final review and multi-level completion dashboards.

- [ ] **Step 1: Write failing archive-flow tests**

Test public archive skips initial review, topic/self-funded archives require both levels, conditional non-applicable items require a reason, and template snapshots do not change when the source template changes.

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/domain/archive-flow.test.ts --reporter=verbose`

Expected: FAIL for missing archive-flow helpers.

- [ ] **Step 3: Implement archive pages and checklist component**

Build project-public, per-topic national and self-funded-project paths; support 科技/技改/基建 templates, applicability decisions, mock files, versions, two-level review where required, and final-approved completion rates.

- [ ] **Step 4: Verify tests and build**

Run: `npx vitest run --reporter=verbose && npm run build`

Expected: all tests PASS and build exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages/archive src/components/archive src/App.tsx src/components/layout src/domain
git commit -m "feat: rebuild archives around project topic and self-funded levels"
```

### Task 7: Administration, UX Polish, and Full Verification

**Files:**
- Replace: `src/pages/admin/UserManagementPage.tsx`
- Create: `src/pages/admin/SystemConfigPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/index.css`
- Modify: `src/App.css`
- Modify: `README.md`
- Modify: `vitest.config.ts`

**Interfaces:**
- Consumes: all prior modules.
- Produces: new-role account management, fixed-project configuration, consistent visual system, documented demo credentials and reliable test script.

- [ ] **Step 1: Add failing permission regression test**

Add an integration-level test proving the administrator can view business pages but cannot invoke approval actions, and topic users cannot view another topic's records.

- [ ] **Step 2: Run test and verify RED**

Run: `npm test -- --reporter=verbose`

Expected: FAIL until page/action permission integration is complete.

- [ ] **Step 3: Complete admin pages and polish**

Update role options and topic binding, add fixed project information, unify page headers/status tags/empty states, remove obsolete routes and document new accounts and scope.

- [ ] **Step 4: Run complete verification**

Run sequentially:

```bash
npm test -- --reporter=verbose
npm run lint
npm run build
```

Expected: tests PASS, lint has zero errors, build exits 0.

- [ ] **Step 5: Review branch diff and commit**

```bash
git status --short
git diff --check
git add src README.md package.json vitest.config.ts
git commit -m "feat: complete approved GZXM frontend prototype"
```

