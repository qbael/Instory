using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("chats")]
public class Chat : BaseEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("type")]
    public ChatType Type { get; set; } = ChatType.Direct;

    [MaxLength(100)]
    [Column("name")]
    public string? Name { get; set; }

    public ICollection<ChatParticipant> Participants { get; set; } = new List<ChatParticipant>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
