using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("post_images")]
public class PostImage
{
    public int Id { get; set; }

    public string ImageUrl { get; set; } = null!;

    public int PostId { get; set; }

    public int SortOrder { get; set; }

    // Navigation
    public Post Post { get; set; } = null!;
}