# GZXM Frontend RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fixed role-name authorization with configurable frontend RBAC while retaining all rule-warning functionality.

**Architecture:** Store roles, permissions, user-role links, and user topic scopes in the existing Zustand/localStorage state. Resolve menu, route, action, and data-scope authorization through shared selectors so pages no longer branch on role display names. Add a role-permission management screen beside the existing user management screen.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Zustand 5, Vite 8

**Spec:** `docs/superpowers/specs/2026-09-09-frontend-rbac-design.md`

## Global Constraints

- Keep every existing rule-warning menu, route, type, Mock record, and calculation unchanged.
- One user binds to exactly one role.
- User data scope is `ALL` or `TOPICS`; `TOPICS` accepts one or more topic IDs.
- The built-in system administrator always has every permission and cannot be edited, disabled, or deleted.
- Do not add or run automated tests; run only the production build and manual browser verification.
- Bump the Zustand persistence key/version so legacy localStorage data reloads the new Mock schema.

---

### Task 1: RBAC Types, Permission Catalog, Mock Roles, and Store Actions

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/domain/permissions.ts`
- Modify: `src/data/mock.ts`
- Modify: `src/store/index.ts`

**Interfaces:**
- Produces: `DataScope = 'ALL' | 'TOPICS'`
- Produces: `PagePermissionKey`, `ActionPermissionKey`, and `RbacRole { id; code; name; description; builtIn; enabled; pagePermissions; actionPermissions; createdAt }`
- Produces: `User { roleId; dataScope; topicIds }`
- Produces: `getRole(user, roles)`, `canViewPage(user, roles, page)`, `canPerform(user, roles, action)`, `canAccessTopic(user, topicId)`, and `filterByTopicScope(user, records)`
- Produces store actions: `addRole`, `updateRole`, `toggleRoleEnabled`, and `removeRole`

- [ ] **Step 1: Define RBAC data contracts**

Replace the fixed `UserRole` field with role linkage and data scope, and add the role model:

```ts
export type DataScope = 'ALL' | 'TOPICS';

export type PagePermissionKey =
  | 'home' | 'topic-indicator' | 'indicator-monitoring' | 'warning-rules'
  | 'achievement-entry' | 'achievement-review' | 'achievement-query'
  | 'report-management' | 'report-review' | 'progress-overview'
  | 'project-public-archive' | 'topic-archive' | 'self-funded-archive'
  | 'archive-review' | 'archive-monitoring'
  | 'user-management' | 'role-permission' | 'dictionary' | 'system-config';

export type ActionPermissionKey =
  | 'topic.manage' | 'indicator.manage' | 'warning.manage'
  | 'achievement.submit' | 'achievement.initial.approve' | 'achievement.final.approve'
  | 'report.submit' | 'report.initial.approve' | 'report.final.approve'
  | 'archive.public.submit' | 'archive.topic.submit'
  | 'archive.initial.approve' | 'archive.final.approve'
  | 'self-funded.manage' | 'system.manage';

export interface RbacRole {
  id: string;
  code: string;
  name: string;
  description: string;
  builtIn: boolean;
  enabled: boolean;
  pagePermissions: PagePermissionKey[];
  actionPermissions: ActionPermissionKey[];
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  roleId: string;
  dataScope: DataScope;
  topicIds: string[];
  unitId?: string;
  phone?: string;
  email?: string;
  enabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
}
```

- [ ] **Step 2: Convert permission maps into a catalog and role-based selectors**

Move the existing page and action key unions into the shared type file as `PagePermissionKey` and `ActionPermissionKey`, including `warning-rules` and `warning.manage`. Re-export aliases from the permissions module where existing imports need compatibility. Export grouped permission metadata for the role editor. Implement selectors that grant every permission only when `role.code === 'system-admin' && role.builtIn`, and otherwise inspect the role permission arrays.

- [ ] **Step 3: Seed four initial roles and migrate Mock users**

Create `MOCK_ROLES` with the current four roles and current permissions. Map users to `role-admin`, `role-leader`, `role-assistant`, or `role-topic`; internal accounts use `dataScope: 'ALL'`, and topic accounts use `dataScope: 'TOPICS'` with one topic ID.

- [ ] **Step 4: Add role state and protected mutations**

Add `roles` to `AppData`. Prevent editing, disabling, or deleting built-in roles. Refuse deletion when `users.some(user => user.roleId === roleId)`. Make login reject disabled users and users whose role is missing or disabled. Change the persistence name to `gzxm-research-management-v2`.

- [ ] **Step 5: Commit the RBAC foundation**

```powershell
git add src/types/index.ts src/domain/permissions.ts src/data/mock.ts src/store/index.ts
git commit -m "feat: add configurable RBAC foundation"
```

### Task 2: Role Permission Management and Dynamic User Management

**Files:**
- Create: `src/pages/admin/RolePermissionPage.tsx`
- Modify: `src/pages/admin/UserManagementPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/AuthGuard.tsx`
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: role store actions and exported permission catalog from Task 1
- Produces: `/admin/roles` role-permission route

- [ ] **Step 1: Build the role list and editor**

Show role name, code, status, built-in tag, permission count, and bound-user count. Use a drawer or modal for name, code, description, grouped page-permission checkboxes, and grouped action-permission checkboxes. Disable all mutations for the built-in administrator; disable delete when the bound-user count is nonzero.

- [ ] **Step 2: Convert user management to dynamic roles and data scopes**

Replace the fixed role-name select with enabled roles from `state.roles`. Add a radio/select for `dataScope`; when it is `TOPICS`, show a required multi-select bound to `topicIds`. Show role name and readable data scope in the table.

- [ ] **Step 3: Register RBAC administration navigation**

Add `/admin/roles` to `App.tsx`, `AuthGuard`, and the System Management menu. Change menu filtering and route guarding to call `canViewPage(currentUser, roles, page)`. Display the resolved role name in the account dropdown.

- [ ] **Step 4: Add compact RBAC presentation styles**

Add only styles needed for the grouped permission matrix and role summary; reuse Ant Design cards, tables, tags, checkboxes, drawer, and form controls.

- [ ] **Step 5: Commit the management UI**

```powershell
git add src/pages/admin/RolePermissionPage.tsx src/pages/admin/UserManagementPage.tsx src/App.tsx src/components/AuthGuard.tsx src/components/layout/AppLayout.tsx src/index.css
git commit -m "feat: add role and permission management UI"
```

### Task 3: Replace Fixed Role Checks Across Business Flows

**Files:**
- Modify: `src/store/index.ts`
- Modify: `src/domain/admin.ts`
- Modify: `src/domain/achievement.ts`
- Modify: `src/domain/monitoring.ts`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/achievement/AchievementEntryPage.tsx`
- Modify: `src/pages/achievement/AchievementApprovalPage.tsx`
- Modify: `src/pages/achievement/AchievementQueryPage.tsx`
- Modify: `src/pages/report/ReportManagementPage.tsx`
- Modify: `src/pages/report/ReportApprovalPage.tsx`
- Modify: `src/pages/archive/ProjectPublicArchivePage.tsx`
- Modify: `src/pages/archive/TopicArchivePage.tsx`
- Modify: `src/pages/archive/SelfFundedProjectPage.tsx`
- Modify: `src/pages/archive/ArchiveApprovalPage.tsx`
- Modify: `src/pages/archive/ArchiveMonitoringPage.tsx`
- Modify: `src/pages/indicator/IndicatorConfigPage.tsx`
- Modify: `src/pages/warning/WarningRulePage.tsx`

**Interfaces:**
- Consumes: `canViewPage`, `canPerform`, `canAccessTopic`, and `filterByTopicScope` from Task 1
- Produces: role-name-independent business authorization

- [ ] **Step 1: Enforce store actions through permission keys**

Replace operator role-name comparisons with action checks against the operator's resolved role. For topic-owned submissions and self-funded projects, additionally require `canAccessTopic(operator, topicId)`.

- [ ] **Step 2: Convert page button visibility and approval queues**

Use action permissions to show submission, initial-review, final-review, public-archive, topic-archive, self-funded, indicator, and warning-rule controls. Approval pages may display both initial and final queues when a custom role owns both permissions.

- [ ] **Step 3: Convert every topic filter to user data scope**

Use `filterByTopicScope` or `canAccessTopic` in achievements, reports, archive pages, monitoring, and topic selectors. Remove every business branch that compares a role display name.

- [ ] **Step 4: Resolve role labels and workbench hints dynamically**

Display the current role's configured name. Replace fixed role-name workbench hints with neutral capability-based text and build pending items from the user's initial/final approval permissions.

- [ ] **Step 5: Commit business-flow integration**

```powershell
git add src/store/index.ts src/domain src/pages
git commit -m "refactor: enforce business access through RBAC"
```

### Task 4: Build and Manual Browser Verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: completed RBAC implementation
- Produces: documented prototype accounts and verification notes

- [ ] **Step 1: Update prototype documentation**

Document the dynamic role model, built-in administrator protection, user data scopes, `/admin/roles`, and the fact that rule warnings remain available.

- [ ] **Step 2: Run the production build only**

```powershell
npm run build
```

Expected: TypeScript and Vite complete successfully. Do not run `npm test` or add test files.

- [ ] **Step 3: Manually verify the administrator flow**

Open `http://127.0.0.1:4174/login`, sign in as `admin / admin123`, open User Management and Role Permission Management, verify the administrator role is read-only, create a temporary role, configure permissions, bind a user, and confirm the menu changes after signing in as that user.

- [ ] **Step 4: Manually verify topic scope and warnings**

Assign a user `TOPICS` scope with two topics, verify only those topics appear in topic-backed pages, then confirm `/warning-rules` still opens and its controls follow the configured `warning.manage` permission.

- [ ] **Step 5: Commit documentation and final corrections**

```powershell
git add README.md src
git commit -m "docs: describe frontend RBAC prototype"
```
