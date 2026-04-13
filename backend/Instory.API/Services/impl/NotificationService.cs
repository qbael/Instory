using Instory.API.DTOs.Notification;
using Instory.API.Exceptions;
using Instory.API.Helpers;
using Instory.API.Hubs;
using Instory.API.Models;
using Instory.API.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace Instory.API.Services.impl;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(INotificationRepository notificationRepository, IHubContext<NotificationHub> hubContext)
    {
        _notificationRepository = notificationRepository;
        _hubContext = hubContext;
    }

    public async Task CreateAndSendAsync(int recipientId, int actorId, string type, int? referenceId, string message)
    {
        if (recipientId == actorId) return;

        var notification = new Notification
        {
            UserId = recipientId,
            ActorId = actorId,
            Type = type,
            ReferenceId = referenceId,
            Message = message,
            IsRead = false
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationRepository.SaveChangesAsync();

        var full = await _notificationRepository.GetByIdWithActorAsync(notification.Id);
        if (full != null)
        {
            var dto = NotificationDto.FromEntity(full);
            await _hubContext.Clients.Group(recipientId.ToString()).SendAsync("ReceiveNotification", dto);
        }
    }

    public async Task<PaginatedResult<NotificationDto>> GetUserNotificationsAsync(int userId, int page, int pageSize)
    {
        var notifications = await _notificationRepository.GetByUserIdAsync(userId, page, pageSize);
        var total = await _notificationRepository.GetTotalCountAsync(userId);
        var dtos = notifications.Select(NotificationDto.FromEntity).ToList();
        return new PaginatedResult<NotificationDto>(dtos, page, pageSize, total);
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _notificationRepository.GetUnreadCountAsync(userId);
    }

    public async Task MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId)
            ?? throw new NotFoundException("Notification not found");

        if (notification.UserId != userId)
            throw new UnauthorizedAccessException("Access denied");

        notification.IsRead = true;
        await _notificationRepository.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        await _notificationRepository.MarkAllAsReadAsync(userId);
    }
}
