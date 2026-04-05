using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("story_views")]
public class StoryView
{
    [Key]
    [Column("id")]
    public int Id { get; set; }
 
    [Column("story_id")]
    public int StoryId { get; set; }
 
    [Column("viewer_id")]
    public int ViewerId { get; set; }
 
    [Column("viewed_at")]
    public DateTime ViewedAt { get; set; }
 
    [ForeignKey(nameof(StoryId))]
    public Story Story { get; set; } = null!;
 
    [ForeignKey(nameof(ViewerId))]
    public User Viewer { get; set; } = null!;
}