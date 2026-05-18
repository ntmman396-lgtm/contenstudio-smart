import * as cheerio from 'cheerio';
import { CitationVerification } from '@/types';

// ─── URL Extraction ─────────────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

function extractUrl(reference: string): string | null {
  const match = reference.match(URL_REGEX);
  return match ? match[0].replace(/[.,;:!?)]+$/, '') : null;
}

// ─── Main Entry ─────────────────────────────────────────────

/**
 * Verifies each reference URL by:
 * 1. Extracting the URL from the reference string
 * 2. Fetching the page content (with timeout)
 * 3. Extracting title + content snippet for verification
 * 
 * Returns an array of CitationVerification results.
 */
export async function verifyCitations(references: string[]): Promise<CitationVerification[]> {
  const results: CitationVerification[] = [];

  // Process in parallel with concurrency limit of 5
  const CONCURRENCY = 5;
  const chunks: string[][] = [];
  for (let i = 0; i < references.length; i += CONCURRENCY) {
    chunks.push(references.slice(i, i + CONCURRENCY));
  }

  for (const chunk of chunks) {
    const batchResults = await Promise.all(
      chunk.map(ref => verifySingleCitation(ref))
    );
    results.push(...batchResults);
  }

  return results;
}

// ─── Single Citation Verification ───────────────────────────

async function verifySingleCitation(reference: string): Promise<CitationVerification> {
  const url = extractUrl(reference);

  if (!url) {
    return {
      original: reference,
      url: null,
      status: 'no_url',
      fetchedAt: new Date().toISOString(),
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        original: reference,
        url,
        status: 'dead',
        httpStatus: response.status,
        fetchedAt: new Date().toISOString(),
      };
    }

    // Parse HTML to extract title and content snippet
    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noise
    $('script, style, nav, footer, header, aside, .sidebar, .ads, iframe, noscript').remove();

    // Extract page title
    const pageTitle = (
      $('meta[property="og:title"]').attr('content') ||
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      ''
    ).slice(0, 200);

    // Extract content snippet
    const mainSelectors = ['article', '[role="main"]', 'main', '.post-content', '.article-content', '.entry-content', '.content-body', '#content'];
    let mainText = '';
    for (const sel of mainSelectors) {
      const el = $(sel);
      if (el.length && el.text().trim().length > 100) {
        mainText = el.text().trim();
        break;
      }
    }
    if (!mainText) {
      mainText = $('body').text().trim();
    }

    // Clean and truncate snippet
    const snippet = mainText
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300);

    return {
      original: reference,
      url,
      status: 'verified',
      httpStatus: response.status,
      pageTitle: pageTitle || undefined,
      snippet: snippet || undefined,
      fetchedAt: new Date().toISOString(),
    };

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        original: reference,
        url,
        status: 'timeout',
        fetchedAt: new Date().toISOString(),
      };
    }

    return {
      original: reference,
      url,
      status: 'dead',
      fetchedAt: new Date().toISOString(),
    };
  }
}
