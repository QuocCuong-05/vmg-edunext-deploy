-- Đặt 3 khóa đầu thành trả phí (chạy SAU migration_paid_courses.sql)
-- Giá có thể đổi bất kỳ lúc nào trong trang admin (Khóa trả phí)
update public.courses
  set access_type = 'paid', price = 199000, sale_price = null
  where slug = 'classroom-english-mastery';

update public.courses
  set access_type = 'paid', price = 299000, sale_price = null
  where slug = 'clil-lesson-design';

update public.courses
  set access_type = 'paid', price = 249000, sale_price = null
  where slug = 'assessment-feedback';

-- 3 khóa sau giữ miễn phí
update public.courses
  set access_type = 'free', price = null, sale_price = null
  where slug in ('vocabulary-teaching-toolkit', 'learning-science-for-teachers', 'stem-academic-language');
