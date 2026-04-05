using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("post_hashtags")]
public class PostHashtag
{
    [Key]
    [Column("id")]
    public int Id { get; set; }
 
    [Column("post_id")]
    public int PostId { get; set; }
 
    [Column("hashtag_id")]
    public int HashtagId { get; set; }
 
    [ForeignKey(nameof(PostId))]
    public Post Post { get; set; } = null!;
 
    [ForeignKey(nameof(HashtagId))]
    public Hashtag Hashtag { get; set; } = null!;
}