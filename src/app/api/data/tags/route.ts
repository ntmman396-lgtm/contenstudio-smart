import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_SITE = 'nha-thuoc';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId') || DEFAULT_SITE;

    const tags = await prisma.tag.findMany({
      where: { siteId },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(tags.map(t => t.name));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId') || DEFAULT_SITE;
    const body = await request.json(); 
    
    if (Array.isArray(body)) {
      const results = [];
      for (const name of body) {
         try {
           const tag = await prisma.tag.upsert({
             where: { name_siteId: { name, siteId } },
             update: {},
             create: { name, siteId }
           });
           results.push(tag.name);
         } catch(e) {} // ignore duplicates
      }
      return NextResponse.json(results);
    }

    const name = typeof body === 'object' ? body.name : body;
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const newTag = await prisma.tag.upsert({
      where: { name_siteId: { name, siteId } },
      update: {},
      create: { name, siteId },
    });

    return NextResponse.json([newTag.name]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const siteId = searchParams.get('siteId') || DEFAULT_SITE;
    
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    await prisma.tag.delete({
      where: { name_siteId: { name, siteId } }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
