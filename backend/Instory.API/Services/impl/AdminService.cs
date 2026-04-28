using Instory.API.DTOs.Admin;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Instory.API.Repositories;
using Microsoft.AspNetCore.Identity;

namespace Instory.API.Services.impl;

public class AdminService : IAdminService
{
    private readonly IAdminRepository _adminRepository;
    private readonly UserManager<User> _userManager;

    public AdminService(IAdminRepository adminRepository, UserManager<User> userManager)
    {
        _adminRepository = adminRepository;
        _userManager = userManager;
    }

    public async Task<PaginatedResult<UserAdminDto>> GetUsersAsync(int pageNumber, int pageSize, string? search = null)
    {
        var (users, count) = await _adminRepository.GetUsersAsync(pageNumber, pageSize, search);

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
        var (reports, count) = await _adminRepository.GetPendingReportsAsync(pageNumber, pageSize);
        return new PaginatedResult<ReportAdminDto>(reports, pageNumber, pageSize, count);
    }

    public async Task ResolveReportAsync(int reportId, string action)
    {
        var report = await _adminRepository.GetReportWithPostAsync(reportId);

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

        await _adminRepository.SaveChangesAsync();
    }

    public async Task<List<ReportReasonAdminDto>> GetReportReasonsAsync()
    {
        return await _adminRepository.GetReportReasonsAsync();
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
        var exists = await _adminRepository.ReportReasonCodeExistsAsync(codeLower);
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

        await _adminRepository.CreateReportReasonAsync(reason);

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
        var reason = await _adminRepository.GetReportReasonWithReportsAsync(reasonId);

        if (reason == null)
            throw new Exception("Lý do báo cáo không tồn tại");

        if (reason.PostReports.Any())
            throw new Exception("Không thể xóa lý do đang được sử dụng");

        _adminRepository.RemoveReportReason(reason);
        await _adminRepository.SaveChangesAsync();
    }

    public async Task<PaginatedResult<PostAdminDto>> GetPostsAsync(int pageNumber, int pageSize, string? search = null)
    {
        var (posts, count) = await _adminRepository.GetPostsAsync(pageNumber, pageSize, search);
        return new PaginatedResult<PostAdminDto>(posts, pageNumber, pageSize, count);
    }

    public async Task DeletePostAsync(int postId)
    {
        var post = await _adminRepository.GetPostByIdAsync(postId);
        if (post == null)
            throw new Exception("Bài viết không tồn tại");

        post.IsDeleted = true;
        post.DeletedAt = DateTime.UtcNow;
        await _adminRepository.SaveChangesAsync();
    }
}
