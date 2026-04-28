namespace Instory.API.DTOs.Admin;

public class ResolveReportDto
{
    // "dismiss" or "remove_post"
    public string Action { get; set; } = null!;
}
