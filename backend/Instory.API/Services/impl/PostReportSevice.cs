using Instory.API.DTOs;
using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Instory.API.Repositories;

namespace Instory.API.Services.impl;

public class PostReportService : IPostReportService
{
    private readonly IPostReportRepository _postReportRepository;
    private readonly IReportReasonRepository _reportReasonRepository;
    private readonly IPostRepository _postRepository;

    public PostReportService(
        IPostReportRepository postReportRepository,
        IReportReasonRepository reportReasonRepository,
        IPostRepository postRepository)
    {
        _postReportRepository = postReportRepository;
        _reportReasonRepository = reportReasonRepository;
        _postRepository = postRepository;
    }

    public async Task<IEnumerable<ReportReason>> GetReasonsAsync()
    {
        return await _reportReasonRepository.GetAllAsync();
    }

    public async Task ReportPostAsync(
        int postId,
        int reporterId,
        CreatePostReportDto dto)
    {
        var postExists = await _postRepository.GetByIdAsync(postId);
        if (postExists == null)
            throw new Exception("Bài viết không tồn tại");

        var reasonExists = await _reportReasonRepository.ExistsAsync(dto.ReasonId);
        if (!reasonExists)
            throw new Exception("Lý do report không hợp lệ");

        var alreadyReported =
            await _postReportRepository.ExistsAsync(postId, reporterId);

        if (alreadyReported)
            throw new BadRequestException("Bạn đã report bài viết này");

        var report = new PostReport
        {
            PostId = postId,
            ReporterId = reporterId,
            ReasonId = dto.ReasonId,
            ReasonDetail = dto.ReasonDetail,
            Status = ReportStatus.Pending
        };

        await _postReportRepository.AddAsync(report);
        await _postReportRepository.SaveChangesAsync();
    }
}