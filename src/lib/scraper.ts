import * as cheerio from 'cheerio';

/**
 * Extracts all valid HTTP/HTTPS URLs from a given text string.
 */
export function extractUrlsFromText(text: string): string[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex) || [];
  
  // Clean up trailing punctuation that might be captured by the regex
  return matches.map(url => {
    return url.replace(/[.,;!?"')\]]+$/, '');
  });
}

/**
 * Scrapes a URL, removes ads/menus, and returns clean text content.
 * Returns a fallback string if the site blocks the crawler (Anti-bot).
 */
export async function scrapeUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      // 15 seconds timeout to avoid hanging the generation process
      signal: AbortSignal.timeout(15000) 
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        return `Không tải được nội dung từ link này do trang web có cơ chế chặn Bot (Anti-bot/Cloudflare - Lỗi ${response.status}).`;
      }
      return `Lỗi tải trang: ${response.status} ${response.statusText}`;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove noise elements
    $('nav, footer, aside, .sidebar, #cookie-banner, .ads, script, style, iframe, header, noscript, svg').remove();
    
    const title = $('title').text() || $('h1').first().text();
    
    // Target main content areas first, fallback to body
    const mainContent = $('article, main, .content, .post, .entry-content').length 
      ? $('article, main, .content, .post, .entry-content') 
      : $('body');
      
    let extractedText = mainContent.text();
    
    // Clean up text
    extractedText = extractedText
      .normalize('NFC')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    return `Tiêu đề trang: ${title}\n\nNội dung chính:\n${extractedText}`;
  } catch (error: any) {
    console.error(`Scrape URL failed for ${url}:`, error);
    if (error.name === 'TimeoutError') {
       return 'Không tải được nội dung do quá thời gian chờ (Timeout).';
    }
    return `Không tải được nội dung từ link này. Lỗi: ${error.message}`;
  }
}
