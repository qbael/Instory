using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("share_posts")]
public class SharePost : BaseEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }
 
    [Column("user_id")]
    public int UserId { get; set; }
 
    [Column("post_id")]
    public int PostId { get; set; }
 
    [Column("caption", TypeName = "text")]
    public string? Caption { get; set; }
 
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
 
    [ForeignKey(nameof(PostId))]
    public Post Post { get; set; } = null!;
}