public class HashtagDTO
{
    public int Id { get; set; }
    public string? Tag { get; set; } = null!;
    public long TotalPost { get; set; }
    public double? Score { get; set; }
}