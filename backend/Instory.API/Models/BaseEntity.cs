using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

public abstract class BaseEntity : ITrackable
{
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}