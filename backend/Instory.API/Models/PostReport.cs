using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
 
    [Column("reason", TypeName = "text")]
    public string? Reason { get; set; }
 
    [MaxLength(20)]
    [Column("status")]
    public string? Status { get; set; }
 
    [ForeignKey(nameof(PostId))]
    public Post Post { get; set; } = null!;
 
    [ForeignKey(nameof(ReporterId))]
    public User Reporter { get; set; } = null!;
}