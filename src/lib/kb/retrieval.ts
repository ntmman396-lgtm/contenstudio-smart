import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- DB Mock Wrapper --- 
// TODO: Replace with real ORM (pg / Supabase) when ready
async function dbQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  console.log(`[DB QUERY]: ${query.trim().substring(0, 50)}...`);
  return [];
}

/**
 * STEP 1 — Query expansion
 * Expands the origin query into multiple search phrases using LLM.
 */
async function expandQuery(query: string): Promise<string[]> {
  const model = genAI.getGenerativeModel({ 
     model: 'gemini-1.5-pro',
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
 * RAG pipeline cho AI generate bài viết.
 */
export async function retrieveForArticle(articleId: string | null, query: string, templateId: string, topK = 8) {
  // STEP 1 — Query expansion
  const expandedQueries = await expandQuery(query);

  // STEP 2 — Vector search
  const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  
  // Run retrieval for ALL expanded queries in parallel.
  const searchPromises = expandedQueries.map(async (q) => {
     try {
         const embedRes = await embedModel.embedContent(q);
         const queryVector = embedRes.embedding.values;
         const vectorStr = `[${queryVector.join(',')}]`;
         
         // pgvector inner product distance search utilizing 'embedding <=> vector'
         const results = await dbQuery(`
            SELECT c.id, c.content, c.metadata,
                   s.publisher, s.publish_year, s.source_type, s.scope,
                   1 - (c.embedding <=> $1::vector) AS similarity_score
            FROM kb_chunks c
            JOIN kb_sources s ON c.source_id = s.id
            WHERE s.is_active = true
              AND s.status = 'ready'
            ORDER BY c.embedding <=> $1::vector
            LIMIT $2
         `, [vectorStr, topK]);
         
         return results;
     } catch (e) {
         console.error("Vector search failed for sub-query", q, e);
         return [];
     }
  });
  
  const resultsMatrix = await Promise.all(searchPromises);
  
  // Merge results, deduplicate by chunk_id, keep highest score per chunk
  const dedupMap = new Map<string, any>();
  for (const batch of resultsMatrix) {
     if (!batch) continue;
     for (const row of batch) {
         if (!dedupMap.has(row.id)) {
            dedupMap.set(row.id, row);
         } else {
            const existing = dedupMap.get(row.id);
            if (row.similarity_score > existing.similarity_score) {
               dedupMap.set(row.id, row);
            }
         }
     }
  }
  
  const mergedResults = Array.from(dedupMap.values());

  // STEP 3 — Filter & rank
  const THRESHOLD = 0.72;
  // Keep only chunks with similarity score >= 0.72
  const filteredResults = mergedResults.filter(r => r.similarity_score >= THRESHOLD);
  
  const authorityList = ['who', 'cdc', 'pubmed', 'lancet', 'nejm', 'bmj', 'uptodate', 'emc', 'mims'];
  
  // Re-rank by equation: Score = Sim(40%) + Recency(30%) + Authority(30%)
  const rankedResults = filteredResults.map(r => {
      // 1. Similarity score (40%)
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
          authScore = 1.0;  // Group 1 luôn là nguồn uy tín cao nhất
      } else if (r.publisher) {
          const pubLower = r.publisher.toLowerCase();
          if (authorityList.some(a => pubLower.includes(a))) {
              authScore = 0.8;  // Group 2 nhưng publisher uy tín
          } else {
              authScore = 0.2;
          }
      }
      const scoreAuthority = authScore * 0.3;
      
      const finalRankScore = scoreSim + scoreRecency + scoreAuthority;
      return { ...r, finalRankScore };
  });
  
  rankedResults.sort((a, b) => b.finalRankScore - a.finalRankScore);
  const finalChunks = rankedResults.slice(0, Math.min(topK, 8)); // Return top 8 chunks

  // STEP 4 — Decide: KB sufficient or need external?
  let kb_sufficient = true;
  let topScore = finalChunks.length > 0 ? finalChunks[0].similarity_score : 0;
  
  if (topScore < THRESHOLD || finalChunks.length < 3) {
      kb_sufficient = false;
      // Log external resource fallback requirement
      await dbQuery(`
         INSERT INTO kb_search_logs (article_id, query, results_count, top_score, used_external)
         VALUES ($1, $2, $3, $4, $5)
      `, [articleId, query, finalChunks.length, topScore, true]);
  } else {
      // Log successful internal retrieval
      await dbQuery(`
         INSERT INTO kb_search_logs (article_id, query, results_count, top_score, used_external)
         VALUES ($1, $2, $3, $4, $5)
      `, [articleId, query, finalChunks.length, topScore, false]);
  }

  // STEP 5 — Build context block for AI
  let context = "";
  let source_instruction = "";

  if (kb_sufficient === true) {
      context = finalChunks.map(c => {
        let metaObj = c.metadata;
        if (typeof metaObj === 'string') {
          try { metaObj = JSON.parse(metaObj); } catch(e) { metaObj = {}; }
        }
        return `[Nguồn KB: ${metaObj?.source_title || 'Unknown Title'} - ${c.publisher || metaObj?.publisher || 'Unknown Publisher'} ${c.publish_year || metaObj?.year || ''}]\n${c.content}`;
      }).join('\n\n');
      
      source_instruction = `
IMPORTANT: Use ONLY the sources provided above.
For every factual claim, cite the source inline: [Nguồn: Publisher, Year]
Do NOT use any other sources.
      `.trim();
  } else {
      context = finalChunks.map(c => c.content).join('\n\n');
      
      source_instruction = `
The internal knowledge base has limited content on this topic.
You may use additional sources, BUT you MUST:
1. Explicitly state the source name, organization, and URL
2. Only use: WHO, CDC, PubMed, Lancet, NEJM, BMJ, UpToDate, EMC, MIMS
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
