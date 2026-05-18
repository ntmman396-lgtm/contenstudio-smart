import { prisma } from '@/lib/prisma'

export interface AutoAssignResult {
  success: boolean;
  assignedBsId?: string;
  assignedBsName?: string;
  method?: 'auto' | 'manual';
  score?: number;
  currentLoad?: number;
  maxCapacity?: number;
  error?: string;
  alertHdyk?: boolean;
}

export async function autoAssignDoctor(articleId: string, specialtyOption?: string, previewMode: boolean = false): Promise<AutoAssignResult> {
  try {
    const article = await prisma.article.findUnique({ where: { id: articleId } })
    if (!article) return { success: false, error: 'Bài viết không tồn tại' }

    if (article.workflowStatus !== 'pending_bs_review') {
      return { success: false, error: 'Bài chưa ở trạng thái chờ assign BS' }
    }

    const specialty = specialtyOption || article.specialty || article.category || ''
    
    const allDoctors = await prisma.user.findMany({
      where: { role: 'bs', isActive: true },
      select: { id: true, name: true, specialties: true, capacity: true },
    })

    if (allDoctors.length === 0) {
      return { success: false, error: 'Không có bác sĩ nào trong hệ thống. Cần HĐYK assign thủ công.', alertHdyk: true }
    }

    const bsLoadCounts = await prisma.article.groupBy({
      by: ['assignedBsId'],
      where: { workflowStatus: 'under_review', assignedBsId: { not: null } },
      _count: { id: true },
    })
    const loadMap = new Map(bsLoadCounts.map(b => [b.assignedBsId, b._count.id]))

    const scored = allDoctors.map(bs => {
      let specs: string[] = []
      if (bs.specialties) {
        try {
          if (typeof bs.specialties === 'string') specs = JSON.parse(bs.specialties)
          else specs = bs.specialties
        } catch(e) { }
      }
      
      const currentLoad = loadMap.get(bs.id) || 0
      const maxCapacity = bs.capacity || 10
      
      let score = 100

      if (specialty && specs.some(s => specialty.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(specialty.toLowerCase()))) {
        score += 50
      }

      const loadRatio = currentLoad / maxCapacity
      score -= loadRatio * 40

      if (currentLoad >= maxCapacity) score = -1

      return { ...bs, score, currentLoad, maxCapacity }
    })
    .filter(bs => bs.score >= 0)
    .sort((a, b) => b.score - a.score)

    if (scored.length === 0) {
      return { success: false, error: 'Tất cả BS đều đã đầy công suất hoặc không phụ trách. Cần HĐYK can thiệp.', alertHdyk: true }
    }

    const bestBs = scored[0]

    if (!previewMode) {
      await prisma.article.update({
        where: { id: articleId },
        data: {
          assignedBsId: bestBs.id,
          workflowStatus: 'under_review',
        },
      })
    }

    return {
      success: true,
      assignedBsId: bestBs.id,
      assignedBsName: bestBs.name,
      method: 'auto',
      score: bestBs.score,
      currentLoad: bestBs.currentLoad,
      maxCapacity: bestBs.maxCapacity,
    }

  } catch (err) {
    console.error('[autoAssignDoctor]', err)
    return { success: false, error: 'Lỗi máy chủ' }
  }
}
