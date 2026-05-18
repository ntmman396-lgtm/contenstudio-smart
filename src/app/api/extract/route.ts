import { NextRequest, NextResponse } from 'next/server';
import { extractFromPDF, extractFromURL } from '@/lib/source-extractor';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data (PDF uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      const urls = formData.getAll('urls') as string[];

      const results = [];

      // Extract from PDF files
      for (const file of files) {
        if (file.type === 'application/pdf') {
          const buffer = Buffer.from(await file.arrayBuffer());
          const extracted = await extractFromPDF(buffer, file.name);
          results.push(extracted);
        }
      }

      // Extract from URLs
      for (const url of urls) {
        if (url && url.trim()) {
          const extracted = await extractFromURL(url.trim());
          results.push(extracted);
        }
      }

      if (results.length === 0) {
        return NextResponse.json(
          { error: 'No valid sources provided' },
          { status: 400 }
        );
      }

      // Combine all extracted text
      const combinedText = results
        .map((r, i) => `--- Nguồn ${i + 1}: ${r.metadata.title} ---\n\n${r.text}`)
        .join('\n\n');

      const totalWords = results.reduce((sum, r) => sum + r.metadata.wordCount, 0);

      return NextResponse.json({
        text: combinedText,
        metadata: {
          title: results[0].metadata.title,
          source: results.map((r) => r.metadata.source).join(', '),
          pageCount: results.reduce((sum, r) => sum + (r.metadata.pageCount || 0), 0) || undefined,
          wordCount: totalWords,
        },
        sourceCount: results.length,
      });
    }

    // Handle JSON (URL-only extraction)
    const body = await request.json();
    const { urls } = body as { urls: string[] };

    if (!urls || urls.length === 0) {
      return NextResponse.json(
        { error: 'No URLs provided' },
        { status: 400 }
      );
    }

    const results = [];
    for (const url of urls) {
      if (url && url.trim()) {
        const extracted = await extractFromURL(url.trim());
        results.push(extracted);
      }
    }

    const combinedText = results
      .map((r, i) => `--- Nguồn ${i + 1}: ${r.metadata.title} ---\n\n${r.text}`)
      .join('\n\n');

    const totalWords = results.reduce((sum, r) => sum + r.metadata.wordCount, 0);

    return NextResponse.json({
      text: combinedText,
      metadata: {
        title: results[0]?.metadata.title || '',
        source: results.map((r) => r.metadata.source).join(', '),
        wordCount: totalWords,
      },
      sourceCount: results.length,
    });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    );
  }
}
