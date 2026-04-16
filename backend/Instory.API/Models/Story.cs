using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Instory.API.Models.Enums;

namespace Instory.API.Models;

[Table("stories")]
public class Story : BaseEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }
 
    [Column("user_id")]
    public int UserId { get; set; }
 
    [MaxLength(255)]
    [Column("media_url")]
    public string? MediaUrl { get; set; }
 
    [Column("caption", TypeName = "text")]
    public string? Caption { get; set; }
 
    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }
    
    [Column("media_type")]
    public MediaType MediaType { get; set; } = MediaType.Image;

    [Column("is_deleted")]
    public bool IsDeleted { get; set; } = false;
 
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
 
    public ICollection<StoryView> StoryViews { get; set; } = new List<StoryView>();
}