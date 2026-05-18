import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_SITE = 'nha-thuoc';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId') || DEFAULT_SITE;

    const links = await prisma.internalLink.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(links);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId') || DEFAULT_SITE;
    const body = await request.json(); 
    
    // Support bulk insertion for CSV imports
    if (Array.isArray(body)) {
      const results = [];
      for (const item of body) {
         try {
           const link = await prisma.internalLink.upsert({
             where: { anchor_siteId: { anchor: item.anchor, siteId } },
             update: { url: item.url },
             create: { anchor: item.anchor, url: item.url, siteId }
           });
           results.push(link);
         } catch(e) {}
      }
      return NextResponse.json(results);
    }

    if (!body.anchor || !body.url) {
      return NextResponse.json({ error: 'Anchor and URL are required' }, { status: 400 });
    }

    const newLink = await prisma.internalLink.upsert({
      where: { anchor_siteId: { anchor: body.anchor, siteId } },
      update: { url: body.url },
      create: { anchor: body.anchor, url: body.url, siteId },
    });

    return NextResponse.json(newLink);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.internalLink.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
