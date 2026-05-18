const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.qcRule.upsert({
    where: { code: 'C-ACC-STATS' },
    update: {},
    create: {
      code: 'C-ACC-STATS',
      name: 'Số liệu phải có nguồn',
      description: 'Các câu chứa số liệu (%), tỷ lệ, thống kê bắt buộc phải nêu rõ nguồn tham khảo ngay trong câu hoặc liền kề.',
      section: 'CONTENT',
      subDimension: 'accuracy',
      deduction: 3,
      maxDeduction: 10,
      severity: 'warning',
      isActive: true,
      isSystem: true,
      autoFixable: false,
      fixInstruction: 'Thêm [nguồn] hoặc "Theo tổ chức ABC..."',
      appliesTo: '["*"]',
      checkType: 'regex'
    }
  });
  console.log('Rule C-ACC-STATS inserted successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
