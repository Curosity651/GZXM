-- 重点项目科研管理系统：MySQL 8.0+ 基础模型
-- 约定：API 将 BIGINT ID 序列化为字符串；状态使用 VARCHAR，避免数据库 ENUM 阻碍流程演进。
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE sys_unit (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(200) NOT NULL,
  internal_flag TINYINT(1) NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY uk_unit_code (code),
  UNIQUE KEY uk_unit_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sys_role (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) NULL,
  built_in TINYINT(1) NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_role_code (code),
  UNIQUE KEY uk_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sys_permission (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  permission_type VARCHAR(16) NOT NULL COMMENT 'PAGE/ACTION',
  permission_group VARCHAR(64) NOT NULL,
  locked_for_external TINYINT(1) NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uk_permission_code (code),
  CHECK (permission_type IN ('PAGE', 'ACTION'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sys_role_permission (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id) REFERENCES sys_role(id),
  CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id) REFERENCES sys_permission(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sys_user (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  phone VARCHAR(32) NULL,
  email VARCHAR(254) NULL,
  unit_id BIGINT UNSIGNED NULL,
  account_type VARCHAR(20) NOT NULL DEFAULT 'PLATFORM' COMMENT 'PLATFORM/TOPIC_UNIT',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  token_version INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '停用、改密、退出全部设备时递增',
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  active_topic_unit_key BIGINT UNSIGNED GENERATED ALWAYS AS (
    CASE WHEN account_type = 'TOPIC_UNIT' AND enabled = 1 AND deleted_at IS NULL THEN unit_id ELSE NULL END
  ) STORED,
  UNIQUE KEY uk_user_username (username),
  UNIQUE KEY uk_one_active_topic_account_per_unit (active_topic_unit_key),
  KEY idx_user_unit (unit_id),
  CONSTRAINT fk_user_unit FOREIGN KEY (unit_id) REFERENCES sys_unit(id),
  CHECK (account_type IN ('PLATFORM', 'TOPIC_UNIT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sys_user_role (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  KEY idx_user_role_role (role_id),
  CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES sys_user(id),
  CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES sys_role(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE biz_project (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(300) NOT NULL,
  description TEXT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  record_version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_project_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE biz_topic (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(300) NOT NULL,
  summary TEXT NULL,
  lead_unit_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'DRAFT/ACTIVE/PAUSED/CLOSED',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  start_date DATE NULL,
  end_date DATE NULL,
  record_version INT UNSIGNED NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_topic_project_code (project_id, code),
  KEY idx_topic_lead_unit (lead_unit_id),
  KEY idx_topic_status (enabled, status),
  CONSTRAINT fk_topic_project FOREIGN KEY (project_id) REFERENCES biz_project(id),
  CONSTRAINT fk_topic_lead_unit FOREIGN KEY (lead_unit_id) REFERENCES sys_unit(id),
  CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE biz_topic_unit_membership (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  topic_id BIGINT UNSIGNED NOT NULL,
  unit_id BIGINT UNSIGNED NOT NULL,
  membership_type VARCHAR(20) NOT NULL COMMENT 'LEAD/PARTICIPANT',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  active_lead_topic_key BIGINT UNSIGNED GENERATED ALWAYS AS (
    CASE WHEN membership_type = 'LEAD' AND enabled = 1 THEN topic_id ELSE NULL END
  ) STORED,
  UNIQUE KEY uk_topic_unit (topic_id, unit_id),
  UNIQUE KEY uk_one_active_lead_per_topic (active_lead_topic_key),
  KEY idx_membership_unit (unit_id, enabled),
  CONSTRAINT fk_membership_topic FOREIGN KEY (topic_id) REFERENCES biz_topic(id),
  CONSTRAINT fk_membership_unit FOREIGN KEY (unit_id) REFERENCES sys_unit(id),
  CHECK (membership_type IN ('LEAD', 'PARTICIPANT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE time_node (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  deadline DATE NOT NULL,
  sort_order INT NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uk_node_project_code (project_id, code),
  UNIQUE KEY uk_node_project_order (project_id, sort_order),
  CONSTRAINT fk_node_project FOREIGN KEY (project_id) REFERENCES biz_project(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE indicator_definition (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  achievement_type VARCHAR(32) NOT NULL COMMENT 'PAPER/PATENT/COPYRIGHT/STANDARD/TALENT',
  category VARCHAR(16) NOT NULL COMMENT 'BASE/SPECIAL',
  unit_name VARCHAR(20) NOT NULL,
  match_rule JSON NULL COMMENT '专项指标匹配条件；基础指标为空',
  built_in TINYINT(1) NOT NULL DEFAULT 1,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uk_indicator_code (code),
  CHECK (category IN ('BASE', 'SPECIAL'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE topic_indicator (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  node_id BIGINT UNSIGNED NOT NULL,
  indicator_definition_id BIGINT UNSIGNED NOT NULL,
  target_quantity INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '截至该节点的累计目标',
  status VARCHAR(16) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT/PUBLISHED',
  publish_version INT UNSIGNED NOT NULL DEFAULT 0,
  published_by BIGINT UNSIGNED NULL,
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_topic_indicator_node (topic_id, node_id, indicator_definition_id),
  KEY idx_topic_indicator_query (topic_id, node_id, status),
  CONSTRAINT fk_topic_indicator_topic FOREIGN KEY (topic_id) REFERENCES biz_topic(id),
  CONSTRAINT fk_topic_indicator_node FOREIGN KEY (node_id) REFERENCES time_node(id),
  CONSTRAINT fk_topic_indicator_definition FOREIGN KEY (indicator_definition_id) REFERENCES indicator_definition(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE unit_indicator_allocation (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  membership_id BIGINT UNSIGNED NOT NULL,
  unit_id BIGINT UNSIGNED NOT NULL,
  node_id BIGINT UNSIGNED NOT NULL,
  indicator_definition_id BIGINT UNSIGNED NOT NULL,
  topic_indicator_id BIGINT UNSIGNED NOT NULL,
  target_quantity INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '截至该节点的单位累计目标',
  status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
  publish_version INT UNSIGNED NOT NULL DEFAULT 0,
  published_by BIGINT UNSIGNED NULL,
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_unit_allocation (topic_id, unit_id, node_id, indicator_definition_id),
  KEY idx_allocation_membership (membership_id),
  CONSTRAINT fk_allocation_topic FOREIGN KEY (topic_id) REFERENCES biz_topic(id),
  CONSTRAINT fk_allocation_membership FOREIGN KEY (membership_id) REFERENCES biz_topic_unit_membership(id),
  CONSTRAINT fk_allocation_unit FOREIGN KEY (unit_id) REFERENCES sys_unit(id),
  CONSTRAINT fk_allocation_node FOREIGN KEY (node_id) REFERENCES time_node(id),
  CONSTRAINT fk_allocation_definition FOREIGN KEY (indicator_definition_id) REFERENCES indicator_definition(id),
  CONSTRAINT fk_allocation_topic_indicator FOREIGN KEY (topic_indicator_id) REFERENCES topic_indicator(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE achievement (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  membership_id BIGINT UNSIGNED NOT NULL,
  unit_id BIGINT UNSIGNED NOT NULL,
  node_id BIGINT UNSIGNED NOT NULL,
  indicator_definition_id BIGINT UNSIGNED NOT NULL COMMENT '五类基础成果指标',
  achievement_type VARCHAR(32) NOT NULL,
  title VARCHAR(500) NOT NULL,
  responsible_person VARCHAR(100) NOT NULL,
  status VARCHAR(40) NOT NULL,
  counts_to_indicator TINYINT(1) NOT NULL DEFAULT 0,
  detail_json JSON NOT NULL COMMENT '论文/专利/软著/标准/人才差异字段',
  record_version INT UNSIGNED NOT NULL DEFAULT 1,
  submitted_version INT UNSIGNED NOT NULL DEFAULT 0,
  submitted_at DATETIME(3) NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_achievement_scope (topic_id, unit_id, status),
  KEY idx_achievement_node_type (node_id, achievement_type),
  CONSTRAINT fk_achievement_topic FOREIGN KEY (topic_id) REFERENCES biz_topic(id),
  CONSTRAINT fk_achievement_membership FOREIGN KEY (membership_id) REFERENCES biz_topic_unit_membership(id),
  CONSTRAINT fk_achievement_unit FOREIGN KEY (unit_id) REFERENCES sys_unit(id),
  CONSTRAINT fk_achievement_node FOREIGN KEY (node_id) REFERENCES time_node(id),
  CONSTRAINT fk_achievement_definition FOREIGN KEY (indicator_definition_id) REFERENCES indicator_definition(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE topic_report_rule (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  topic_id BIGINT UNSIGNED NOT NULL,
  effective_year SMALLINT UNSIGNED NOT NULL,
  monthly_enabled TINYINT(1) NOT NULL DEFAULT 1,
  monthly_open_day TINYINT UNSIGNED NOT NULL,
  monthly_deadline_day TINYINT UNSIGNED NOT NULL,
  quarterly_enabled TINYINT(1) NOT NULL DEFAULT 1,
  quarterly_open_day TINYINT UNSIGNED NOT NULL,
  quarterly_deadline_day TINYINT UNSIGNED NOT NULL,
  quarterly_months JSON NOT NULL,
  record_version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_topic_report_rule_year (topic_id, effective_year),
  CONSTRAINT fk_report_rule_topic FOREIGN KEY (topic_id) REFERENCES biz_topic(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE report_task (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  topic_id BIGINT UNSIGNED NOT NULL,
  report_type VARCHAR(16) NOT NULL COMMENT 'MONTHLY/QUARTERLY',
  report_year SMALLINT UNSIGNED NOT NULL,
  period_no TINYINT UNSIGNED NOT NULL,
  open_date DATE NOT NULL,
  deadline DATE NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_report_task_period (topic_id, report_type, report_year, period_no),
  CONSTRAINT fk_report_task_topic FOREIGN KEY (topic_id) REFERENCES biz_topic(id),
  CHECK (report_type IN ('MONTHLY', 'QUARTERLY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE progress_report (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  report_type VARCHAR(16) NOT NULL,
  milestone_progress TEXT NOT NULL,
  overall_progress TEXT NOT NULL,
  demonstration_progress TEXT NOT NULL,
  fund_usage TEXT NOT NULL,
  next_plan TEXT NOT NULL,
  problems_and_measures TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
  overdue TINYINT(1) NOT NULL DEFAULT 0,
  record_version INT UNSIGNED NOT NULL DEFAULT 1,
  submitted_version INT UNSIGNED NOT NULL DEFAULT 0,
  submitted_at DATETIME(3) NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_progress_report_task (task_id),
  KEY idx_report_scope (topic_id, status),
  CONSTRAINT fk_progress_report_task FOREIGN KEY (task_id) REFERENCES report_task(id),
  CONSTRAINT fk_progress_report_topic FOREIGN KEY (topic_id) REFERENCES biz_topic(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE approval_record (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  business_type VARCHAR(20) NOT NULL COMMENT 'ACHIEVEMENT/REPORT',
  business_id BIGINT UNSIGNED NOT NULL,
  stage VARCHAR(24) NOT NULL,
  approval_level VARCHAR(16) NOT NULL COMMENT 'INITIAL/FINAL',
  decision VARCHAR(16) NOT NULL COMMENT 'APPROVED/RETURNED',
  opinion VARCHAR(1000) NULL,
  operator_id BIGINT UNSIGNED NOT NULL,
  submitted_version INT UNSIGNED NOT NULL,
  operated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_approval_business (business_type, business_id, submitted_version),
  KEY idx_approval_operator (operator_id, operated_at),
  CONSTRAINT fk_approval_operator FOREIGN KEY (operator_id) REFERENCES sys_user(id),
  CHECK (business_type IN ('ACHIEVEMENT', 'REPORT')),
  CHECK (approval_level IN ('INITIAL', 'FINAL')),
  CHECK (decision IN ('APPROVED', 'RETURNED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE submission_snapshot (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  business_type VARCHAR(20) NOT NULL,
  business_id BIGINT UNSIGNED NOT NULL,
  stage VARCHAR(24) NOT NULL,
  submitted_version INT UNSIGNED NOT NULL,
  submitter_id BIGINT UNSIGNED NOT NULL,
  payload_json JSON NOT NULL COMMENT '提交时业务字段和文件元数据的不可变快照',
  submitted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_snapshot_version (business_type, business_id, submitted_version),
  CONSTRAINT fk_snapshot_submitter FOREIGN KEY (submitter_id) REFERENCES sys_user(id),
  CHECK (business_type IN ('ACHIEVEMENT', 'REPORT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE file_object (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  storage_provider VARCHAR(32) NOT NULL DEFAULT 'MOCK' COMMENT 'MOCK/MINIO/S3',
  bucket_name VARCHAR(100) NOT NULL,
  object_key VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  content_type VARCHAR(200) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  sha256 CHAR(64) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/READY/DELETED',
  uploader_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at DATETIME(3) NULL,
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY uk_file_object (bucket_name, object_key),
  KEY idx_file_uploader (uploader_id, created_at),
  CONSTRAINT fk_file_uploader FOREIGN KEY (uploader_id) REFERENCES sys_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE achievement_material (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  achievement_id BIGINT UNSIGNED NOT NULL,
  file_id BIGINT UNSIGNED NOT NULL,
  material_type VARCHAR(100) NOT NULL,
  material_status VARCHAR(20) NOT NULL DEFAULT 'UNSUBMITTED',
  file_version INT UNSIGNED NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_achievement_material_version (achievement_id, material_type, file_version),
  KEY idx_achievement_material_file (file_id),
  CONSTRAINT fk_material_achievement FOREIGN KEY (achievement_id) REFERENCES achievement(id),
  CONSTRAINT fk_material_file FOREIGN KEY (file_id) REFERENCES file_object(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE archive_requirement_template (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  template_code VARCHAR(100) NOT NULL,
  template_version INT UNSIGNED NOT NULL,
  owner_type VARCHAR(24) NOT NULL COMMENT 'TOPIC_NATIONAL/SELF_FUNDED',
  project_type VARCHAR(32) NULL COMMENT '自筹模板类型',
  name VARCHAR(300) NOT NULL,
  required_flag TINYINT(1) NOT NULL DEFAULT 1,
  required_quantity INT UNSIGNED NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uk_archive_template_item (template_code, template_version, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE self_funded_project (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  topic_id BIGINT UNSIGNED NOT NULL,
  owner_unit_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(300) NOT NULL,
  project_type VARCHAR(32) NOT NULL COMMENT 'TECHNOLOGY/RENOVATION/INFRASTRUCTURE',
  principal_name VARCHAR(100) NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  budget DECIMAL(16,2) NULL,
  status VARCHAR(24) NOT NULL,
  template_code VARCHAR(100) NOT NULL,
  template_version INT UNSIGNED NOT NULL,
  record_version INT UNSIGNED NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_self_funded_code (topic_id, owner_unit_id, code),
  KEY idx_self_funded_scope (topic_id, owner_unit_id),
  CONSTRAINT fk_self_funded_topic FOREIGN KEY (topic_id) REFERENCES biz_topic(id),
  CONSTRAINT fk_self_funded_unit FOREIGN KEY (owner_unit_id) REFERENCES sys_unit(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE archive_folder (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  requirement_template_id BIGINT UNSIGNED NULL COMMENT '自定义文件夹为空',
  owner_type VARCHAR(24) NOT NULL COMMENT 'TOPIC_NATIONAL/SELF_FUNDED',
  owner_id BIGINT UNSIGNED NOT NULL COMMENT '国家材料为 topic_id，自筹材料为 self_funded_project.id',
  topic_id BIGINT UNSIGNED NOT NULL,
  unit_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(300) NOT NULL,
  required_flag TINYINT(1) NOT NULL DEFAULT 1,
  required_quantity INT UNSIGNED NOT NULL DEFAULT 1,
  custom_flag TINYINT(1) NOT NULL DEFAULT 0,
  applicability VARCHAR(24) NOT NULL DEFAULT 'APPLICABLE',
  non_applicable_reason VARCHAR(1000) NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  KEY idx_archive_folder_scope (owner_type, topic_id, unit_id),
  KEY idx_archive_folder_owner (owner_type, owner_id),
  CONSTRAINT fk_archive_folder_template FOREIGN KEY (requirement_template_id) REFERENCES archive_requirement_template(id),
  CONSTRAINT fk_archive_folder_topic FOREIGN KEY (topic_id) REFERENCES biz_topic(id),
  CONSTRAINT fk_archive_folder_unit FOREIGN KEY (unit_id) REFERENCES sys_unit(id),
  CHECK (owner_type IN ('TOPIC_NATIONAL', 'SELF_FUNDED')),
  CHECK (applicability IN ('PENDING', 'APPLICABLE', 'NOT_APPLICABLE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE archive_folder_file (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  folder_id BIGINT UNSIGNED NOT NULL,
  file_id BIGINT UNSIGNED NOT NULL,
  uploader_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY uk_archive_folder_file (folder_id, file_id),
  KEY idx_archive_file_file (file_id),
  CONSTRAINT fk_archive_file_folder FOREIGN KEY (folder_id) REFERENCES archive_folder(id),
  CONSTRAINT fk_archive_file_object FOREIGN KEY (file_id) REFERENCES file_object(id),
  CONSTRAINT fk_archive_file_uploader FOREIGN KEY (uploader_id) REFERENCES sys_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE api_idempotency (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL,
  operation_code VARCHAR(100) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  response_status INT NULL,
  response_body JSON NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_idempotency (user_id, operation_code, idempotency_key),
  KEY idx_idempotency_expiry (expires_at),
  CONSTRAINT fk_idempotency_user FOREIGN KEY (user_id) REFERENCES sys_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE audit_log (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  username VARCHAR(100) NULL,
  action_code VARCHAR(100) NOT NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id VARCHAR(64) NULL,
  request_id VARCHAR(64) NULL,
  ip_address VARCHAR(64) NULL,
  success_flag TINYINT(1) NOT NULL,
  detail_json JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_audit_resource (resource_type, resource_id, created_at),
  KEY idx_audit_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- 初始化时至少写入以下固定角色：
-- SYSTEM_ADMIN、PROJECT_TECH_LEADER、RESEARCH_ASSISTANT、INTERNAL_TOPIC_UNIT、EXTERNAL_TOPIC_UNIT。
-- 外部课题单位的 self-funded 页面/动作权限必须在服务端硬限制，不能通过角色配置开启。
