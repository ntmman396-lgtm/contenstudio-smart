-- Knowledge Base system database schema for Long Châu Content Studio

-- Bật pgvector extension để hỗ trợ similarity search (Embedding 1536 chiều của OpenAI)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE kb_sources (
   id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   title           VARCHAR(500) NOT NULL,       -- tên tài liệu / tên trang web
   source_type     VARCHAR(20) NOT NULL,        -- 'pdf' | 'url' | 'manual'
   origin_url      VARCHAR(2000),               -- URL gốc nếu là web
   file_path       VARCHAR(500),                -- đường dẫn file nếu là PDF
   file_size_kb    INT,
   page_count      INT,                         -- số trang (PDF)
   language        VARCHAR(10),                 -- 'vi' | 'en'
   publisher       VARCHAR(300),                -- WHO, CDC, PubMed...
   publish_year    INT,
   topic_tags      TEXT[],                      -- ['tiểu đường','insulin','nội tiết']
   template_tags   TEXT[],                      -- ['BENH_LY','THUOC'] template nào dùng
   status          VARCHAR(20) DEFAULT 'processing', -- 'processing' | 'ready' | 'error'
   chunk_count     INT DEFAULT 0,               -- số chunk đã embed
   is_active       BOOLEAN DEFAULT true,
   uploaded_by     VARCHAR(100),
   created_at      TIMESTAMPTZ DEFAULT NOW(),
   last_indexed_at TIMESTAMPTZ
);

CREATE TABLE kb_chunks (
   id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   source_id       UUID REFERENCES kb_sources(id) ON DELETE CASCADE,
   chunk_index     INT NOT NULL,                -- thứ tự chunk trong tài liệu
   content         TEXT NOT NULL,               -- nội dung text chunk
   content_length  INT,                         -- số ký tự
   page_number     INT,                         -- trang PDF (nếu có)
   section_heading VARCHAR(500),                -- heading của section chứa chunk
   embedding       VECTOR(1536),                -- vector embedding (pgvector)
   metadata        JSONB,                       -- {source_title, publisher, year, url}
   created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Giả định bảng 'articles' đã tồn tại trong DB, nếu chưa có cần tạo trước khi chạy lệnh REFERENCES
CREATE TABLE article_citations (
   id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   article_id      UUID REFERENCES articles(id) ON DELETE CASCADE,
   chunk_id        UUID REFERENCES kb_chunks(id) ON DELETE SET NULL,  -- NULL nếu nguồn ngoài KB
   source_id       UUID REFERENCES kb_sources(id) ON DELETE SET NULL, -- NULL nếu nguồn ngoài KB
   citation_type   VARCHAR(20) NOT NULL,        -- 'kb_internal' | 'ai_external' | 'manual'
   cited_text      TEXT NOT NULL,               -- đoạn văn trong bài dùng nguồn này
   source_title    VARCHAR(500),
   source_url      VARCHAR(2000),
   publisher       VARCHAR(300),
   publish_year    INT,
   transparency_note TEXT,                      -- AI phải ghi rõ nếu lấy nguồn ngoài KB
   created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kb_search_logs (
   id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   article_id      UUID REFERENCES articles(id) ON DELETE CASCADE,
   query           TEXT NOT NULL,               -- câu query dùng để tìm
   results_count   INT,                         -- số kết quả trả về
   top_score       FLOAT,                       -- similarity score cao nhất
   used_external   BOOLEAN,                     -- có phải lấy nguồn ngoài KB không
   created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES: Tối ưu query, similarity search và caching
CREATE INDEX idx_kb_chunks_embedding ON kb_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_kb_chunks_source_id ON kb_chunks(source_id);
CREATE INDEX idx_kb_sources_topic_tags ON kb_sources USING GIN(topic_tags);
CREATE INDEX idx_kb_sources_template_tags ON kb_sources USING GIN(template_tags);
CREATE INDEX idx_article_citations_article_id ON article_citations(article_id);
