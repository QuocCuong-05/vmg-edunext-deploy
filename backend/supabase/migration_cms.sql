-- ============================================================
-- VMG EduNext — CMS: content_items (blog/help/policy + version)
-- Chạy 1 lần trên Supabase SQL Editor (staging + production)
-- ============================================================

create table if not exists public.content_items (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,                -- 'blog' | 'help' | 'policy'
  slug         text not null,
  title        text not null,
  excerpt      text,
  body         text,                         -- HTML (TipTap)
  category     text,
  cover_url    text,
  author       text,
  status       text not null default 'draft',-- draft | published
  version      integer not null default 1,
  is_active    boolean not null default true,
  published_at timestamptz,
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null,
  unique (type, slug, version)
);

create index if not exists idx_content_type_status on public.content_items(type, status);
create index if not exists idx_content_published on public.content_items(published_at desc);

alter table public.content_items enable row level security;

drop policy if exists "content_items_select_published" on public.content_items;
create policy "content_items_select_published" on public.content_items
  for select using (status = 'published');

grant select on public.content_items to anon, authenticated;
grant all privileges on table public.content_items to service_role;

-- ============================================================
-- SEED
-- ============================================================

-- 1. Chính sách bảo mật — version 1 (active)
insert into public.content_items (type, slug, title, excerpt, body, category, author, status, version, is_active, published_at)
values ('policy', 'chinh-sach-bao-mat', 'Chính sách bảo mật',
  'Chính sách bảo mật của VMG EduNext',
  '<h2>1. Dữ liệu chúng tôi thu thập</h2><p>Khi sử dụng VMG EduNext, chúng tôi có thể thu thập: thông tin tài khoản (email, họ tên, trường, phường/xã), địa chỉ IP và thiết bị truy cập, dữ liệu hoạt động học tập (tiến độ bài học, kết quả trắc nghiệm, lượt sử dụng AI, bài viết cộng đồng), và lịch sử đồng ý chính sách của bạn.</p><h2>2. Mục đích xử lý dữ liệu</h2><p>Dữ liệu được xử lý cho các mục đích: cung cấp và duy trì dịch vụ (tài khoản, đơn hàng, thanh toán, chứng nhận); hỗ trợ và chăm sóc người dùng; an ninh và tuân thủ pháp luật; nâng cao chất lượng dịch vụ (phân tích tương tác, cá nhân hóa, cải thiện AI); và truyền thông, tiếp thị (chỉ khi bạn đồng ý).</p><h2>3. Lưu trữ dữ liệu</h2><p>Dữ liệu người dùng được lưu trữ trong nước (Việt Nam). Nội dung video bài học sử dụng hạ tầng nước ngoài nhưng không chứa dữ liệu nhận dạng cá nhân.</p><h2>4. Bảo mật dữ liệu</h2><p>Mật khẩu được băm một chiều (bcrypt) — hệ thống không lưu trữ hay truy xuất mật khẩu dạng văn bản gốc. Truyền dữ liệu qua HTTPS. Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba.</p><h2>5. Quyền của bạn</h2><p>Bạn có quyền: xem và sửa thông tin cá nhân, xem lịch sử đồng ý và dữ liệu được thu thập, rút lại đồng ý bất kỳ lúc nào, yêu cầu xóa dữ liệu. Liên hệ hỗ trợ để thực hiện các quyền này.</p><h2>6. Liên hệ</h2><p>Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ qua email hỗ trợ của VMG EduNext.</p>',
  'policy', 'VMG EduNext', 'published', 1, true, now());

-- 2. Bài blog (seed — admin chỉnh qua CMS)
insert into public.content_items (type, slug, title, excerpt, body, category, author, status, version, published_at) values
('blog', 'thiet-ke-muc-tieu-kep', 'Thiết kế mục tiêu kép: vừa học nội dung, vừa phát triển ngôn ngữ',
 'Cách viết hai nhóm mục tiêu và kết nối chúng trong từng hoạt động của tiết học.',
 '<p class="article-lead">Trong lớp học bằng ngôn ngữ thứ hai, học sinh không chỉ cần hiểu kiến thức. Các em còn cần ngôn ngữ để quan sát, so sánh, giải thích, lập luận và trình bày điều đã hiểu.</p><h2>1. Hai mục tiêu không phải hai bài học riêng biệt</h2><p>Mục tiêu nội dung mô tả điều học sinh cần biết hoặc làm được trong môn học. Mục tiêu ngôn ngữ mô tả cách học sinh sẽ dùng ngôn ngữ để tiếp cận và thể hiện hiểu biết đó.</p><h2>2. Bắt đầu từ hành động nhận thức</h2><p>Hãy xác định học sinh phải làm gì với kiến thức: phân loại, so sánh, dự đoán, giải thích hay đánh giá. Mỗi hành động cần một tập hợp mẫu câu.</p><h2>3. Đánh giá cả hai mục tiêu</h2><p>Không cần tách thành hai bài kiểm tra. Một sản phẩm học tập có thể cho thấy cả kiến thức và ngôn ngữ.</p>',
 'CLIL & Song ngữ', 'VMG EduNext', 'published', 1, now()),
('blog', 'phan-hoi-sua-loi', 'Phản hồi sửa lỗi mà không làm giảm động lực',
 'Các mẫu câu phản hồi cụ thể, trung tính và định hướng học sinh thử lại.',
 '<p class="article-lead">Mục tiêu của sửa lỗi không phải chứng minh học sinh sai, mà giúp các em nhận ra khoảng cách giữa câu trả lời hiện tại và bước tiến tiếp theo.</p><h2>Chọn lỗi cần sửa</h2><p>Ưu tiên lỗi ảnh hưởng đến ý nghĩa, lỗi liên quan trực tiếp đến mục tiêu bài học hoặc lỗi lặp lại nhiều lần.</p><h2>Công thức: ghi nhận – chỉ rõ – mời thử lại</h2><p>Ví dụ: "Your main idea is clear. Use the past tense when you describe the experiment. Try the second sentence again."</p>',
 'Quản lý lớp', 'VMG EduNext', 'published', 1, now()),
('blog', 'khung-5-buoc-kiem-tra-ke-hoach-bai-day-ai', 'Khung 5 bước kiểm tra kế hoạch bài dạy do AI tạo',
 'Đảm bảo nội dung đúng, phù hợp học sinh và khả thi với điều kiện lớp học.',
 '<p class="article-lead">AI có thể giúp giáo viên tạo bản nháp nhanh, nhưng trách nhiệm chuyên môn vẫn thuộc về giáo viên.</p><h2>1. Kiểm tra tính đúng của nội dung</h2><p>Đối chiếu khái niệm, số liệu, ví dụ và nguồn học liệu với tài liệu chính thống.</p><h2>2. Kiểm tra sự phù hợp với người học</h2><p>Xem lại độ khó ngôn ngữ, kiến thức nền, độ tuổi, nhu cầu hỗ trợ và bối cảnh văn hóa.</p><h2>3. Kiểm tra sự liên kết</h2><p>Mục tiêu, hoạt động và đánh giá phải cùng hướng về một năng lực.</p><h2>4. Kiểm tra tính khả thi</h2><p>Tính lại thời lượng, sĩ số, thiết bị, không gian và thời gian chuyển hoạt động.</p><h2>5. Kiểm tra an toàn và đạo đức</h2><p>Loại bỏ dữ liệu cá nhân, nội dung thiên lệch, tài liệu vi phạm bản quyền.</p>',
 'AI trong giáo dục', 'VMG EduNext', 'published', 1, now()),
('blog', 'wait-time', 'Wait time: khoảng im lặng có chủ đích',
 'Ba giây im lặng đôi khi chưa đủ để học sinh xử lý cả nội dung và ngôn ngữ thứ hai.',
 '<p class="article-lead">Trong lớp học bằng ngôn ngữ thứ hai, học sinh phải xử lý đồng thời nội dung và ngôn ngữ.</p><h2>Hai khoảng chờ quan trọng</h2><p><b>Khoảng chờ 1</b> xảy ra sau khi giáo viên đặt câu hỏi. <b>Khoảng chờ 2</b> xảy ra sau câu trả lời của học sinh.</p><h2>Cách tạo khoảng chờ mà không gây ngượng</h2><p>Thông báo trước: "Take five seconds to think." Cho học sinh ghi một từ khóa, trao đổi nhanh với bạn.</p>',
 'Quản lý lớp', 'VMG EduNext', 'published', 1, now()),
('blog', '5-cach-kiem-tra-muc-do-hieu', '5 cách kiểm tra mức độ hiểu trong dưới hai phút',
 'Câu "Các em hiểu chưa?" thường không cung cấp bằng chứng đáng tin cậy.',
 '<p class="article-lead">Kiểm tra hiểu cần khiến học sinh thể hiện điều đã hiểu.</p><h2>1. Nói lại nhiệm vụ</h2><p>"What do you need to do first?" hoặc yêu cầu học sinh giải thích cho bạn.</p><h2>2. Tín hiệu lựa chọn</h2><p>Học sinh giơ một, hai hoặc ba ngón tay để chọn đáp án.</p><h2>3. Viết một câu</h2><p>Yêu cầu viết định nghĩa, ví dụ lên bảng con.</p><h2>4. Câu hỏi truy hồi</h2><p>Không cho nhìn tài liệu, hỏi lại ý quan trọng.</p><h2>5. Phiếu thoát lớp</h2><p>Một điều đã hiểu, một điều còn băn khoăn.</p>',
 'Đánh giá', 'VMG EduNext', 'published', 1, now()),
('blog', 'xay-dung-cong-dong-hoc-tap-chuyen-mon', 'Xây dựng cộng đồng học tập chuyên môn trong trường',
 'Một cộng đồng nơi giáo viên cùng xác định vấn đề, thử giải pháp và điều chỉnh thực hành.',
 '<p class="article-lead">Một cộng đồng chuyên môn hiệu quả không chỉ là nhóm chia sẻ tài liệu.</p><h2>Bắt đầu từ một câu hỏi nhỏ</h2><p>"Làm thế nào để học sinh nói nhiều hơn trong hoạt động nhóm?"</p><h2>Chu trình bốn bước</h2><p>1) Xác định bằng chứng. 2) Chọn chiến lược. 3) Thử và thu bằng chứng. 4) Chia sẻ, điều chỉnh.</p><h2>Tạo an toàn nghề nghiệp</h2><p>Quan sát không nhằm xếp loại. Tập trung vào hành vi học tập, dùng ngôn ngữ mô tả.</p>',
 'Phát triển giáo viên', 'VMG EduNext', 'published', 1, now());

-- 3. Trợ giúp — 4 chủ đề + FAQ
insert into public.content_items (type, slug, title, excerpt, body, category, author, status, version, published_at) values
('help', 'dang-ky-tai-khoan', 'Đăng ký tài khoản như thế nào?',
 'Hướng dẫn đăng ký tài khoản VMG EduNext.',
 '<h2>Các bước đăng ký</h2><p>1. Vào trang đăng nhập và chọn "Đăng ký".</p><p>2. Nhập email, mật khẩu, họ tên, phường/xã và trường học.</p><p>3. Tích chọn các mục đồng ý bắt buộc và tùy chọn theo nhu cầu.</p><p>4. Bấm tạo tài khoản và kiểm tra email để xác nhận (nếu được yêu cầu).</p>',
 'Học tập', 'VMG EduNext', 'published', 1, now()),
('help', 'quen-mat-khau', 'Quên mật khẩu phải làm sao?',
 'Hướng dẫn đặt lại mật khẩu.',
 '<h2>Đặt lại mật khẩu</h2><p>Trên trang đăng nhập, bấm "Quên mật khẩu", nhập email của bạn và làm theo link gửi qua hộp thư. Mật khẩu mới cần tối thiểu 6 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>',
 'Tài khoản', 'VMG EduNext', 'published', 1, now()),
('help', 'nang-cap-goi-plus', 'Cách nâng cấp gói Plus?',
 'Hướng dẫn mua và gia hạn gói Plus.',
 '<h2>Nâng cấp Plus</h2><p>Vào mục "Gói Plus" trên sidebar, chọn gói phù hợp (1/3/6/12 tháng), tạo đơn và chuyển khoản theo thông tin hiển thị. Sau khi thanh toán, bấm "Tôi đã hoàn tất thanh toán" — hệ thống sẽ xác nhận và kích hoạt gói.</p>',
 'Thanh toán', 'VMG EduNext', 'published', 1, now()),
('help', 'kiem-tra-don-hang', 'Theo dõi trạng thái đơn hàng?',
 'Hướng dẫn xem trạng thái đơn hàng và lịch sử thanh toán.',
 '<h2>Trạng thái đơn hàng</h2><p>Vào mục "Gói Plus" → "Lịch sử thanh toán" để xem trạng thái đơn: Chờ thanh toán, Chờ xác nhận, Đã thanh toán hoặc Hết hạn. Với đơn chờ thanh toán còn hạn, bạn có thể tiếp tục thanh toán hoặc hủy đơn.</p>',
 'Thanh toán', 'VMG EduNext', 'published', 1, now()),
('help', 'phat-video-khong-load', 'Video bài học không phát được?',
 'Xử lý sự cố video phát không được.',
 '<h2>Kiểm tra nhanh</h2><p>1. Đảm bảo mạng ổn định và thử tải lại trang.</p><p>2. Xóa cache trình duyệt hoặc thử trình duyệt khác.</p><p>3. Nếu bài học yêu cầu gói Plus, hãy kiểm tra gói của bạn còn hạn không.</p>',
 'Kỹ thuật', 'VMG EduNext', 'published', 1, now()),
('help', 'xu-ly-khieu-nai', 'Cách gửi phản hồi hoặc khiếu nại?',
 'Hướng dẫn liên hệ hỗ trợ.',
 '<h2>Liên hệ hỗ trợ</h2><p>Mọi thắc mắc, phản hồi hoặc khiếu nại vui lòng liên hệ qua email hỗ trợ của VMG EduNext. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>',
 'Tài khoản', 'VMG EduNext', 'published', 1, now()),
('help', 'faq', 'Câu hỏi thường gặp',
 'Các câu hỏi thường gặp về VMG EduNext.',
 '<details><summary>VMG EduNext là gì và phù hợp với ai?</summary><p>VMG EduNext là nền tảng phát triển năng lực ngoại ngữ và phương pháp giảng dạy dành cho giáo viên — từ Classroom English, CLIL/STEM đến đánh giá năng lực, kết hợp trợ lý AI ViMi.</p></details><details><summary>Làm thế nào để đăng ký tài khoản?</summary><p>Vào trang đăng nhập, chọn Đăng ký, điền thông tin và đồng ý các mục bắt buộc. Kiểm tra email để xác nhận nếu được yêu cầu.</p></details><details><summary>Gói Plus có những quyền lợi gì?</summary><p>Toàn bộ khóa học premium, ViMi AI không giới hạn, sổ từ không giới hạn, lịch sử quiz, XP x1.2, quà cửa hàng hạng Plus và chứng chỉ premium.</p></details><details><summary>Tôi có thể học trên điện thoại không?</summary><p>Có. VMG EduNext hoạt động trên mọi trình duyệt hiện đại — điện thoại, máy tính bảng hay laptop.</p></details><details><summary>Làm sao để liên hệ hỗ trợ?</summary><p>Xem các bài viết trợ giúp hoặc liên hệ qua email hỗ trợ của VMG EduNext.</p></details>',
 'Học tập', 'VMG EduNext', 'published', 1, now());
