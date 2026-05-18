-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "specialties" TEXT,
    "capacity" INTEGER,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sapo" TEXT,
    "content" TEXT,
    "references" TEXT,
    "seoMeta" TEXT,
    "category" TEXT,
    "tags" TEXT,
    "templateId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "siteId" TEXT NOT NULL DEFAULT 'nha-thuoc',
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3),
    "rawFields" TEXT,
    "citationReport" TEXT,
    "citationVerification" TEXT,
    "workflowStatus" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT,
    "assignedCtvId" TEXT,
    "assignedBsId" TEXT,
    "specialty" TEXT,
    "rejectionReason" TEXT,
    "revisionChecklist" TEXT,
    "inlineComments" TEXT,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "ctaContent" TEXT,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "assignedBy" TEXT,
    "approvedBy" TEXT,
    "qcScore" DOUBLE PRECISION,
    "qcGrade" TEXT,
    "qcBadge" TEXT,
    "qcAutoFixes" INTEGER DEFAULT 0,
    "qcManualIssues" INTEGER DEFAULT 0,
    "qcSyncBlocked" BOOLEAN DEFAULT false,
    "qcBlockedBy" TEXT,
    "qcBlockedReason" TEXT,
    "qcLastRun" TIMESTAMP(3),
    "qcTechScore" TEXT,
    "qcTechGrade" TEXT,
    "qcContentScore" TEXT,
    "qcContentGrade" TEXT,
    "qcContentReviewerNote" TEXT,
    "qcRiskScore" DOUBLE PRECISION,
    "qcSafetyScore" DOUBLE PRECISION,
    "qcFinalSafetyIndex" DOUBLE PRECISION,
    "qcDecision" TEXT,
    "qcRiskLevel" TEXT,
    "qcFindings" TEXT,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siteId" TEXT NOT NULL DEFAULT 'nha-thuoc',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siteId" TEXT NOT NULL DEFAULT 'nha-thuoc',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_links" (
    "id" TEXT NOT NULL,
    "anchor" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "siteId" TEXT NOT NULL DEFAULT 'nha-thuoc',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "stepCount" INTEGER NOT NULL DEFAULT 0,
    "steps" TEXT,
    "estimatedWords" TEXT,
    "systemPrompt" TEXT,
    "outline" TEXT,
    "requiredFields" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_sources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "scope" TEXT,
    "originUrl" TEXT,
    "filePath" TEXT,
    "extractedText" TEXT,
    "fileSizeKb" INTEGER,
    "pageCount" INTEGER,
    "language" TEXT,
    "publisher" TEXT,
    "publishYear" INTEGER,
    "topicTags" TEXT,
    "templateTags" TEXT,
    "siteId" TEXT NOT NULL DEFAULT 'nha-thuoc',
    "status" TEXT NOT NULL,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastIndexedAt" TIMESTAMP(3),
    "errorMsg" TEXT,

    CONSTRAINT "kb_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_chunks" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "contentLength" INTEGER NOT NULL,
    "pageNumber" INTEGER,
    "sectionHeading" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kb_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_citation_logs" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "articleTitle" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCitations" INTEGER NOT NULL DEFAULT 0,
    "kbCitations" INTEGER NOT NULL DEFAULT 0,
    "externalCitations" INTEGER NOT NULL DEFAULT 0,
    "unverified" INTEGER NOT NULL DEFAULT 0,
    "transparencyNotes" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "kb_citation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_rules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "subDimension" TEXT NOT NULL,
    "deduction" INTEGER NOT NULL,
    "maxDeduction" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "autoFixable" BOOLEAN NOT NULL DEFAULT false,
    "fixInstruction" TEXT NOT NULL,
    "appliesTo" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_logs" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_status_idx" ON "articles"("status");

-- CreateIndex
CREATE INDEX "articles_workflowStatus_idx" ON "articles"("workflowStatus");

-- CreateIndex
CREATE INDEX "articles_templateId_idx" ON "articles"("templateId");

-- CreateIndex
CREATE INDEX "articles_siteId_idx" ON "articles"("siteId");

-- CreateIndex
CREATE INDEX "articles_createdBy_idx" ON "articles"("createdBy");

-- CreateIndex
CREATE INDEX "articles_assignedBsId_idx" ON "articles"("assignedBsId");

-- CreateIndex
CREATE INDEX "categories_siteId_idx" ON "categories"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_siteId_key" ON "categories"("name", "siteId");

-- CreateIndex
CREATE INDEX "tags_siteId_idx" ON "tags"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_siteId_key" ON "tags"("name", "siteId");

-- CreateIndex
CREATE INDEX "internal_links_siteId_idx" ON "internal_links"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "internal_links_anchor_siteId_key" ON "internal_links"("anchor", "siteId");

-- CreateIndex
CREATE INDEX "kb_sources_siteId_idx" ON "kb_sources"("siteId");

-- CreateIndex
CREATE INDEX "kb_chunks_sourceId_idx" ON "kb_chunks"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "qc_rules_code_key" ON "qc_rules"("code");

-- CreateIndex
CREATE INDEX "workflow_logs_articleId_idx" ON "workflow_logs"("articleId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
