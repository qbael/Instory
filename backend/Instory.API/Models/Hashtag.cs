using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("hashtags")]
public class Hashtag : BaseEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }
 
    [MaxLength(100)]
    [Column("tag")]
    public string? Tag { get; set; }
 
    public ICollection<PostHashtag> PostHashtags { get; set; } = new List<PostHashtag>();
}