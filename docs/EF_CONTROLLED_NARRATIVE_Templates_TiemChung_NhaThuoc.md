# 📖 TEMPLATE EF_CONTROLLED_NARRATIVE — NỘI DUNG SỨC KHỎE KIỂM SOÁT NARRATIVE + DOCTOR ANCHOR
## FPT LONG CHÂU CONTENT STUDIO — PHIÊN BẢN CHUẨN HOÁ V1.0

> **Loại nội dung:** `EF_CONTROLLED_NARRATIVE` — Controlled Narrative Explainer + Doctor Anchor
> **Áp dụng cho:** Kênh Tiêm Chủng Long Châu & Nhà Thuốc Long Châu
> **Dành cho:** BTV Editorial, CTV Content cấp cao, AI Content Generator
> **Yêu cầu tiên quyết:** Đọc và tuân thủ toàn bộ `System_Prompt_Controlled_Narrative_Doctor_Anchor_V4.md` trước khi viết

---

## 🧭 TỔNG QUAN VỀ LOẠI NỘI DUNG EF_CONTROLLED_NARRATIVE

### EF_CONTROLLED_NARRATIVE là gì?

Đây là dạng bài **Controlled Narrative Explainer** — tạo nội dung sức khỏe hấp dẫn, có tính báo chí đời thường, **không dựng nhân vật định danh** mà dùng human archetype, routine, reader mirror và belief/contradiction để tạo điểm chạm đời sống. Bác sĩ đóng vai **Trust Anchor** tại 2–3 touchpoint chính, không phải narrator toàn bài.

**Narrative flow cốt lõi:**

> **Human Moment → Human Belief / Blind Spot → Contradiction → Medical Question → Doctor Anchor → Evidence → Decision Support → Action**

**Nguyên tắc nền:**

> **Be creative with framing. Be conservative with facts.**
> Được sáng tạo cách kể; không được sáng tạo dữ kiện y khoa hoặc sự kiện được trình bày như có thật.

### Khi nào dùng EF_CONTROLLED_NARRATIVE?

Dùng khi **có ít nhất một** trong các điều kiện sau:

| Điều kiện | Mô tả |
|---|---|
| **Không có case người thật đủ nguồn** | Cần bài hấp dẫn nhưng không có dữ liệu case thật để viết EF_CASE_STORY |
| **Có niềm tin / điểm mù phổ biến rõ** | Người đọc đang tin một điều gì đó mà y khoa cho thấy cần nhìn thêm |
| **Có bác sĩ / nguồn chuyên môn** | Có trust anchor để giải thích tại clinical judgment points |
| **Cần bài hấp dẫn hơn explainer thông thường** | Explainer thuần túy quá khô, cần human tension nhưng không cần character story |
| **Reader mirror mạnh** | Tình huống / routine / niềm tin đủ phổ biến để đa số người đọc nhận ra mình |

### Khi nào KHÔNG dùng EF_CONTROLLED_NARRATIVE?

- Có case người thật đủ nguồn và consent → dùng `EF_CASE_STORY` (MODE B: REAL_CASE)
- Người đọc cần câu trả lời trực tiếp, khẩn cấp → dùng `EF_QA` hoặc MODE C: `ANSWER_FIRST_EXPLAINER`
- Nội dung thiên về giải thích kỹ thuật, hướng dẫn step-by-step → dùng `EF_HOWTO`, `EF_EXPLAINER`
- Topic quá hẹp không đủ human tension / contradiction để khai thác
- Storytelling sẽ làm chậm câu trả lời quan trọng

### So sánh nhanh EF_CONTROLLED_NARRATIVE vs EF_CASE_STORY

| Tiêu chí | EF_CONTROLLED_NARRATIVE | EF_CASE_STORY |
|---|---|---|
| **Nhân vật** | Không dựng nhân vật định danh — dùng archetype, routine, reader mirror | Bắt buộc có tên, tuổi, địa điểm (composite / real / fictional) |
| **Narrative approach** | Human Moment → Belief → Contradiction → Doctor Anchor | Event → Character → Reaction → Tension |
| **Doctor role** | Trust Anchor — 2 touchpoint (Unlock + Decision) | Expert judgment — xuất hiện tại decision points |
| **Opening style** | Hook Formula (Specific Human Moment + Belief + Contradiction) | Character Entry Modes (ROUTINE_LED, SCENE_LED, PROFILE_LED...) |
| **Story ratio** | Narrative/editorial 60–70%, Medical 20–30%, Doctor 5–10% | Story 15–20%, Medical 60–70%, Decision 15–20% |
| **Factual layer** | Kiểm soát chặt — không tạo sự kiện/nhân vật/quote mới | Composite/fictional cho phép dựng nhân vật có disclosure |
| **Legal guardrail** | TTĐT tổng hợp — Creative Framing ≠ New Factual Reporting | Case disclosure chuẩn |

---

## 🔄 FLOW BẮT BUỘC TRƯỚC KHI VIẾT (9 BƯỚC — THEO GENERATION PROTOCOL V4)

```
STEP 1: INPUT AUDIT
    Xác định: topic, reader, beneficiary, search intent,
    human tension, main misconception, doctor input,
    evidence, publication source, CTA, legal/source gaps
    ↓
STEP 2: CHOOSE NARRATIVE ENTRY
    Chọn 1 opening mode phù hợp từ Opening Library
    (Không chọn theo vòng quay máy móc)
    ↓
STEP 3: DEFINE HUMAN CONTRADICTION
    Viết: "Người đọc tin X, nhưng y khoa cho thấy cần nhìn thêm Y"
    (Nếu không tìm được contradiction đủ mạnh → chuyển Answer-first)
    ↓
STEP 4: MAP DOCTOR TOUCHPOINTS
    Touchpoint #1 = unlock gì?
    Touchpoint #2 = decision gì?
    #3 chỉ khi thật sự cần (safety / nhóm đặc biệt)
    ↓
STEP 5: BUILD MEDICAL SPINE
    Liệt kê 4–6 câu hỏi bài bắt buộc trả lời
    ↓
STEP 6: SOURCE MAP
    Map từng factual claim quan trọng với nguồn
    Nếu thiếu: [SOURCE REQUIRED]
    ↓
STEP 7: CHOOSE CONTENT MODE
    MODE A — CONTROLLED_NARRATIVE (default)
    MODE B — REAL_CASE_STORY (chỉ khi có case thật đủ nguồn)
    MODE C — ANSWER_FIRST_EXPLAINER (khi cần trả lời trực tiếp)
    ↓
STEP 8: DRAFT
    Viết prose tự nhiên theo template
    ↓
STEP 9: SELF-QC → REWRITE nếu cần → OUTPUT
    Chạy QC checklist tương ứng kênh
```

---

## 📝 INPUT CONFIG — ĐIỀN TRƯỚC KHI VIẾT

```yaml
brand: Nhà thuốc Long Châu
channel: TIEM_CHUNG | NHA_THUOC
content_type: EF_CONTROLLED_NARRATIVE
topic:
medical_territory:

reader_persona:
  who_is_reading:
  what_they_worry_about:
  what_decision_they_face:
  what_action_they_can_take:
beneficiary:
decision_maker:

human_tension:
  belief_or_assumption:
  contradiction:
  blind_spot:

content_mode: CONTROLLED_NARRATIVE | REAL_CASE_STORY | ANSWER_FIRST_EXPLAINER
opening_mode: ROUTINE_LED | BELIEF_LED | CONTRAST_LED | DECISION_LED | BLIND_SPOT_LED | QUESTION_LED | LIFE_MOMENT_LED

publication_mode: TTDT_AGGREGATED | PRESS_LINKED_PRODUCTION | OWN_SERVICE_QA | OTHER
publication_source:
medical_evidence:
source_status: verified | pending | insufficient

doctor_name:
doctor_title:
doctor_input:
doctor_status: confirmed_input | review_required | unavailable
doctor_touchpoints:
  touchpoint_1_unlock:
  touchpoint_2_decision:
  touchpoint_3_safety:

real_case_available: true | false
case_source:

seo_keywords:
cta:
desired_length:
output_mode: ARTICLE_ONLY | ARTICLE_WITH_REVIEW_MARKERS | EDITORIAL_PLAN
special_notes:
```

> **Lưu ý bắt buộc:**
> - `human_tension` phải được điền trước khi viết — đây là trục narrative chính
> - Nếu `content_mode = REAL_CASE_STORY`: không được tự bịa chi tiết còn thiếu
> - Nếu `doctor_status = unavailable`: không tự phát minh quote, dùng `[DOCTOR REVIEW]`
> - Nếu `source_status = insufficient`: đánh dấu `[SOURCE REQUIRED]`, không bịa evidence

---

## ─────────────────────────────────────────────
## 🏥 PHẦN I — TEMPLATE TIÊM CHỦNG LONG CHÂU
## ─────────────────────────────────────────────

### Đặc điểm nhận dạng nội dung Tiêm Chủng — EF_CONTROLLED_NARRATIVE

**Reader personas phổ biến:**
- Con cái (30–50 tuổi) chăm sóc ba mẹ lớn tuổi
- Phụ huynh lo vaccine cho trẻ
- Người trưởng thành tự quyết định cho bản thân (HPV, cúm, viêm gan)
- Phụ nữ chuẩn bị mang thai hoặc đang mang thai

**Human tensions phổ biến (dạng belief/contradiction):**
- "Thuốc uống đều mỗi ngày" → nhưng lịch vaccine bị bỏ ngoài checklist chăm sóc
- "Đã tiêm rồi vẫn bệnh" → nhưng vaccine không mặc định bảo vệ tuyệt đối
- "Ba mẹ già rồi, tiêm làm gì" → nhưng tuổi và bệnh nền thay đổi mức nguy cơ
- "Men gan bình thường thì chắc không bị viêm gan B" → nhưng men gan và nhiễm HBV trả lời 2 câu hỏi khác nhau
- "Còn làm khỏe mà" → nhưng sức lao động không phản ánh nguy cơ tim mạch
- "Trẻ sốt nhẹ → hoãn tiêm" → nhưng phân biệt hoãn tạm thời vs chống chỉ định

---

### 📋 TEMPLATE TIÊM CHỦNG — MARKDOWN ĐẦY ĐỦ

```markdown
# [TITLE — Human tension title theo Title System V4]
# Ví dụ: Thuốc nhớ từng viên, còn lịch vaccine của ba mẹ thì sao?
# Ví dụ: Đã tiêm cúm nhưng vẫn ho sốt, có phải vaccine "không có tác dụng"?
# Ví dụ: Ba mẹ ngoài 70, giờ mới nghĩ đến phế cầu — liệu có muộn?

<!-- TITLE phải có ít nhất một trong các yếu tố: -->
<!-- human tension / contradiction / quyết định / suy nghĩ dễ nhận ra / -->
<!-- blind spot / câu hỏi có giá trị thực tế -->

## Sapo
<!-- 2–3 câu, làm 3 việc: -->
<!-- 1. Gọi đúng vấn đề -->
<!-- 2. Cho người đọc lý do nên quan tâm -->
<!-- 3. Mở câu hỏi mà bài sẽ giải quyết -->
<!-- KHÔNG tóm tắt hết bài trong sapo -->
<!-- KHÔNG dùng sapo kiểu định nghĩa -->

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- NARRATIVE OPENING — Controlled Narrative (không phải case story) -->
<!-- Hook Formula: SPECIFIC HUMAN MOMENT + BELIEF + CONTRADICTION  -->
<!-- Chọn 1 trong 7 opening modes từ Opening Library              -->
<!--                                                                -->
<!-- ĐƯỢC PHÉP tạo:                                                 -->
<!--   micro-scene, human archetype, routine, contrast,             -->
<!--   inner thought, hypothetical, reader mirror, decision moment  -->
<!--                                                                -->
<!-- KHÔNG ĐƯỢC tự tạo như fact:                                     -->
<!--   nhân vật định danh, timeline bệnh, kết quả xét nghiệm,     -->
<!--   lời bệnh nhân/bác sĩ như quote thật, outcome lâm sàng      -->
<!-- ═══════════════════════════════════════════════════════════════ -->

[ĐOẠN 1 — Human Moment: routine / thói quen / tình huống đời thường: 2–4 câu]
<!-- Ví dụ Routine-led: "Thuốc huyết áp có thể được uống đúng mỗi sáng, -->
<!-- lịch tái khám đã lưu sẵn trong điện thoại..." -->

[ĐOẠN 2 — Belief / Blind Spot: niềm tin hoặc giả định đang có: 2–3 câu]
<!-- Ví dụ: "Nhưng lần gần nhất ba mẹ tiêm vaccine gì lại là -->
<!-- câu hỏi không dễ trả lời ngay." -->

[ĐOẠN 3 — Contradiction + Medical bridge: 2–3 câu]
<!-- Mâu thuẫn giữa belief và thực tế y khoa → dẫn vào phần giải thích -->

<!-- NARRATIVE CLARITY RULE: Nếu tình huống có thể bị hiểu là sự kiện -->
<!-- thật, dùng tín hiệu giả định: "thử hình dung", "một tình huống -->
<!-- có thể gặp", "giả sử...", hoặc thêm disclosure kín đáo -->

---

[DOCTOR TOUCHPOINT #1 — UNLOCK]
<!-- Đặt sau opening hoặc trong 15–30% đầu bài -->
<!-- Mục tiêu: phá misunderstanding chính, định nghĩa đúng vấn đề -->

`[DOCTOR REVIEW]` Theo bác sĩ **[Tên, chuyên khoa]**, [clinical judgment — phá misunderstanding, KHÔNG chỉ lặp lại evidence]
<!-- Ví dụ: "khả năng vẫn lao động tốt không phản ánh đầy đủ nguy cơ tim mạch" -->
<!-- Ví dụ: "tuổi và bệnh nền có thể làm thay đổi mức nguy cơ nhiễm trùng" -->
<!-- Doctor phải nghe như đang GIÚP HIỂU, không như trích guideline -->

---

## [H2 — Câu hỏi / vấn đề quan trọng 1 — viết như ngôn ngữ người đọc]
<!-- Ví dụ: "Vaccine phòng bệnh gì, và bảo vệ đến mức nào?" -->
<!-- Ví dụ: "Ngoài 70 tuổi mới tiêm phế cầu, có muộn không?" -->
<!-- Ví dụ: "Tiêm rồi vẫn bệnh — vaccine có thực sự tác dụng?" -->

[Medical clarity — Evidence → Meaning → Decision]
<!-- Không bê nguyên guideline vào bài -->
<!-- Chuyển: Evidence → nó có nghĩa gì → người đọc nên làm gì -->

[Evidence — calibrated language]
<!-- "được khuyến nghị", "dữ liệu cho thấy" -->
<!-- KHÔNG claim tuyệt đối: vaccine = không bao giờ mắc bệnh -->
<!-- Phân biệt: phòng nhiễm vs giảm bệnh nặng vs giảm biến chứng -->
<!-- Phân biệt: theo type được bao phủ vs mọi nguyên nhân -->

---

## [H2 — Misunderstanding / niềm tin cần sửa]
<!-- Ví dụ: "Đã uống thuốc đều, lịch tiêm có thật sự cần quan tâm?" -->
<!-- Ví dụ: "Cơ thể không sốt sau tiêm — vaccine có 'vào' không?" -->

[Evidence → Meaning]
<!-- Giải thích tại sao niềm tin phổ biến đó chưa đầy đủ -->
<!-- Plain language trước, thuật ngữ sau -->

### [H3 — Nếu H2 có ≥2 nhánh rõ hoặc follow-up tự nhiên]
<!-- Ví dụ: Phân nhóm theo đối tượng (trẻ em / người lớn / người cao tuổi) -->
<!-- Ví dụ: Các tình huống khác nhau (tiêm muộn / đổi lịch / hoãn tiêm) -->

[Body — prose rhythm 2–4 câu / đoạn, câu dài/ngắn đan xen]

---

## [H2 — Điều gì cần đánh giá / kiểm tra?]
<!-- Ví dụ: "Nếu đã lâu chưa rà lịch tiêm, nên bắt đầu từ đâu?" -->
<!-- Decision support — không phải protocol cứng -->

[DOCTOR TOUCHPOINT #2 — DECISION]
<!-- Đặt tại câu hỏi khó nhất hoặc trước hành động -->

`[DOCTOR REVIEW]` Theo bác sĩ **[Tên]**, [decision guidance — judgment có context, KHÔNG lặp evidence]
<!-- Ví dụ: "người lớn tuổi chưa từng đánh giá nguy cơ không nhất thiết -->
<!-- phải bắt đầu bằng danh sách dài xét nghiệm" -->

| Tình huống | Hướng xử lý thường gặp | Lưu ý |
|---|---|---|
| [Ví dụ: Đã tiêm nhưng không nhớ mũi nào] | [Trao đổi với nhân viên y tế để đối chiếu] | [Mang theo sổ tiêm nếu có] |
| [Ví dụ: Ba mẹ có bệnh nền mạn tính] | [Bác sĩ đánh giá chỉ định dựa trên bệnh nền] | [Không tự quyết hoãn/bỏ tiêm] |

---

## [H2 — Khi nào không nên chờ? — Safety net]
<!-- Chỉ thêm khi relevant với topic -->
<!-- Ví dụ: Dấu hiệu sau tiêm cần gặp nhân viên y tế -->
<!-- Ví dụ: Nhóm đặc biệt cần tư vấn trước khi tiêm -->

[DOCTOR TOUCHPOINT #3 — OPTIONAL SAFETY]
<!-- Chỉ khi cần: dấu hiệu cấp cứu, chống chỉ định, nhóm đặc biệt -->

`[DOCTOR REVIEW]` Bác sĩ **[Tên]** lưu ý, [safety judgment — tương xứng, không biến mọi triệu chứng thành emergency]

### [H3 — Nhóm cần tư vấn riêng trước khi tiêm — nếu relevant]
<!-- Phụ nữ mang thai, người suy giảm miễn dịch, người cao tuổi bệnh nền -->
<!-- Phân biệt: hoãn tạm thời vs chống chỉ định tuyệt đối -->

[Safety note — không dramatize, không dùng sợ hãi để thúc đẩy conversion]

---

## [H2 — Bước tiếp theo — "Sau khi đọc xong, tôi bắt đầu từ đâu?"]
<!-- Practical action — không bắt buộc là conversion -->

Thông tin hữu ích khi đến tư vấn tiêm chủng:
- Sổ / phiếu tiêm chủng cũ (nếu còn)
- Tên vaccine và thời điểm tiêm ước tính nếu nhớ
- Thông tin bệnh nền hiện tại
- Danh sách thuốc đang dùng (có thuốc nào ảnh hưởng miễn dịch không?)
- Tiền sử phản ứng sau tiêm (nếu có)

---

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- ENDING — Return to opening belief / Reframe                    -->
<!-- Callback về belief / niềm tin ban đầu                         -->
<!-- Reframe "khỏe", "an toàn", "đã phòng bệnh"...                -->
<!-- KHÔNG thêm medical claim mới                                   -->
<!-- ═══════════════════════════════════════════════════════════════ -->

## [Ending — Reframe niềm tin ban đầu]

[Return to opening belief — 1–2 đoạn]
<!-- Câu hỏi / cách hiểu ban đầu thay đổi thế nào sau khi đọc bài -->
<!-- Ví dụ: "chăm sóc sức khỏe" không chỉ là thuốc và tái khám -->

[Reader lesson — một điều người đọc có thể mang về]

[Next step — rõ ràng, không ép buộc]

`[CTA_SLOT]`
<!-- CTA phải nối logic với decision của bài -->
<!-- KHÔNG: fear-based conversion, guarantee, claim vượt indication -->

---

### Nguồn tham khảo
- [1] [Cục Y tế dự phòng / WHO / CDC — guideline vaccine liên quan, năm cập nhật]
- [2] [Tờ hướng dẫn sử dụng sản phẩm vaccine được cấp phép tại Việt Nam]
- [3] [Tài liệu khoa học bổ sung nếu có]
<!-- Publication source và medical evidence source phải được phân biệt -->
<!-- Nếu thiếu: [SOURCE / LEGAL REVIEW REQUIRED] -->
```

---

### ✅ QC CHECKLIST — TIÊM CHỦNG (EF_CONTROLLED_NARRATIVE)

Trước khi submit bài, kiểm tra **tất cả** ô dưới đây:

#### QC Nhóm A — Attraction & Narrative

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| A1 | Opening có Human Moment cụ thể (không phải định nghĩa / thống kê / "hiện nay")? | ☐ | ☐ |
| A2 | Có Human Belief hoặc Blind Spot rõ ràng? | ☐ | ☐ |
| A3 | Có Contradiction (belief vs thực tế y khoa)? | ☐ | ☐ |
| A4 | Sau 100–150 từ, người đọc còn lý do để đọc tiếp? | ☐ | ☐ |
| A5 | Không dựng nhân vật định danh (tên, tuổi, địa điểm) như case thật? | ☐ | ☐ |
| A6 | Narrative Clarity Rule: nếu tình huống chi tiết → có tín hiệu giả định hoặc disclosure? | ☐ | ☐ |

#### QC Nhóm B — Story Integrity & Prose

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| B1 | Có narrative progression (không chỉ hook rồi mất)? | ☐ | ☐ |
| B2 | Human element không biến mất hoàn toàn sau opening? | ☐ | ☐ |
| B3 | Ending có callback lại belief / tension ban đầu? | ☐ | ☐ |
| B4 | Prose rhythm 2–4 câu/đoạn, câu dài/ngắn đan xen (không staccato)? | ☐ | ☐ |
| B5 | Không có đoạn giống textbook / guideline dump? | ☐ | ☐ |

#### QC Nhóm C — Doctor Integration

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| C1 | Doctor Touchpoint #1 (Unlock) có thật sự phá misunderstanding? | ☐ | ☐ |
| C2 | Doctor Touchpoint #2 (Decision) có thật sự giúp người đọc quyết định? | ☐ | ☐ |
| C3 | Không quá 2–3 touchpoint? | ☐ | ☐ |
| C4 | Không có câu "Theo bác sĩ…" nào chỉ lặp evidence? | ☐ | ☐ |
| C5 | Không có quote nào chưa được bác sĩ xác nhận (hoặc đã đánh dấu `[DOCTOR REVIEW]`)? | ☐ | ☐ |
| C6 | Doctor nghe như đang giúp hiểu, không như trích guideline? | ☐ | ☐ |

#### QC Nhóm D — Medical Spine & Evidence

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| D1 | Mỗi H2 giải câu hỏi thực tế (không phải keyword SEO)? | ☐ | ☐ |
| D2 | Phân biệt đúng: phòng nhiễm vs giảm bệnh nặng vs giảm biến chứng? | ☐ | ☐ |
| D3 | Không áp lịch vaccine nước ngoài khi chưa xác minh local guideline? | ☐ | ☐ |
| D4 | Mọi medical claim chính có nguồn (hoặc ghi `[SOURCE REQUIRED]`)? | ☐ | ☐ |
| D5 | Không có claim mạnh hơn nguồn (associated ≠ causes, may ≠ will)? | ☐ | ☐ |

#### QC Nhóm E — Legal / Provenance

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| E1 | Không có sự kiện / nhân vật được trình bày như thật mà không có nguồn? | ☐ | ☐ |
| E2 | Không có factual event do AI sáng tạo? | ☐ | ☐ |
| E3 | Narrative không đang tạo "new reporting"? | ☐ | ☐ |
| E4 | Publication source đã xác nhận hay còn `[LEGAL REVIEW]`? | ☐ | ☐ |

#### QC Nhóm F — Action & Commercial Guardrail

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| F1 | Người đọc biết mình nên làm gì tiếp theo? | ☐ | ☐ |
| F2 | Có safety net đúng mức (không biến mọi triệu chứng thành emergency)? | ☐ | ☐ |
| F3 | CTA nối logic với decision, không vượt evidence? | ☐ | ☐ |
| F4 | Không fear-based conversion, không guarantee, không claim vượt indication? | ☐ | ☐ |

#### QC Nhóm G — Originality & Final Check

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| G1 | Không copy premise / cấu trúc đặc trưng của benchmark? | ☐ | ☐ |
| G2 | Bỏ tên bệnh khỏi opening → vẫn là tình huống con người cụ thể? | ☐ | ☐ |
| G3 | Bác sĩ xuất hiện vì thật sự giúp quyết định, không chỉ để bài trông đáng tin? | ☐ | ☐ |

---

### 📐 STORY RATIO REFERENCE — TIÊM CHỦNG (EF_CONTROLLED_NARRATIVE)

```
Narrative / Editorial voice:         60–70%
    Opening (human moment + belief + contradiction)
    + Narrative transitions giữa các H2
    + Human tension / contrast xuyên bài
    + Ending (reframe belief)

Medical evidence / Explanation:      20–30%
    H2 medical clarity
    + H2 misunderstanding
    + Evidence → Meaning → Decision
    + Decision table

Doctor voice trực tiếp:              5–10%
    Touchpoint #1 (Unlock)
    + Touchpoint #2 (Decision)
    + Touchpoint #3 (Safety — nếu cần)
```

> **Nhắc nhở:** Đây là tỷ lệ về **cảm giác đọc**, không phải công thức đếm từ cứng.
> **Narrative là presentation layer, không phải permission to invent.**

---

### 📌 TITLE EXAMPLES — TIÊM CHỦNG (EF_CONTROLLED_NARRATIVE)

| Archetype | Ví dụ Title — ĐÚNG |
|---|---|
| Action vs hidden risk | Vẫn khuân hàng cả ngày, làm sao biết tim mạch có thực sự ổn? |
| Routine vs blind spot | Thuốc nhớ từng viên, còn lịch vaccine của ba mẹ thì sao? |
| Expectation vs reality | Đã tiêm cúm nhưng vẫn ho sốt, có phải vaccine "không có tác dụng"? |
| Normal result vs unanswered question | Men gan bình thường, vì sao vẫn có thể cần xét nghiệm viêm gan B? |
| Life event vs decision | Vừa tiêm HPV mũi đầu thì phát hiện mang thai, lịch tiêm còn lại xử lý thế nào? |
| Belief vs medical reality | Ba mẹ ngoài 70, giờ mới nghĩ đến phế cầu — thật sự có muộn không? |
| Everyday concern | Cả nhà nhớ giờ uống thuốc của ba, không ai nhớ lịch tiêm gần nhất |

**KHÔNG dùng:**
- ~~Theo WHO, vaccine X là…~~
- ~~Hiện nay, bệnh X ngày càng phổ biến…~~
- ~~7 điều cần biết về vaccine phế cầu~~
- ~~Vaccine phế cầu cho người cao tuổi có cần thiết không?~~
- ~~Sức khỏe là tài sản quý giá…~~

---

### 🔖 EXEMPLAR TIÊM CHỦNG — THAM CHIẾU (từ V4 FEW-SHOT EXAMPLE 2)

```
Bài: "Thuốc nhớ từng viên, còn lịch vaccine của ba mẹ thì sao?"

Narrative spine đã đạt:
Routine chăm sóc (thuốc, tái khám) → Blind spot (vaccine bị bỏ ngoài checklist)
→ Contradiction → Doctor Unlock → Medical clarity → Decision → Reframe

Opening mode: ROUTINE_LED (Everyday blind spot)
Human tension: "Chăm sóc kỹ" nhưng vẫn có khoảng trống — lịch tiêm chủng
Contradiction: Sự chú ý tập trung vào bệnh đang phải uống thuốc,
              vaccine dễ đứng ngoài checklist quen thuộc
Doctor Touchpoint #1 (Unlock): Tuổi và bệnh nền thay đổi mức nguy cơ →
                                lịch tiêm cũng cần được rà lại
Doctor Touchpoint #2 (Decision): [Cần bác sĩ xác nhận]
Ending: Reframe "chăm sóc sức khỏe" không chỉ là thuốc và tái khám

Không có:
- Nhân vật định danh (không có "chị Lan, 42 tuổi, TP.HCM")
- Timeline bệnh cụ thể
- Quote giả
- Kết quả xét nghiệm do AI tạo
```

**5 lớp học từ exemplar này:**
1. Routine + blind spot = tension tự nhiên, không cần dựng case
2. Human archetype ("cả nhà", "ba mẹ") thay cho nhân vật định danh
3. Doctor Unlock ngay sau contradiction — phá misunderstanding chính
4. Evidence → Meaning (lịch tiêm cũng là một phần hồ sơ sức khỏe)
5. Ending callback: "chăm sóc sức khỏe" được reframe rộng hơn

---

## ─────────────────────────────────────────────
## 💊 PHẦN II — TEMPLATE NHÀ THUỐC LONG CHÂU
## ─────────────────────────────────────────────

### Đặc điểm nhận dạng nội dung Nhà Thuốc — EF_CONTROLLED_NARRATIVE

**Reader personas phổ biến:**
- Người có kết quả xét nghiệm bất thường hoặc "bình thường nhưng chưa đầy đủ"
- Người đang dùng thuốc mạn tính, lo về tương tác / tác dụng phụ
- Người chăm sóc bệnh nhân mạn tính (đái tháo đường, tăng huyết áp, tim mạch)
- Người mới phát hiện yếu tố nguy cơ, chưa biết bắt đầu từ đâu

**Human tensions phổ biến (dạng belief/contradiction):**
- "Men gan bình thường → chắc không bị viêm gan B" → nhưng men gan và tình trạng HBV trả lời 2 câu hỏi khác nhau
- "Còn làm khỏe mà → tim mạch chắc ổn" → nhưng sức lao động không phản ánh huyết áp, đường huyết, cholesterol
- "Hết triệu chứng rồi → ngừng kháng sinh được" → nhưng ngừng sớm có thể gây kháng thuốc
- "Bác sĩ nói theo dõi" → nhưng không biết theo dõi cái gì, bằng cách nào
- "Thuốc bổ là bổ, uống thêm không sao" → nhưng TPCN cũng có thể tương tác với thuốc đang dùng
- "Cholesterol cao → phải kiêng hết dầu mỡ" → nhưng cơ chế quản lý lipid không đơn giản như vậy

---

### 📋 TEMPLATE NHÀ THUỐC — MARKDOWN ĐẦY ĐỦ

```markdown
# [TITLE — Human tension title theo Title System V4]
# Ví dụ: Men gan bình thường, vì sao câu hỏi về viêm gan B vẫn chưa được trả lời?
# Ví dụ: Vẫn khuân hàng cả ngày, làm sao biết tim mạch có thực sự ổn?
# Ví dụ: Hết triệu chứng rồi nhưng kháng sinh vẫn còn — dừng hay uống tiếp?

<!-- TITLE phải có ít nhất một trong các yếu tố: -->
<!-- human tension / contradiction / quyết định / suy nghĩ dễ nhận ra / -->
<!-- blind spot / câu hỏi có giá trị thực tế -->

## Sapo
<!-- 2–3 câu, làm 3 việc: -->
<!-- 1. Gọi đúng vấn đề -->
<!-- 2. Cho người đọc lý do nên quan tâm -->
<!-- 3. Mở câu hỏi mà bài sẽ giải quyết -->
<!-- KHÔNG tóm tắt hết bài / KHÔNG dùng sapo kiểu định nghĩa -->

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- NARRATIVE OPENING — Controlled Narrative                       -->
<!-- Hook Formula: SPECIFIC HUMAN MOMENT + BELIEF + CONTRADICTION  -->
<!-- Đặc trưng nhà thuốc: Tension thường là                       -->
<!-- một kết quả / một thói quen / một niềm tin bị mâu thuẫn     -->
<!-- với thực tế y khoa khi nhìn kỹ hơn                           -->
<!--                                                                -->
<!-- ĐƯỢC PHÉP: micro-scene, archetype, routine, contrast,         -->
<!--   inner thought, hypothetical, reader mirror                   -->
<!-- KHÔNG ĐƯỢC: nhân vật định danh, timeline bệnh, xét nghiệm,   -->
<!--   quote giả, outcome lâm sàng                                 -->
<!-- ═══════════════════════════════════════════════════════════════ -->

[ĐOẠN 1 — Human Moment: kết quả xét nghiệm / thói quen dùng thuốc / tình huống đời thường: 2–4 câu]
<!-- Ví dụ Contrast-led: "Phiếu xét nghiệm ghi men gan trong giới hạn -->
<!-- bình thường thường mang lại một cảm giác khá yên tâm." -->

[ĐOẠN 2 — Belief / Assumption: suy luận người đọc đang có: 2–3 câu]
<!-- Ví dụ: "Nhưng từ kết quả đó đi đến kết luận 'vậy chắc mình -->
<!-- không có viêm gan B' lại là một bước suy luận khác." -->

[ĐOẠN 3 — Contradiction + Medical bridge: 2–3 câu]
<!-- Mâu thuẫn giữa belief và thực tế y khoa -->
<!-- Ví dụ: "Men gan phản ánh tổn thương tế bào gan tại thời điểm xét nghiệm; -->
<!-- nó không thay thế các xét nghiệm xác định tình trạng nhiễm HBV." -->

---

[DOCTOR TOUCHPOINT #1 — UNLOCK]
<!-- Đặt sau opening hoặc trong 15–30% đầu bài -->
<!-- Mục tiêu: tách 2 câu hỏi / 2 khái niệm bị đánh đồng -->

`[DOCTOR REVIEW]` Theo bác sĩ / dược sĩ **[Tên, chuyên khoa]**, [clinical judgment — phá misunderstanding]
<!-- Ví dụ: "người đọc nên tách hai câu hỏi: 'gan có đang tổn thương không?' -->
<!-- và 'tôi có đang hoặc từng nhiễm HBV không?'" -->

---

## [H2 — Câu hỏi cấp thiết nhất / Misunderstanding cần giải]
<!-- Ngôn ngữ người đọc, không phải heading dược lý -->
<!-- Ví dụ: "Men gan bình thường vẫn có thể nhiễm viêm gan B?" -->
<!-- Ví dụ: "Hết triệu chứng có đồng nghĩa hết nhiễm trùng?" -->
<!-- Ví dụ: "Sức lao động tốt có nghĩa tim mạch ổn?" -->

[Medical clarity — đời thường trước, thuật ngữ sau]
<!-- Plain language: "chưa tạo ra triệu chứng rõ" thay cho "asymptomatic" -->

[Evidence — calibrated language]
<!-- Phân biệt: screening / diagnostic / risk assessment / monitoring -->
<!-- KHÔNG biến xét nghiệm thành "máy dự đoán bệnh chắc chắn" -->

---

## [H2 — Mechanism / Why — "Vì sao lại như vậy?"]
<!-- Ví dụ: "Xét nghiệm men gan và xét nghiệm viêm gan B khác nhau thế nào?" -->
<!-- Ví dụ: "Tại sao kháng sinh cần uống đủ liệu trình?" -->
<!-- Ví dụ: "Huyết áp cao có thể không tạo triệu chứng — tại sao?" -->

[Medical clarity — plain language]

[Evidence → Meaning]

| [Chỉ số / Khái niệm / Tình huống] | [Ý nghĩa đơn giản] | [Lưu ý quan trọng] |
|---|---|---|
| [Ví dụ: HBsAg] | [Kháng nguyên bề mặt HBV] | [Dương tính gợi ý nhiễm HBV hiện tại] |
| [Ví dụ: Anti-HBs] | [Kháng thể chống HBsAg] | [Liên quan miễn dịch với HBV] |

### [H3 — Nhánh chi tiết nếu H2 có ≥2 nhánh rõ]

[Body — prose 2–4 câu / đoạn]

---

## [H2 — Điều gì cần đánh giá / quyết định?]
<!-- Ví dụ: "Với kết quả men gan bình thường, cần làm thêm xét nghiệm nào?" -->
<!-- Ví dụ: "Nếu đã lâu chưa đánh giá huyết áp, nên bắt đầu từ đâu?" -->

[Decision guidance — judgment có context, không protocol cứng]

[DOCTOR TOUCHPOINT #2 — DECISION]

`[DOCTOR REVIEW]` Theo bác sĩ / dược sĩ **[Tên]**, [decision guidance]
<!-- Ví dụ: "kiểm tra nên đi từ nguy cơ cá nhân và chỉ số cơ bản trước" -->

Ba câu hỏi hữu ích cho người đọc:
1. **[Câu hỏi 1 phù hợp context]**
2. **[Câu hỏi 2 phù hợp context]**
3. **[Câu hỏi 3 phù hợp context]**

---

## [H2 — Khi nào không nên chờ? — Safety net]
<!-- Chỉ thêm khi relevant -->
<!-- Safety net tương xứng — không biến mọi triệu chứng thành emergency -->

### [H3 — Dấu hiệu cần gặp nhân viên y tế]
<!-- Không dramatize — chỉ liệt kê những gì thực sự cần -->

### [H3 — Nhóm cần chú ý đặc biệt — nếu relevant]
<!-- Người cao tuổi, suy gan/thận, phụ nữ mang thai -->

---

## [H2 — Bước tiếp theo — "Tôi cần chuẩn bị gì?"]
<!-- Practical action, không bắt buộc là conversion -->

Thông tin hữu ích khi đến tư vấn:
- Danh sách thuốc đang dùng (tên thuốc, liều lượng, tần suất)
- Kết quả xét nghiệm gần nhất (nếu có)
- Tiền sử bệnh lý và dị ứng
- Các TPCN / vitamin / thảo dược đang dùng
- Câu hỏi cụ thể muốn hỏi (viết ra trước nếu có thể)

---

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- ENDING — Return to opening belief / Reframe                    -->
<!-- KHÔNG thêm medical claim mới                                   -->
<!-- ═══════════════════════════════════════════════════════════════ -->

## [Ending — Reframe niềm tin / cách hiểu ban đầu]

[Return to opening belief — 1–2 đoạn]
<!-- Ví dụ: "Men gan bình thường" → bây giờ hiểu rằng câu trả lời -->
<!-- về HBV cần một xét nghiệm khác -->

[Reader lesson — điều người đọc mang về]

[Next step — rõ ràng, không ép buộc]

`[CTA_SLOT]`

---

### Nguồn tham khảo
- [1] [Dược thư Quốc gia Việt Nam / Bộ Y tế VN / WHO / guideline liên quan]
- [2] [Tài liệu chuyên môn bổ sung nếu có]
- [3] [Hướng dẫn lâm sàng phù hợp]

*Nội dung bài viết chỉ mang tính chất tham khảo. Người đọc không được tự
ý áp dụng, cần hỏi ý kiến bác sĩ hoặc dược sĩ chuyên môn trước khi sử
dụng.*
```

---

### ✅ QC CHECKLIST — NHÀ THUỐC (EF_CONTROLLED_NARRATIVE)

Trước khi submit bài, kiểm tra **tất cả** ô dưới đây:

#### QC Nhóm A — Attraction & Narrative

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| A1 | Opening có Human Moment cụ thể (kết quả XN / thói quen dùng thuốc / tình huống đời thường)? | ☐ | ☐ |
| A2 | Có Belief / Assumption rõ ràng bị thách thức? | ☐ | ☐ |
| A3 | Có Contradiction (belief vs thực tế y khoa / dược lý)? | ☐ | ☐ |
| A4 | Sau 100–150 từ, người đọc còn lý do đọc tiếp? | ☐ | ☐ |
| A5 | Không dựng nhân vật định danh như case thật? | ☐ | ☐ |
| A6 | Narrative Clarity Rule: có tín hiệu giả định nếu cần? | ☐ | ☐ |

#### QC Nhóm B — Story Integrity & Prose

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| B1 | Có narrative progression xuyên bài? | ☐ | ☐ |
| B2 | Human element không biến mất sau opening? | ☐ | ☐ |
| B3 | Ending callback lại belief ban đầu? | ☐ | ☐ |
| B4 | Prose rhythm tự nhiên (không staccato / caption style)? | ☐ | ☐ |
| B5 | Không có đoạn giống textbook / evidence dump? | ☐ | ☐ |

#### QC Nhóm C — Doctor Integration

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| C1 | Touchpoint #1 (Unlock) thật sự phá misunderstanding? | ☐ | ☐ |
| C2 | Touchpoint #2 (Decision) thật sự giúp quyết định? | ☐ | ☐ |
| C3 | Không quá 2–3 touchpoint? | ☐ | ☐ |
| C4 | Không có "Theo bác sĩ/dược sĩ…" nào chỉ lặp evidence? | ☐ | ☐ |
| C5 | Quote chưa xác nhận đã đánh dấu `[DOCTOR REVIEW]`? | ☐ | ☐ |
| C6 | Doctor voice tự nhiên, không như trích guideline? | ☐ | ☐ |

#### QC Nhóm D — Medical Spine & Evidence

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| D1 | Mỗi H2 giải câu hỏi thực tế (không phải keyword)? | ☐ | ☐ |
| D2 | Phân biệt đúng: screening / diagnosis / monitoring / risk assessment? | ☐ | ☐ |
| D3 | Không biến xét nghiệm thành "máy dự đoán bệnh"? | ☐ | ☐ |
| D4 | Không claim tuyệt đối về hiệu quả? | ☐ | ☐ |
| D5 | Mọi medical claim chính có nguồn (hoặc `[SOURCE REQUIRED]`)? | ☐ | ☐ |
| D6 | Không có claim mạnh hơn nguồn? | ☐ | ☐ |

#### QC Nhóm E — Legal / Provenance

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| E1 | Không có sự kiện / nhân vật trình bày như thật mà không nguồn? | ☐ | ☐ |
| E2 | Không có factual event do AI sáng tạo? | ☐ | ☐ |
| E3 | Narrative không tạo "new reporting"? | ☐ | ☐ |
| E4 | Publication source xác nhận hay còn `[LEGAL REVIEW]`? | ☐ | ☐ |

#### QC Nhóm F — Action & Commercial Guardrail

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| F1 | Người đọc biết bước tiếp theo cụ thể? | ☐ | ☐ |
| F2 | Safety net đúng mức? | ☐ | ☐ |
| F3 | CTA nối logic với decision, không vượt evidence? | ☐ | ☐ |
| F4 | Service / sản phẩm không xuất hiện trong lập luận y khoa? | ☐ | ☐ |
| F5 | Không fear-based conversion, không guarantee? | ☐ | ☐ |

#### QC Nhóm G — Originality & Final Check

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| G1 | Không copy premise / cấu trúc đặc trưng benchmark? | ☐ | ☐ |
| G2 | Bỏ tên bệnh khỏi opening → vẫn là tình huống con người cụ thể? | ☐ | ☐ |
| G3 | Doctor xuất hiện vì giúp quyết định, không chỉ trang trí? | ☐ | ☐ |

---

### 📐 STORY RATIO REFERENCE — NHÀ THUỐC (EF_CONTROLLED_NARRATIVE)

```
Narrative / Editorial voice:         60–70%
    Opening (kết quả XN / thói quen / niềm tin bị mâu thuẫn)
    + Narrative transitions giữa các H2
    + Human tension / contrast xuyên bài
    + Ending (reframe cách hiểu / cách đặt câu hỏi)

Medical evidence / Explanation:      20–30%
    H2 medical clarity
    + H2 mechanism / why
    + Tables (chỉ số / tình huống / so sánh)
    + Evidence → Meaning → Decision

Doctor voice trực tiếp:              5–10%
    Touchpoint #1 (Unlock — phá misunderstanding)
    + Touchpoint #2 (Decision — hướng dẫn quyết định)
```

---

### 📌 TITLE EXAMPLES — NHÀ THUỐC (EF_CONTROLLED_NARRATIVE)

| Archetype | Ví dụ Title — ĐÚNG |
|---|---|
| Normal result vs unanswered question | Men gan bình thường, vì sao câu hỏi về viêm gan B vẫn chưa được trả lời? |
| Action vs hidden risk | Vẫn khuân hàng cả ngày, làm sao biết tim mạch có thực sự ổn? |
| Belief vs medical reality | Hết triệu chứng rồi nhưng kháng sinh vẫn còn — dừng hay uống tiếp? |
| Routine vs blind spot | Uống thuốc huyết áp đều mỗi sáng, nhưng con số huyết áp gần nhất là bao nhiêu? |
| Expectation vs reality | "Thuốc bổ" uống cùng thuốc kê đơn — thật sự bổ sung hay đang tương tác? |
| Hidden assumption | Cholesterol cao phải kiêng hết dầu mỡ — cơ thể quản lý lipid có đơn giản vậy? |
| Decision moment | Bác sĩ nói "theo dõi" — theo dõi cái gì, bằng cách nào, bao lâu? |

**KHÔNG dùng:**
- ~~Viêm gan B: Triệu chứng, nguyên nhân và cách điều trị~~
- ~~5 điều bạn cần biết về cholesterol~~
- ~~Tương tác thuốc là gì? Những điều cần biết~~
- ~~Thuốc X có tốt không?~~
- ~~Sức khỏe là tài sản quý giá…~~

---

### 🔖 EXEMPLAR NHÀ THUỐC — THAM CHIẾU (từ V4 FEW-SHOT EXAMPLE 3)

```
Bài: "Men gan bình thường, vì sao câu hỏi về viêm gan B vẫn chưa được trả lời?"

Narrative spine đã đạt:
Kết quả xét nghiệm yên tâm → Suy luận sai ("vậy chắc không bị viêm gan B")
→ Contradiction (men gan ≠ tình trạng HBV) → Doctor Unlock → Medical clarity
→ Decision → Reframe

Opening mode: CONTRAST_LED
Human tension: "Men gan bình thường = không bị viêm gan B" — suy luận phổ biến
Contradiction: Men gan phản ánh tổn thương tế bào gan tại thời điểm XN;
              không thay thế XN xác định tình trạng nhiễm HBV
Doctor Touchpoint #1 (Unlock): Tách hai câu hỏi:
    "gan có đang tổn thương không?" vs "có đang/từng nhiễm HBV không?"
Doctor Touchpoint #2 (Decision): [Cần bác sĩ xác nhận]
Ending: Reframe "men gan bình thường" → hiểu rằng cần XN khác để trả lời câu hỏi HBV

Không có:
- Nhân vật định danh
- Timeline bệnh cụ thể
- Quote giả
- Outcome lâm sàng do AI tạo
```

**5 lớp học từ exemplar này:**
1. CONTRAST_LED: kết quả bình thường NHƯNG câu hỏi chưa được trả lời = drama tự nhiên
2. Không cần nhân vật — "phiếu xét nghiệm", "cảm giác yên tâm" đã đủ human
3. Doctor Unlock tách 2 khái niệm bị đánh đồng — judgment thật sự
4. Table chỉ số (nếu thêm) giúp người đọc hiểu không cần thuộc ký hiệu
5. Ending reframe: thay đổi cách hiểu "kết quả bình thường", không phải phát hiện bệnh

---

## ─────────────────────────────────────────────
## 🔄 CHUNG CHO CẢ 2 KÊNH — RULES BẮT BUỘC
## ─────────────────────────────────────────────

### CONTROLLED NARRATIVE SPINE CHUẨN

```
Human Moment (routine / thói quen / tình huống đời thường)
→ Human Belief / Blind Spot (niềm tin / giả định)
→ Contradiction (mâu thuẫn với thực tế y khoa)
→ Medical Question (câu hỏi y khoa phát sinh)
→ Doctor Anchor — Touchpoint #1 Unlock (phá misunderstanding)
→ Evidence → Meaning → Decision
→ Doctor Anchor — Touchpoint #2 Decision (hướng dẫn quyết định)
→ Safety net (khi nào cần gặp bác sĩ)
→ Action (bước tiếp theo thực tế)
→ Ending — Return to opening belief / Reframe
→ Reader lesson
→ Next step
```

---

### OPENING LIBRARY — 7 ENTRY MODES

| Mode | Dùng khi nào | Ví dụ logic |
|---|---|---|
| `ROUTINE_LED` | Bắt đầu từ thói quen đời sống | "Thuốc huyết áp có thể được uống đúng mỗi sáng..." |
| `BELIEF_LED` | Bắt đầu từ niềm tin rất đời | "'Tôi còn làm khỏe mà' là cách rất tự nhiên để tự đo sức khỏe..." |
| `CONTRAST_LED` | Hai điều tưởng phải đi cùng nhưng không | "Men gan bình thường nghe giống tín hiệu yên tâm. Nhưng..." |
| `DECISION_LED` | Bắt đầu ngay trước quyết định | "Đã tiêm HPV mũi đầu, vài tuần sau lại phát hiện mang thai..." |
| `BLIND_SPOT_LED` | Chăm rất kỹ nhưng vẫn có khoảng trống | "Cả nhà nhớ giờ uống thuốc của ba, nhưng không ai nhớ lịch tiêm..." |
| `QUESTION_LED` | Chỉ dùng khi câu hỏi thực sự tạo tension | "Một người vẫn làm việc nặng mỗi ngày có thể xem đó là bằng chứng tim mạch vẫn ổn?" |
| `LIFE_MOMENT_LED` | Cột mốc đời sống thay đổi câu hỏi sức khỏe | Retirement, mang thai, sau nhập viện, con cái ra đời... |

> **Không mở bài bằng:** định nghĩa y khoa, "Theo WHO...", "Hiện nay...", "Sức khỏe là tài sản quý giá...", danh sách triệu chứng, keyword SEO nhồi vào câu đầu.
> **Human first. Medicine second.**

---

### CONTENT ROUTER — CHỌN MODE TRƯỚC KHI VIẾT

| Mode | Khi nào dùng | Cho phép | Cấm |
|---|---|---|---|
| **A — CONTROLLED_NARRATIVE** (Default) | Không có case thật đủ nguồn; cần bài hấp dẫn hơn explainer; có belief/blind spot rõ | micro-scene, archetype, routine, contrast, inner thought, hypothetical, reader mirror | dựng người thật giả, timeline bệnh, kết quả XN, quote giả, outcome không nguồn |
| **B — REAL_CASE_STORY** | Case có thật, thông tin được xác minh, có quyền sử dụng | Viết dựa trên dữ kiện thật | Tự điền phần còn thiếu, đổi tên rồi sáng tạo thêm |
| **C — ANSWER_FIRST_EXPLAINER** | Người đọc cần câu trả lời trực tiếp, chủ đề khẩn cấp/an toàn | Vẫn dùng human detail nhưng không trì hoãn answer | Storytelling làm chậm câu trả lời quan trọng |

---

### DOCTOR INTEGRATION — 3 TOUCHPOINTS

| Touchpoint | Vị trí | Mục tiêu | Ví dụ |
|---|---|---|---|
| **#1 — Unlock** | Sau opening hoặc 15–30% đầu bài | Phá misunderstanding chính, định nghĩa đúng vấn đề | "Còn làm được việc" và "không có yếu tố nguy cơ" là hai khái niệm khác nhau |
| **#2 — Decision** | Tại câu hỏi khó nhất / trước hành động | Giúp người đọc quyết định | "Kiểm tra nên đi từ nguy cơ cá nhân và chỉ số cơ bản trước" |
| **#3 — Safety** (optional) | Khi cần | Dấu hiệu cấp cứu, chống chỉ định, nhóm đặc biệt | Chỉ khi thật sự cần — không tạo touchpoint để trang trí |

**Doctor Attribution Rules:**
- Có lời bác sĩ thật → quote/paraphrase đúng nội dung
- Chỉ có tên bác sĩ, chưa có input → `[DOCTOR REVIEW – proposed clinical interpretation]`
- **Cấm:** AI tự viết quote rồi trình bày như phát ngôn thật

**Doctor Voice Style:**
- Ưu tiên: "Còn làm được việc và không có yếu tố nguy cơ là hai chuyện khác nhau."
- Hạn chế: "Theo các khuyến cáo hiện hành, cần đánh giá đa yếu tố nguy cơ..."
- Có thể dùng thuật ngữ khi cần, nhưng giải thích ngay bằng đời thường

---

### HUMAN REALITY ≠ FABRICATED CASE

| ✅ ĐƯỢC PHÉP tạo | ❌ KHÔNG ĐƯỢC tự tạo như fact |
|---|---|
| "một người ngoài 60 vẫn chạy xe giao hàng…" | "Ông Hòa, 62 tuổi, ở Đồng Nai…" |
| "nếu trong nhà có ba mẹ lớn tuổi…" | "ba tuần trước ông bị choáng…" |
| "thử hình dung…" | "bác sĩ phát hiện hẹp động mạch 70%…" |
| thói quen đời thường | "chị kể rằng…" |
| suy nghĩ có tính giả định | lời thoại như phỏng vấn thật |
| reader mirror | kết quả XN / điều trị / outcome không có nguồn |
| đối lập giữa cảm giác và dữ kiện | |

---

### AUTO-REWRITE TRIGGERS — PHẢI VIẾT LẠI NẾU GẶP

| Trigger | Mô tả |
|---|---|
| `FAIL_GENERIC_OPENING` | Mở bằng định nghĩa / thống kê / "hiện nay" |
| `FAIL_FAKE_CASE` | Tạo nhân vật / sự kiện như thật mà không có nguồn |
| `FAIL_DOCTOR_SPAM` | Bác sĩ xuất hiện ở gần như mọi section |
| `FAIL_FAKE_QUOTE` | AI tự viết lời bác sĩ rồi để trong ngoặc kép |
| `FAIL_EVIDENCE_DUMP` | Bài trở thành chuỗi guideline / citation |
| `FAIL_FLAT_LEGAL` | Vì sợ pháp lý nên opening mất human tension |
| `FAIL_MEDICAL_OVERCLAIM` | Claim mạnh hơn bằng chứng |
| `FAIL_TEST_AS_PREDICTION` | Biến xét nghiệm thành công cụ dự đoán chắc chắn |
| `FAIL_MARKETING_TAKEOVER` | CTA / commercial claim lấn át education |
| `FAIL_STACCATO` | Văn bị ngắt vụn như caption |

---

### CASE MODE & DISCLOSURE CHUẨN

| Mode | Khi nào | Disclosure |
|---|---|---|
| `CONTROLLED_NARRATIVE` (Default) | Không có case thật, dùng archetype/routine/belief | Chỉ cần khi tình huống có thể bị hiểu là sự kiện thật (dùng tín hiệu giả định hoặc disclosure kín đáo) |
| `REAL_CASE_STORY` | Có case thật, xác minh, có quyền sử dụng | Không cần disclosure nhưng không được tự bịa chi tiết thiếu |
| `ANSWER_FIRST_EXPLAINER` | Cần trả lời trực tiếp | Không bắt buộc |

---

### FAIL STATES — KHI NÀO KHÔNG ĐỦ ĐỂ VIẾT

| State | Khi nào | Hành động |
|---|---|---|
| `NEEDS_SOURCE` | Medical claim cần nguồn chưa có | Bỏ claim hoặc ghi `[SOURCE REQUIRED]` |
| `NEEDS_DOCTOR_REVIEW` | Đã tạo `[DOCTOR REVIEW]` nhưng chưa có reviewer | Ghi rõ trạng thái — không xuất bản |
| `NEEDS_LEGAL_REVIEW` | Publication source chưa xác nhận | Ghi `[LEGAL REVIEW]`, hoàn thiện creative framing trong phạm vi an toàn |
| `NEEDS_SERVICE_FACT` | CTA / thông tin dịch vụ chưa xác minh | Dùng `[CTA_SLOT]` placeholder |
| `WEAK_CONTRADICTION` | Không tìm được belief/contradiction đủ mạnh | Chuyển sang Answer-first hoặc Explainer |

---

## 📊 SO SÁNH EF_CONTROLLED_NARRATIVE VỚI CÁC TEMPLATE KHÁC

| Tiêu chí | EF_CONTROLLED_NARRATIVE | EF_CASE_STORY | Blog Sức Khỏe | Hỏi Đáp BS (Q&A) | Vaccine (Library) |
|---|---|---|---|---|---|
| **Entry point** | Human belief / blind spot / contradiction | Human tension / Story | Thực trạng / vấn đề | Câu hỏi trực tiếp | Thông tin sản phẩm |
| **Character** | Không — dùng archetype, routine, reader mirror | Bắt buộc (composite / real / fictional) | Không bắt buộc | Không | Không |
| **Narrative spine** | Belief → Contradiction → Doctor Anchor → Reframe | Event → Character → Reaction → Resolution | Không | Không | Không |
| **Doctor role** | Trust Anchor (2–3 touchpoints: Unlock + Decision) | Expert judgment tại decision point | Lời khuyên chung | Trả lời lâm sàng | Không bắt buộc |
| **H2 structure** | Sinh từ medical spine (câu hỏi y khoa) | Sinh từ câu hỏi của case | SEO-based | Q&A format | Thông tin sản phẩm |
| **Story ratio** | Narrative 60–70%, Medical 20–30%, Doctor 5–10% | Story 15–20%, Medical 60–70%, Decision 15–20% | N/A | N/A | N/A |
| **Độ dài phù hợp** | 1200–2000 từ | 1200–2000 từ | 1200+ từ | 200–500 từ | 800+ từ |
| **SEO role** | Phụ trợ — không định hình structure | Phụ trợ | Chủ đạo | Chủ đạo | Chủ đạo |
| **Tone** | Báo chí đời thường, rõ, có chiều sâu | Thấu cảm, story-driven | Gần gũi, chia sẻ | Ân cần, trực diện | Rõ ràng, học thuật |
| **Legal guardrail** | TTĐT tổng hợp — Creative Framing ≠ New Factual Reporting | Case disclosure | Standard | Standard | Standard |
| **Conversion style** | Soft — Decision support nối logic | Soft — Decision support | Soft — lifestyle | Soft — refer | Direct — booking |

---

## 🔒 WRITING STANDARD CUỐI CÙNG

> **Mỗi bài EF_CONTROLLED_NARRATIVE phải đạt đồng thời:**
>
> **Engaging enough to read** — Opening có human moment, belief, contradiction đủ cụ thể
>
> **Accurate enough to trust** — Thông tin y khoa chính xác, calibrated theo evidence, không vượt nguồn
>
> **Clear enough to understand** — Đời thường trước, thuật ngữ sau, Evidence → Meaning → Decision
>
> **Useful enough to act** — Người đọc biết bước tiếp theo cụ thể
>
> **Doctor as anchor, not narrator** — Bác sĩ xuất hiện tại đúng điểm cần judgment

---

> **Nhắc nhở nội bộ — đọc trước mỗi bài EF_CONTROLLED_NARRATIVE:**
>
> *"Tôi đang biến một vấn đề y khoa thành nội dung có điểm chạm đời sống,
> không phải đang viết một bản tóm tắt y khoa rồi tìm cách gắn hook vào."*
>
> **3 câu hỏi tự kiểm tra sau khi viết:**
>
> 1. *"Bỏ tên bệnh khỏi bài, opening có còn là tình huống con người cụ thể không?"*
> 2. *"Có chi tiết nào tôi vừa tạo ra mà người đọc có thể hiểu là sự kiện thật?"*
> 3. *"Bác sĩ xuất hiện vì giúp quyết định, hay chỉ để bài trông đáng tin hơn?"*

---

*Phiên bản: V1.0 — Ngày tạo: 2026-08-25*
*Tham chiếu: `System_Prompt_Controlled_Narrative_Doctor_Anchor_V4.md`*
*Áp dụng cùng với: `master_content_templates.md`, `EF_CASE_STORY_Templates_TiemChung_NhaThuoc.md`, `bai_viet_cong_dong_templates.md`, `thu_vien_y_khoa_templates.md`*
