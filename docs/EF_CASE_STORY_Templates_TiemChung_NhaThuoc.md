# 📖 TEMPLATE EF_CASE_STORY — CÂU CHUYỆN SỨC KHỎE (HUMAN / CASE STORY)
## FPT LONG CHÂU CONTENT STUDIO — PHIÊN BẢN CHUẨN HOÁ V1.0

> **Loại nội dung:** `EF_CASE_STORY` — Story-first, People-first
> **Áp dụng cho:** Kênh Tiêm Chủng Long Châu & Nhà Thuốc Long Châu
> **Dành cho:** BTV Editorial, CTV Content cấp cao, AI Content Generator
> **Yêu cầu tiên quyết:** Đọc và tuân thủ toàn bộ `System_Prompt_People_First_Health_Bot_with_Examples.md` trước khi viết

---

## 🧭 TỔNG QUAN VỀ LOẠI NỘI DUNG EF_CASE_STORY

### Khi nào dùng EF_CASE_STORY?

Dùng khi **có ít nhất một** trong các điều kiện sau:

| Điều kiện | Mô tả |
|---|---|
| **Human tension rõ** | Có misunderstanding, hesitation, delayed decision, family conflict, life event |
| **Reader mirror mạnh** | Đa số người đọc có thể thấy chính mình trong tình huống |
| **Medical territory phức tạp** | Câu chuyện giúp người đọc hiểu vấn đề y khoa tốt hơn giải thích thuần túy |
| **Decision point cần hỗ trợ** | Người đọc cần cân nhắc, không chỉ cần thông tin |
| **Routine blind spot** | Người đọc đang làm sai hoặc bỏ sót mà không biết |

### Khi nào KHÔNG dùng EF_CASE_STORY?

- Người đọc cần câu trả lời trực tiếp, nhanh chóng
- Nội dung thiên về giải thích kỹ thuật, hướng dẫn step-by-step
- Không có human tension thật sự để khai thác
- Topic quá hẹp không đủ narrative space

→ Trong các trường hợp này, dùng `EF_EXPLAINER`, `EF_QA`, `EF_HOWTO`, `EF_GUIDANCE`

---

## 🔄 FLOW BẮT BUỘC TRƯỚC KHI VIẾT

```
STEP 1: Xác định Medical Territory
    ↓
STEP 2: Xác định Reader Persona (Beneficiary ≠ Reader?)
    ↓
STEP 3: Tìm Human Tension (misunderstanding / hesitation / decision / event)
    ↓
STEP 4: Xây Character (name + age + location + context + behavior/belief)
    ↓
STEP 5: Chọn Case Mode (REAL_CASE | COMPOSITE | FICTIONAL_SCENARIO)
    ↓
STEP 6: Chọn Character Entry Mode (ACTION / ROUTINE / SCENE / QUESTION / CONFLICT / LIFE_EVENT / PROFILE)
    ↓
STEP 7: Draft → QC 13 điểm → Rewrite nếu cần → Output
```

---

## 📝 INPUT CONFIG — ĐIỀN TRƯỚC KHI VIẾT

```yaml
brand: Nhà thuốc Long Châu
channel: TIEM_CHUNG | NHA_THUOC
content_type: EF_CASE_STORY
topic:
medical_territory:
reader_persona:
  who_is_reading:
  what_they_worry_about:
  what_decision_they_face:
  what_action_they_can_take:
beneficiary:
reader_tension:
desired_angle:
story_mode: REAL_CASE | COMPOSITE | FICTIONAL_SCENARIO
case_facts:
  name:
  age:
  location:
  relationship:
  occupation_or_context:
  relevant_health_context:
  belief_or_behavior:
character_entry_mode: ACTION_LED | ROUTINE_LED | SCENE_LED | QUESTION_LED | CONFLICT_LED | LIFE_EVENT_LED | PROFILE_LED
source_pack:
expert_context:
service_context:
seo_keywords:
desired_length:
special_notes:
```

> **Lưu ý bắt buộc:**
> - Nếu `story_mode = REAL_CASE`: không được tự bịa chi tiết còn thiếu
> - Nếu `story_mode = COMPOSITE` hoặc `FICTIONAL_SCENARIO`: phải có disclosure chuẩn ở đầu bài
> - Field `belief_or_behavior` giúp tạo tension — điền càng cụ thể càng tốt

---

## ─────────────────────────────────────────────
## 🏥 PHẦN I — TEMPLATE TIÊM CHỦNG LONG CHÂU
## ─────────────────────────────────────────────

### Đặc điểm nhận dạng nội dung Tiêm Chủng

**Reader personas phổ biến:**
- Phụ huynh (mẹ bỉm sữa, ông bà) chăm sóc trẻ
- Người trưởng thành lo cho ba mẹ lớn tuổi
- Người trẻ tự quyết định cho bản thân (HPV, cúm, viêm gan)
- Phụ nữ chuẩn bị mang thai hoặc đang mang thai

**Human tensions phổ biến trong tiêm chủng:**
- "Trễ lịch có tiêm lại từ đầu không?"
- "Con đang sốt nhẹ, có tiêm được không?"
- "Ba/mẹ già rồi, tiêm làm gì nữa?"
- "Đã nhiễm bệnh rồi còn cần vaccine không?"
- "Tiêm rồi vẫn mắc bệnh, vaccine có tác dụng không?"
- "Không nhớ đã tiêm mũi nào, phải làm sao?"
- "Vaccine này an toàn không, tôi nghe nói có tác dụng phụ?"
- "Tôi mang thai có tiêm được không?"

---

### 📋 TEMPLATE TIÊM CHỦNG — MARKDOWN ĐẦY ĐỦ

```markdown
# [TITLE — Theo TITLE ARCHETYPES: People First, Medicine Second]
# Ví dụ: Ba uống thuốc đều mỗi ngày, đến lịch tiêm phế cầu cả nhà mới nhận ra đã bỏ quên
# Ví dụ: 38 tuổi mới nghĩ đến tiêm HPV sau một lần khám phụ khoa
# Ví dụ: Que thử hai vạch giữa lịch HPV — những mũi còn lại phải làm sao?

<!-- DISCLOSURE — Bắt buộc nếu COMPOSITE hoặc FICTIONAL_SCENARIO -->
*Nhân vật và một số thông tin nhận diện trong bài được xây dựng từ tình
huống thường gặp nhằm minh họa nội dung y khoa. Các nội dung [EXPERT] là
bản thảo để chuyên gia thật phụ trách bài xác nhận hoặc chỉnh sửa trước
khi xuất bản.*

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- OPENING STORY — 100–180 từ                                    -->
<!-- Bắt buộc có đủ 5 yếu tố:                                     -->
<!-- 1. Event / Situation (chuyện gì đang xảy ra)                  -->
<!-- 2. Character (name + age + location xuất hiện trong 100 từ)   -->
<!-- 3. Reaction / Stake (nhân vật đang phản ứng / lo điều gì)     -->
<!-- 4. Unresolved question / tension (câu hỏi chưa được giải)     -->
<!-- 5. Medical bridge (dẫn vào phần y khoa)                       -->
<!-- ═══════════════════════════════════════════════════════════════ -->

[ĐOẠN 1 — Character entry theo mode đã chọn: 3–5 câu]

[ĐOẠN 2 — Development: tension / phát hiện / reaction: 3–5 câu]

[ĐOẠN 3 — Unresolved question + medical bridge: 2–3 câu]

---

## [H2 — Misunderstanding hoặc câu hỏi cấp thiết nhất từ case]
<!-- Viết như ngôn ngữ người đọc, không phải tiêu đề giáo trình -->
<!-- Ví dụ: "76 tuổi rồi, giờ mới tiêm phế cầu có muộn không?" -->
<!-- Ví dụ: "Đã quan hệ tình dục rồi, tiêm HPV có còn ý nghĩa không?" -->
<!-- Ví dụ: "Que thử hai vạch giữa lịch HPV — những mũi còn lại tính thế nào?" -->

[Medical clarity — giải thích bằng ngôn ngữ đời thường trước, thuật ngữ sau]

[Evidence — nguồn phù hợp: WHO / CDC / Bộ Y tế / guideline hiện hành Việt Nam]
<!-- Dùng ngôn ngữ calibrated: "được khuyến nghị", "dữ liệu cho thấy", -->
<!-- không dùng "đã chứng minh" nếu chỉ là observational study -->

`[EXPERT]` Theo bác sĩ **[Tên chuyên gia]**, [judgment — không chỉ lặp lại fact phía trên]
<!-- Expert ở đây phải đưa ra judgment, trade-off, hoặc decision guidance thực sự -->

<!-- Character có thể quay lại tự nhiên để làm rõ context hoặc chuyển ý -->
[Chuyển ý tự nhiên — có thể là phản ứng của Character với thông tin vừa được giải]

---

## [H2 — Mechanism / Evidence / Risk — câu hỏi thứ 2 phát sinh từ case]
<!-- Ví dụ: "Vaccine phế cầu bảo vệ khỏi bệnh gì, và bảo vệ đến mức nào?" -->
<!-- Ví dụ: "HPV có bao nhiêu chủng, vaccine bảo vệ được loại nào?" -->
<!-- Ví dụ: "Tiêm một mũi có tác dụng không nếu chưa hoàn tất lịch?" -->

[Medical clarity — plain language]

[Evidence — phân biệt rõ: phòng nhiễm vs giảm bệnh nặng vs giảm biến chứng]
<!-- KHÔNG claim tuyệt đối: "vaccine = không bao giờ mắc bệnh" -->
<!-- PHÂN BIỆT: theo type phế cầu được bao phủ, không phải mọi nguyên nhân -->

### [H3 — Nếu H2 có ≥2 nhánh rõ hoặc câu hỏi follow-up tự nhiên]
<!-- Ví dụ: Phân nhóm theo đối tượng (trẻ em / người lớn / người cao tuổi) -->
<!-- Ví dụ: Phân biệt các tình huống (tiêm muộn / đổi lịch / hoãn tiêm) -->
<!-- Ví dụ: Các bệnh nền ảnh hưởng đến chỉ định như thế nào -->

[Body — prose rhythm 2–4 câu / đoạn]

---

## [H2 — Decision Point — "Với tình huống của tôi, phải làm gì?"]
<!-- Ví dụ: "Không nhớ đã tiêm mũi nào — tiếp tục hay làm lại từ đầu?" -->
<!-- Ví dụ: "Đang mang thai, những vaccine nào được khuyến nghị?" -->
<!-- Ví dụ: "Con sốt nhẹ hôm nay, có tiêm đúng lịch được không?" -->

[Decision guidance — không phải protocol cứng, là judgment có context]

<!-- Character quay lại — decision của nhân vật làm cụ thể hóa cho reader -->
[Câu hoặc đoạn ngắn nhắc lại Case để reader không mất thread]

| Tình huống | Hướng xử lý thường gặp | Lưu ý cần báo |
|---|---|---|
| [Ví dụ: Trễ lịch dưới 4 tuần] | [Ví dụ: Tiêm tiếp, không cần làm lại từ đầu] | [Ví dụ: Báo lịch tiêm cũ] |
| [Ví dụ: Không nhớ đã tiêm mũi nào] | [Ví dụ: Tìm lại hồ sơ / sổ tiêm] | [Ví dụ: Nhân viên y tế sẽ hỗ trợ đối chiếu] |
| [Ví dụ: Trẻ đang sốt nhẹ dưới 38°C] | [Ví dụ: Thường tư vấn tại trung tâm để đánh giá] | [Ví dụ: Không tự quyết, cần khám trực tiếp] |

`[EXPERT]` Theo bác sĩ **[Tên chuyên gia]**, [decision guidance tại điểm này — mode: DECISION GUIDANCE]

---

## [H2 — Safety / Hoãn tiêm / Nhóm đặc biệt — chỉ thêm khi relevant với case]
<!-- Thêm H2 này nếu case có nhóm ngoại lệ rõ cần nói đến -->
<!-- Ví dụ: Phụ nữ mang thai, người suy giảm miễn dịch, người đang dùng corticoid -->

### Những trường hợp nào cần hoãn tiêm?
<!-- Sốt cao, nhiễm trùng cấp, phản ứng nặng với mũi trước -->
<!-- Phân biệt: hoãn tạm thời vs chống chỉ định tuyệt đối -->
<!-- KHÔNG phải: sổ mũi nhẹ, đang uống kháng sinh thông thường -->

### [H3 — Nhóm cần tư vấn riêng trước khi tiêm]
<!-- Phụ nữ mang thai: vaccine nào được khuyến nghị / vaccine nào cần hoãn -->
<!-- Người cao tuổi có bệnh nền: bệnh nền nào ảnh hưởng đến chỉ định -->
<!-- Người suy giảm miễn dịch: cần lưu ý gì khác -->

[Safety note — không dramatize nguy cơ, không dùng sợ hãi để thúc đẩy conversion]

---

## [H2 — Action / "Sau khi đọc xong, tôi bắt đầu từ đâu?"]
<!-- Ví dụ: "Muốn rà lại lịch tiêm cho cả gia đình, cần chuẩn bị gì?" -->
<!-- Ví dụ: "Nếu chưa tiêm HPV, bắt đầu thế nào là đúng?" -->

[Action cụ thể — không bắt buộc là conversion]

Thông tin hữu ích khi đến tư vấn tiêm chủng:
- Sổ / phiếu tiêm chủng cũ (nếu còn)
- Tên vaccine và thời điểm tiêm ước tính nếu nhớ
- Thông tin bệnh nền hiện tại
- Danh sách thuốc đang dùng (có thuốc nào ảnh hưởng miễn dịch không?)
- Tiền sử phản ứng sau tiêm (nếu có)

---
<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CONCLUSION — Bắt buộc: Return to Character                   -->
<!-- Câu hỏi của Character thay đổi                               -->
<!-- Understanding / decision thay đổi                            -->
<!-- Không thêm medical claim mới                                  -->
<!-- ═══════════════════════════════════════════════════════════════ -->

## [Conclusion — Câu hỏi / understanding của Character thay đổi]

[Return to Character — 1–2 đoạn]
<!-- Nhân vật không phát hiện bệnh mới — nhân vật phát hiện khoảng trống / -->
<!-- cách nhìn mới / câu hỏi đúng hơn -->

[Reader lesson — một điều người đọc có thể mang về từ câu chuyện này]

[Next step — rõ ràng, không ép buộc]

`[CTA_SLOT]`

---

### Nguồn tham khảo
- [1] [Cục Y tế dự phòng / WHO / CDC — guideline vaccine liên quan, năm cập nhật]
- [2] [Tờ hướng dẫn sử dụng sản phẩm vaccine được cấp phép tại Việt Nam]
- [3] [Tài liệu khoa học bổ sung nếu có]
```

---

### ✅ QC CHECKLIST — TIÊM CHỦNG

Trước khi submit bài, kiểm tra **tất cả** ô dưới đây:

#### QC Nhóm A — Story & Character

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| A1 | Opening có đủ: Event → Character → Reaction → Unresolved question → Medical bridge | ☐ | ☐ |
| A2 | Character có tên + tuổi + địa điểm xuất hiện trong 100–150 từ đầu | ☐ | ☐ |
| A3 | Entry mode phù hợp với bản chất case (không mặc định PROFILE_LED) | ☐ | ☐ |
| A4 | Character quay lại tự nhiên ở 1–3 decision point (không biến mất sau opening) | ☐ | ☐ |
| A5 | Disclosure đã có nếu COMPOSITE hoặc FICTIONAL_SCENARIO | ☐ | ☐ |
| A6 | Không có quote giả ("tôi rất hối hận...") nếu không phải REAL_CASE | ☐ | ☐ |

#### QC Nhóm B — Medical Spine

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| B1 | Mỗi H2 giải một câu hỏi phát sinh từ case (không phải từ SEO keyword) | ☐ | ☐ |
| B2 | Phân biệt đúng: phòng nhiễm vs giảm bệnh nặng vs giảm biến chứng (không claim tuyệt đối) | ☐ | ☐ |
| B3 | Không áp lịch vaccine nước ngoài cho Việt Nam khi chưa xác minh local guideline | ☐ | ☐ |
| B4 | Có phần Safety / Hoãn tiêm / Chống chỉ định khi relevant với case | ☐ | ☐ |
| B5 | Expert xuất hiện ở misunderstanding / trade-off / decision point — đưa judgment thật sự | ☐ | ☐ |
| B6 | Tất cả medical claim có nguồn hoặc ghi rõ cần xác minh | ☐ | ☐ |

#### QC Nhóm C — Story vs SEO Test

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| C1 | Xóa Character + opening → phần còn lại KHÔNG thể đứng độc lập như bài SEO thông thường | ☐ | ☐ |
| C2 | Không có H2 nào awkward chỉ để chứa keyword | ☐ | ☐ |
| C3 | Heading dùng ngôn ngữ người đọc, không phải ngôn ngữ giáo trình | ☐ | ☐ |
| C4 | Không có chuỗi câu staccato / social-caption rhythm | ☐ | ☐ |

#### QC Nhóm D — Action & Safety

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| D1 | Người đọc biết mình cần làm gì sau khi đọc xong | ☐ | ☐ |
| D2 | CTA tách hoàn toàn khỏi kết luận y khoa | ☐ | ☐ |
| D3 | Không dramatize nguy cơ / không dùng fear để thúc đẩy conversion | ☐ | ☐ |
| D4 | Conclusion không thêm medical claim mới | ☐ | ☐ |

---

### 📐 STORY RATIO REFERENCE — TIÊM CHỦNG

```
Story / Human context:           15–20%
    Opening story
    + Character returns tại decision point
    + Conclusion (return to character)

Medical clarity + Evidence + Expert:   60–70%
    H2 misunderstanding
    + H2 mechanism / evidence
    + Decision table
    + Expert judgment

Decision + Action + Safety:      15–20%
    H2 decision point
    + H2 safety / hoãn tiêm (nếu có)
    + H2 action / next step
```

> **Nhắc nhở:** Đây là tỉ lệ tham khảo, không phải quota cơ học.
> **Story là entry point, không phải destination.**

---

### 📌 TITLE EXAMPLES — TIÊM CHỦNG

| Archetype | Ví dụ Title — ĐÚNG |
|---|---|
| Relationship Action | Ba uống thuốc đều mỗi ngày, đến lịch tiêm phế cầu cả nhà mới nhận ra đã bỏ quên |
| Everyday Incident | Đưa con đi tiêm đúng lịch, chị mới biết mình còn thiếu một mũi từ năm ngoái |
| Unexpected Decision | Que thử hai vạch giữa lịch HPV — những mũi còn lại phải làm sao? |
| Surprise / Contrast | Tiêm đủ 3 mũi vẫn bị cúm — chị Hạnh mới hiểu vaccine bảo vệ đến đâu |
| Routine Blind Spot | Nhớ đặt lịch tái khám cho ba, quên mất ông chưa tiêm phế cầu mũi nào |
| Life Event | Sau đợt nhập viện của mẹ, anh Tuấn bắt đầu rà lại lịch phòng bệnh của cả gia đình |
| Expectation vs Reality | Nghĩ chỉ trẻ em mới cần tiêm phòng, chị Hằng mới biết mình cũng còn thiếu vaccine |

**KHÔNG dùng:**
- ~~Vaccine HPV là gì? Những điều cần biết~~
- ~~5 điều về vaccine phế cầu bạn nên biết~~
- ~~Tiêm vaccine có nguy hiểm không?~~
- ~~Vaccine phế cầu cho người cao tuổi có cần thiết không?~~

---

### 🔖 EXEMPLAR TIÊM CHỦNG — THAM CHIẾU

Tham khảo **EXEMPLAR A** trong `System_Prompt_People_First_Health_Bot_with_Examples.md`:

```
Bài: "Ba uống thuốc đều mỗi ngày, đến lịch tiêm phế cầu cả nhà mới nhận ra đã bỏ quên"

Narrative spine đã đạt:
Routine chăm sóc → Phát hiện khoảng trống → Câu hỏi → Medical clarity
→ Decision → Return to Character → Reader lesson

Character: Chị Lan, 42 tuổi, TP.HCM, chăm ba 76 tuổi
Tension: Biết hết lịch thuốc, không biết lịch tiêm — "khoảng trống trong routine"
Entry mode: ROUTINE_LED
Medical bridge: "76 tuổi, giờ mới tiêm có muộn không?"
Character returns: "Lan không phải tự chọn vaccine — đây là phần nhân viên y tế làm"
Ending: Không phát hiện bệnh mới — phát hiện khoảng trống trong cách chăm sóc
```

**6 lớp học từ exemplar này:**
1. Routine chăm sóc → khoảng trống = tension tự nhiên, không kịch tính giả tạo
2. Case Identity tích hợp trong ~100 từ, không phải câu đầu tiên
3. H2 sinh ra từ câu hỏi của nhân vật, không phải keyword
4. Expert ở misunderstanding ("người trên 70 không chỉ là về tuổi") và decision ("không cần tự chọn vaccine")
5. Character quay lại ở decision point: làm rõ người chăm sóc không phải tự quyết
6. Ending: thay đổi ở mục tiêu theo dõi, không phải phát hiện bệnh

---

## ─────────────────────────────────────────────
## 💊 PHẦN II — TEMPLATE NHÀ THUỐC LONG CHÂU
## ─────────────────────────────────────────────

### Đặc điểm nhận dạng nội dung Nhà Thuốc

**Reader personas phổ biến:**
- Người đang dùng thuốc, lo về tác dụng phụ hoặc tương tác
- Người chăm sóc bệnh nhân mạn tính (đái tháo đường, tăng huyết áp, tim mạch)
- Người có kết quả xét nghiệm bất thường, chưa hiểu ý nghĩa
- Người đang cân nhắc giữa các lựa chọn điều trị
- Người mới được chẩn đoán, chưa biết bắt đầu từ đâu

**Human tensions phổ biến trong nhà thuốc:**
- "Đang uống X, bác sĩ kê thêm Y, có uống chung được không?"
- "Men gan bình thường nhưng bác sĩ vẫn muốn xét nghiệm thêm — tại sao?"
- "Con số cholesterol như vậy có đáng lo không?"
- "Đã có đơn thuốc rồi, vẫn cần hỏi dược sĩ không?"
- "Nghe nói thuốc X gây hại gan — có đúng không?"
- "Bác sĩ nói theo dõi, nhưng tôi phải theo dõi cái gì, như thế nào?"
- "Hết triệu chứng rồi, có cần uống hết liệu trình kháng sinh không?"

---

### 📋 TEMPLATE NHÀ THUỐC — MARKDOWN ĐẦY ĐỦ

```markdown
# [TITLE — Theo TITLE ARCHETYPES: People First, Medicine Second]
# Ví dụ: Men gan bình thường, chị Phương vẫn được đề nghị xét nghiệm viêm gan B
# Ví dụ: Mua thêm một viên thuốc bổ, dược sĩ hỏi một câu khiến anh Dũng dừng lại
# Ví dụ: Hết triệu chứng nên tự ngừng kháng sinh — điều chị Mai chưa từng nghĩ là vấn đề

<!-- DISCLOSURE — Bắt buộc nếu COMPOSITE hoặc FICTIONAL_SCENARIO -->
*Nhân vật và một số thông tin nhận diện trong bài được xây dựng từ tình
huống thường gặp nhằm minh họa nội dung y khoa. Các nội dung [EXPERT] là
bản thảo để chuyên gia thật phụ trách bài xác nhận hoặc chỉnh sửa trước
khi xuất bản.*

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- OPENING STORY — 100–180 từ                                    -->
<!-- Đặc trưng nhà thuốc: Tension thường là                       -->
<!-- một niềm tin / giả định / thói quen bị thách thức            -->
<!-- Không phải chỉ "đi mua thuốc" mà là                          -->
<!-- "phát hiện mình đã hiểu sai / bỏ sót / làm sai điều gì đó"  -->
<!-- Phải có đủ 5 yếu tố:                                         -->
<!-- 1. Situation / routine / behavior của nhân vật                -->
<!-- 2. Character (name + age + location trong 100 từ)             -->
<!-- 3. Assumption / belief đang có                                -->
<!-- 4. Khoảnh khắc / điểm phá vỡ giả định đó                     -->
<!-- 5. Câu hỏi treo → Medical bridge                              -->
<!-- ═══════════════════════════════════════════════════════════════ -->

[ĐOẠN 1 — Situation / behavior / routine + Character entry: 3–5 câu]

[ĐOẠN 2 — Assumption / belief của nhân vật + Breaking point: 3–5 câu]

[ĐOẠN 3 — Câu hỏi treo + medical bridge: 2–3 câu]

---

## [H2 — Câu hỏi cấp thiết nhất / Misunderstanding cần giải]
<!-- Ngôn ngữ người đọc, không phải heading giáo trình dược -->
<!-- Ví dụ: "Men gan bình thường vẫn có thể nhiễm viêm gan B?" -->
<!-- Ví dụ: "Hết triệu chứng thì có thể tự ngừng kháng sinh không?" -->
<!-- Ví dụ: "Thực phẩm chức năng và thuốc uống cùng lúc có vấn đề gì không?" -->

[Medical clarity — đời thường trước, thuật ngữ sau]

[Evidence — phân biệt đúng: screening / diagnosis / monitoring / risk assessment khi relevant]
<!-- KHÔNG biến một xét nghiệm thành "máy dự đoán bệnh" -->
<!-- KHÔNG claim tuyệt đối về hiệu quả -->

`[EXPERT]` Theo bác sĩ / dược sĩ **[Tên chuyên gia]**, [judgment — không chỉ lặp lại fact]

[Chuyển ý tự nhiên — phản ứng hoặc câu hỏi follow-up của Character]

---

## [H2 — Mechanism / Why — "Vì sao lại như vậy?"]
<!-- Ví dụ: "Xét nghiệm viêm gan B gồm những chỉ số nào, mỗi chỉ số nói gì?" -->
<!-- Ví dụ: "Tại sao kháng sinh cần uống đủ liệu trình dù đã hết triệu chứng?" -->
<!-- Ví dụ: "Nguy cơ tương tác thuốc xảy ra như thế nào?" -->

[Medical clarity — plain language]

[Evidence — calibrated language]

| [Chỉ số / Tình huống / Khái niệm] | [Ý nghĩa đơn giản] | [Thông tin chính / Lưu ý] |
|---|---|---|
| [Ví dụ: HBsAg] | [Kháng nguyên bề mặt HBV] | [Gợi ý tình trạng nhiễm HBV hiện tại khi dương tính] |
| [Ví dụ: Anti-HBs] | [Kháng thể chống HBsAg] | [Liên quan đến miễn dịch với HBV] |
| [Ví dụ: Total anti-HBc] | [Kháng thể với kháng nguyên lõi] | [Cho biết cơ thể từng tiếp xúc HBV] |

### [H3 — Nhánh chi tiết nếu H2 có ≥2 nhánh rõ]
<!-- Ví dụ: Phân biệt các loại tương tác thuốc -->
<!-- Ví dụ: Nhóm người cần thận trọng đặc biệt -->
<!-- Ví dụ: Sự khác nhau giữa các chỉ số cùng chủ đề -->

[Body — prose 2–4 câu / đoạn]

`[EXPERT]` Theo dược sĩ / bác sĩ **[Tên chuyên gia]**, [EXPLAIN WHY mode — giải thích cơ chế / lý do]

---

## [H2 — Decision Point — "Với kết quả / tình huống này, tôi làm gì?"]
<!-- Ví dụ: "Kết quả âm tính — bước tiếp theo là gì?" -->
<!-- Ví dụ: "HBsAg dương tính — tôi cần làm gì ngay bây giờ?" -->
<!-- Ví dụ: "Đơn thuốc có nhiều loại, thứ tự và thời điểm uống thế nào?" -->

[Decision guidance có context]

<!-- Character quay lại — cho thấy sự thay đổi trong câu hỏi / decision -->
[Câu hoặc đoạn ngắn nhắc lại Case để reader không mất thread]

Ba câu hỏi hữu ích hơn chỉ nhìn vào một kết quả đơn lẻ:
1. **[Câu hỏi 1 phù hợp với context]**
2. **[Câu hỏi 2 phù hợp với context]**
3. **[Câu hỏi 3 phù hợp với context]**

`[EXPERT]` Theo dược sĩ / bác sĩ **[Tên chuyên gia]**, [DECISION GUIDANCE mode]

---

## [H2 — Safety / Khi nào cần gặp chuyên gia / Red flags — khi relevant]
<!-- Thêm H2 này khi case có thông tin safety quan trọng -->
<!-- Ví dụ: Tương tác thuốc nguy hiểm cần biết -->
<!-- Ví dụ: Triệu chứng nào sau khi dùng thuốc cần báo ngay -->
<!-- Ví dụ: Nhóm người cần thận trọng hơn (suy gan/thận, người cao tuổi, thai kỳ) -->

### Dấu hiệu cần gặp nhân viên y tế sớm hơn dự kiến
<!-- Không dramatize — chỉ liệt kê những gì thực sự cần -->
<!-- Ví dụ: Tác dụng phụ bất thường, triệu chứng không cải thiện sau X ngày -->
<!-- Ví dụ: Thay đổi bất thường trong các chỉ số theo dõi -->

### [H3 — Nhóm cần chú ý đặc biệt nếu có trong case]
<!-- Người cao tuổi đang dùng nhiều thuốc -->
<!-- Người suy giảm chức năng gan/thận -->
<!-- Phụ nữ mang thai hoặc cho con bú -->

[Safety note — không fear-based, không dramatize]

---

## [H2 — Action / "Tôi cần chuẩn bị gì khi đến nhà thuốc / tư vấn dược sĩ?"]
<!-- Bước cụ thể reader có thể thực hiện ngay -->
<!-- Action không bắt buộc là conversion -->

Thông tin hữu ích khi đến tư vấn:
- Danh sách thuốc đang dùng (tên thuốc, liều lượng, tần suất)
- Kết quả xét nghiệm gần nhất (nếu có)
- Tiền sử bệnh lý và dị ứng
- Các TPCN / vitamin / thảo dược đang dùng (thường bị bỏ quên)
- Câu hỏi cụ thể muốn hỏi (viết ra trước nếu có thể)

---
<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CONCLUSION — Bắt buộc: Return to Character                   -->
<!-- Thay đổi trong understanding / câu hỏi / decision            -->
<!-- KHÔNG thêm medical claim mới                                  -->
<!-- ═══════════════════════════════════════════════════════════════ -->

## [Conclusion — Understanding / cách đặt câu hỏi của Character thay đổi]

[Return to Character — 1–2 đoạn]
<!-- Nhân vật không phát hiện bệnh mới -->
<!-- Nhân vật phát hiện cách đặt câu hỏi đúng hơn / hiểu rõ hơn điều gì đó -->

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

### ✅ QC CHECKLIST — NHÀ THUỐC

Trước khi submit bài, kiểm tra **tất cả** ô dưới đây:

#### QC Nhóm A — Story & Character

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| A1 | Opening có đủ: Situation → Character → Assumption/Belief → Breaking point → Medical bridge | ☐ | ☐ |
| A2 | Character có tên + tuổi + địa điểm trong 100–150 từ đầu | ☐ | ☐ |
| A3 | Tension là niềm tin / giả định / thói quen bị thách thức (không chỉ "đi mua thuốc") | ☐ | ☐ |
| A4 | Character quay lại tự nhiên ở 1–3 decision point | ☐ | ☐ |
| A5 | Disclosure đã có nếu COMPOSITE hoặc FICTIONAL_SCENARIO | ☐ | ☐ |

#### QC Nhóm B — Medical Spine

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| B1 | Mỗi H2 giải câu hỏi phát sinh từ case (không phải keyword) | ☐ | ☐ |
| B2 | Phân biệt đúng: screening / diagnosis / monitoring / risk assessment khi relevant | ☐ | ☐ |
| B3 | Không biến một xét nghiệm thành "máy dự đoán bệnh" | ☐ | ☐ |
| B4 | Không claim tuyệt đối về hiệu quả sản phẩm / thuốc | ☐ | ☐ |
| B5 | Expert xuất hiện ở misunderstanding / trade-off / decision point — có judgment thật sự | ☐ | ☐ |
| B6 | Có thông tin khi nào cần gặp nhân viên y tế (không để người đọc tự quyết hoàn toàn) | ☐ | ☐ |

#### QC Nhóm C — Story vs SEO Test

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| C1 | Xóa Character + opening → phần còn lại KHÔNG thể đứng như bài SEO độc lập | ☐ | ☐ |
| C2 | Heading dùng ngôn ngữ người đọc (không phải heading tờ hướng dẫn thuốc) | ☐ | ☐ |
| C3 | Không nhồi exact-match keyword vào heading awkward | ☐ | ☐ |

#### QC Nhóm D — Action & Commercial Guardrail

| # | Tiêu chí | Đạt | Cần sửa |
|---|---|---|---|
| D1 | Người đọc biết mình cần làm gì sau khi đọc xong | ☐ | ☐ |
| D2 | CTA tách hoàn toàn khỏi kết luận y khoa | ☐ | ☐ |
| D3 | Service / sản phẩm không xuất hiện trong lập luận y khoa | ☐ | ☐ |
| D4 | Không tạo testimonial giả hoặc outcome điều trị không có dữ liệu | ☐ | ☐ |
| D5 | Không claim "tốt nhất", "an toàn tuyệt đối", "chữa khỏi hoàn toàn" | ☐ | ☐ |

---

### 📐 STORY RATIO REFERENCE — NHÀ THUỐC

```
Story / Human context:           15–20%
    Opening (niềm tin / giả định bị thách thức)
    + Character returns tại decision point
    + Conclusion (thay đổi trong cách hiểu / đặt câu hỏi)

Medical clarity + Evidence + Expert:   60–70%
    H2 misunderstanding
    + H2 mechanism / why
    + Tables (chỉ số / tình huống / so sánh)
    + Expert judgment

Decision + Action + Safety:      15–20%
    H2 decision point (với table / numbered questions)
    + H2 safety / red flags (nếu có)
    + H2 action (chuẩn bị trước khi đến tư vấn)
```

---

### 📌 TITLE EXAMPLES — NHÀ THUỐC

| Archetype | Ví dụ Title — ĐÚNG |
|---|---|
| Surprise / Contrast | Men gan bình thường, chị Phương vẫn được đề nghị xét nghiệm viêm gan B |
| Routine Blind Spot | Uống thuốc huyết áp đều mỗi ngày, anh Minh chưa bao giờ kể đủ danh sách với dược sĩ |
| Unexpected Decision | Mua thêm một viên thuốc bổ, dược sĩ hỏi một câu khiến anh Dũng dừng lại |
| Belief Challenged | Hết triệu chứng nên tự ngừng kháng sinh — điều chị Hoa chưa từng nghĩ là vấn đề |
| Life Event | Sau khi đọc kết quả HbA1c lần đầu, anh Tuấn mới hiểu mình cần theo dõi cái gì |
| Family Disagreement | Mẹ muốn dùng TPCN cùng thuốc bác sĩ kê, gia đình chưa biết câu nào cần hỏi trước |
| Expectation vs Reality | Nghe nói thuốc X hại gan — con số anh thấy trên nhãn có nghĩa gì thật ra? |

**KHÔNG dùng:**
- ~~Tương tác thuốc là gì? Những điều cần biết~~
- ~~5 điều bạn cần biết về cholesterol~~
- ~~Thuốc X có tốt không?~~
- ~~Viêm gan B: Triệu chứng, nguyên nhân và cách điều trị~~

---

### 🔖 EXEMPLAR NHÀ THUỐC — THAM CHIẾU

Tham khảo **EXEMPLAR B** trong `System_Prompt_People_First_Health_Bot_with_Examples.md`:

```
Bài: "Men gan bình thường, chị Phương vẫn được đề nghị xét nghiệm viêm gan B"

Narrative spine đã đạt:
Khám sức khỏe bình thường → Bác sĩ đề nghị xét nghiệm thêm
→ Câu hỏi: "Tại sao nếu không có triệu chứng?"
→ Medical clarity: men gan ≠ trạng thái HBV
→ Table chỉ số → Decision questions → Reader lesson

Character: Chị Phương, 36 tuổi, Bình Dương
Tension: "Men gan bình thường = không bị viêm gan B" — giả định sai phổ biến
Entry mode: CONTRAST_LED
Medical bridge: "Tại sao vẫn cần biết nếu cơ thể không có triệu chứng?"
Expert role: Phân biệt 2 kết luận: "men gan bình thường" ≠ "không nhiễm HBV"
Ending: Nhân vật hiểu 2 câu hỏi khác nhau: gan đang biểu hiện thế nào vs HBV status
```

**6 lớp học từ exemplar này:**
1. Giả định phổ biến ("men gan ổn = không bệnh gan") = tension mạnh vì reader mirror cao
2. CONTRAST_LED: kết quả bình thường NHƯNG vẫn cần thêm = drama tự nhiên
3. Table chỉ số: giúp người đọc hiểu không cần học thuộc ký hiệu
4. Không biến xét nghiệm thành "máy phát hiện bệnh"
5. Expert phân biệt hai kết luận khác nhau — không chỉ lặp fact
6. Ending: nhân vật thay đổi cách đặt câu hỏi, không phải tìm ra bệnh mới

---

## ─────────────────────────────────────────────
## 🔄 CHUNG CHO CẢ 2 KÊNH — RULES BẮT BUỘC
## ─────────────────────────────────────────────

### NARRATIVE SPINE CHUẨN

```
Character → Event / Situation
→ Assumption / Belief / Routine
→ Breaking point (câu hỏi / phát hiện / khoảnh khắc)
→ Tension (chưa được giải)
→ Medical clarity (giải từ góc nhìn của case — không phải giáo trình)
→ Evidence (calibrated language)
→ Expert judgment (judgment, không phải chỉ lặp fact)
→ Decision support (contextual, không protocol cứng)
→ Action (realistic, không ép conversion)
→ Return to Character (thay đổi trong understanding / question / decision)
→ Reader lesson
→ Next step
```

### CHARACTER ENTRY MODES — CHỌN THEO BẢN CHẤT CASE

| Mode | Dùng khi nào | Ví dụ mở bài |
|---|---|---|
| `ROUTINE_LED` | Nhân vật có routine bị gián đoạn hoặc phát hiện khoảng trống | "Lan nhớ khá rõ giờ uống thuốc của ba..." |
| `SCENE_LED` | Có khoảnh khắc cụ thể tạo turning point | "Đến câu hỏi 'bác đã từng tiêm phế cầu chưa?'..." |
| `ACTION_LED` | Mở bằng hành động đang diễn ra | "Mỗi tháng, Lan đều là người đưa ba đi tái khám..." |
| `QUESTION_LED` | Câu hỏi thật gắn với nhân vật | "'Ba con 76 tuổi rồi, giờ mới tiêm có muộn không?'..." |
| `CONFLICT_LED` | Hai cách nghĩ trái nhau | "Ba bảo hơn 70 tuổi thì tiêm làm gì, còn chị không chắc..." |
| `LIFE_EVENT_LED` | Biến cố làm nhân vật nhìn lại | "Sau đợt viêm phổi khiến ba nằm viện..." |
| `PROFILE_LED` | Giới thiệu trực tiếp — hợp lệ khi thật sự phù hợp | "Chị Lan, 42 tuổi, sống tại TP.HCM, thường là người đưa ba đi khám..." |

> **Không xoay vòng mode một cách máy móc.** Chọn mode dựa trên bản chất case.
> `PROFILE_LED` hoàn toàn hợp lệ, chỉ không dùng làm default mặc định.

### CASE MODE & DISCLOSURE CHUẨN

| Mode | Khi nào dùng | Disclosure bắt buộc |
|---|---|---|
| `REAL_CASE` | Có dữ liệu thật, có consent | Không cần — NHƯNG không tự bịa chi tiết còn thiếu |
| `COMPOSITE` | Tổng hợp từ nhiều case thường gặp | *"Tình huống trong bài được tổng hợp từ những trường hợp thường gặp; tên và một số thông tin nhận diện đã được thay đổi."* |
| `FICTIONAL_SCENARIO` | Xây dựng để minh họa y khoa | *"Nhân vật và một số chi tiết nhận diện trong bài được xây dựng từ tình huống thường gặp nhằm minh họa nội dung y khoa."* |

### EXPERT VOICE — 3 DẠNG SỬ DỤNG

| Dạng | Khi nào dùng | Ví dụ |
|---|---|---|
| `DIRECT ANSWER` | Câu hỏi có câu trả lời rõ, expert xác nhận | *"Với người trên 70 tuổi, câu hỏi không chỉ là 'có dễ mắc bệnh hơn không'..."* |
| `EXPLAIN WHY` | Cần giải thích cơ chế / lý do / nuance | *"Men gan bình thường và không nhiễm HBV là hai kết luận khác nhau..."* |
| `DECISION GUIDANCE` | Tại decision point — hướng dẫn hành động | *"Người chăm sóc không cần học thuộc tên vaccine. Điều hữu ích hơn là..."* |

> **[EXPERT] là workflow marker.** Sau khi reviewer thật confirm → ẩn tag, render tên/chức danh thật.

### FAIL STATES — KHI NÀO KHÔNG ĐỦ ĐỂ VIẾT

| State | Khi nào xảy ra | Hành động |
|---|---|---|
| `NEEDS_CASE_FACTS` | Case REAL nhưng thiếu dữ kiện để viết | Yêu cầu bổ sung, không tự bịa |
| `NEEDS_SOURCE` | Medical claim cần nguồn chưa có hoặc chưa xác minh | Bỏ claim hoặc ghi rõ "cần xác minh" |
| `NEEDS_EXPERT_REVIEW` | Đã tạo [EXPERT] nhưng chưa có reviewer thật | Ghi rõ trạng thái — không xuất bản |
| `NEEDS_SERVICE_FACT` | CTA hoặc thông tin dịch vụ chưa xác minh | Dùng [CTA_SLOT] placeholder |

---

## 📊 SO SÁNH EF_CASE_STORY VỚI CÁC TEMPLATE KHÁC

| Tiêu chí | EF_CASE_STORY | Blog Sức Khỏe | Hỏi Đáp BS (Q&A) | Vaccine (Library) |
|---|---|---|---|---|
| **Entry point** | Human tension / Story | Thực trạng / vấn đề | Câu hỏi trực tiếp | Thông tin sản phẩm |
| **Character** | Bắt buộc (ít nhất composite) | Không bắt buộc | Không | Không |
| **Narrative spine** | Có — chạy xuyên bài | Không | Không | Không |
| **H2 structure** | Sinh ra từ câu hỏi của case | SEO-based | Q&A format | Thông tin sản phẩm |
| **Expert voice** | Judgment tại decision point | Lời khuyên chung | Trả lời lâm sàng | Không bắt buộc |
| **Độ dài phù hợp** | 1200–2000 từ | 1200+ từ | 200–500 từ | 800+ từ |
| **SEO role** | Phụ trợ — không định hình structure | Chủ đạo | Chủ đạo | Chủ đạo |
| **Tone** | Báo chí đời thường, thấu cảm | Gần gũi, chia sẻ | Ân cần, trực diện | Rõ ràng, học thuật |
| **Disclosure** | Bắt buộc nếu không phải REAL_CASE | Không bắt buộc | Có disclaimer | Không bắt buộc |
| **Conversion style** | Soft — Decision support | Soft — lifestyle | Soft — refer | Direct — booking |

---

## 🔒 WRITING STANDARD CUỐI CÙNG

> **Mỗi bài EF_CASE_STORY phải đạt đồng thời:**
>
> **Human enough to care** — Người đọc nhận ra tình huống như của chính mình
>
> **Medical enough to trust** — Thông tin y khoa chính xác, calibrated theo evidence
>
> **Clear enough to understand** — Đời thường trước, thuật ngữ sau
>
> **Useful enough to act** — Người đọc biết bước tiếp theo cụ thể

---

> **Nhắc nhở nội bộ — đọc trước mỗi bài EF_CASE_STORY:**
>
> *"Tôi đang giải một vấn đề của một con người bằng thông tin y khoa,
> không phải đang viết một bài y khoa rồi tìm cách nhét một con người vào."*
>
> **Tự kiểm tra sau khi viết:**
>
> *"Nếu bỏ Character khỏi bài mà bài gần như vẫn y nguyên → phải viết lại."*

---

*Phiên bản: V1.0 — Ngày tạo: 2026-08-24*
*Tham chiếu: `System_Prompt_People_First_Health_Bot_with_Examples.md`*
*Áp dụng cùng với: `master_content_templates.md`, `bai_viet_cong_dong_templates.md`, `thu_vien_y_khoa_templates.md`*
