# Achievement Management Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Mock frontend achievement module into clear submission, two-stage approval, and progress pages with RBAC-scoped data and reference-form-based editing.

**Architecture:** Keep Zustand as the Mock persistence layer and retain the existing achievement lifecycle domain functions. Add focused presentation helpers for status-stage statistics and reuse the existing type-specific form components inside a wider drawer-based workflow. Replace the duplicate query page with an aggregated progress page while preserving the existing route for compatibility.

**Tech Stack:** React, TypeScript, Ant Design, Zustand, React Router, Vite

**Spec:** `docs/superpowers/specs/2026-09-09-achievement-management-redesign.md`

## Global Constraints

- Preserve all unrelated uncommitted user changes in the working tree.
- Use frontend Mock data only; do not add backend APIs.
- Do not run automated tests per explicit user request.
- Verify only with the production build and a development-server HTTP/page check.
- Keep the existing blue-and-white enterprise visual language.

---

### Task 1: Achievement presentation and progress helpers

**Files:**
- Modify: `src/domain/achievement.ts`
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: `Achievement`, `AchievementWorkflowStatus`, `UnitIndicatorAllocation`.
- Produces: status grouping helpers and progress row types used by all three pages.

- [ ] **Step 1: Add user-facing stage grouping**

Add helpers that consistently group lifecycle statuses into pre-review, externally submitted/applied, formal processing, and effective stages without changing the approved transition rules.

- [ ] **Step 2: Add progress aggregation**

Implement a pure aggregation helper keyed by `topicId + unitId + indicatorDefinitionId`, combining published unit allocation targets with visible achievements and allowing completion rates above 100 percent.

- [ ] **Step 3: Review type compatibility**

Confirm the helper accepts custom indicator definitions while retaining their base `AchievementType` form mapping.

### Task 2: Reference-aligned achievement form and detail presentation

**Files:**
- Modify: `src/components/achievement/AchievementForm.tsx`
- Modify: `src/components/achievement/PaperFields.tsx`
- Modify: `src/components/achievement/PatentFields.tsx`
- Modify: `src/components/achievement/CopyrightFields.tsx`
- Modify: `src/components/achievement/StandardFields.tsx`
- Modify: `src/components/achievement/TalentFields.tsx`
- Create: `src/components/achievement/AchievementDetail.tsx`
- Create: `src/components/achievement/AchievementStageBar.tsx`

**Interfaces:**
- Consumes: current `Achievement` fields, reference screenshots, approval records.
- Produces: a wide-drawer form, reusable read-only detail, and lifecycle stage bar.

- [ ] **Step 1: Reorganize the common form shell**

Render topic, current unit, indicator definition, title, responsible person, and remarks in compact grouped sections suitable for a wide drawer. The unit is derived from the signed-in user and remains read-only for submitting roles.

- [ ] **Step 2: Align paper, patent, and copyright sections**

Match the section names and visible fields in the six files under `成果管理参考`, including ordered contributor tables where the reference form uses them.

- [ ] **Step 3: Keep standard and talent forms consistent**

Retain their existing business fields and apply the same grouped styling.

- [ ] **Step 4: Separate source files from formal evidence**

Do not require paper originals, source code, or other source files during pre-review. Show formal evidence upload placeholders only when the record has reached the formal-material stage.

- [ ] **Step 5: Build reusable detail and stage components**

Show basic data, type-specific data, submitted materials, current stage, and approval history consistently in submission, approval, and progress drawers.

### Task 3: Rebuild the achievement submission page

**Files:**
- Modify: `src/pages/achievement/AchievementEntryPage.tsx`

**Interfaces:**
- Consumes: RBAC visibility helpers, lifecycle actions, progress helpers, `AchievementForm`, `AchievementDetail`.
- Produces: a flat submission-management page with role-scoped records.

- [ ] **Step 1: Replace the tree with summary cards and filters**

Render target, initiated, pre-review, submitted/applied, formal, and effective totals above filters for topic, type, unit, status, and title.

- [ ] **Step 2: Build the role-scoped result list**

Submitting units can edit only their own records. Lead units can switch between their records and all records within led topics. Global roles see all records read-only.

- [ ] **Step 3: Implement state-aware row actions**

Expose edit, submit for pre-review, register external submission/application, supplement formal information, and view-detail actions only when the current lifecycle status permits them.

- [ ] **Step 4: Use wide drawers for create, edit, and detail**

Keep one persistent record throughout its lifecycle and ensure topic, unit, indicator definition, and base achievement type remain bound correctly.

### Task 4: Rebuild the two-stage approval page

**Files:**
- Modify: `src/pages/achievement/AchievementApprovalPage.tsx`

**Interfaces:**
- Consumes: `reviewActionFor`, approval records, reusable achievement detail components.
- Produces: pre-review/formal tabs with pending, processed, and all record scopes.

- [ ] **Step 1: Add stage and work-scope tabs**

Separate pre-review from formal review, then allow the current reviewer to switch between pending, processed, and all visible records.

- [ ] **Step 2: Build the approval worklist**

Show result name, type, topic, submitting unit, submitter, submitted time, current review step, and status.

- [ ] **Step 3: Build the approval drawer**

Display read-only business information, contributors, stage-specific materials, approval timeline, and opinion input. A rejection requires an opinion; approval keeps it optional.

- [ ] **Step 4: Enforce role-specific operations**

Only assistants can perform initial approval and only technical leaders can perform final approval. Administrators remain read-only.

### Task 5: Replace achievement query with achievement progress

**Files:**
- Modify: `src/pages/achievement/AchievementQueryPage.tsx`

**Interfaces:**
- Consumes: progress aggregation from Task 1 and RBAC-scoped achievements/allocations.
- Produces: summary cards, progress matrix, and read-only result detail drawer.

- [ ] **Step 1: Add progress filters and summary cards**

Support topic, unit, and achievement-type filtering and display target, initiated, pre-review-approved, submitted/applied, formal, effective, and completion metrics.

- [ ] **Step 2: Render the progress matrix**

Group by topic, unit, and indicator definition and show all approved columns. Render completion as both `effective/target` and a progress bar that can label over-completion above 100 percent.

- [ ] **Step 3: Add read-only drill-down**

Clicking a matrix row opens the corresponding achievement records with access to reusable lifecycle details but no edit actions.

### Task 6: Navigation, copy, and verification

**Files:**
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/domain/permissions.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: the three rebuilt pages.
- Produces: final menu labels and routes for 成果提交, 成果审批, 成果进度.

- [ ] **Step 1: Update navigation labels**

Rename the existing three achievement entries without adding extra routes: `/achievement-entry` becomes 成果提交, `/achievement-approval` remains 成果审批, and `/achievement-query` becomes 成果进度.

- [ ] **Step 2: Check all role views manually in code**

Confirm page visibility and action visibility for system administrator, technical leader, research assistant, lead unit, and undertaking unit.

- [ ] **Step 3: Run the production build**

Run `npm run build`. Expected result: TypeScript and Vite complete successfully.

- [ ] **Step 4: Restart/check the development server**

Start or reuse the Vite server at port 4174 and confirm the achievement routes return an HTTP success response.
