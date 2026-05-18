import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(`${salt}:${derivedKey.toString('hex')}`)
    })
  })
}

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Superadmin
  const saPassword = await hashPassword('superadmin2026')
  const sa = await prisma.user.upsert({
    where: { email: 'superadmin@longchau.com' },
    update: {},
    create: {
      email: 'superadmin@longchau.com',
      name: 'Super Admin',
      role: 'superadmin',
      password: saPassword,
    },
  })
  console.log(`  ✅ Superadmin: ${sa.email}`)

  // 2. Lead
  const leadPassword = await hashPassword('longchau2026')
  const lead = await prisma.user.upsert({
    where: { email: 'lead@longchau.com' },
    update: {},
    create: {
      email: 'lead@longchau.com',
      name: 'Lead Developer',
      role: 'lead',
      password: leadPassword,
      createdBy: sa.id,
    },
  })
  console.log(`  ✅ Lead: ${lead.email}`)

  // 3. BTV (Biên tập viên)
  const btvPassword = await hashPassword('btv2026')
  const btv = await prisma.user.upsert({
    where: { email: 'btv@longchau.com' },
    update: {},
    create: {
      email: 'btv@longchau.com',
      name: 'Nguyễn Văn Biên tập',
      role: 'btv',
      password: btvPassword,
      createdBy: lead.id,
    },
  })
  console.log(`  ✅ BTV: ${btv.email}`)

  // 4. CTV (Cộng tác viên)
  const ctvPassword = await hashPassword('ctv2026')
  const ctv = await prisma.user.upsert({
    where: { email: 'ctv@longchau.com' },
    update: {},
    create: {
      email: 'ctv@longchau.com',
      name: 'Trần Thị Cộng tác',
      role: 'ctv',
      password: ctvPassword,
      createdBy: lead.id,
    },
  })
  console.log(`  ✅ CTV: ${ctv.email}`)

  // 5. HĐYK (Hội đồng y khoa)
  const hdykPassword = await hashPassword('hdyk2026')
  const hdyk = await prisma.user.upsert({
    where: { email: 'hdyk@longchau.com' },
    update: {},
    create: {
      email: 'hdyk@longchau.com',
      name: 'PGS.TS Lê Hội đồng',
      role: 'hdyk',
      password: hdykPassword,
      createdBy: lead.id,
    },
  })
  console.log(`  ✅ HĐYK: ${hdyk.email}`)

  // 6. BS (Bác sĩ)
  const bsPassword = await hashPassword('bs2026')
  const bs = await prisma.user.upsert({
    where: { email: 'bs@longchau.com' },
    update: {},
    create: {
      email: 'bs@longchau.com',
      name: 'BS. Phạm Minh Duyệt',
      role: 'bs',
      password: bsPassword,
      specialties: JSON.stringify(['nội khoa', 'tim mạch']),
      capacity: 10,
      createdBy: lead.id,
    },
  })
  console.log(`  ✅ BS: ${bs.email}`)

  // 7. Gán bài cũ (chưa có createdBy) cho Lead
  const updated = await prisma.article.updateMany({
    where: { createdBy: null },
    data: {
      createdBy: lead.id,
      workflowStatus: 'draft',
    },
  })
  console.log(`  📝 Gán ${updated.count} bài cũ cho Lead (workflowStatus=draft)`)

  console.log('\n✅ Seed hoàn tất!')
  console.log('\n📋 Tài khoản demo:')
  console.log('  superadmin@longchau.com / superadmin2026')
  console.log('  lead@longchau.com / longchau2026')
  console.log('  btv@longchau.com / btv2026')
  console.log('  ctv@longchau.com / ctv2026')
  console.log('  hdyk@longchau.com / hdyk2026')
  console.log('  bs@longchau.com / bs2026')
}

main()
  .catch(e => {
    console.error('❌ Seed thất bại:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
