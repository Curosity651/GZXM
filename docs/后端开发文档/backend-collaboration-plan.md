# 重点项目科研管理系统后端协作与架构方案

> 基线：当前 React Mock 原型；目标：三人并行完成可联调的 Spring Boot 后端。归档材料需要上传但不审批，真实对象存储实现可后置替换。

配套文档：[`API接口清单`](./api-reference.md) · [`MySQL数据表说明`](./mysql-data-dictionary.md) · [`OpenAPI机器契约`](./openapi.yaml) · [`MySQL建表脚本`](./mysql-schema.sql)

## 1. 架构结论

采用“前后端分离＋契约优先＋模块化单体”，暂不拆微服务：一个 Spring Boot 应用、一个 MySQL 数据库、一个 Redis、一个对象存储适配层，由 Nginx 统一暴露前端与 `/api/v1`；模块之间只通过应用服务接口协作，后续确有独立扩容需求时再拆服务。

```text
Browser
   │ HTTPS
Nginx ── /        → React 静态资源
   └── /api/v1    → Spring Boot
                        ├── IAM：登录、用户、角色、权限
                        ├── Research：课题、成员、指标、成果、审批
                        ├── Progress：月季报、规则、审批、统计
                        ├── Archive：国家材料、自筹项目、文件目录、统计
                        ├── File：对象存储抽象（Mock/MinIO/其他 S3）
                        ├── MySQL：业务事实与审计记录
                        └── Redis：会话、刷新令牌、限流、短期缓存
```

### 1.1 关键业务边界

- 固定业务角色为系统管理员、项目技术负责人、科研助理、内部课题单位、外部课题单位；角色控制功能权限，课题成员关系控制数据范围。
- 一个单位只有一个有效课题单位账号；一个账号可参与多个课题，并在不同课题中分别是 `LEAD` 或 `PARTICIPANT`。
- 科研助理/技术负责人配置课题总体累计指标，课题牵头单位按考核节点向本课题各单位分配累计指标。
- 成果归属“课题＋上传单位”，先预审投稿/申请，再登记投稿/申请，取得正式材料后走初审、终审；专项指标是基础成果总量的子集。
- 月季报每课题每期最多一份，只由牵头单位创建和提交，科研助理初审、项目技术负责人终审，不为未填报月份自动创建空记录。
- 国家材料按“课题＋单位”独立管理；自筹项目仅内部单位可见和维护；归档材料上传后直接计入完成度，不进入审批。
- 课题、成员、账号停用后历史数据可读但不可新增、修改、提交或审批。

## 2. 三人协作拆分

### 2.1 人员 A：平台、认证与公共能力

负责 `iam`、`common`、`file`、部署基础设施：登录/刷新/退出、用户、单位、角色权限、Spring Security、统一异常、审计日志、Redis、对象存储适配、OpenAPI 聚合及 Nginx/Docker 配置。

交付接口标签：`Auth`、`Users`、`Roles`、`Units`、`Files`；交付数据表：`sys_*`、`file_object`、`audit_log`。

### 2.2 人员 B：课题、指标与成果

负责 `research`：课题及成员关系、考核节点、指标定义、课题累计指标、单位累计分配、成果全流程、成果审批、成果版本快照和成果进度统计。

交付接口标签：`Topics`、`Indicators`、`Achievements`；交付数据表：`biz_topic*`、`indicator_*`、`achievement*`、通用 `approval_record/submission_snapshot` 的成果部分。

### 2.3 人员 C：月季报、归档与统计

负责 `progress`、`archive`：课题月季报规则、报告创建/提交/审批/进度，国家材料、自筹项目、文件夹与材料、归档进度及工作台聚合查询。

交付接口标签：`Reports`、`Archives`、`Dashboard`；交付数据表：`topic_report_rule`、`report_*`、`self_funded_project`、`archive_*`，并复用人员 A 的文件服务。

### 2.4 为什么三个人可以并行

1. 第 1–2 天三人共同冻结 `openapi.yaml`、错误码、状态枚举和数据库迁移 V1，接口变更必须先改契约再改代码。
2. 人员 A 先提供 `CurrentUser`、`PermissionService`、`TopicAccessService` 接口及测试替身，B/C 不需要等待完整权限后台即可开发。
3. B/C 的 Controller 只依赖各自 Application Service；文件上传只依赖 A 定义的 `ObjectStoragePort`，开发期可用本地 Mock。
4. 前端由 OpenAPI Generator 生成 TypeScript 客户端，先连接 Prism/WireMock 契约桩，后端模块完成后逐个替换 Mock。
5. 数据库用 Flyway 串行编号：A 使用 `V1_0xx`，B 使用 `V1_1xx`，C 使用 `V1_2xx`，避免多人修改同一迁移文件。

### 2.5 必须共同遵守的代码边界

- 推荐包结构：`com.gzxm.{common,iam,research,progress,archive,file}`，每个模块包含 `api/application/domain/infrastructure` 四层。
- 禁止 Controller 直接调用 Mapper；禁止跨模块直接查询对方 Mapper；跨模块使用只读查询接口或明确的应用服务。
- `@PreAuthorize` 负责动作权限，`TopicAccessService` 负责课题成员/牵头/数据归属；MyBatis-Plus 数据权限拦截器只作为列表查询防漏网，不作为唯一安全防线。
- 所有修改接口使用事务、乐观锁版本和审计字段；提交/审批接口接收 `Idempotency-Key`，避免重复点击生成重复记录。
- 数据库 ID 使用 `BIGINT UNSIGNED`，API 一律序列化为字符串，避免 JavaScript 大整数精度问题。

## 3. 推荐开发节奏

### 阶段 0：契约和骨架（2–3 天）

- 冻结 OpenAPI、状态机、权限码、表结构 V1；生成前端客户端和后端接口骨架。
- A 完成安全上下文与公共返回/异常；B/C 用 `@WithMockUser` 和模拟 `TopicAccessService` 开发。

### 阶段 1：三路并行（7–10 天）

- A：认证、RBAC、用户单位、文件票据、审计。
- B：课题成员、指标两级下发、成果状态机与审批。
- C：课题报告规则、月季报、归档目录与统计。

### 阶段 2：纵向联调（4–5 天）

- 依次打通“登录→课题→指标→成果→审批”“报告→审批”“归档→文件→统计”。
- 每条链路覆盖五类角色、跨课题、牵头/承担、内部/外部、停用状态和重复提交。

### 阶段 3：部署验收（2–3 天）

- MySQL/Redis/Nginx/对象存储容器化；完成备份、日志脱敏、健康检查和恢复演练。

## 4. 权限如何融入普通 API

每个请求按相同顺序执行：验证访问令牌与账号/角色有效性 → 校验 RBAC 动作权限 → 校验课题处于可操作状态 → 校验单位是课题成员 → 校验是否牵头 → 校验记录是否属于当前单位；查询列表在 SQL 中附加数据范围，详情及修改再次进行对象级校验。

示例：课题单位调用 `POST /topics/{topicId}/achievements` 时，Spring Security 先验证 `achievement.submit`，随后 `TopicAccessService` 验证当前单位为该课题有效成员，Service 再强制把 `unit_id` 写成登录人的单位，不能信任前端传来的单位 ID。

## 5. 技术栈建议

- Java 21 LTS；建议固定 Spring Boot 3.5.16，首期不直接使用 4.x，降低团队学习和依赖迁移成本。
- Spring Web MVC、Validation、Spring Security、Actuator；MyBatis-Plus 用于 CRUD、分页、乐观锁及查询拦截。
- MySQL 8.0/8.4 LTS；Flyway 管理数据库版本；HikariCP 使用 Spring Boot 默认配置。
- Redis 用于刷新令牌/会话失效、登录限流、短期权限缓存和幂等键；业务事实、审批记录和版本快照必须落 MySQL。
- MyBatis-Plus 3.5.17 使用 `mybatis-plus-spring-boot3-starter`；springdoc-openapi 使用与 Boot 3.5 对应的 2.8.x，具体补丁版本统一由 Maven BOM/Dependabot 管理。
- springdoc-openapi 生成/校验接口文档；OpenAPI 文件作为仓库中的契约源，CI 检查破坏性变更。
- 文件层定义 S3 风格接口，首期可以本地 Mock，NAS 上部署 MinIO 后只替换适配器；浏览器通过短期上传/下载票据传输，数据库只存对象元数据。
- Nginx 提供 TLS、SPA 静态文件、`/api` 反向代理、限流和安全头；大文件采用直传对象存储时无需提高后端上传上限。
- 测试建议：JUnit 5、Spring Boot Test、Spring Security Test、Testcontainers（MySQL/Redis/MinIO）、RestAssured 或 MockMvc、WireMock；CI 至少执行单元测试、集成测试、OpenAPI 契约检查和 Flyway 空库迁移。

## 6. 暂不建议引入

- 不建议现在拆微服务、上消息队列、Elasticsearch、工作流引擎或 Kubernetes：当前团队只有三人，业务规模和流程复杂度尚不足以抵消运维成本。
- 成果/月季报状态机先在领域服务中显式实现；将来若出现大量可配置流程，再评估 Flowable/Camunda。
- MyBatis-Plus `DataPermissionInterceptor` 可以减少列表查询重复条件，但必须对每张表、每个 Mapper 白名单配置并配套越权测试，不能认为引入插件就自动拥有正确的数据权限。

## 7. 联调完成定义

- 前端不再直接读取 Zustand Mock，所有业务通过生成的 API Client 调用。
- 五类账号的菜单、按钮、HTTP 403 与数据列表范围一致。
- F01–F12 对应后端集成测试全部通过，尤其覆盖专项子集、累计节点、停用会话、跨课题越权和重提版本快照。
- 文件服务更换 Mock/MinIO 时 Controller 和前端契约不变化。
- 空库执行 Flyway 后可以创建管理员、登录并跑通三条核心业务链路。

## 8. 参考依据

- OpenAPI 3.1 规范：https://spec.openapis.org/oas/latest.html
- Spring Security 方法授权：https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html
- MyBatis-Plus 数据权限插件：https://baomidou.com/plugins/data-permission/
- Spring Boot 系统要求：https://docs.spring.io/spring-boot/system-requirements.html
- Redis 会话存储：https://redis.io/docs/latest/develop/use-cases/session-store/
