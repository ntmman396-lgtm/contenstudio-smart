// Full end-to-end batch simulation — tests the EXACT flow user does in browser
// Step 1: Create keyword-based plan items (what happens when user types keywords)
// Step 2: Generate articles via /api/generate (what happens when user clicks "Tạo bài viết (Batch)")
// Step 3: Save articles via /api/articles (what happens after generation succeeds)

const BASE = 'http://localhost:3000';

const PLAN_ITEMS = [
  { id: 'batch-1', title: 'Sự khác biệt giữa vaccine dịch vụ 6 trong 1 và 5 trong 1 mở rộng', outline: '', status: 'draft' },
  { id: 'batch-2', title: 'Những vaccine nào quan trọng cho người trưởng thành hoặc người cao tuổi?', outline: '', status: 'draft' },
  { id: 'batch-3', title: 'Tiêm nhiều mũi cùng lúc có quá tải cho bé không?', outline: '', status: 'draft' },
];

const TEMPLATE_ID = 'vac-xin-le';

const SETTINGS = {
  sourceText: 'Thông tin tham khảo về vaccine cho nội dung y khoa',
  templateId: TEMPLATE_ID,
  siteId: 'nha-thuoc',
  articleCount: 1,
  tone: 'professional',
  language: 'vi',
  minWords: 800,
  maxWords: 2000,
  customInstructions: '',
};

async function generateSingleItem(item, index) {
  const label = `[${index+1}/${PLAN_ITEMS.length}] ${item.title.substring(0, 50)}...`;
  console.log(`\n⚙️  Generating: ${label}`);
  
  try {
    const t0 = Date.now();
    const genRes = await fetch(`${BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, settings: SETTINGS }),
    });
    
    if (!genRes.ok) {
      const err = await genRes.text();
      let errorMsg;
      try { errorMsg = JSON.parse(err).error; } catch { errorMsg = err.substring(0, 200); }
      console.log(`❌ GENERATE FAILED: ${errorMsg}`);
      return { ...item, status: 'failed', error: errorMsg };
    }
    
    const genData = await genRes.json();
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✅ Generated in ${elapsed}s: "${genData.article.title}"`);
    
    // Step 2: Save to DB
    const saveRes = await fetch(`${BASE}/api/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(genData.article),
    });
    
    if (!saveRes.ok) {
      const saveErr = await saveRes.text();
      let errorMsg;
      try { errorMsg = JSON.parse(saveErr).error; } catch { errorMsg = saveErr.substring(0, 200); }
      console.log(`❌ SAVE FAILED: ${errorMsg}`);
      return { ...item, status: 'failed', error: errorMsg };
    }
    
    const saved = await saveRes.json();
    console.log(`💾 Saved as: ${saved.id}`);
    return { ...item, status: 'completed', articleId: saved.id };
    
  } catch (err) {
    console.log(`❌ NETWORK ERROR: ${err.message}`);
    return { ...item, status: 'failed', error: err.message };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('BATCH GENERATION E2E TEST');
  console.log(`Template: ${TEMPLATE_ID}`);
  console.log(`Articles: ${PLAN_ITEMS.length}`);
  console.log('='.repeat(60));
  
  const results = [];
  for (let i = 0; i < PLAN_ITEMS.length; i++) {
    const result = await generateSingleItem(PLAN_ITEMS[i], i);
    results.push(result);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('RESULTS SUMMARY:');
  const completed = results.filter(r => r.status === 'completed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.log(`✅ Completed: ${completed}/${PLAN_ITEMS.length}`);
  console.log(`❌ Failed: ${failed}/${PLAN_ITEMS.length}`);
  
  if (failed > 0) {
    console.log('\nFailed items:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`  - ${r.title.substring(0, 50)}: ${r.error}`);
    });
  }
  
  console.log('='.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

main();
