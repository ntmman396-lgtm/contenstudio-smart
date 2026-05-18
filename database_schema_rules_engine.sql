-- Rules Engine database schema for Long Châu Content Studio

CREATE TABLE rule_sections (
   id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   code          VARCHAR(30) UNIQUE NOT NULL, -- 'LINK' | 'CONTENT' | 'MEDICAL' | 'FORMAT' | 'SOURCE'
   name          VARCHAR(100) NOT NULL,       -- 'Link & Domain Rules'
   description   TEXT,
   sort_order    INT,
   is_active     BOOLEAN DEFAULT true
);

CREATE TABLE rules (
   id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   section_id        UUID REFERENCES rule_sections(id) ON DELETE CASCADE,
   code              VARCHAR(80) UNIQUE NOT NULL,
   name              VARCHAR(300) NOT NULL,
   description       TEXT,
   check_type        VARCHAR(30) NOT NULL,
     -- 'regex' | 'no_external_link' | 'no_cross_domain'
     -- 'min_count' | 'max_length' | 'custom_ai' | 'unique_score'
   check_config      JSONB,
   deduction         INT,             -- điểm trừ mỗi vi phạm
   max_deduction     INT,             -- trần điểm trừ tối đa
   auto_fixable      BOOLEAN DEFAULT false,
   fix_instruction   TEXT,            -- hướng dẫn AI khi auto-fix
   severity          VARCHAR(10),     -- 'info' | 'warning' | 'critical'
   applies_to        TEXT[],          -- ['*'] hoặc ['BENH_LY','THUOC'...]
   scope             VARCHAR(20),     -- 'global' | 'template_specific'
   is_active         BOOLEAN DEFAULT true,
   is_system         BOOLEAN DEFAULT false,  -- true = không cho xóa
   created_by        VARCHAR(100),
   created_at        TIMESTAMPTZ DEFAULT NOW(),
   updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rule_template_overrides (
   id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   rule_id       UUID REFERENCES rules(id) ON DELETE CASCADE,
   template_id   VARCHAR(30) NOT NULL,
   deduction     INT,             -- override điểm trừ riêng cho template này
   is_active     BOOLEAN,         -- tắt rule này riêng cho template này
   note          TEXT,            -- lý do override
   created_by    VARCHAR(100),
   created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rule_domain_configs (
   id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   config_key    VARCHAR(50) UNIQUE NOT NULL,
     -- 'allowed_internal_domains'
     -- 'allowed_reference_domains'
     -- 'cross_domain_groups'
     -- 'blocked_domains'
   config_value  JSONB NOT NULL,
   description   TEXT,
   updated_by    VARCHAR(100),
   updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rule_change_logs (
   id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   rule_id       UUID REFERENCES rules(id) ON DELETE CASCADE,
   changed_by    VARCHAR(100),
   change_type   VARCHAR(20),  -- 'created'|'updated'|'activated'|'deactivated'
   old_value     JSONB,
   new_value     JSONB,
   note          TEXT,
   created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- SEED rule_domain_configs
INSERT INTO rule_domain_configs (config_key, config_value, description) VALUES
('allowed_internal_domains',
  '["nhathuoclongchau.com.vn", "tiemchunglongchau.com.vn"]',
  'Domain nội bộ được phép link trong nội dung bài viết'),

('allowed_reference_domains',
  '["who.int","cdc.gov","pubmed.ncbi.nlm.nih.gov","ncbi.nlm.nih.gov",
    "thelancet.com","nejm.org","bmj.com","uptodate.com",
    "emc.medicines.org.uk","mims.com","cochranelibrary.com"]',
  'Domain được phép dùng trong phần nguồn tham khảo'),

('cross_domain_groups',
  '[["nhathuoclongchau.com.vn"],["tiemchunglongchau.com.vn"]]',
  'Các domain trong cùng nhóm được link nhau, khác nhóm thì không'),

('blocked_domains',
  '[]',
  'Domain bị chặn tuyệt đối, không xuất hiện bất kỳ đâu trong bài');
