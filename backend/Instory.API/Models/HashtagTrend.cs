using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;
public class HashtagTrend
{
    public int Id { get; set; }
    public int HashtagId { get; set; }
    public DateTime Date { get; set; }
    public int PostCount { get; set; }

    public Hashtag Hashtag { get; set; } = null!;
}