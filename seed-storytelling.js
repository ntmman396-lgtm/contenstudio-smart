/**
 * Seed template Storytelling (People-First) vào DB
 * Chạy: node seed-storytelling.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📖 Đang thêm template Storytelling vào DB...\n');

  const template = {
    id: 'storytelling',
    name: 'Storytelling (People-First)',
    icon: '📖',
    stepCount: 5,
    steps: JSON.stringify(['TERRITORY', 'PERSONA', 'TENSION', 'CHARACTER', 'STORY']),
    estimatedWords: JSON.stringify({ min: 1200, max: 2500 }),
    sites: JSON.stringify(['nha-thuoc', 'tiem-chung']),
    systemPrompt: 'Xem templates.ts — STORYTELLING.systemPrompt',
    outline: JSON.stringify([
      { type: 'h2', label: 'Opening Story', fieldKey: 'openingStory', children: [
        { type: 'h3', label: 'Human tension / Case entry', fieldKey: 'humanTension' },
        { type: 'h3', label: 'Character + Context', fieldKey: 'characterContext' },
        { type: 'h3', label: 'Unresolved question / Medical bridge', fieldKey: 'medicalBridge' },
      ]},
      { type: 'h2', label: 'H2 — Medical question 1', fieldKey: 'h2Medical1' },
      { type: 'h2', label: 'H2 — Medical question 2 (mechanism / evidence)', fieldKey: 'h2Medical2' },
      { type: 'h2', label: 'H2 — Decision point', fieldKey: 'h2Decision' },
      { type: 'h2', label: 'H2 — Action / Next step', fieldKey: 'h2Action' },
      { type: 'h2', label: 'Conclusion — Return to Character', fieldKey: 'conclusion' },
      { type: 'required', label: 'Nguon tham khao hoc thuat' },
    ]),
    requiredFields: JSON.stringify(['tenBaiViet', 'slug', 'danhMucBaiViet', 'moTaNgan', 'moTa', 'nguonThamKhao', 'seo']),
    notes: JSON.stringify([
      'Template danh cho noi dung People-First x Evidence-Grounded (EF_CASE_STORY).',
      'PHAI chon Character Entry Mode phu hop.',
      'Case Identity phai xuat hien trong 100-150 tu dau.',
    ]),
    sitePromptOverrides: null,
  };

  try {
    const result = await prisma.template.upsert({
      where: { id: template.id },
      update: { name: template.name, icon: template.icon, stepCount: template.stepCount, steps: template.steps, estimatedWords: template.estimatedWords, systemPrompt: template.systemPrompt, outline: template.outline, requiredFields: template.requiredFields, notes: template.notes, sites: template.sites, sitePromptOverrides: template.sitePromptOverrides },
      create: { id: template.id, name: template.name, icon: template.icon, stepCount: template.stepCount, steps: template.steps, estimatedWords: template.estimatedWords, systemPrompt: template.systemPrompt, outline: template.outline, requiredFields: template.requiredFields, notes: template.notes, sites: template.sites, sitePromptOverrides: template.sitePromptOverrides },
    });
    console.log('OK:', result.id, result.name);
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
