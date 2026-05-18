/**
 * Seed tài khoản Superadmin ban đầu
 * Chạy: node seed-admin.js
 *
 * Chỉ chạy lần đầu khi khởi tạo hệ thống.
 * Nếu superadmin đã tồn tại, script sẽ bỏ qua.
 */

const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(`${salt}:${derivedKey.toString('hex')}`)
    })
  })
}

async function main() {
  const email    = process.env.ADMIN_EMAIL    || 'superadmin@longchau.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456'
  const name     = process.env.ADMIN_NAME     || 'Super Admin'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`✓ Superadmin "${email}" đã tồn tại, bỏ qua.`)
    return
  }

  const hashed = await hashPassword(password)
  await prisma.user.create({
    data: { email, name, role: 'superadmin', password: hashed, isActive: true },
  })

  console.log(`✓ Đã tạo Superadmin: ${email}`)
  console.log(`  Mật khẩu: ${password}`)
  console.log(`  ⚠️  Hãy đổi mật khẩu ngay sau khi đăng nhập lần đầu!`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
