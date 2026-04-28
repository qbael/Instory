using System;
using System.Collections.Generic;

namespace Instory.API.DTOs.Admin;

public class PostAdminDto
{
    public int Id { get; set; }
    public string? Content { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public int ReportCount { get; set; }
    public PostAdminUserDto User { get; set; } = null!;
    public List<PostAdminImageDto> Images { get; set; } = new();
}

public class PostAdminUserDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = null!;
    public string? AvatarUrl { get; set; }
}

public class PostAdminImageDto
{
    public string ImageUrl { get; set; } = null!;
}
