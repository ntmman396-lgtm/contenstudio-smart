'use client';

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  ExternalHyperlink,
  TableRow,
  TableCell,
  Table,
  WidthType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
  LevelFormat,
  ImageRun,
} from 'docx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

interface ExportArticle {
  title: string;
  sapo?: string;
  content: string; // HTML
  category?: string;
  tags?: string[];
  references?: string[];
  seoMeta?: { title?: string; description?: string };
  templateName?: string;
  createdAt?: string;
  /** Original keyword used to generate this article */
  keyword?: string;
}

// ─── HTML → DOCX Converter ────────────────────────────────────

/**
 * Simple HTML parser that converts HTML content into docx Paragraph objects.
 * Handles: h2, h3, h4, p, ul/ol/li, strong/b, em/i, u, a, br, table
 */

interface InlineStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  link?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}



interface InlinePart {
  type: 'text' | 'img';
  text?: string;
  style?: InlineStyle;
  src?: string;
  alt?: string;
}

async function parseInlineContent(html: string, parentStyle: InlineStyle = {}): Promise<(TextRun | ImageRun | ExternalHyperlink)[]> {
  const runs: (TextRun | ImageRun | ExternalHyperlink)[] = [];
  const tagRegex = /<(\/?)(\w+)([^>]*)>/g;
  const parts: InlinePart[] = [];

  let lastIndex = 0;
  let styleStack: InlineStyle[] = [{ ...parentStyle }];

  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const [fullMatch, isClosing, tagName, attrs] = match;
    const beforeText = html.substring(lastIndex, match.index);

    if (beforeText) {
      const decoded = stripHtml(beforeText);
      if (decoded) {
        parts.push({ type: 'text', text: decoded, style: { ...styleStack[styleStack.length - 1] } });
      }
    }

    const tag = tagName.toLowerCase();

    if (!isClosing) {
      const currentStyle = { ...styleStack[styleStack.length - 1] };

      if (tag === 'img') {
        const srcMatch = attrs.match(/src="([^"]*)"/);
        const altMatch = attrs.match(/alt="([^"]*)"/);
        if (srcMatch) {
          parts.push({ type: 'img', src: srcMatch[1], alt: altMatch ? altMatch[1] : '' });
        }
      } else if (tag === 'strong' || tag === 'b') {
        currentStyle.bold = true;
      } else if (tag === 'em' || tag === 'i') {
        currentStyle.italic = true;
      } else if (tag === 'u') {
        currentStyle.underline = true;
      } else if (tag === 'a') {
        const hrefMatch = attrs.match(/href="([^"]*)"/);
        if (hrefMatch) currentStyle.link = hrefMatch[1];
      } else if (tag === 'br') {
        parts.push({ type: 'text', text: '\n', style: { ...currentStyle } });
      }

      if (tag !== 'img' && tag !== 'br') {
        styleStack.push(currentStyle);
      }
    } else {
      if (tag !== 'img' && tag !== 'br' && styleStack.length > 1) {
        styleStack.pop();
      }
    }

    lastIndex = match.index + fullMatch.length;
  }

  const remaining = html.substring(lastIndex);
  if (remaining) {
    const decoded = stripHtml(remaining);
    if (decoded) {
      parts.push({ type: 'text', text: decoded, style: { ...styleStack[styleStack.length - 1] } });
    }
  }

  for (const part of parts) {
    if (part.type === 'img' && part.src) {
      // User request: "không gồm hình ảnh, chỉ lấy caption của ảnh"
      runs.push(new TextRun({ 
        text: ` [Hình ảnh: ${part.alt || part.src}] `, 
        font: 'Times New Roman', size: 20, italics: true, color: '888888' 
      }));
    } else if (part.type === 'text' && part.text) {
      const runOptions: any = {
        text: part.text,
        font: 'Times New Roman',
        size: 24,
      };
      if (part.style?.bold) runOptions.bold = true;
      if (part.style?.italic) runOptions.italics = true;
      if (part.style?.underline) runOptions.underline = { type: 'single' };
      if (part.style?.link) {
        let href = part.style.link;
        if (href.startsWith('/')) {
          href = `https://nhathuoclongchau.com.vn${href}`;
        }
        runOptions.color = '0066CC';
        runOptions.underline = { type: 'single' };
        runs.push(new ExternalHyperlink({
          children: [new TextRun(runOptions)],
          link: href
        }));
      } else {
        runs.push(new TextRun(runOptions));
      }
    }
  }

  return runs;
}

async function htmlToParagraphs(html: string): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];

  // Split by block-level elements
  // We'll use a simple regex-based approach
  const blockRegex = /<(h[2-4]|p|li|tr|th|td|div|blockquote|ul|ol|table)([\s>])/gi;

  // More robust: split HTML into blocks
  const blocks = splitHtmlBlocks(html);

  for (const block of blocks) {
    const tag = block.tag.toLowerCase();
    const content = block.content;

    switch (tag) {
      case 'h2':
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: await parseInlineContent(content, { bold: true }),
          })
        );
        break;

      case 'h3':
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
            children: await parseInlineContent(content, { bold: true }),
          })
        );
        break;

      case 'h4':
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_4,
            spacing: { before: 160, after: 80 },
            children: await parseInlineContent(content, { bold: true }),
          })
        );
        break;

      case 'li':
        paragraphs.push(
          new Paragraph({
            spacing: { before: 40, after: 40 },
            indent: { left: convertInchesToTwip(0.5) },
            children: [
              new TextRun({ text: '• ', font: 'Times New Roman', size: 24 }),
              ...(await parseInlineContent(content)),
            ],
          })
        );
        break;

      case 'blockquote':
        paragraphs.push(
          new Paragraph({
            spacing: { before: 100, after: 100 },
            indent: { left: convertInchesToTwip(0.5), right: convertInchesToTwip(0.5) },
            children: await parseInlineContent(content, { italic: true }),
          })
        );
        break;

      case 'p':
      default:
        // Skip completely empty paragraphs
        if (content.trim()) {
          const children = await parseInlineContent(content);
          if (children.length > 0) {
            paragraphs.push(
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: children,
              })
            );
          }
        }
        break;
    }
  }

  return paragraphs;
}

interface HtmlBlock {
  tag: string;
  content: string;
}

function splitHtmlBlocks(html: string): HtmlBlock[] {
  const blocks: HtmlBlock[] = [];
  // Match block-level elements with their content
  const blockTagRegex = /<(h[2-4]|p|li|div|blockquote|figcaption)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;

  let match;
  let lastIndex = 0;

  while ((match = blockTagRegex.exec(html)) !== null) {
    // Check for text between blocks
    const between = html.substring(lastIndex, match.index).trim();
    if (between && stripHtml(between).trim()) {
      blocks.push({ tag: 'p', content: between });
    }

    blocks.push({ tag: match[1], content: match[2] });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last match
  const remaining = html.substring(lastIndex).trim();
  if (remaining && stripHtml(remaining).trim()) {
    blocks.push({ tag: 'p', content: remaining });
  }

  // If no blocks found, treat entire HTML as one paragraph
  if (blocks.length === 0 && stripHtml(html).trim()) {
    blocks.push({ tag: 'p', content: html });
  }

  return blocks;
}

// ─── Main Export Function ──────────────────────────────────

/** Default document styles shared across all exported docs */
const DOC_STYLES = {
  default: {
    document: {
      run: {
        font: 'Times New Roman',
        size: 24,
      },
    },
    heading1: {
      run: {
        font: 'Times New Roman',
        size: 32,
        bold: true,
        color: '1a1a2e',
      },
    },
    heading2: {
      run: {
        font: 'Times New Roman',
        size: 28,
        bold: true,
        color: '16213e',
      },
    },
    heading3: {
      run: {
        font: 'Times New Roman',
        size: 26,
        bold: true,
        color: '0f3460',
      },
    },
  },
};

const DOC_PAGE_MARGIN = {
  top: convertInchesToTwip(1),
  right: convertInchesToTwip(1),
  bottom: convertInchesToTwip(1),
  left: convertInchesToTwip(1),
};

/** Build the paragraph children for a single article */
async function buildArticleChildren(article: ExportArticle): Promise<Paragraph[]> {
  const children: Paragraph[] = [];

  // ── Article Title (H1) ──
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: article.title,
          bold: true,
          font: 'Times New Roman',
          size: 32, // 16pt
          color: '1a1a2e',
        }),
      ],
    })
  );

  // ── Metadata line ──
  const metaParts: string[] = [];
  if (article.templateName) metaParts.push(`Template: ${article.templateName}`);
  if (article.category) metaParts.push(`Danh mục: ${article.category}`);
  if (article.createdAt) {
    const date = new Date(article.createdAt);
    metaParts.push(`Ngày tạo: ${date.toLocaleDateString('vi-VN')}`);
  }
  if (metaParts.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: metaParts.join('  |  '),
            font: 'Times New Roman',
            size: 18, // 9pt
            color: '888888',
            italics: true,
          }),
        ],
      })
    );
  }

  // ── Tags ──
  if (article.tags && article.tags.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `Tags: ${article.tags.join(', ')}`,
            font: 'Times New Roman',
            size: 18,
            color: '666666',
            italics: true,
          }),
        ],
      })
    );
  }

  // ── SEO Meta ──
  if (article.seoMeta) {
    if (article.seoMeta.title) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({ text: 'SEO Title: ', bold: true, font: 'Times New Roman', size: 20, color: '0066CC' }),
            new TextRun({ text: article.seoMeta.title, font: 'Times New Roman', size: 20 }),
          ],
        })
      );
    }
    if (article.seoMeta.description) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: 'SEO Description: ', bold: true, font: 'Times New Roman', size: 20, color: '0066CC' }),
            new TextRun({ text: article.seoMeta.description, font: 'Times New Roman', size: 20 }),
          ],
        })
      );
    }
  }

  // ── Divider ──
  children.push(
    new Paragraph({
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({ text: '─'.repeat(60), font: 'Times New Roman', size: 16, color: 'cccccc' }),
      ],
    })
  );

  // ── Sapo ──
  if (article.sapo) {
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [
          new TextRun({
            text: article.sapo,
            font: 'Times New Roman',
            size: 24,
            italics: true,
            bold: true,
            color: '333333',
          }),
        ],
      })
    );
  }

  // ── Main Content (HTML → paragraphs) ──
  const contentParagraphs = await htmlToParagraphs(article.content);
  children.push(...contentParagraphs);

  // ── References ──
  if (article.references && article.references.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: 'Nguồn tham khảo:',
            bold: true,
            font: 'Times New Roman',
            size: 24,
            color: '1a1a2e',
          }),
        ],
      })
    );

    article.references.forEach((ref, i) => {
      children.push(
        new Paragraph({
          spacing: { before: 20, after: 20 },
          indent: { left: convertInchesToTwip(0.3) },
          children: [
            new TextRun({
              text: `${i + 1}. ${ref}`,
              font: 'Times New Roman',
              size: 20,
              color: '555555',
            }),
          ],
        })
      );
    });
  }

  return children;
}

/** Build a complete Document from a single article */
async function buildSingleDoc(article: ExportArticle): Promise<Document> {
  return new Document({
    creator: 'Long Châu Content Studio',
    title: article.title,
    description: `Exported article: ${article.title}`,
    styles: DOC_STYLES,
    sections: [
      {
        properties: { page: { margin: DOC_PAGE_MARGIN } },
        children: await buildArticleChildren(article),
      },
    ],
  });
}

/** Sanitize a string into a safe file name */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80)
    || 'article';
}

/**
 * Export multiple articles into a SINGLE .docx file (page-break separated).
 * Used for single-article export or when a combined document is preferred.
 */
export async function exportBatchToDocx(articles: ExportArticle[], batchName?: string) {
  const allChildren: Paragraph[] = [];
  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];
    if (idx > 0) {
      allChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
    const articleChildren = await buildArticleChildren(article);
    allChildren.push(...articleChildren);
  }

  const doc = new Document({
    creator: 'Long Châu Content Studio',
    title: batchName || 'Batch Articles Export',
    description: `Exported ${articles.length} articles from Long Châu Content Studio`,
    styles: DOC_STYLES,
    sections: [
      {
        properties: { page: { margin: DOC_PAGE_MARGIN } },
        children: allChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = batchName
    ? `${sanitizeFileName(batchName)}.docx`
    : `batch_articles_${new Date().toISOString().slice(0, 10)}.docx`;
  saveAs(blob, fileName);
}

/**
 * Export multiple articles as a ZIP file — each article is a separate .docx.
 * File names are generated from article titles.
 */
export async function exportBatchToZip(articles: ExportArticle[], zipName?: string) {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const article of articles) {
    const doc = await buildSingleDoc(article);
    const blob = await Packer.toBlob(doc);

    // Build unique file name — prefer keyword over title
    let baseName = sanitizeFileName(article.keyword || article.title);
    let fileName = `${baseName}.docx`;
    let counter = 1;
    while (usedNames.has(fileName)) {
      fileName = `${baseName}_${counter}.docx`;
      counter++;
    }
    usedNames.add(fileName);

    zip.file(fileName, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const finalName = zipName
    ? `${sanitizeFileName(zipName)}.zip`
    : `articles_export_${new Date().toISOString().slice(0, 10)}.zip`;
  saveAs(zipBlob, finalName);
}
