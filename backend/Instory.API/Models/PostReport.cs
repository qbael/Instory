using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Instory.API.Models.Enums;

namespace Instory.API.Models;

[Table("post_reports")]
public class PostReport : BaseEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("post_id")]
    public int PostId { get; set; }

    [Column("reporter_id")]
    public int ReporterId { get; set; }

    [Column("reason_id")]
    public int ReasonId { get; set; }

    [Column("reason_detail", TypeName = "text")]
    public string? ReasonDetail { get; set; }

    [MaxLength(20)]
    [Column("status")]
    public ReportStatus Status { get; set; } = ReportStatus.Pending;

    [ForeignKey(nameof(PostId))]
    public Post Post { get; set; } = null!;

    [ForeignKey(nameof(ReporterId))]
    public User Reporter { get; set; } = null!;

    [ForeignKey(nameof(ReasonId))]
    public ReportReason ReportReason { get; set; } = null!;
}