public class EditResponseDTO
{
    public int Id { get; set; }
    // public int UserId { get; set; }
    public string? Content { get; set; }
    public List<PostImageDTO> Images { get; set; } = new List<PostImageDTO>();
}