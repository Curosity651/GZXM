# 重点项目科研管理系统 MySQL 数据表说明

> 本文是数据库设计的可读版，帮助产品、前端和后端快速理解数据如何保存。可直接执行的完整字段类型、索引、外键和约束仍保存在 [`mysql-schema.sql`](./mysql-schema.sql)。

## 1. 数据库整体划分

| 模块 | 表数量 | 保存的主要内容 |
|---|---:|---|
| 用户与权限 | 6 | 单位、用户、角色、权限以及关联关系 |
| 项目与课题 | 3 | 当前重点项目、课题、课题牵头/承担单位关系 |
| 科研指标 | 4 | 时间节点、指标定义、课题指标、单位指标分配 |
| 成果管理 | 2 | 成果业务记录和成果材料 |
| 月季报 | 3 | 课题填报规则、应填期间、实际填报内容 |
| 审批与版本 | 2 | 成果/月季报审批记录和提交快照 |
| 归档与文件 | 5 | 文件对象、材料模板、自筹项目、文件夹和文件关联 |
| 系统支撑 | 2 | 接口幂等记录和操作审计日志 |
| 合计 | 27 | — |

## 2. 用户与权限表

| 中文名称 | 数据表 | 关键字段 | 关联关系 | 关键规则 |
|---|---|---|---|---|
| 单位 | `sys_unit` | `code`单位编码、`name`名称、`internal_flag`是否内部单位、`enabled`状态 | 被用户、课题成员、成果和归档数据引用 | 单位编码和名称不能重复 |
| 角色 | `sys_role` | `code`角色编码、`name`名称、`built_in`是否内置、`enabled`状态 | 通过`sys_role_permission`关联权限，通过`sys_user_role`关联用户 | 五类基本角色使用内置数据初始化 |
| 权限 | `sys_permission` | `code`权限编码、`permission_type`页面/动作、`permission_group`分组、`locked_for_external`外部单位锁定 | 被角色权限关系引用 | 外部课题单位不能获得企业自筹权限 |
| 角色权限关系 | `sys_role_permission` | `role_id`、`permission_id` | 多个权限组合成一个角色 | 同一个角色不能重复配置同一权限 |
| 用户 | `sys_user` | `username`、`password_hash`、`contact_name`、`phone`、`email`、`unit_id`、`account_type`、`enabled` | 属于一个单位，通过`sys_user_role`拥有一个角色 | 用户名唯一；同一单位只能有一个有效课题单位账号；账号停用但不删除历史业务数据 |
| 用户角色关系 | `sys_user_role` | `user_id`、`role_id` | 用户和角色的关联 | 当前设计每个用户只能选择一个角色 |

### 用户账号的理解

| 账号类型 | 是否必须关联单位 | 典型角色 | 数据范围来源 |
|---|---|---|---|
| 平台账号 `PLATFORM` | 可选 | 系统管理员、项目技术负责人、科研助理 | 角色及业务职责 |
| 课题单位账号 `TOPIC_UNIT` | 必须 | 内部课题单位、外部课题单位 | `biz_topic_unit_membership`课题成员关系 |

## 3. 项目与课题表

| 中文名称 | 数据表 | 关键字段 | 关联关系 | 关键规则 |
|---|---|---|---|---|
| 重点项目 | `biz_project` | `code`项目编码、`name`项目名称、起止日期、`enabled` | 一个项目包含多个课题和时间节点 | 系统当前只管理一个重点项目，但保留项目表便于数据完整和后续扩展 |
| 课题 | `biz_topic` | `project_id`、`code`、`name`、`lead_unit_id`、`status`、起止日期 | 属于重点项目；关联多个成员单位、指标、成果、月季报和归档数据 | 同一项目内课题编码唯一；一个课题只有一个牵头单位 |
| 课题单位关系 | `biz_topic_unit_membership` | `topic_id`、`unit_id`、`membership_type`、`enabled` | 连接课题和单位 | 关系类型为`LEAD`牵头或`PARTICIPANT`承担；同课题同单位只能有一条关系；同课题只有一个有效牵头关系 |

### 角色与课题关系不是同一件事

| 概念 | 解决的问题 | 示例 |
|---|---|---|
| 用户角色 | 用户可以进入哪些页面、执行哪些类型的动作 | 清华大学账号是“外部课题单位” |
| 单位属性 | 是否允许访问企业自筹业务 | 广西电网内部单位可以管理自筹项目，高校不能访问 |
| 课题成员关系 | 用户可以访问哪些课题，在课题中是牵头还是承担 | 清华大学在课题1是牵头单位，在课题2可以是承担单位 |

## 4. 科研指标表

| 中文名称 | 数据表 | 关键字段 | 关联关系 | 关键规则 |
|---|---|---|---|---|
| 考核时间节点 | `time_node` | `project_id`、`code`、`name`、`deadline`、`sort_order` | 属于重点项目，被课题指标、单位指标和成果引用 | 时间节点用于表达“截至某个日期累计应完成多少” |
| 指标定义 | `indicator_definition` | `code`、`name`、`achievement_type`、`category`、`match_rule` | 被课题指标、单位指标和成果引用 | 五类基础成果固定；`SPECIAL`专项指标是基础总量子集，不重复计入总数 |
| 课题指标 | `topic_indicator` | `topic_id`、`node_id`、`indicator_definition_id`、`target_quantity`、`status`、`publish_version` | 科研助理下发给课题 | 同一课题、节点和指标只有一条记录；数量为累计目标 |
| 单位指标分配 | `unit_indicator_allocation` | `topic_id`、`membership_id`、`unit_id`、`node_id`、`indicator_definition_id`、`target_quantity`、`status` | 牵头单位把课题指标分配给课题成员单位 | 同一单位、节点、指标只有一条分配；所有单位合计不得低于课题指标 |

## 5. 成果管理表

| 中文名称 | 数据表 | 关键字段 | 关联关系 | 关键规则 |
|---|---|---|---|---|
| 成果 | `achievement` | `topic_id`、`membership_id`、`unit_id`、`node_id`、`achievement_type`、`title`、`detail_json`、`status`、版本号 | 归属一个课题和上传单位，关联成果材料、审批和版本快照 | 谁上传就计入谁的单位指标；成果不归属配套自筹项目；不同成果类型的差异字段保存在`detail_json` |
| 成果材料 | `achievement_material` | `achievement_id`、`file_id`、`material_type`、`material_status`、`file_version` | 连接成果和文件对象 | 预审阶段不强制上传原文；取得正式材料后补充文件 |

### 成果版本字段

| 字段 | 含义 |
|---|---|
| `record_version` | 当前记录被编辑了多少版，用于避免两个人互相覆盖修改 |
| `submitted_version` | 每次正式提交审核时递增，对应一份不可变提交快照 |
| `counts_to_indicator` | 终审通过且满足统计条件后，是否已经计入指标完成数 |

## 6. 月报和季报表

| 中文名称 | 数据表 | 关键字段 | 关联关系 | 关键规则 |
|---|---|---|---|---|
| 课题填报规则 | `topic_report_rule` | `topic_id`、`effective_year`、月报启用/开放日/截止日、季报启用/月份/开放日/截止日 | 每个课题独立配置 | 同一课题同一年度只有一套规则，不再存在项目统一规则 |
| 填报期间 | `report_task` | `topic_id`、`report_type`、`report_year`、`period_no`、`open_date`、`deadline` | 对应某课题某月或某季度 | 同一课题、类型、年度、期次唯一；用于统计应填期间，但不自动生成空白月季报 |
| 月季报 | `progress_report` | `task_id`、`topic_id`、六类填报正文、`status`、`overdue`、版本号 | 属于一个填报期间，关联审批和提交快照 | 每课题每期最多一份；仅课题牵头单位编辑和提交；承担单位只读 |

## 7. 审批与版本表

| 中文名称 | 数据表 | 关键字段 | 关联关系 | 关键规则 |
|---|---|---|---|---|
| 审批记录 | `approval_record` | `business_type`、`business_id`、`stage`、`approval_level`、`decision`、`opinion`、`operator_id`、`submitted_version` | 指向成果或月季报 | 只服务成果和月季报；归档材料不能写入此表；科研助理初审、技术负责人终审 |
| 提交快照 | `submission_snapshot` | `business_type`、`business_id`、`stage`、`submitted_version`、`submitter_id`、`payload_json` | 指向成果或月季报 | 每个业务版本只有一份不可变快照，退回重提后形成新版本 |

## 8. 文件和归档表

| 中文名称 | 数据表 | 关键字段 | 关联关系 | 关键规则 |
|---|---|---|---|---|
| 文件对象 | `file_object` | `storage_provider`、`bucket_name`、`object_key`、`original_name`、类型、大小、校验值、状态、上传人 | 被成果材料和归档文件关系引用 | 业务表只保存文件ID；存储可以从Mock切换到MinIO或其他S3服务 |
| 归档要求模板 | `archive_requirement_template` | `template_code`、`template_version`、`owner_type`、`project_type`、`name`、是否必需、要求数量 | 创建国家材料或自筹材料预置文件夹的依据 | 模板发布后以版本固定，后续修改不影响已经生成的目录 |
| 配套自筹项目 | `self_funded_project` | `topic_id`、`owner_unit_id`、`code`、`name`、`project_type`、负责人、预算、状态、模板版本 | 属于一个课题和一个内部单位，关联归档文件夹 | 外部单位不能读取或创建；内部牵头单位只可查看其他单位项目，不能代为编辑 |
| 归档文件夹 | `archive_folder` | `owner_type`、`owner_id`、`topic_id`、`unit_id`、`name`、是否必需、要求数量、`custom_flag`、适用性 | 关联国家材料或自筹项目，并包含多个文件 | 国家材料按“课题＋单位”独立；预置文件夹不可删除；自定义文件夹可由本单位增删 |
| 文件夹文件关系 | `archive_folder_file` | `folder_id`、`file_id`、`uploader_id`、创建时间、删除时间 | 连接归档文件夹和文件对象 | 同一文件不能重复放入同一文件夹；采用软删除；上传后直接统计，不审批 |

### 两类归档材料的数据归属

| 材料类型 | `owner_type` | `owner_id`代表什么 | 谁可以编辑 | 是否审批 |
|---|---|---|---|---|
| 国家课题材料 | `TOPIC_NATIONAL` | 课题ID | 每个课题成员单位只编辑本单位目录 | 否 |
| 配套自筹材料 | `SELF_FUNDED` | 配套自筹项目ID | 自筹项目所属内部单位 | 否 |

## 9. 系统支撑表

| 中文名称 | 数据表 | 关键字段 | 关联关系 | 关键规则 |
|---|---|---|---|---|
| 接口幂等记录 | `api_idempotency` | `user_id`、`idempotency_key`、`operation_code`、请求摘要、响应结果、过期时间 | 关联操作用户 | 防止重复点击导致重复提交或重复审批；用户、操作、幂等键组合唯一 |
| 操作审计日志 | `audit_log` | 用户、动作、资源类型和ID、请求ID、IP、是否成功、详情、时间 | 可关联用户和任意业务资源 | 记录关键新增、修改、提交、审批、启停和文件操作，原则上只新增不修改 |

## 10. 通用字段说明

| 字段 | 作用 |
|---|---|
| `id` | 数据主键；后端返回前端时转为字符串 |
| `created_by` / `created_at` | 谁在什么时间创建 |
| `updated_by` / `updated_at` | 谁在什么时间最后修改 |
| `enabled` | 当前数据是否启用，停用后历史记录仍保留 |
| `deleted_at` | 软删除时间；为空表示未删除 |
| `record_version` | 乐观锁版本号，防止并发修改覆盖 |
| `status` | 当前业务流程状态，使用字符串便于以后增加状态 |

## 11. 最重要的数据关系

| 上级数据 | 下级数据 | 关系 |
|---|---|---|
| 重点项目 | 课题 | 一个重点项目包含多个课题 |
| 课题 | 课题单位关系 | 一个课题有一个牵头单位和多个承担单位 |
| 单位 | 课题单位关系 | 一个单位可以参与多个课题，并在不同课题承担不同身份 |
| 课题 | 课题指标 | 一个课题在不同时间节点有多项累计指标 |
| 课题指标 | 单位指标分配 | 牵头单位把课题指标分配到每个成员单位 |
| 课题＋单位 | 成果 | 单位上传成果并完成自己的指标 |
| 课题＋期间 | 月季报 | 每课题每期最多一份，只由牵头单位提交 |
| 课题＋单位 | 国家材料文件夹 | 每个参与单位都有独立国家材料清单 |
| 课题＋内部单位 | 配套自筹项目 | 一个内部单位在一个课题下可以创建多个自筹项目 |
| 自筹项目 | 归档文件夹 | 一个自筹项目按照模板生成多个材料目录 |
