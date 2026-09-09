# 课题—单位指标分配与成果管理前端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 将现有前端 Mock 原型改造成“重点项目—课题—课题单位—成果记录”的业务模型，完成课题创建、两级指标下发、单位成果填报、投稿/申请前预审、正式材料补充、两级审批和进度查看。

**总体架构：** 保留 React 单页应用与 Zustand 本地持久化。业务数据由固定重点项目向课题展开；课题指标由科研助理下发，单位指标由课题牵头单位分配；每项成果采用一条持久记录贯穿预审、实际投稿/申请、正式材料和终审生效。访问控制继续采用现有 RBAC，数据范围额外依据用户所在单位与课题成员关系计算。

**技术栈：** React 19、TypeScript 6、Vite 8、Ant Design 6、Zustand 5

**需求依据：** `docs/superpowers/specs/2026-09-09-topic-unit-indicator-allocation-design.md`

## 全局约束

- 本期只实现前端 Mock 原型，不接后端接口；数据继续保存在 Zustand/localStorage。
- 保留现有规则预警、月报、季报、归档材料、自筹项目归档等模块，不因本次改造删除其入口或已有功能。
- 不新增、不修改、不运行自动化测试；用户明确要求快速验证前端逻辑。最终只执行 TypeScript/Vite 构建和浏览器人工验收。
- 课题是科研指标、进度报告和成果管理的主业务层级；配套自筹项目只存在于归档材料模块。
- 成果不分解到配套自筹项目，只分解到课题牵头单位或承担单位。
- 课题单位目标合计不得低于科研助理下发的课题目标；单个单位目标不得低于该单位已经生效的成果数。
- 成果计数以“已生效”为准；预审中、已允许投稿、已投稿/申请和正式审批中的记录不计入完成量。

## Task 1：扩展领域类型与 Mock 数据

**文件：**

- 修改：`src/types/index.ts`
- 修改：`src/data/mock.ts`

- [ ] 1.1 在 `src/types/index.ts` 补齐课题、课题单位关系和指标定义类型。

  新增或扩展以下结构：

  - `Topic`：课题编号、名称、研究周期、研究内容摘要、牵头单位、负责人、状态。
  - `TopicUnitMembership`：课题、单位、成员类型（`LEAD`/`PARTICIPANT`）、负责人、联系信息、启用状态。
  - `IndicatorDefinition`：指标编码、名称、成果大类、计量单位、是否系统预置、启用状态。
  - `TopicIndicator`：课题、指标、考核节点、累计目标值、下发状态、版本号。
  - `UnitIndicatorAllocation`：课题、课题单位关系、指标、节点、目标值、状态、版本号。

- [ ] 1.2 扩展用户与角色关联数据。

  - `User` 保留单角色 RBAC，增加明确的 `unitId`。
  - 课题数据范围不直接硬编码在用户上，而是由 `unitId + TopicUnitMembership` 推导。
  - 增加“课题承担单位”默认业务角色和演示账号；保留系统管理员、项目技术负责人、科研助理、课题牵头单位。

- [ ] 1.3 扩展成果记录类型，使一条记录覆盖完整生命周期。

  `Achievement` 至少增加：课题单位关系、上传单位、关联单位指标、当前阶段、实际投稿/申请日期、投稿/申请编号、版本号、退回原因、历史操作记录，以及论文、专利、软件著作权三类参考表单字段。

- [ ] 1.4 更新 `src/data/mock.ts` 的示例数据。

  - 为现有课题补充牵头单位和承担单位关系。
  - 为五类预置指标生成指标目录、课题指标和单位分配示例。
  - 增加一个承担单位账号，并让至少一个单位账号参与两个课题，以验证多课题场景。
  - 成果样例覆盖预审、允许投稿、已投稿/申请、正式审批和已生效等主要状态。

- [ ] 1.5 人工检查 Mock 数据引用完整性，不运行测试。

- [ ] 1.6 提交本任务。

  ```powershell
  git add src/types/index.ts src/data/mock.ts
  git commit -m "feat: model topic unit indicator allocation"
  ```

## Task 2：实现课题、单位和指标领域规则

**文件：**

- 新建：`src/domain/topic-access.ts`
- 新建：`src/domain/indicator-allocation.ts`
- 修改：`src/store/useAppStore.ts`

- [ ] 2.1 在 `src/domain/topic-access.ts` 实现数据范围选择器。

  提供以下纯函数：

  - 根据用户单位查找其全部课题成员关系。
  - 计算用户可见课题：管理员、项目技术负责人、科研助理可见全部；单位账号只见本单位参与课题。
  - 判断用户是否为指定课题牵头单位。
  - 判断用户是否可维护课题成员、分配单位指标、查看某项成果。
  - 当同一账号在一个课题为牵头单位、另一个课题为承担单位时，按课题分别计算权限。

- [ ] 2.2 在 `src/domain/indicator-allocation.ts` 实现两级指标校验。

  - 课题指标按“指标类型 + 考核节点”唯一。
  - 单位分配合计必须大于等于课题目标，允许超额分配。
  - 调整单位目标时，不得低于该单位对应指标已经生效的成果数。
  - 返回可直接展示的逐行错误信息，供矩阵页面阻止下发。

- [ ] 2.3 扩展 Zustand 状态与持久化动作。

  增加课题 CRUD、指标目录 CRUD、课题指标保存/下发、课题单位增删启停、单位指标保存/下发/调整等动作。所有动作均写入本地状态，发布类动作保存版本号与更新时间。

- [ ] 2.4 将 localStorage 版本键升级为 `gzxm-research-management-v3`，避免旧数据结构污染新原型。

- [ ] 2.5 通过 TypeScript 编辑器诊断与代码走查确认接口引用，不运行测试或构建。

- [ ] 2.6 提交本任务。

  ```powershell
  git add src/domain/topic-access.ts src/domain/indicator-allocation.ts src/store/useAppStore.ts
  git commit -m "feat: add topic access and allocation rules"
  ```

## Task 3：改造科研指标配置为课题与指标管理中心

**文件：**

- 修改：`src/pages/IndicatorConfigPage.tsx`
- 新建：`src/pages/indicator/TopicManagementPanel.tsx`
- 新建：`src/pages/indicator/IndicatorCatalogPanel.tsx`
- 新建：`src/pages/indicator/TopicIndicatorPanel.tsx`

- [ ] 3.1 将科研指标配置页改成三个页签：课题管理、指标目录、课题指标下发。

- [ ] 3.2 实现课题管理。

  - 列表展示课题编号、名称、周期、牵头单位、负责人和状态。
  - 科研助理可以新增、编辑、启停课题。
  - 新增/编辑表单填写完整基本信息，并从单位列表中选择唯一牵头单位。
  - 选中牵头单位后自动建立 `LEAD` 成员关系；更换牵头单位时同步更新关系。

- [ ] 3.3 实现指标目录。

  - 系统预置论文、专利、软件著作权、标准、人才五类指标。
  - 科研助理可新增、编辑、启停自定义指标。
  - 系统预置项不可删除，只允许查看或调整启用状态。

- [ ] 3.4 实现课题指标下发矩阵。

  - 先选课题，再按指标类型与考核节点维护累计目标。
  - 提供保存草稿和直接下发按钮，不经过项目技术负责人审批。
  - 页面明确展示当前版本、下发时间和下发人。
  - 对重复维度、空目标、负数等正常录入错误给出就地提示。

- [ ] 3.5 人工检查三个页签的基本交互，不运行自动化测试。

- [ ] 3.6 提交本任务。

  ```powershell
  git add src/pages/IndicatorConfigPage.tsx src/pages/indicator
  git commit -m "feat: add topic and topic indicator management"
  ```

## Task 4：实现课题成员与单位指标分配

**文件：**

- 新建：`src/pages/indicator/TopicUnitPanel.tsx`
- 新建：`src/pages/indicator/UnitAllocationPanel.tsx`
- 修改：`src/pages/IndicatorConfigPage.tsx`

- [ ] 4.1 为课题牵头单位提供“课题单位管理”页签。

  - 只显示当前账号所牵头的课题。
  - 牵头单位固定展示且不能移除。
  - 可从组织列表选择承担单位，补充负责人和联系方式，支持启用/停用。
  - 列表同时展示对应单位账号是否已经启用；账号仍由系统管理员在用户管理中创建。

- [ ] 4.2 实现单位指标分配矩阵。

  - 行为课题指标的“指标类型 + 考核节点”，列为牵头单位及全部承担单位。
  - 每行展示课题目标、各单位目标和分配合计。
  - 保存草稿时保留输入；下发时统一执行合计约束校验。
  - 超额分配允许通过，并用中性提示显示“超出课题要求”；不足时阻止下发并定位具体行。

- [ ] 4.3 实现已下发指标调整。

  - 可在单位之间重新分配。
  - 不允许将某单位目标降到其已生效成果数以下。
  - 每次重新下发增加版本号并记录更新时间。

- [ ] 4.4 将两个页签接入科研指标配置页，并按 RBAC 与课题数据范围控制可见性和操作按钮。

- [ ] 4.5 人工检查牵头单位与普通承担单位看到的内容差异，不运行测试。

- [ ] 4.6 提交本任务。

  ```powershell
  git add src/pages/IndicatorConfigPage.tsx src/pages/indicator/TopicUnitPanel.tsx src/pages/indicator/UnitAllocationPanel.tsx
  git commit -m "feat: add topic unit allocation workflow"
  ```

## Task 5：补齐 RBAC 页面权限与演示账号

**文件：**

- 修改：`src/types/index.ts`
- 修改：`src/data/mock.ts`
- 修改：`src/auth/permissions.ts`
- 修改：`src/components/AuthGuard.tsx`
- 修改：`src/components/AppLayout.tsx`
- 修改：`src/pages/system/UserManagementPage.tsx`
- 修改：`src/App.tsx`

- [ ] 5.1 增加本次页面和操作权限键。

  至少覆盖：课题维护、指标目录维护、课题指标下发、课题单位维护、单位指标下发、成果新建/编辑/提交、预审初审、预审终审、正式初审、正式终审、全局进度查看。

- [ ] 5.2 更新四类业务角色默认权限。

  - 项目技术负责人：全部业务查看，预审终审与正式终审。
  - 科研助理：课题与课题指标管理，全部课题查看，预审初审与正式初审。
  - 课题牵头单位：本单位参与课题查看；对所牵头课题维护成员和分配单位指标；上传本单位成果。
  - 课题承担单位：查看本单位参与课题并上传本单位成果。
  - 系统管理员：继续拥有所有页面和系统配置权限，默认不作为业务审批人。

- [ ] 5.3 在用户管理页补充单位选择，并保证一个账号只绑定一个单位和一个系统角色。

- [ ] 5.4 更新导航与路由守卫，使页面权限和操作权限均来源于 RBAC；课题级能力再叠加 `topic-access` 的数据范围判断。

- [ ] 5.5 更新登录页演示账号提示，加入课题承担单位账号。

- [ ] 5.6 提交本任务。

  ```powershell
  git add src/types/index.ts src/data/mock.ts src/auth/permissions.ts src/components/AuthGuard.tsx src/components/AppLayout.tsx src/pages/system/UserManagementPage.tsx src/App.tsx
  git commit -m "feat: align RBAC with topic unit workflows"
  ```

## Task 6：重构成果生命周期与审批动作

**文件：**

- 修改：`src/domain/workflows.ts`
- 修改：`src/domain/achievement.ts`
- 修改：`src/store/useAppStore.ts`

- [ ] 6.1 将成果状态统一为一条记录的阶段状态机。

  采用以下业务状态：预审草稿、预审初审中、预审终审中、预审退回、允许投稿/申请、已投稿/已申请、正式成果草稿、正式初审中、正式终审中、正式退回、已生效。

- [ ] 6.2 定义角色可执行动作及迁移规则。

  - 单位用户：新建/编辑预审、提交预审、登记实际投稿/申请、补充正式材料、提交正式审批、修改退回记录。
  - 科研助理：预审初审、正式初审，可通过或退回并填写意见。
  - 项目技术负责人：预审终审、正式终审，可通过或退回并填写意见。
  - 禁止跳过“允许投稿/申请”直接登记正式成果。

- [ ] 6.3 保证全过程复用同一个 `Achievement.id`。

  阶段迁移只更新当前记录并追加版本/操作历史，不另建“预审记录”和“正式成果记录”。退回后保留此前提交内容、审批意见和附件信息。

- [ ] 6.4 实现成果归属校验。

  成果必须归属当前用户所在单位在该课题中的成员关系，并关联对应的单位指标；上传单位由登录用户的 `unitId` 自动写入，不能在表单中任意选择。

- [ ] 6.5 将完成量计算统一限制为 `已生效` 状态。

- [ ] 6.6 提交本任务。

  ```powershell
  git add src/domain/workflows.ts src/domain/achievement.ts src/store/useAppStore.ts
  git commit -m "feat: implement persistent achievement lifecycle"
  ```

## Task 7：实现成果树、记录列表与进度视图

**文件：**

- 修改：`src/pages/AchievementManagementPage.tsx`
- 新建：`src/components/achievement/AchievementTree.tsx`
- 新建：`src/components/achievement/AchievementList.tsx`
- 新建：`src/components/achievement/AchievementDetailDrawer.tsx`
- 新建：`src/components/achievement/AchievementProgressSummary.tsx`

- [ ] 7.1 将成果管理页改成左树右表布局。

  左侧树固定为“重点项目 → 可见课题 → 论文/专利/软件著作权/标准/人才及自定义指标”，右侧展示当前节点的一条条成果记录。

- [ ] 7.2 按角色应用数据范围。

  - 单位账号只看到本单位参与的课题和本单位成果。
  - 课题牵头单位在自己牵头的课题可查看所有成员单位成果；在仅参与的课题只看本单位成果。
  - 科研助理、项目技术负责人可查看全部课题、单位和成果。

- [ ] 7.3 右侧列表展示成果标题、所属课题、上传单位、指标类型、当前状态、最近提交时间和当前审批人，并提供按单位、状态和关键字筛选。

- [ ] 7.4 增加顶部进度摘要。

  显示当前节点的目标数、预审中、允许投稿/申请、正式审批中、已生效和完成率；完成率只用已生效数量计算。

- [ ] 7.5 实现详情抽屉。

  展示完整表单、附件清单、预审意见、正式审批意见和时间线；只读状态下不出现编辑入口。

- [ ] 7.6 人工检查多课题账号切换树节点后列表与进度同步，不运行测试。

- [ ] 7.7 提交本任务。

  ```powershell
  git add src/pages/AchievementManagementPage.tsx src/components/achievement
  git commit -m "feat: add scoped achievement tree and progress view"
  ```

## Task 8：按参考图片实现成果表单

**文件：**

- 修改：`src/components/achievement/AchievementForm.tsx`
- 新建：`src/components/achievement/PaperFields.tsx`
- 新建：`src/components/achievement/PatentFields.tsx`
- 新建：`src/components/achievement/CopyrightFields.tsx`
- 新建：`src/components/achievement/ParticipantEditor.tsx`
- 新建：`src/components/achievement/MaterialUploader.tsx`
- 新建：`src/components/achievement/ExternalSubmissionForm.tsx`

- [ ] 8.1 将成果新建入口限定在具体课题与成果类型节点下，并自动带入课题、上传单位和可关联的单位指标。

- [ ] 8.2 实现论文表单。

  按六张参考图片及设计稿字段实现：论文题目、中英文题目、论文类型、研究方向、拟投/实际期刊、期刊级别、作者与排序、第一作者/通讯作者单位、署名单位排序、摘要、关键词、拟投稿日期、实际投稿日期、投稿编号、录用/发表信息及材料附件。

- [ ] 8.3 实现专利表单。

  包含专利名称、类型、技术领域、申请国家/地区、申请人及排序、发明人及排序、权利归属、摘要、拟申请日期、实际申请日、申请号、公开号、授权信息及材料附件。

- [ ] 8.4 实现软件著作权表单。

  包含软件全称、简称、版本号、开发完成日期、首次发表日期、开发方式、著作权人及排序、权利范围、软件分类、运行平台、开发语言、功能与技术特点、登记申请信息、登记号及材料附件。

- [ ] 8.5 保留标准、人才及自定义指标的通用表单，并统一使用参与人编辑器与材料上传组件。

- [ ] 8.6 根据成果阶段控制表单区块。

  - 预审阶段显示拟投稿/拟申请信息和预审材料。
  - 预审通过后开放实际投稿/申请登记。
  - 登记后开放正式编号、录用/授权/登记信息与正式证明材料。
  - 已生效记录只读。

- [ ] 8.7 提交本任务。

  ```powershell
  git add src/components/achievement
  git commit -m "feat: add reference-based achievement forms"
  ```

## Task 9：统一审批工作台与全局进度监控

**文件：**

- 修改：`src/pages/AchievementApprovalPage.tsx`
- 修改：`src/pages/IndicatorMonitoringPage.tsx`
- 修改：`src/pages/HomePage.tsx`
- 修改：`src/domain/monitoring.ts`

- [ ] 9.1 将成果审批页改成统一待办工作台。

  - 科研助理看到预审初审和正式初审待办。
  - 项目技术负责人看到预审终审和正式终审待办。
  - 标签明确区分预审/正式、初审/终审。
  - 审批人可查看完整记录、附件、历史意见，并执行通过或退回。

- [ ] 9.2 调整指标监控为“课题 → 单位 → 指标类型/节点”钻取结构。

  - 全局角色查看所有课题。
  - 课题牵头单位查看所牵头课题的所有单位，同时保留其在其他课题的本单位视图。
  - 单位账号只查看本单位。
  - 目标来源使用最新已下发单位指标，完成量只统计已生效成果。

- [ ] 9.3 更新首页统计卡片与待办。

  展示用户可见范围内的课题数、待预审、待正式审批、已生效成果和指标完成率；不再把未生效记录计为完成。

- [ ] 9.4 回归检查规则预警、月报、季报和归档材料仍可正常进入，必要时仅修复因类型变化造成的编译引用。

- [ ] 9.5 提交本任务。

  ```powershell
  git add src/pages/AchievementApprovalPage.tsx src/pages/IndicatorMonitoringPage.tsx src/pages/HomePage.tsx src/domain/monitoring.ts
  git commit -m "feat: align approval and monitoring with unit outcomes"
  ```

## Task 10：文档、构建与人工验收

**文件：**

- 修改：`README.md`
- 修改：`docs/superpowers/plans/2026-09-09-topic-unit-achievement-frontend.md`

- [ ] 10.1 更新 README 的业务模型、角色、演示账号、启动命令和 Mock 数据说明。

- [ ] 10.2 运行一次生产构建，只验证 TypeScript 与打包，不运行任何自动化测试。

  ```powershell
  npm run build
  ```

- [ ] 10.3 保持或重新启动 Vite 开发服务器，在 `http://127.0.0.1:4174/` 进行浏览器人工验收。

  人工验收路径：

  1. 科研助理新增课题、选择牵头单位、下发课题指标。
  2. 课题牵头单位添加承担单位并下发单位指标，验证不足时阻止、超额时允许。
  3. 承担单位在其两个可见课题中分别新建成果并提交预审。
  4. 科研助理预审初审，项目技术负责人预审终审。
  5. 承担单位登记实际投稿/申请、补充正式材料并再次提交。
  6. 科研助理正式初审，项目技术负责人正式终审，成果变为已生效。
  7. 检查成果树、首页和进度监控只将已生效成果计入完成量。
  8. 检查系统管理员用户管理、角色权限、规则预警、月季报和归档材料入口仍存在。

- [ ] 10.4 在本计划中勾选已完成项并记录构建与人工验收结果。

- [ ] 10.5 提交文档与最终修正。

  ```powershell
  git add README.md docs/superpowers/plans/2026-09-09-topic-unit-achievement-frontend.md
  git commit -m "docs: document topic unit achievement prototype"
  ```

