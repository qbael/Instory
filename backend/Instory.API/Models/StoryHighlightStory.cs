using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("story_highlight_stories")]
public class StoryHighlightStory
{
    [Column("highlight_id")]
    public int HighlightId { get; set; }

    [Column("story_id")]
    public int StoryId { get; set; }

    [ForeignKey(nameof(HighlightId))]
    public StoryHighlight Highlight { get; set; } = null!;

    [ForeignKey(nameof(StoryId))]
    public Story Story { get; set; } = null!;
}
