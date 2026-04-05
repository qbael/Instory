using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("notifications")]
public class Notification : BaseEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }
 
    [Column("user_id")]
    public int UserId { get; set; }
 
    [MaxLength(50)]
    [Column("type")]
    public string? Type { get; set; }
 
    [Column("reference_id")]
    public int? ReferenceId { get; set; }
 
    [Column("message", TypeName = "text")]
    public string? Message { get; set; }
 
    [Column("is_read")]
    public bool IsRead { get; set; }
 
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}