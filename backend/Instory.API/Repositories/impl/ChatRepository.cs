using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class ChatRepository : Repository<Chat>, IChatRepository
{
    public ChatRepository(InstoryDbContext context) : base(context)
    {
    }

    public async Task<Chat?> GetDirectChatAsync(int user1Id, int user2Id)
    {
        return await _dbSet
            .Where(c => c.Type == ChatType.Direct)
            .Where(c => c.Participants.Any(p => p.UserId == user1Id) && c.Participants.Any(p => p.UserId == user2Id))
            .FirstOrDefaultAsync();
    }

    public async Task<ChatParticipant?> GetParticipantAsync(int chatId, int userId)
    {
        return await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatId == chatId && cp.UserId == userId);
    }

    public async Task<bool> IsParticipantAsync(int chatId, int userId)
    {
        return await _context.ChatParticipants
            .AnyAsync(cp => cp.ChatId == chatId && cp.UserId == userId);
    }

    public async Task AddMessageAsync(Message message)
    {
        await _context.Messages.AddAsync(message);
    }

    public async Task LoadMessageSenderAsync(Message message)
    {
        await _context.Entry(message).Reference(m => m.Sender).LoadAsync();
    }

    public async Task<IEnumerable<Chat>> GetUserChatsAsync(int userId)
    {
        return await _dbSet
            .Include(c => c.Participants)
            .ThenInclude(p => p.User)
            .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .Where(c => c.Participants.Any(p => p.UserId == userId))
            .OrderByDescending(c => c.Messages.Any() ? c.Messages.Max(m => m.CreatedAt) : c.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Message>> GetChatMessagesAsync(int chatId)
    {
        return await _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ChatId == chatId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<int>> GetParticipantIdsAsync(int chatId)
    {
        return await _context.ChatParticipants
            .Where(cp => cp.ChatId == chatId)
            .Select(cp => cp.UserId)
            .ToListAsync();
    }
}
