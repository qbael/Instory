using System;
using Instory.API.Models.Enums;

namespace Instory.API.DTOs.Admin;

public class ReportAdminDto
{
    public int Id { get; set; }
    public string? Reason { get; set; }
    public string? ReasonDetail { get; set; }
    public ReportStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }

    public ReporterDto Reporter { get; set; } = null!;
    public ReportedPostDto Post { get; set; } = null!;
}

public class ReporterDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = null!;
    public string? AvatarUrl { get; set; }
}

public class ReportedPostDto
{
    public int Id { get; set; }
    public string? Content { get; set; }
    public ReporterDto User { get; set; } = null!;
    public List<ReportedPostImageDto> Images { get; set; } = new();
}

public class ReportedPostImageDto
{
    public string ImageUrl { get; set; } = null!;
}
