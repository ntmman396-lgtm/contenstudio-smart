import { ExtractedSource } from '@/types';
import * as cheerio from 'cheerio';

/**
 * Extract text content from a PDF buffer using pdf-parse.
 */
export async function extractFromPDF(buffer: Buffer, fileName: string): Promise<ExtractedSource> {
  // Dynamic import to avoid SSR issues with pdf-parse
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParseModule = await import('pdf-parse') as any;
  const pdfParse = pdfParseModule.default || pdfParseModule;

  const data = await pdfParse(buffer);

  const text = data.text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    text,
    metadata: {
      title: data.info?.Title || fileName.replace(/\.pdf$/i, ''),
      source: fileName,
      pageCount: data.numpages,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    },
  };
}

/**
 * Extract main content from a URL using cheerio.
 * Strips navigation, footer, sidebar, scripts, and ads.
 */
export async function extractFromURL(url: string): Promise<ExtractedSource> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove noise elements
  $(
    'script, style, nav, footer, header, aside, .sidebar, .navigation, ' +
    '.ads, .advertisement, .social-share, .related-posts, .comments, ' +
    'iframe, noscript, [role="navigation"], [role="banner"], [role="complementary"]'
  ).remove();

  // Try to extract from main content area first
  const mainSelectors = [
    'article',
    '[role="main"]',
    'main',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content-body',
    '#content',
    '.main-content',
  ];

  let mainContent = '';
  for (const selector of mainSelectors) {
    const el = $(selector);
    if (el.length && el.text().trim().length > 200) {
      mainContent = el.text().trim();
      break;
    }
  }

  // Fallback to body text
  if (!mainContent) {
    mainContent = $('body').text().trim();
  }

  // Clean up whitespace
  const text = mainContent
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Extract title
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    $('h1').first().text().trim() ||
    url;

  return {
    text,
    metadata: {
      title,
      source: url,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    },
  };
}

/**
 * Extract text from multiple sources, combining the results.
 */
export async function extractFromSources(
  sources: Array<{ type: 'pdf' | 'url'; data: Buffer | string; name: string }>
): Promise<ExtractedSource> {
  const results: ExtractedSource[] = [];

  for (const source of sources) {
    try {
      if (source.type === 'pdf') {
        results.push(await extractFromPDF(source.data as Buffer, source.name));
      } else {
        results.push(await extractFromURL(source.data as string));
      }
    } catch (error) {
      console.error(`Failed to extract from ${source.name}:`, error);
      // Continue with other sources
    }
  }

  if (results.length === 0) {
    throw new Error('Failed to extract content from any sources');
  }

  // Combine all extracted text
  const combinedText = results
    .map((r, i) => `--- Nguồn ${i + 1}: ${r.metadata.title} ---\n\n${r.text}`)
    .join('\n\n');

  const totalWords = results.reduce((sum, r) => sum + r.metadata.wordCount, 0);
  const totalPages = results.reduce((sum, r) => sum + (r.metadata.pageCount || 0), 0);

  return {
    text: combinedText,
    metadata: {
      title: results[0].metadata.title,
      source: results.map((r) => r.metadata.source).join(', '),
      pageCount: totalPages || undefined,
      wordCount: totalWords,
    },
  };
}
