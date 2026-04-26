namespace Instory.API.Models.Enums;

public enum ReportStatus
{
    Pending,
    Reviewed, //đã xem xét, nhưng chưa áp dụng hình phạt, ở mức cảnh cáo
    Removed, // đã gỡ nội dung
    Rejected // report không hợp lệ
}