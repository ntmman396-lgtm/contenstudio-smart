import { SafetyQCEngine } from './lib/qc/safety-engine';

// Mock article data
const badArticle = `
  <html>
    <body>
      <h1>Điều trị dứt điểm bệnh tiểu đường tuýp 2</h1>
      <p>Loại thảo dược này cam kết chữa khỏi bệnh hoàn toàn 100% chỉ sau 7 ngày.</p>
      <p>Mỗi ngày bạn chỉ cần sử dụng 5000mg thuốc Metformin và uống cùng nước chanh để thấy hiệu quả.</p>
      <p>Bài thuốc này chưa gây ra tác dụng phụ gì đáng kể.</p>
      <p>Tuy nhiên, ở một số chỗ khác khuyên uống 500mg Metformin thay vì 5000mg.</p>
    </body>
  </html>
`;

const goodArticle = `
  <html>
    <body>
      <h1>Hướng dẫn chăm sóc sức khỏe cho người tiểu đường</h1>
      <p>Bài viết này chỉ mang tính chất tham khảo, không thể thay thế việc tư vấn y khoa.</p>
      <p>Nếu bạn gặp các triệu chứng như mệt mỏi, hãy nhanh chóng tới gặp bác sĩ để được thăm khám kịp thời.</p>
      <p>Lưu ý với phụ nữ mang thai, không nên sử dụng loại thuốc này vì nguy cơ biến chứng thai kỳ.</p>
      <p>Thuốc có một số tác dụng phụ như buồn nôn, chóng mặt.</p>
      <p>Nếu triệu chứng không giảm sau 3 ngày, vui lòng ngưng sử dụng và tái khám.</p>
    </body>
  </html>
`;

async function runTests() {
  const engine = new SafetyQCEngine();

  console.log("=== THỬ NGHIỆM ĐÁNH GIÁ RISK & SAFETY ĐỘC LẬP ===");
  
  console.log("\\n1. BÀI VIẾT VI PHẠM (DANGEROUS CLAIM, DOSAGE ISSUE)");
  const riskResultBad = await engine.evaluateRiskStandalone(badArticle);
  const safetyResultBad = await engine.evaluateSafetyStandalone(badArticle);
  console.log("Risk: ", riskResultBad.flags, "Score:", riskResultBad.risk_score, "Level:", riskResultBad.risk_level);
  console.log("Safety Score:", safetyResultBad.safety_score, "Missing:", safetyResultBad.missing_elements);

  console.log("\\n2. BÀI VIẾT AN TOÀN (CÓ CẢNH BÁO, DISCLAIMER)");
  const riskResultGood = await engine.evaluateRiskStandalone(goodArticle);
  const safetyResultGood = await engine.evaluateSafetyStandalone(goodArticle);
  console.log("Risk: ", riskResultGood.flags, "Score:", riskResultGood.risk_score, "Level:", riskResultGood.risk_level);
  console.log("Safety Score:", safetyResultGood.safety_score, "Missing:", safetyResultGood.missing_elements);

  console.log("\\n=== TEST XONG ===");
}

// To run this:
// npx ts-node src/test-safety-engine.ts
runTests().catch(console.error);
