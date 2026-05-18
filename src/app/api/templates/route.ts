import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContentTemplate } from '@/lib/templates';

// Helper: safely stringify
function toJson(value: any): string | null {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
}

// Helper: safe parse
function fromJson(value: string | null): any {
  if (!value) return undefined;
  try { return JSON.parse(value); } catch { return undefined; }
}

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    const formatted: ContentTemplate[] = templates.map(t => ({
      id: t.id,
      name: t.name,
      icon: t.icon || '',
      stepCount: t.stepCount,
      steps: fromJson(t.steps) || [],
      estimatedWords: fromJson(t.estimatedWords) || { min: 1000, max: 2000 },
      systemPrompt: t.systemPrompt || '',
      outline: fromJson(t.outline) || [],
      requiredFields: fromJson(t.requiredFields) || [],
      notes: fromJson(t.notes) || [],
      sites: fromJson((t as any).sites) || ['nha-thuoc', 'tiem-chung'],
      sitePromptOverrides: fromJson((t as any).sitePromptOverrides) || undefined,
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
      for (const t of body as ContentTemplate[]) {
         try {
           const template = await prisma.template.upsert({
             where: { id: t.id },
             update: {
                name: t.name,
                icon: t.icon,
                stepCount: t.stepCount,
                steps: toJson(t.steps),
                estimatedWords: toJson(t.estimatedWords),
                systemPrompt: t.systemPrompt,
                outline: toJson(t.outline),
                requiredFields: toJson(t.requiredFields),
                notes: toJson(t.notes)
             },
             create: {
                id: t.id,
                name: t.name,
                icon: t.icon,
                stepCount: t.stepCount,
                steps: toJson(t.steps),
                estimatedWords: toJson(t.estimatedWords),
                systemPrompt: t.systemPrompt,
                outline: toJson(t.outline),
                requiredFields: toJson(t.requiredFields),
                notes: toJson(t.notes)
             }
           });
           results.push(template.id);
         } catch(e) {}
      }
      return NextResponse.json(results);
    }

    if (!body.id || !body.name) {
      return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
    }

    const t = body as ContentTemplate;
    const template = await prisma.template.upsert({
      where: { id: t.id },
      update: {
         name: t.name,
         icon: t.icon,
         stepCount: t.stepCount,
         steps: toJson(t.steps),
         estimatedWords: toJson(t.estimatedWords),
         systemPrompt: t.systemPrompt,
         outline: toJson(t.outline),
         requiredFields: toJson(t.requiredFields),
         notes: toJson(t.notes)
      },
      create: {
         id: t.id,
         name: t.name,
         icon: t.icon,
         stepCount: t.stepCount,
         steps: toJson(t.steps),
         estimatedWords: toJson(t.estimatedWords),
         systemPrompt: t.systemPrompt,
         outline: toJson(t.outline),
         requiredFields: toJson(t.requiredFields),
         notes: toJson(t.notes)
      }
    });

    return NextResponse.json({ id: template.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.template.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
