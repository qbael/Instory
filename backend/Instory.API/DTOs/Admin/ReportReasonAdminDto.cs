using System.ComponentModel.DataAnnotations;

namespace Instory.API.DTOs.Admin;

public class ReportReasonAdminDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public int Severity { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int UsageCount { get; set; }
}

public class CreateReportReasonDto
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = null!;

    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public int Severity { get; set; } = 1;
}

public class UpdateReportReasonDto
{
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public int Severity { get; set; } = 1;

    public bool IsActive { get; set; } = true;
}
