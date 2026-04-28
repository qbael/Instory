using System;
using System.Linq;
using System.Threading.Tasks;
using Instory.API.Data;
using Instory.API.DTOs.Admin;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Services.impl;

public class AdminService : IAdminService
{
    private readonly InstoryDbContext _context;
    private readonly UserManager<User> _userManager;

    public AdminService(InstoryDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<PaginatedResult<UserAdminDto>> GetUsersAsync(int pageNumber, int pageSize, string? search = null)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                u.UserName!.ToLower().Contains(searchLower) ||
                u.Email!.ToLower().Contains(searchLower));
        }

        query = query.OrderByDescending(u => u.CreatedAt);

        var count = await query.CountAsync();

        var users = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var userDtos = new List<UserAdminDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userDtos.Add(new UserAdminDto
            {
                Id = user.Id,
                UserName = user.UserName!,
                Email = user.Email!,
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                IsBlocked = user.IsBlocked,
                CreatedAt = user.CreatedAt,
                Roles = roles.ToList()
            });
        }

        return new PaginatedResult<UserAdminDto>(userDtos, pageNumber, pageSize, count);
    }

    public async Task PromoteToAdminAsync(int userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            throw new Exception("Người dùng không tồn tại");

        var hasRole = await _userManager.IsInRoleAsync(user, "Admin");
        if (!hasRole)
        {
            await _userManager.AddToRoleAsync(user, "Admin");
        }
    }

    public async Task ToggleUserBlockAsync(int userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            throw new Exception("Người dùng không tồn tại");

        var isSuperAdmin = await _userManager.IsInRoleAsync(user, "Admin");
        if (isSuperAdmin)
        {
            throw new Exception("Không thể khóa tài khoản của Admin khác");
        }

        user.IsBlocked = !user.IsBlocked;
        await _userManager.UpdateAsync(user);
    }

    public async Task<PaginatedResult<ReportAdminDto>> GetReportsAsync(int pageNumber, int pageSize)
    {
        var query = _context.PostReports
            .Include(r => r.Reporter)
            .Include(r => r.ReportReason)
            .Include(r => r.Post)
                .ThenInclude(p => p.User)
            .Include(r => r.Post)
                .ThenInclude(p => p.PostImages)
            .Where(r => r.Status == ReportStatus.Pending)
            .OrderByDescending(r => r.CreatedAt);

        var count = await query.CountAsync();

        var reports = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReportAdminDto
            {
                Id = r.Id,
                Reason = r.ReportReason.Name,
                ReasonDetail = r.ReasonDetail,
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                Reporter = new ReporterDto
                {
                    Id = r.Reporter.Id,
                    UserName = r.Reporter.UserName!,
                    AvatarUrl = r.Reporter.AvatarUrl
                },
                Post = new ReportedPostDto
                {
                    Id = r.Post.Id,
                    Content = r.Post.Content,
                    User = new ReporterDto
                    {
                        Id = r.Post.User.Id,
                        UserName = r.Post.User.UserName!,
                        AvatarUrl = r.Post.User.AvatarUrl
                    },
                    Images = r.Post.PostImages.OrderBy(i => i.SortOrder).Select(i => new ReportedPostImageDto
                    {
                        ImageUrl = i.ImageUrl
                    }).ToList()
                }
            })
            .ToListAsync();

        return new PaginatedResult<ReportAdminDto>(reports, pageNumber, pageSize, count);
    }

    public async Task ResolveReportAsync(int reportId, string action)
    {
        var report = await _context.PostReports
            .Include(r => r.Post)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
            throw new Exception("Báo cáo không tồn tại");

        if (report.Status != ReportStatus.Pending)
            throw new Exception("Báo cáo đã được xử lý");

        if (action == "remove_post")
        {
            report.Status = ReportStatus.Removed;
            if (report.Post != null)
            {
                report.Post.IsDeleted = true;
                report.Post.DeletedAt = DateTime.UtcNow;
            }
        }
        else
        {
            report.Status = ReportStatus.Rejected;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<ReportReasonAdminDto>> GetReportReasonsAsync()
    {
        var reasons = await _context.ReportReasons
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReportReasonAdminDto
            {
                Id = r.Id,
                Code = r.Code,
                Name = r.Name,
                Description = r.Description,
                Severity = r.Severity,
                IsActive = r.IsActive,
                CreatedAt = r.CreatedAt,
                UsageCount = r.PostReports.Count
            })
            .ToListAsync();

        return reasons;
    }

    public async Task<ReportReasonAdminDto> CreateReportReasonAsync(CreateReportReasonDto dto)
    {
        var code = dto.Code.Trim();
        var name = dto.Name.Trim();

        if (string.IsNullOrWhiteSpace(code))
            throw new Exception("Code không được để trống");
        if (string.IsNullOrWhiteSpace(name))
            throw new Exception("Tên lý do không được để trống");

        var codeLower = code.ToLower();
        var exists = await _context.ReportReasons.AnyAsync(r => r.Code.ToLower() == codeLower);
        if (exists)
            throw new Exception("Code đã tồn tại");

        var reason = new ReportReason
        {
            Code = code,
            Name = name,
            Description = dto.Description?.Trim(),
            Severity = dto.Severity <= 0 ? 1 : dto.Severity,
            IsActive = true
        };

        _context.ReportReasons.Add(reason);
        await _context.SaveChangesAsync();

        return new ReportReasonAdminDto
        {
            Id = reason.Id,
            Code = reason.Code,
            Name = reason.Name,
            Description = reason.Description,
            Severity = reason.Severity,
            IsActive = reason.IsActive,
            CreatedAt = reason.CreatedAt,
            UsageCount = 0
        };
    }

    public async Task DeleteReportReasonAsync(int reasonId)
    {
        var reason = await _context.ReportReasons
            .Include(r => r.PostReports)
            .FirstOrDefaultAsync(r => r.Id == reasonId);

        if (reason == null)
            throw new Exception("Lý do báo cáo không tồn tại");

        if (reason.PostReports.Any())
            throw new Exception("Không thể xóa lý do đang được sử dụng");

        _context.ReportReasons.Remove(reason);
        await _context.SaveChangesAsync();
    }

    public async Task<PaginatedResult<PostAdminDto>> GetPostsAsync(int pageNumber, int pageSize, string? search = null)
    {
        var query = _context.Posts
            .Include(p => p.User)
            .Include(p => p.PostImages)
            .Include(p => p.PostReports)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p =>
                (p.Content != null && p.Content.ToLower().Contains(searchLower)) ||
                p.User.UserName!.ToLower().Contains(searchLower));
        }

        query = query.OrderByDescending(p => p.CreatedAt);

        var count = await query.CountAsync();

        var posts = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PostAdminDto
            {
                Id = p.Id,
                Content = p.Content,
                IsDeleted = p.IsDeleted,
                DeletedAt = p.DeletedAt,
                CreatedAt = p.CreatedAt,
                LikeCount = p.LikeCount,
                CommentCount = p.CommentCount,
                ReportCount = p.PostReports.Count,
                User = new PostAdminUserDto
                {
                    Id = p.User.Id,
                    UserName = p.User.UserName!,
                    AvatarUrl = p.User.AvatarUrl
                },
                Images = p.PostImages
                    .OrderBy(i => i.SortOrder)
                    .Select(i => new PostAdminImageDto { ImageUrl = i.ImageUrl })
                    .ToList()
            })
            .ToListAsync();

        return new PaginatedResult<PostAdminDto>(posts, pageNumber, pageSize, count);
    }

    public async Task DeletePostAsync(int postId)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post == null)
            throw new Exception("Bài viết không tồn tại");

        post.IsDeleted = true;
        post.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }
}
