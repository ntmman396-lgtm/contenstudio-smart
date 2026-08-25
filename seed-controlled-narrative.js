/**
 * Seed template Controlled Narrative (Bác sĩ Anchor V4) vào DB
 * Chạy: node seed-controlled-narrative.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🩺 Đang thêm template Controlled Narrative (Doctor Anchor V4) vào DB...\n');

  const template = {
    id: 'controlled-narrative',
    name: 'Controlled Narrative (Bác sĩ Anchor V4)',
    icon: '🩺',
    stepCount: 5,
    steps: JSON.stringify(['TERRITORY', 'CONTRADICTION', 'DOCTOR_ANCHOR', 'MEDICAL_SPINE', 'NARRATIVE_DRAFT']),
    estimatedWords: JSON.stringify({ min: 1200, max: 2000 }),
    sites: JSON.stringify(['nha-thuoc', 'tiem-chung']),
    systemPrompt: 'Xem templates.ts — CONTROLLED_NARRATIVE.systemPrompt',
    outline: JSON.stringify([
      {
        type: 'h2', label: 'Opening — Human Moment + Belief + Contradiction', fieldKey: 'narrativeOpening',
        children: [
          { type: 'meta', label: 'Hook Formula: Specific Human Moment + Belief + Contradiction (100–180 từ)' },
          { type: 'meta', label: 'Opening Library: Routine-led / Belief-led / Contrast-led / Decision-led / Blind spot / Question-led / Life moment' },
        ],
      },
      {
        type: 'h2', label: 'Doctor Touchpoint #1 — Unlock (Phá misunderstanding)', fieldKey: 'doctorUnlock',
        children: [
          { type: 'meta', label: '[DOCTOR REVIEW] Theo bác sĩ [Tên, chuyên khoa], clinical judgment phá vỡ hiểu lầm' },
        ],
      },
      {
        type: 'h2', label: '[H2 — Câu hỏi / Vấn đề quan trọng 1]', fieldKey: 'h2Question1',
        children: [
          { type: 'meta', label: 'Ngôn ngữ người đọc. Evidence → Meaning → Decision' },
        ],
      },
      {
        type: 'h2', label: '[H2 — Misunderstanding / Niềm tin cần sửa]', fieldKey: 'h2Misunderstanding',
      },
      {
        type: 'h2', label: '[H2 — Điều gì cần đánh giá / Quyết định?]', fieldKey: 'h2DecisionSupport',
        children: [
          { type: 'meta', label: 'Doctor Touchpoint #2 — Decision guidance + Decision Table / Checklist' },
        ],
      },
      {
        type: 'h2', label: '[H2 — Khi nào không nên chờ? (Safety Net)]', fieldKey: 'h2SafetyNet',
      },
      {
        type: 'h2', label: '[H2 — Bước tiếp theo thực tế]', fieldKey: 'h2ActionStep',
      },
      {
        type: 'h2', label: 'Ending — Return to opening belief / Reframe', fieldKey: 'conclusion',
        children: [
          { type: 'meta', label: 'Reframe niềm tin ban đầu → Reader lesson → Next step → [CTA_SLOT]' },
        ],
      },
      { type: 'required', label: 'Nguồn tham khảo học thuật' },
    ]),
    requiredFields: JSON.stringify(['tenBaiViet', 'slug', 'danhMucBaiViet', 'moTaNgan', 'moTa', 'nguonThamKhao', 'seo']),
    notes: JSON.stringify([
      'Template Controlled Narrative Explainer + Doctor Anchor V4 (EF_CONTROLLED_NARRATIVE).',
      'KHÔNG dựng nhân vật định danh — dùng archetype, routine, reader mirror.',
      'Hook Formula: Specific Human Moment + Belief + Contradiction.',
      'Doctor là Trust Anchor tại 2-3 touchpoint (Unlock + Decision + Safety).',
      'Story ratio: 60-70% narrative/editorial, 20-30% medical evidence, 5-10% doctor voice.',
    ]),
    sitePromptOverrides: null,
  };

  try {
    const result = await prisma.template.upsert({
      where: { id: template.id },
      update: { name: template.name, icon: template.icon, stepCount: template.stepCount, steps: template.steps, estimatedWords: template.estimatedWords, systemPrompt: template.systemPrompt, outline: template.outline, requiredFields: template.requiredFields, notes: template.notes, sites: template.sites, sitePromptOverrides: template.sitePromptOverrides },
      create: { id: template.id, name: template.name, icon: template.icon, stepCount: template.stepCount, steps: template.steps, estimatedWords: template.estimatedWords, systemPrompt: template.systemPrompt, outline: template.outline, requiredFields: template.requiredFields, notes: template.notes, sites: template.sites, sitePromptOverrides: template.sitePromptOverrides },
    });
    console.log('✅ OK:', result.id, result.name);
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
