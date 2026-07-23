# UX/UI Design Rules cho Coding Agents

Inspired by *Refactoring UI*, *Don't Make Me Think*, *The Design of Everyday Things*, *Laws of UX*, and *About Face*.

---

## 1. Visual Hierarchy — Refactoring UI

- **Một ý chính mỗi màn hình.** Xác định hành động quan trọng nhất; làm nó nổi bật bằng kích thước, màu sắc, và khoảng trống. Các hành động phụ thuộc dùng style trung tính hơn.
- **Font-size phản ánh tầm quan trọng.** Tiêu đề trang: 28-36px, section heading: 18-22px, body: 14-16px, phụ trợ: 11-13px.
- **Font-weight kết hợp với size.** Tiêu đề dùng weight 700-900; body dùng 400-500; label dùng 600-700.
- **Không dùng size quá gần nhau.** Nếu body 14px, đừng để section heading 16px. Nhảy ít nhất 4-6px mỗi cấp.
- **Ưu tiên spacing hơn decoration.** Khoảng trắng (padding/margin) phân tách nội dung tốt hơn đường kẻ, border, hay background màu.

## 2. Typography — Refactoring UI

- **Dùng 1-2 font families tối đa.** Một cho heading, một cho body. Nếu chỉ dùng một, dùng variable-weight font.
- **Line-height chuẩn:**
  - Heading: 1.1-1.3
  - Body: 1.5-1.8
  - Văn bản dài: 1.7-2.0
- **Độ dài dòng tối ưu:** 50-75 ký tự (khoảng 600-750px cho body text).
- **Letter-spacing cho uppercase:** thêm 0.5-2px cho text uppercase.
- **Tránh dùng màu xám nhạt cho text.** Text tương phản tối thiểu 4.5:1 so với nền.

## 3. Màu sắc — Refactoring UI

- **Chọn một màu chủ đạo, 1-2 màu phụ.** Không dùng quá 3 màu cho UI elements.
- **Dùng shade nhạt hơn cho hover/disabled.** Thay vì opacity, dùng màu diluted (giảm saturation) hoặc lighten.
- **Màu semantics rõ ràng:**
  - Đỏ = lỗi, xóa, cảnh báo nguy hiểm
  - Xanh dương = thông tin, link, hành động chính
  - Xanh lá = thành công, hoàn thành
  - Vàng/cam = cảnh báo, chú ý
- **Không dùng màu saturation cao cho text hoặc nền large area.** Giảm saturation 20-40% cho background大面积.
- **Dùng 1 neutral palette.** Từ trắng đến đen, với 5-8 bậc xám.

## 4. Spacing & Layout — Refactoring UI

- **Hệ thống spacing chuẩn (8px grid):** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
- **Padding nội thất (card/panel):** 20-28px.
- **Gap giữa các phần tử cùng cấp:** 12-20px.
- **Gap giữa các section:** 28-40px.
- **Max-width cho content:** 1200-1280px (layout chính), 600-800px (form/reading).

## 5. Nút & Hành động — Refactoring UI / About Face

- **Phân biệt rõ primary, secondary, và tertiary buttons:**
  - Primary: filled button, màu chủ đạo
  - Secondary: outline hoặc ghost button
  - Tertiary: text link
- **Button height tối thiểu:** 40-48px (touch target 44px).
- **Border-radius cho button:** 8-12px.
- **Hover state:** 5-10% darken hoặc lighten.
- **Active/pressed state:** scale(0.97) hoặc darken thêm 5%.
- **Disabled opacity:** 0.4-0.5, không kèm hover effect.
- **Icon + text trong button:** gap 8px, icon 16-20px.

## 6. Form & Input — Don't Make Me Think / Refactoring UI

- **Label luôn visible** (không dùng placeholder làm label).
- **Label ở trên input** (top-aligned) thay vì bên trái — đọc nhanh hơn.
- **Input height:** 44-52px. Padding: 12-16px vertical, 14-18px horizontal.
- **Focus state rõ ràng:** border color đậm hơn + box-shadow nhẹ (0 0 0 3px rgba(main-color, 0.15)).
- **Error state:** border đỏ + icon + message màu đỏ ở dưới input.
- **Placeholder text:** màu xám (opacity 0.5-0.6), font style normal (không italic nếu có thể).
- **Group related fields** với margin-bottom 20-24px.
- **Auto-focus** field đầu tiên trong form.

## 7. Navigation & Information Architecture — Don't Make Me Think

- **Người dùng không đọc — họ scan.** Dùng heading phân cấp, bullet points, bold keywords.
- **Mỗi trang cần tiêu đề rõ ràng** khớp với navigation label.
- **Active state trong navigation** phải visible ngay lập tức.
- **Breadcrumb** cho page có depth > 2 levels.
- **Search box** hiển thị sẵn (không ẩn trong menu) nếu search là chức năng chính.
- **Số lượng navigation items:** 3-7 items tối ưu (Hick's Law).

## 8. Feedback & Affordance — The Design of Everyday Things

- **Mọi hành động đều có phản hồi.** Click → visual change. Submit → loading state. Error → message.
- **Affordance rõ ràng:**
  - Button nhìn như button (có padding, border-radius, hover)
  - Link nhìn như link (màu xanh hoặc underline khi hover)
  - Card nhìn clickable (hover shadow, cursor pointer)
- **Loading state:** spinner hoặc skeleton screen. Không để user chờ > 1s không feedback.
- **Success feedback:** checkmark, màu xanh, message ngắn.
- **Error feedback:** message cụ thể ở gần field lỗi, không chỉ toast ở góc.

## 9. Accessibility — Laws of UX (POUR)

- **Color contrast:** text thường ≥ 4.5:1, text lớn ≥ 3:1.
- **Focus indicator:** tất cả interactive elements có visible focus ring.
- **Touch targets:** tối thiểu 44x44px cho mobile.
- **Keyboard navigation:** tất cả interactive elements reachable bằng Tab.
- **Screen reader:** button có text mô tả, icon có aria-label.

## 10. Consistency & Design System — Atomic Design

- **Một component = một style.** Nếu Button có borderRadius 12px, tất cả button đều 12px.
- **Khoảng cách nhất quán.** Nếu card padding 24px, tất cả card đều 24px.
- **Màu sắc nhất quán.** primary color, danger color, success color dùng xuyên suốt.
- **Biến CSS cho tất cả tokens.** Màu, spacing, radius, shadow, font.

## 11. Visual Hierarchy Rules cụ thể

- **60-30-10 rule:** 60% neutral, 30% primary, 10% accent.
- **Không có 2 elements cạnh tranh attention.** Nếu có 2 primary buttons, cả 2 đều yếu.
- **Dùng icon sparingly.** Icon hỗ trợ nhận diện, không trang trí.
- **Shadow cho card:** 0 2px 8px rgba(0,0,0,0.08) cho card thường, 0 8px 30px cho elevated card.
- **Dùng border-radius 8-16px cho card, 4-8px cho button/input nhỏ.**

## 12. Micro-interactions

- **Transition duration:** 150-300ms.
- **Easing:** ease-out cho entering, ease-in cho exiting.
- **Hover effect:** transform translateY(-1px) + shadow tăng nhẹ.
- **Page transition:** fade-in 200ms khi route change.

## 13. Mobile-first Responsive

- **Breakpoints:**
  - < 600px: mobile (1 column)
  - 600-900px: tablet (2 columns)
  - 900-1200px: small desktop (3 columns)
  - > 1200px: large desktop (4 columns)
- **Touch targets tối thiểu 44px** trên mobile.
- **Bottom navigation** thay vì sidebar trên mobile.
- **Form elements full-width** trên mobile.

---

## Trigger Rules

- Khi một page có > 1 primary action, giảm còn 1 primary, các action còn lại secondary.
- Khi form không có focus state rõ ràng, thêm box-shadow focus.
- Khi navigation không highlight page hiện tại, sửa active state.
- Khi button không có hover state, thêm hover effect.
- Khi spacing không theo hệ thống (8px grid), chuẩn hóa lại.
- Khi loading không có indicator, thêm skeleton/spinner.
- Khi không có error state trên form input, thêm error handling.
- Khi font-size không có hierarchy rõ ràng, chuẩn hóa type scale.
