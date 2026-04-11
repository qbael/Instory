using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("chat_participants")]
public class ChatParticipant
{
    [Column("chat_id")]
    public int ChatId { get; set; }
    public Chat Chat { get; set; } = null!;

    [Column("user_id")]
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
