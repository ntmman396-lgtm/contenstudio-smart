import { GoogleGenerativeAI } from '@google/generative-ai';
import { MOCK_DOMAIN_CONFIGS } from '@/lib/mock-rules-data';
import { getAllRules } from '@/lib/qc/rule-registry';

// Initialize Gemini
// Ensure you have GEMINI_API_KEY in your .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Placeholder for your actual Database client (e.g., pg, knex, prisma, or supabase).
 * Swap out the internals of this function once you have a DB client configured.
 */
async function dbQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  console.log('Executing DB Query:', query.trim().replace(/\s+/g, ' '));
  console.log('With Params:', params);
  
  // Return mocked empty array to avoid breaking the application before a real DB is connected
  return [];
}

/**
 * Parses and loads domain configs into a dictionary.
 */
async function loadDomainConfigs() {
  return MOCK_DOMAIN_CONFIGS;
}

/**
 * 1. buildPrompt: Prepares the prompt by evaluating rules from the Database.
 */
export async function buildPrompt(articleId: string, templateId: string, targetWebsite: string) {
  // 1. Load active rules from DB/Mock
  const rules = getAllRules().filter((r: any) => 
    r.is_active && 
    (r.applies_to.includes('*') || r.applies_to.includes(templateId))
  );

  // 2. Apply template overrides (Skipped in mock mode)
  const overrides: any[] = [];

  if (overrides.length > 0) {
    rules.forEach((rule: any) => {
      const override = overrides.find((o: any) => o.rule_id === rule.id);
      if (override) {
        if (override.deduction !== null) rule.deduction = override.deduction;
        if (override.is_active !== null) rule.is_active = override.is_active;
      }
    });
  }

  // Filter out any that were deactivated via overrides
  const activeRules = rules.filter((r: any) => r.is_active);

  // 3. Load domain configs
  const domainConfigs = await loadDomainConfigs();

  // 4. Inject targetWebsite into cross-domain rule & resolve dynamic configs
  activeRules.forEach((rule: any) => {
    // Ensure check_config is an object
    if (typeof rule.check_config === 'string') {
      try { rule.check_config = JSON.parse(rule.check_config); } catch (e) { /* ignore */ }
    }
    rule.check_config = rule.check_config || {};

    // specific injection for LINK_no_cross_domain
    if (rule.code === 'LINK_no_cross_domain') {
      rule.check_config.article_domain = targetWebsite;
    }

    // Automatically resolve any config relying on "rule_domain_configs.*"
    Object.keys(rule.check_config).forEach(key => {
      const val = rule.check_config[key];
      if (typeof val === 'string' && val.startsWith('rule_domain_configs.')) {
        const configKey = val.split('.')[1];
        if (domainConfigs[configKey] !== undefined) {
          rule.check_config[key] = domainConfigs[configKey];
        }
      }
    });
  });

  // Split rules by severity
  const criticalRules = activeRules.filter((r: any) => r.severity === 'critical');
  const warningRules = activeRules.filter((r: any) => r.severity === 'warning');
  const infoRules = activeRules.filter((r: any) => r.severity === 'info');

  const formatRule = (r: any) => {
    return `- [${r.code}] ${r.name}
    * Check Type: ${r.check_type}
    * Config: ${JSON.stringify(r.check_config)}
    * Point Deduction: ${r.deduction}
    * Max Deduction: ${r.max_deduction}
    ${r.auto_fixable ? `* AUTO_FIXABLE: true\n    * Fix Instruction: ${r.fix_instruction}` : ''}`;
  };

  const scoreConfig = `Point deduction rules apply up to max_deduction per rule. Return the scores broken down by 2 main layers (TECH and CONTENT) and a total score (max 100 for each layer). Total score = ROUND(TECH * 0.4 + CONTENT * 0.6). Floor rules: If TECH < 60 or CONTENT < 60, then blocked = true.`;

  // 5. Build system prompt
  const prompt = `You are a QC engine for Long Châu medical content.
      
Apply these rules in order:

CRITICAL rules (check first, block if violated):
${criticalRules.map(formatRule).join('\n')}

WARNING rules (check, deduct points):
${warningRules.map(formatRule).join('\n')}

INFO rules (auto-fix then check):
${infoRules.map(formatRule).join('\n')}

SCORING:
${scoreConfig}

Return exact valid JSON with the following structure:
{
  "fixed_content": "string - Full HTML content after applying AUTO_FIXABLE instructions. Ensure HTML syntax is perfectly intact.",
  "issues": [{"rule_code": "...", "severity": "...", "deduction": 0, "location": "...", "text": "...", "suggestion": "..."}],
  "auto_fixed": [{"rule_code": "...", "original": "...", "fixed": "..."}],
  "scores": {"tech": 0, "content": 0, "total": 100},
  "grade": "A/B/C/D",
  "blocked": false,
  "block_reasons": [""]
}`;

  return { prompt, activeRules };
}

/**
 * 2. runReview: Executes the end to end review pipeline
 */
export async function runReview(article: any, templateId: string, targetWebsite: string) {
  // 1. Build prompt and prepare rule references
  const { prompt } = await buildPrompt(article.id, templateId, targetWebsite);

  // 2. Call Gemini
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.1, // Keep it deterministic for QC
      responseMimeType: 'application/json'
    }
  });

  const contentToReview = `
[ARTICLE META]
ID: ${article.id}
Website Target: ${targetWebsite}

[ARTICLE CONTENT]
${article.content || article.htmlContent || ''}
  `;

  let responseData: any;
  try {
    const response = await model.generateContent([prompt, contentToReview]);
    const responseText = response.response.text();
    responseData = JSON.parse(responseText);
  } catch (error) {
    console.error("Gemini Review Engine Error:", error);
    throw new Error('RulesEngine review execution failed');
  }

  // 4. Apply score thresholds → determine status (dùng ArticleStatus thống nhất)
  let finalStatus = 'pending_review';
  if (responseData.blocked) {
    finalStatus = 'rework_required';
  } else if (responseData.scores.total >= 90) {
    finalStatus = 'ready_for_review';
  } else if (responseData.scores.total >= 70) {
    finalStatus = 'needs_improvement';
  } else {
    finalStatus = 'rework_required';
  }

  // 5. Save to article_review_results
  // (Using simple inserts for illustration purposes - adjust based on your chosen ORM)
  await dbQuery(`
    INSERT INTO article_review_results (article_id, scores, grade, issues, auto_fixed, blocked, block_reasons, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    article.id,
    JSON.stringify(responseData.scores),
    responseData.grade || 'C',
    JSON.stringify(responseData.issues),
    JSON.stringify(responseData.auto_fixed),
    responseData.blocked || false,
    JSON.stringify(responseData.block_reasons || []),
    finalStatus
  ]);

  // 6. Update article.content with fixed_content
  if (responseData.fixed_content) {
    await dbQuery(`UPDATE articles SET content = $1 WHERE id = $2`, [responseData.fixed_content, article.id]);
    article.content = responseData.fixed_content;
  }

  // 7. Log to rule_change_logs if any rule triggered
  // Note: Your schema defines 'rule_change_logs' for tracking DB rule additions/edits. 
  // However, logging issue triggers here as requested:
  if (responseData.issues && responseData.issues.length > 0) {
    for (const issue of responseData.issues) {
      await dbQuery(`
        INSERT INTO rule_change_logs (rule_id, changed_by, change_type, note)
        VALUES ((SELECT id FROM rules WHERE code = $1 LIMIT 1), 'System_RulesEngine', 'triggered', $2)
      `, [issue.rule_code, `Rule triggered on article ${article.id}`]);
    }
  }

  // 8. Return result with recommended status transition
  return {
    success: true,
    result: responseData,
    recommendedStatus: finalStatus,
    updatedArticle: article
  };
}
