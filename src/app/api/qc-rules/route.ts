import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UnifiedRule, getAllRules } from '@/lib/qc/rule-registry';

// Helper to reliably parse booleans
function parseBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'true';
  return !!val;
}

export async function GET() {
  try {
    let dbRules = await prisma.qcRule.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    // Auto-seed if empty
    if (dbRules.length === 0) {
      const defaults = getAllRules();
      for (const r of defaults) {
         try {
           await prisma.qcRule.create({
             data: {
                code: r.code,
                name: r.name,
                description: r.description,
                section: r.section,
                subDimension: r.sub_dimension,
                deduction: r.deduction,
                maxDeduction: r.max_deduction,
                severity: r.severity,
                isActive: parseBool(r.is_active),
                isSystem: parseBool(r.is_system),
                autoFixable: parseBool(r.auto_fixable),
                fixInstruction: r.fix_instruction,
                appliesTo: JSON.stringify(r.applies_to || ['*']),
                checkType: r.check_type
             }
           });
         } catch(e) {}
      }
      // re-fetch after seed
      dbRules = await prisma.qcRule.findMany({
        orderBy: { createdAt: 'asc' }
      });
    }
    
    const formatted: UnifiedRule[] = dbRules.map(r => ({
      code: r.code,
      name: r.name,
      description: r.description,
      section: r.section as 'TECH' | 'CONTENT',
      sub_dimension: r.subDimension,
      deduction: r.deduction,
      max_deduction: r.maxDeduction,
      severity: r.severity as 'critical' | 'warning' | 'info',
      is_active: r.isActive,
      is_system: r.isSystem,
      auto_fixable: r.autoFixable,
      fix_instruction: r.fixInstruction,
      applies_to: r.appliesTo ? JSON.parse(r.appliesTo) : ['*'],
      check_type: r.checkType
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json(); 
    
    // Support bulk sync for initial seeding
    if (Array.isArray(body)) {
      const results = [];
      for (const r of body as UnifiedRule[]) {
         try {
           const rule = await prisma.qcRule.upsert({
             where: { code: r.code },
             update: {
                name: r.name,
                description: r.description,
                section: r.section,
                subDimension: r.sub_dimension,
                deduction: r.deduction,
                maxDeduction: r.max_deduction,
                severity: r.severity,
                isActive: parseBool(r.is_active),
                isSystem: parseBool(r.is_system),
                autoFixable: parseBool(r.auto_fixable),
                fixInstruction: r.fix_instruction,
                appliesTo: JSON.stringify(r.applies_to || ['*']),
                checkType: r.check_type
             },
             create: {
                code: r.code,
                name: r.name,
                description: r.description,
                section: r.section,
                subDimension: r.sub_dimension,
                deduction: r.deduction,
                maxDeduction: r.max_deduction,
                severity: r.severity,
                isActive: parseBool(r.is_active),
                isSystem: parseBool(r.is_system),
                autoFixable: parseBool(r.auto_fixable),
                fixInstruction: r.fix_instruction,
                appliesTo: JSON.stringify(r.applies_to || ['*']),
                checkType: r.check_type
             }
           });
           results.push(rule.code);
         } catch(e) {}
      }
      return NextResponse.json(results);
    }

    // Upsert single rule
    const r = body as UnifiedRule;
    if (!r.code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

    const rule = await prisma.qcRule.upsert({
      where: { code: r.code },
      update: {
        name: r.name,
        description: r.description,
        section: r.section,
        subDimension: r.sub_dimension,
        deduction: r.deduction,
        maxDeduction: r.max_deduction,
        severity: r.severity,
        isActive: parseBool(r.is_active),
        isSystem: parseBool(r.is_system),
        autoFixable: parseBool(r.auto_fixable),
        fixInstruction: r.fix_instruction,
        appliesTo: JSON.stringify(r.applies_to || ['*']),
        checkType: r.check_type
      },
      create: {
        code: r.code,
        name: r.name,
        description: r.description,
        section: r.section,
        subDimension: r.sub_dimension,
        deduction: r.deduction,
        maxDeduction: r.max_deduction,
        severity: r.severity,
        isActive: parseBool(r.is_active),
        isSystem: parseBool(r.is_system),
        autoFixable: parseBool(r.auto_fixable),
        fixInstruction: r.fix_instruction,
        appliesTo: JSON.stringify(r.applies_to || ['*']),
        checkType: r.check_type
      }
    });

    return NextResponse.json({ code: rule.code });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

    await prisma.qcRule.delete({
      where: { code }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
