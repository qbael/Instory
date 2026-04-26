select * from hashtags
select * from hashtagtrend
select * from post_hashtags
select * from likes
select * from posts
select * from comments
select * from post_images

update posts set is_deleted = false where id = 19 
select * from report_reasons
select * from post_reports
INSERT INTO report_reasons
(
    code,
    name,
    description,
    severity,
    is_active,
    created_at,
    updated_at
)
VALUES
('spam', 'Spam / quảng cáo', 'Nội dung quảng cáo, spam', 1, true, NOW(), NOW()),
('harassment', 'Quấy rối / xúc phạm', 'Công kích, bắt nạt', 2, true, NOW(), NOW()),
('violence', 'Nội dung bạo lực', 'Cổ súy bạo lực', 4, true, NOW(), NOW()),
('sexual', 'Nội dung nhạy cảm', 'Nội dung phản cảm', 3, true, NOW(), NOW()),
('misinformation', 'Thông tin sai lệch', 'Lan truyền tin giả', 3, true, NOW(), NOW()),
('scam', 'Lừa đảo', 'Phishing, scam', 5, true, NOW(), NOW()),
('copyright', 'Vi phạm bản quyền', 'Sử dụng trái phép nội dung', 2, true, NOW(), NOW()),
('hate_speech', 'Phát ngôn thù ghét', 'Kích động thù địch', 5, true, NOW(), NOW()),
('fake_account', 'Mạo danh', 'Giả mạo cá nhân/tổ chức', 4, true, NOW(), NOW()),
('other', 'Khác', 'Lý do khác', 1, true, NOW(), NOW());