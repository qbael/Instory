using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("follows")]
public class Follow : BaseEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }
 
    [Column("follower_id")]
    public int FollowerId { get; set; }
 
    [Column("following_id")]
    public int FollowingId { get; set; }
 
    [ForeignKey(nameof(FollowerId))]
    public User Follower { get; set; } = null!;
 
    [ForeignKey(nameof(FollowingId))]
    public User Following { get; set; } = null!;
}