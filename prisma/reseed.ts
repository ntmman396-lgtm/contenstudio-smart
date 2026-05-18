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

const USERS = [
  { email: 'superadmin@longchau.com', name: 'Super Admin',           role: 'superadmin', password: 'superadmin2026' },
  { email: 'lead@longchau.com',       name: 'Lead Developer',        role: 'lead',       password: 'longchau2026' },
  { email: 'btv@longchau.com',        name: 'Nguyễn Văn Biên tập',   role: 'btv',        password: 'btv2026' },
  { email: 'ctv@longchau.com',        name: 'Trần Thị Cộng tác',     role: 'ctv',        password: 'ctv2026' },
  { email: 'ctv2@longchau.com',       name: 'Lê Văn CTV Phụ',        role: 'ctv',        password: 'ctv2026' },
  { email: 'hdyk@longchau.com',       name: 'PGS.TS Lê Hội đồng',   role: 'hdyk',       password: 'hdyk2026' },
  { email: 'bs@longchau.com',         name: 'BS. Phạm Minh Duyệt',   role: 'bs',         password: 'bs2026',
    specialties: JSON.stringify(['nội khoa', 'tim mạch']), capacity: 10 },
  { email: 'bs2@longchau.com',        name: 'BS. Hoàng Y/Khảo',      role: 'bs',         password: 'bs2026',
    specialties: JSON.stringify(['nhi khoa', 'chẩn đoán hình ảnh']), capacity: 15 },
]

async function main() {
  console.log('🔄 Re-seeding passwords...')

  for (const u of USERS) {
    const hashed = await hashPassword(u.password)
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    
    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: { password: hashed },
      })
      console.log(`  ✅ Updated password for ${u.email}`)
    } else {
      await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          password: hashed,
          specialties: (u as any).specialties || null,
          capacity: (u as any).capacity || null,
        },
      })
      console.log(`  ✅ Created ${u.email}`)
    }
  }

  console.log('\n✅ Re-seed hoàn tất!')
  console.log('\n📋 Tài khoản demo:')
  USERS.forEach(u => console.log(`  ${u.email} / ${u.password}`))
}

main()
  .catch(e => { console.error('❌ Lỗi:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
