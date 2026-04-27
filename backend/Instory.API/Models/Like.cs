using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("likes")]
public class Like : BaseEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }
 
    [Required]
    [Column("post_id")]
    public int PostId { get; set; }
 
    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("is_deleted")]
    public bool IsDeleted { get; set; } = false;
    
    [ForeignKey(nameof(PostId))]
    public Post Post { get; set; } = null!;
 
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}