using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("report_reasons")]
public class ReportReason : BaseEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("code")]
    public string Code { get; set; } = null!;

    [Required]
    [MaxLength(255)]
    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("description", TypeName = "text")]
    public string? Description { get; set; }

    [Column("severity")]
    public int Severity { get; set; } = 1;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    public ICollection<PostReport> PostReports { get; set; }
        = new List<PostReport>();
}