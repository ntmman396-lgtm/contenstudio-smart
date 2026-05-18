import * as cheerio from 'cheerio';
import * as pdfParseLib from 'pdf-parse';
const pdfParse = (pdfParseLib as any).default || pdfParseLib;
import * as fs from 'fs';
import { franc } from 'franc';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- DB Mock Wrapper --- 
// TODO: Replace with real ORM (pg / Supabase) when ready
async function dbQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  console.log(`[DB QUERY]: ${query.trim().substring(0, 50)}...`, params);
  return [];
}

export type IngestionProgressState = {
  stage: 'extract' | 'clean' | 'chunk' | 'embed' | 'done';
  percent: number;
};

type KBSourceRecord = {
  id: string;
  source_type: 'pdf' | 'url' | 'manual';
  file_path?: string;
  origin_url?: string;
  language?: string;
};

/**
 * Main ingestion pipeline for a document/URL.
 */
export async function ingestSource(
  sourceId: string, 
  onProgress: (state: IngestionProgressState) => void
) {
  try {
    // Note: Mocking fetching source record from DB
    const sourceRecords = await dbQuery<KBSourceRecord>(`SELECT * FROM kb_sources WHERE id = $1`, [sourceId]);
    if (!sourceRecords || sourceRecords.length === 0) {
      throw new Error(`Source ID ${sourceId} not found`);
    }
    const source = sourceRecords[0];

    // ==========================================
    // STAGE 1 — Extract text
    // ==========================================
    let extractedText = '';
    let extractedTitle = '';
    let extractedPublisher = 'Unknown';
    let extractedYear = new Date().getFullYear();
    let detectedLang = 'en';

    if (source.source_type === 'pdf' && source.file_path) {
      if (!fs.existsSync(source.file_path)) {
        throw new Error('PDF file not found at path');
      }
      const dataBuffer = fs.readFileSync(source.file_path);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
      
      // Attempt to get metadata
      extractedTitle = data.info?.Title || 'Untitled PDF Document';
      if (data.info?.Author) extractedPublisher = data.info.Author;
      
      detectedLang = franc(extractedText.substring(0, 1000));
    } 
    else if (source.source_type === 'url' && source.origin_url) {
      const response = await fetch(source.origin_url);
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Clean HTML - Remove noise
      $('nav, footer, aside, .sidebar, #cookie-banner, .ads, script, style, iframe').remove();
      
      extractedTitle = $('title').text() || $('h1').first().text();
      // Only keep text from main semantic containers if generic, else fallback to body
      const mainContent = $('main, article, .content, .post').length 
        ? $('main, article, .content, .post') 
        : $('body');
        
      extractedText = mainContent.text();
      detectedLang = franc(extractedText.substring(0, 1000));
    } else {
      throw new Error(`Unsupported source type or missing path/url: ${source.source_type}`);
    }

    onProgress({ stage: 'extract', percent: 20 });


    // ==========================================
    // STAGE 2 — Clean & normalize
    // ==========================================
    // Normalize NFD -> NFC
    let cleanText = extractedText.normalize('NFC');
    // Remove duplicate whitespace / fix encodings
    cleanText = cleanText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ');
    // Strip trailing/leading
    cleanText = cleanText.trim();
    
    // (Optional) Detect bold lines/H1-H3 logic for PDF section tracking
    // For this demonstration, we'll keep it as a clean text sequence.

    onProgress({ stage: 'clean', percent: 40 });


    // ==========================================
    // STAGE 3 — Chunking
    // ==========================================
    // Target Chunk: ~500-800 tokens. (Approx 4 chars = 1 token). So 2000 - 3200 chars.
    // Minimum: 100 tokens -> 400 chars.
    // Overlap: 100 tokens -> 400 chars.
    
    const TARGET_SIZE = 2500; 
    const OVERLAP_SIZE = 400; 
    const MIN_SIZE = 400;

    // Split text securely by paragraph first
    const paragraphs = cleanText.split('\n\n');
    let chunks: { content: string, index: number }[] = [];
    let currentChunk = '';
    let currentChunkIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
       const p = paragraphs[i].trim();
       if (!p) continue;

       if ((currentChunk.length + p.length) <= TARGET_SIZE) {
          currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + p;
       } else {
          // If current chunk has enough content, save it
          if (currentChunk.length >= MIN_SIZE) {
             chunks.push({ content: currentChunk, index: currentChunkIndex++ });
          }
          
          // Seed the next chunk with overlap
          // Take the tail end of currentChunk approx `OVERLAP_SIZE` characters
          let tailEnd = currentChunk.substring(Math.max(0, currentChunk.length - OVERLAP_SIZE));
          // Snapping tail to a word boundary for clean overlap
          const firstSpace = tailEnd.indexOf(' ');
          if (firstSpace > 0) tailEnd = tailEnd.substring(firstSpace + 1);
          
          currentChunk = tailEnd + '\n\n' + p;
       }
    }
    // Flush remaining
    if (currentChunk.length >= MIN_SIZE) {
       chunks.push({ content: currentChunk, index: currentChunkIndex++ });
    }

    onProgress({ stage: 'chunk', percent: 60 });

    
    // ==========================================
    // STAGE 4 — Embedding
    // ==========================================
    const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const BATCH_SIZE = 100; // max reasonable batch
    
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
       const batch = chunks.slice(i, i + BATCH_SIZE);
       
       // Process batch with retry logic
       await processBatchWithRetry(batch, embedModel, sourceId, source, extractedTitle, extractedPublisher, extractedYear);
    }

    onProgress({ stage: 'embed', percent: 80 });


    // ==========================================
    // STAGE 5 — Index & finalize
    // ==========================================
    // Auto-tag feature 
    const autoTagPrompt = `Extract 3-7 medical topic tags from this document title and the following content snippet. Return ONLY a comma separated list.\n\nTitle: ${extractedTitle}\nContent: ${cleanText.substring(0, 500)}`;
    
    let topicTags: string[] = [];
    try {
       const tagModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
       const tagRes = await tagModel.generateContent(autoTagPrompt);
       topicTags = tagRes.response.text().split(',').map(t => t.trim());
    } catch (e) {
       console.log("Topic tagging warning:", e);
    }

    // Auto suggest templates (basic heuristic)
    let templateTags = ['NON_THUOC'];
    if (topicTags.some(t => t.toLowerCase().includes('bệnh') || t.toLowerCase().includes('hội chứng'))) {
        templateTags.push('BENH_LY');
    }

    // Finalize Source in DB
    await dbQuery(`
        UPDATE kb_sources 
        SET status = 'ready', 
            chunk_count = $1, 
            last_indexed_at = NOW(),
            topic_tags = $2,
            template_tags = $3,
            language = $4,
            title = $5
        WHERE id = $6
    `, [chunks.length, topicTags, templateTags, detectedLang, extractedTitle, sourceId]);

    onProgress({ stage: 'done', percent: 100 });
    return { success: true, chunksGenerated: chunks.length };

  } catch (error: any) {
    // ERORR HANDLING
    console.error(`Ingestion Pipeline Failed for Source: ${sourceId}`, error);
    
    await dbQuery(`
       UPDATE kb_sources 
       SET status = 'error', 
           metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{last_error}', $1::jsonb)
       WHERE id = $2
    `, [JSON.stringify(error.message || 'Unknown Error'), sourceId]);

    throw error;
  }
}

/**
 * Helper to embed a batch and save to kb_chunks. Includes Exponential Backoff Retry.
 */
async function processBatchWithRetry(
  batch: { content: string, index: number }[],
  embedModel: any,
  sourceId: string,
  source: any,
  title: string,
  publisher: string,
  year: number
) {
   let retryCount = 0;
   const MAX_RETRIES = 3;

   while (retryCount <= MAX_RETRIES) {
     try {
       // Gemini Batch Embedding
       // Workaround: We resolve embeddings concurrently in promises if batchEmbedContents is unsupported by local package ver
       const embedPromises = batch.map(b => 
         embedModel.embedContent(b.content).then((res: any) => ({
             chunk: b,
             vector: res.embedding.values
         }))
       );

       const results = await Promise.all(embedPromises);

       // Save to DB
       for (const r of results) {
         const metadata = JSON.stringify({
            source_title: title,
            publisher: publisher,
            year: year,
            url: source.origin_url || ''
         });

         await dbQuery(`
            INSERT INTO kb_chunks (source_id, chunk_index, content, content_length, embedding, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
         `, [
            sourceId, 
            r.chunk.index, 
            r.chunk.content, 
            r.chunk.content.length, 
            `[${r.vector.join(',')}]`, // pgvector format
            metadata
         ]);
       }

       return; // Success, break loop
     } catch (e) {
       retryCount++;
       if (retryCount > MAX_RETRIES) {
         throw new Error(`Batch embedding failed after ${MAX_RETRIES} retries. Last error: ${e}`);
       }
       // Exponential backoff: 2s, 4s, 8s
       const backoffMs = Math.pow(2, retryCount) * 1000;
       console.log(`Embedding error, retrying in ${backoffMs}ms...`);
       await new Promise(resolve => setTimeout(resolve, backoffMs));
     }
   }
}
