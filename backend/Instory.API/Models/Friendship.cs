using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Instory.API.Models.Enums;

namespace Instory.API.Models;

[Table("friendships")]
public class Friendship : BaseEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }
 
    [Column("requester_id")]
    public int RequesterId { get; set; }
 
    [Column("addressee_id")]
    public int AddresseeId { get; set; }
    
    [Column("status")]
    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;
 
    [ForeignKey(nameof(RequesterId))]
    public User Requester { get; set; } = null!;
 
    [ForeignKey(nameof(AddresseeId))]
    public User Addressee { get; set; } = null!;
}