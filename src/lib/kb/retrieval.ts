import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * STEP 1 — Query expansion
 * Expands the origin query into multiple search phrases using LLM.
 */
async function expandQuery(query: string): Promise<string[]> {
  const model = genAI.getGenerativeModel({ 
     model: 'gemini-2.5-flash',
     generationConfig: { responseMimeType: "application/json" }
  });
  
  const prompt = `Given this medical article topic: '${query}'
Generate 3 search queries in Vietnamese and 2 in English that would find relevant academic sources.
Return as an exact JSON array of strings.`;
  
  try {
     const res = await model.generateContent(prompt);
     const text = res.response.text();
     const expanded = JSON.parse(text);
     if (Array.isArray(expanded)) {
         return [query, ...expanded]; // Include original query
     }
     return [query];
  } catch (e) {
     console.error("Query expansion failed, using original query only.", e);
     return [query];
  }
}

/**
 * Extract keywords from a query for text-based search.
 * Breaks query into meaningful search tokens.
 */
function extractKeywords(query: string): string[] {
  // Vietnamese stop words to filter out
  const stopWords = new Set([
    'là', 'và', 'của', 'cho', 'có', 'các', 'được', 'với', 'trong', 'này',
    'để', 'một', 'khi', 'từ', 'về', 'theo', 'đã', 'như', 'không', 'những',
    'hay', 'hoặc', 'nên', 'bị', 'ra', 'đó', 'lên', 'tại', 'the', 'and',
    'of', 'for', 'in', 'to', 'is', 'a', 'an', 'on', 'with', 'by',
  ]);
  
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // keep letters, numbers, spaces
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));
}

/**
 * Text-based retrieval using Prisma queries.
 * Since we don't have vector embeddings stored in the DB,
 * we use keyword matching + LLM reranking for semantic search.
 */
async function textBasedRetrieval(queries: string[], topK: number = 8) {
  // Extract unique keywords from all queries
  const allKeywords = new Set<string>();
  for (const q of queries) {
    for (const kw of extractKeywords(q)) {
      allKeywords.add(kw);
    }
  }
  const keywords = Array.from(allKeywords);
  
  if (keywords.length === 0) {
    return [];
  }

  // Get all active, ready chunks from DB
  // We search for chunks whose content contains any of the keywords
  // Using OR conditions for keyword matching
  try {
    const matchingChunks = await prisma.kbChunk.findMany({
      where: {
        AND: [
          // Ensure the source is active and ready
          {
            sourceId: {
              in: (await prisma.kbSource.findMany({
                where: { isActive: true, status: 'ready' },
                select: { id: true },
              })).map(s => s.id),
            },
          },
          // Match any keyword in content
          {
            OR: keywords.slice(0, 10).map(kw => ({
              content: { contains: kw, mode: 'insensitive' as const },
            })),
          },
        ],
      },
      include: {
        // Note: Prisma doesn't support JOIN directly, so we'll fetch source info separately
      },
      take: 50, // Get more candidates, then rerank
    });

    if (matchingChunks.length === 0) {
      return [];
    }

    // Fetch source info for matched chunks
    const sourceIds = [...new Set(matchingChunks.map(c => c.sourceId))];
    const sources = await prisma.kbSource.findMany({
      where: { id: { in: sourceIds } },
    });
    const sourceMap = new Map(sources.map(s => [s.id, s]));

    // Score each chunk by keyword match density
    const scoredChunks = matchingChunks.map(chunk => {
      const contentLower = chunk.content.toLowerCase();
      let matchCount = 0;
      let matchedKeywords = 0;
      
      for (const kw of keywords) {
        const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = contentLower.match(regex);
        if (matches) {
          matchCount += matches.length;
          matchedKeywords++;
        }
      }
      
      // Keyword coverage ratio (how many of our keywords appear in this chunk)
      const keywordCoverage = matchedKeywords / keywords.length;
      
      // Density score (matches per 1000 chars of content)
      const density = (matchCount / Math.max(chunk.content.length, 1)) * 1000;
      
      // Combined text similarity score (0-1 range)
      const textScore = Math.min(1, (keywordCoverage * 0.6) + (Math.min(density / 20, 1) * 0.4));
      
      const source = sourceMap.get(chunk.sourceId);
      let metaObj: any = {};
      try { metaObj = chunk.metadata ? JSON.parse(chunk.metadata) : {}; } catch {}
      
      return {
        id: chunk.id,
        content: chunk.content,
        metadata: metaObj,
        publisher: source?.publisher || metaObj?.publisher || 'Unknown',
        publish_year: source?.publishYear || metaObj?.year || null,
        source_type: source?.sourceType || 'manual',
        scope: source?.scope || 'specific',
        similarity_score: textScore,
        matchCount,
        matchedKeywords,
      };
    });

    // Sort by score descending
    scoredChunks.sort((a, b) => b.similarity_score - a.similarity_score);

    return scoredChunks.slice(0, topK * 3); // Return extra for reranking
  } catch (e) {
    console.error('Text-based retrieval error:', e);
    return [];
  }
}

/**
 * LLM-based reranking of retrieved chunks.
 * Uses Gemini to select the most relevant chunks for the article topic.
 */
async function llmRerank(query: string, chunks: any[], topK: number): Promise<any[]> {
  if (chunks.length <= topK) return chunks;
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    // Build a numbered list of chunk summaries for the LLM
    const chunkSummaries = chunks.slice(0, 20).map((c, i) => 
      `[${i}] (${c.publisher}, ${c.publish_year || 'N/A'}): ${c.content.substring(0, 200)}...`
    ).join('\n');

    const prompt = `You are a medical content relevance evaluator.

Given this article topic: "${query}"

Here are candidate source chunks:
${chunkSummaries}

Select the ${topK} MOST RELEVANT chunks for writing a comprehensive medical article about this topic.
Return a JSON array of the chunk indices (numbers only), ordered by relevance.
Example: [2, 5, 0, 7, 1, 3, 8, 4]`;

    const res = await model.generateContent(prompt);
    const text = res.response.text();
    const indices: number[] = JSON.parse(text);

    if (Array.isArray(indices)) {
      return indices
        .filter(i => i >= 0 && i < chunks.length)
        .slice(0, topK)
        .map(i => chunks[i]);
    }
  } catch (e) {
    console.error('LLM reranking failed, using text score ranking:', e);
  }

  // Fallback: return top-K by text score
  return chunks.slice(0, topK);
}

/**
 * RAG pipeline cho AI generate bài viết.
 * Sử dụng text-based search + LLM reranking thay vì vector search.
 */
export async function retrieveForArticle(articleId: string | null, query: string, templateId: string, topK = 8) {
  // STEP 1 — Query expansion
  const expandedQueries = await expandQuery(query);

  // STEP 2 — Text-based retrieval (replaces vector search)
  const candidateChunks = await textBasedRetrieval(expandedQueries, topK);

  if (candidateChunks.length === 0) {
    console.log(`[KB Retrieval] No matching chunks found for query: "${query}"`);
    
    // Log the miss
    try {
      await prisma.kbCitationLog.create({
        data: {
          articleId: articleId || 'preview',
          articleTitle: query,
          totalCitations: 0,
          kbCitations: 0,
          externalCitations: 0,
          unverified: 0,
          status: 'pending',
        },
      });
    } catch {}
    
    // Return external-fallback instruction
    return {
      context: '',
      source_instruction: `
The internal knowledge base has no content on this topic.
You may use additional sources, BUT you MUST:
1. Explicitly state the source name, organization, and URL
2. Only use: WHO, CDC, PubMed, Lancet, NEJM, BMJ, UpToDate, EMC, MIMS, Bộ Y tế Việt Nam
3. Never invent or hallucinate sources
4. Add transparency note: "Nguồn bổ sung ngoài KB: [URL] - [Tổ chức] - [Năm]"
      `.trim(),
      kb_sufficient: false,
      chunks_used: [],
    };
  }

  // STEP 3 — Rerank with authority + recency scoring
  const THRESHOLD = 0.15; // Lower threshold for text-based search (vs 0.72 for vector)
  const filteredResults = candidateChunks.filter(r => r.similarity_score >= THRESHOLD);

  const authorityList = ['who', 'cdc', 'pubmed', 'lancet', 'nejm', 'bmj', 'uptodate', 'emc', 'mims', 'bộ y tế'];
  
  // Re-rank by equation: Score = TextMatch(40%) + Recency(30%) + Authority(30%)
  const rankedResults = filteredResults.map(r => {
      // 1. Text match score (40%)
      const scoreSim = r.similarity_score * 0.4;
      
      // 2. Source recency (30%) — newer publish_year scores higher
      const currentYear = new Date().getFullYear();
      let yearScore = 0;
      if (r.publish_year) {
          const age = currentYear - r.publish_year;
          if (age <= 1) yearScore = 1.0;
          else if (age <= 3) yearScore = 0.8;
          else if (age <= 5) yearScore = 0.5;
          else if (age <= 10) yearScore = 0.2;
      }
      const scoreRecency = yearScore * 0.3;
      
      // 3. Source authority (30%) — Group 1 (general) > known publishers > others
      let authScore = 0;
      if (r.scope === 'general') {
          authScore = 1.0;
      } else if (r.publisher) {
          const pubLower = r.publisher.toLowerCase();
          if (authorityList.some(a => pubLower.includes(a))) {
              authScore = 0.8;
          } else {
              authScore = 0.2;
          }
      }
      const scoreAuthority = authScore * 0.3;
      
      const finalRankScore = scoreSim + scoreRecency + scoreAuthority;
      return { ...r, finalRankScore };
  });
  
  rankedResults.sort((a, b) => b.finalRankScore - a.finalRankScore);

  // STEP 4 — LLM Reranking for semantic relevance
  const topCandidates = rankedResults.slice(0, topK * 2);
  const finalChunks = await llmRerank(query, topCandidates, Math.min(topK, 8));

  // STEP 5 — Decide: KB sufficient or need external?
  let kb_sufficient = finalChunks.length >= 3;
  
  console.log(`[KB Retrieval] Found ${finalChunks.length} relevant chunks for "${query}" (sufficient: ${kb_sufficient})`);

  // STEP 6 — Build context block for AI
  let context = "";
  let source_instruction = "";

  if (kb_sufficient) {
      context = finalChunks.map(c => {
        return `[Nguồn KB: ${c.metadata?.source_title || 'Unknown Title'} - ${c.publisher || 'Unknown Publisher'} ${c.publish_year || ''}]\n${c.content}`;
      }).join('\n\n');
      
      source_instruction = `
IMPORTANT: Use ONLY the sources provided above.
For every factual claim, cite the source inline: [Nguồn: Publisher, Year]
Do NOT use any other sources.
      `.trim();
  } else {
      context = finalChunks.map(c => c.content).join('\n\n');
      
      source_instruction = `
The internal knowledge base has limited content on this topic (${finalChunks.length} chunks found).
You may use additional sources, BUT you MUST:
1. Explicitly state the source name, organization, and URL
2. Only use: WHO, CDC, PubMed, Lancet, NEJM, BMJ, UpToDate, EMC, MIMS, Bộ Y tế Việt Nam
3. Never invent or hallucinate sources
4. Add transparency note: "Nguồn bổ sung ngoài KB: [URL] - [Tổ chức] - [Năm]"
      `.trim();
  }

  return { 
      context, 
      source_instruction, 
      kb_sufficient, 
      chunks_used: finalChunks 
  };
}
