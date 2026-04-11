using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("messages")]
public class Message : BaseEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("chat_id")]
    public int ChatId { get; set; }
    public Chat Chat { get; set; } = null!;

    [Column("sender_id")]
    public int SenderId { get; set; }
    public User Sender { get; set; } = null!;

    [Column("content")]
    public string? Content { get; set; }

    [MaxLength(512)]
    [Column("media_url")]
    public string? MediaUrl { get; set; }
}
