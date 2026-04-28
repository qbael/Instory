using Instory.API.Data;
using Instory.API.DTOs.Admin;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class AdminRepository : IAdminRepository
{
    private readonly InstoryDbContext _context;

    public AdminRepository(InstoryDbContext context)
    {
        _context = context;
    }

    public async Task<(List<User> Users, int TotalCount)> GetUsersAsync(int pageNumber, int pageSize, string? search = null)
    {
        var query = _context.Users.AsQueryable();

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

        return (users, count);
    }

    public async Task<(List<ReportAdminDto> Reports, int TotalCount)> GetPendingReportsAsync(int pageNumber, int pageSize)
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

        return (reports, count);
    }

    public async Task<PostReport?> GetReportWithPostAsync(int reportId)
    {
        return await _context.PostReports
            .Include(r => r.Post)
            .FirstOrDefaultAsync(r => r.Id == reportId);
    }

    public async Task<(List<PostAdminDto> Posts, int TotalCount)> GetPostsAsync(int pageNumber, int pageSize, string? search = null)
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

        return (posts, count);
    }

    public async Task<Post?> GetPostByIdAsync(int postId)
    {
        return await _context.Posts.FindAsync(postId);
    }

    public async Task<List<ReportReasonAdminDto>> GetReportReasonsAsync()
    {
        return await _context.ReportReasons
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
    }

    public async Task<bool> ReportReasonCodeExistsAsync(string code)
    {
        var codeLower = code.ToLower();
        return await _context.ReportReasons.AnyAsync(r => r.Code.ToLower() == codeLower);
    }

    public async Task<ReportReason> CreateReportReasonAsync(ReportReason reason)
    {
        _context.ReportReasons.Add(reason);
        await _context.SaveChangesAsync();
        return reason;
    }

    public async Task<ReportReason?> GetReportReasonWithReportsAsync(int reasonId)
    {
        return await _context.ReportReasons
            .Include(r => r.PostReports)
            .FirstOrDefaultAsync(r => r.Id == reasonId);
    }

    public void RemoveReportReason(ReportReason reason)
    {
        _context.ReportReasons.Remove(reason);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}

