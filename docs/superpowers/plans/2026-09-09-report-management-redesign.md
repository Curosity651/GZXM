# Report Management Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将进度管理重构为按课题牵头单位提交的月季报提交、月季报审批和月季报进度三个页面。

**Architecture:** 在现有 Zustand Mock 状态中增加全项目月报/季报规则，由规则生成“课题 + 报告类型 + 年度 + 期次”任务。RBAC 决定页面与操作权限，课题牵头关系决定提交范围；进度页面同时承载统计和科研助理规则配置。

**Tech Stack:** React 19、TypeScript 6、Vite 8、Ant Design 6、Zustand 5

**Spec:** `docs/superpowers/specs/2026-09-09-report-management-redesign.md`

## Global Constraints

- 每个课题每期只生成一份报告，由课题牵头单位提交。
- 科研助理初审并配置全项目统一规则；项目技术负责人终审。
- 课题承担单位不显示月季报提交入口。
- 系统管理员可以查看进度，但默认不能提交、配置或审批。
- 只实现前端 Mock，不修改成果、指标、预警和归档业务。
- 不新增、修改或运行自动化测试；最终只执行构建和页面访问检查。

---

### Task 1: 月季报规则与任务模型

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/data/mock.ts`
- Modify: `src/store/index.ts`
- Modify: `src/domain/reporting.ts`

**Interfaces:**
- Produces: `ReportSubmissionRule`、`reportWindow()`、`generateReportTasks()`、`saveReportRule()`。

- [ ] 增加月报和季报统一规则类型，字段包括启用状态、生效年度、开放日、截止日和季报月份。
- [ ] 将 `ReportTask` 扩展为包含 `openDate`、`deadline` 和规则来源。
- [ ] 提供根据规则及启用课题生成任务的纯函数，使用课题作为唯一提交主体。
- [ ] 增加两套 Mock 规则与覆盖五个课题的任务。
- [ ] 扩展 Zustand 规则保存动作；保存后更新未提交任务，不覆盖已有报告。
- [ ] Commit: `feat: add configurable report submission rules`

### Task 2: RBAC 与导航调整

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/domain/permissions.ts`
- Modify: `src/data/mock.ts`
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `ReportSubmissionRule`。
- Produces: `report-progress` 页面权限和 `report.rule.manage` 操作权限。

- [ ] 将进度管理导航固定为“月季报提交、月季报审批、月季报进度”。
- [ ] 科研助理获得规则配置和初审权限，项目技术负责人获得终审权限。
- [ ] 课题牵头单位获得提交入口；课题承担单位移除提交入口。
- [ ] 系统管理员仅保留页面查看，不获得报告业务操作权限。
- [ ] 将 `/progress-overview` 路由指向新的月季报进度页面。
- [ ] Commit: `refactor: align report navigation and permissions`

### Task 3: 月季报提交页面

**Files:**
- Modify: `src/pages/report/ReportManagementPage.tsx`
- Modify: `src/store/index.ts`

**Interfaces:**
- Consumes: `reportWindow()`、`isTopicLead()`、`ReportTask`。

- [ ] 只展示当前账号作为牵头单位的课题任务。
- [ ] 列表展示课题、期次、开放时间、截止时间、状态、时效、提交时间。
- [ ] 未开放时禁用填报；逾期允许补交并标记逾期。
- [ ] 保留六项报告表单、草稿、提交、退回修改和只读状态。
- [ ] Commit: `refactor: scope report submission to topic leads`

### Task 4: 月季报审批与进度页面

**Files:**
- Modify: `src/pages/report/ReportApprovalPage.tsx`
- Create: `src/pages/report/ReportProgressPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `ReportSubmissionRule`、`ReportTask`、`ProgressReport`。

- [ ] 审批列表补充期次、牵头单位、时效及审批层级。
- [ ] 科研助理只处理初审，项目技术负责人只处理终审。
- [ ] 进度页提供报告类型、年度、期次和状态筛选。
- [ ] 展示应提交、已提交、已通过、未提交、逾期和提交率统计。
- [ ] 列表按课题展示牵头单位、状态、提交时间、审批阶段和时效。
- [ ] 增加只对科研助理开放的月报/季报规则编辑表单。
- [ ] Commit: `feat: add report progress and rule configuration`

### Task 5: 构建与原型交付

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-09-09-report-management-redesign.md`

**Interfaces:**
- Consumes: 完成后的三个进度管理页面。

- [ ] 更新 README 的页面、权限和演示账号说明。
- [ ] 执行 `npm run build`，不运行自动化测试。
- [ ] 确认 `http://127.0.0.1:4174/` 返回 HTTP 200。
- [ ] 使用牵头单位、承担单位、科研助理和项目技术负责人账号核对菜单差异。
- [ ] Commit: `docs: document redesigned report management`

