using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("posts")]
public class Post : BaseEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("content", TypeName = "text")]
    public string? Content { get; set; }

    // [MaxLength(255)]
    // [Column("image_url")]
    // public string? ImageUrl { get; set; }

    [Column("like_count")]
    public int LikeCount { get; set; } = 0;

    [Column("comment_count")]
    public int CommentCount { get; set; } = 0;

    [Column("share_count")]
    public int ShareCount { get; set; } = 0;

    [Column("allow_comment")]
    public bool AllowComment { get; set; } = true;

    [Column("is_deleted")]
    public bool IsDeleted { get; set; } = false;

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Like> Likes { get; set; } = new List<Like>();
    public ICollection<SharePost> SharePosts { get; set; } = new List<SharePost>();
    public ICollection<PostReport> PostReports { get; set; } = new List<PostReport>();
    public ICollection<PostHashtag> PostHashtags { get; set; } = new List<PostHashtag>();
    public ICollection<PostImage> PostImages { get; set; } = new List<PostImage>();
}