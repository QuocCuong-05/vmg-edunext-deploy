-- Đặt 3 khóa cuối thành trả phí (chạy SAU migration_paid_courses.sql)
-- Giá có thể đổi bất kỳ lúc nào trong trang admin (Khóa trả phí)
update public.courses
  set access_type = 'paid', price = 199000, sale_price = null
  where slug = 'vocabulary-teaching-toolkit';

update public.courses
  set access_type = 'paid', price = 299000, sale_price = null
  where slug = 'learning-science-for-teachers';

update public.courses
  set access_type = 'paid', price = 249000, sale_price = null
  where slug = 'stem-academic-language';

-- 3 khóa đầu giữ miễn phí
update public.courses
  set access_type = 'free', price = null, sale_price = null
  where slug in ('classroom-english-mastery', 'clil-lesson-design', 'assessment-feedback');
