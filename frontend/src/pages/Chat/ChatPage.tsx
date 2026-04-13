import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, ImagePlus, X, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchUserChats,
  fetchChatMessages,
  sendMessage,
  sendMediaMessage,
  setActiveChatId,
} from '@/store/slices/chatSlice';
import { useChatSignalR } from '@/hooks/useChatSignalR';
import { Avatar } from '@/components/ui/Avatar';
import type { Chat } from '@/types/chat';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return formatTime(iso);
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getChatDisplayName(chat: Chat, currentUserId: number | undefined) {
  if (chat.type === 'group') return chat.name ?? 'Group Chat';
  const other = chat.participants.find((p) => p.userId !== currentUserId);
  return other?.fullName ?? 'Unknown User';
}

function getChatAvatar(chat: Chat, currentUserId: number | undefined) {
  if (chat.type === 'group') return null;
  return chat.participants.find((p) => p.userId !== currentUserId)?.avatarUrl ?? null;
}

// ─── ConversationItem ────────────────────────────────────────────────────────

function ConversationItem({
  chat,
  isActive,
  currentUserId,
  onClick,
}: {
  chat: Chat;
  isActive: boolean;
  currentUserId: number | undefined;
  onClick: () => void;
}) {
  const name = getChatDisplayName(chat, currentUserId);
  const avatar = getChatAvatar(chat, currentUserId);
  const lastMsg = chat.lastMessage;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 ${
        isActive ? 'bg-[#f0f0f0]' : 'hover:bg-[#f7f7f7]'
      }`}
      style={{ border: 'none', background: isActive ? '#f0f0f0' : 'transparent', cursor: 'pointer' }}
    >
      <div className="relative shrink-0">
        <Avatar src={avatar} alt={name} size="md" />
        {/* online dot – static for now */}
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
          style={{ background: '#3fc14c' }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span
            className="truncate text-[14px] font-semibold"
            style={{ color: '#262626' }}
          >
            {name}
          </span>
          {lastMsg && (
            <span className="ml-2 shrink-0 text-[11px]" style={{ color: '#8e8e8e' }}>
              {formatDate(lastMsg.createdAt)}
            </span>
          )}
        </div>
        {lastMsg && (
          <p className="truncate text-[13px]" style={{ color: '#8e8e8e' }}>
            {lastMsg.content ?? (lastMsg.mediaUrl ? '📷 Photo' : '')}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── MessageBubble ───────────────────────────────────────────────────────────

function MessageBubble({
  isMine,
  content,
  mediaUrl,
  time,
  senderName,
  senderAvatar,
}: {
  isMine: boolean;
  content: string | null;
  mediaUrl: string | null;
  time: string;
  senderName: string | null;
  senderAvatar: string | null;
}) {
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMine && (
        <Avatar src={senderAvatar} alt={senderName ?? ''} size="xs" />
      )}
      <div
        className={`flex max-w-[65%] flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}
      >
        {mediaUrl && (
          <img
            src={mediaUrl}
            alt="media"
            className="rounded-2xl object-cover shadow-sm"
            style={{ maxWidth: '260px', maxHeight: '320px' }}
          />
        )}
        {content && (
          <div
            className="rounded-2xl px-4 py-2.5 text-[14px] leading-5"
            style={
              isMine
                ? { background: '#0095f6', color: '#fff' }
                : { background: '#efefef', color: '#262626' }
            }
          >
            {content}
          </div>
        )}
        <span className="px-1 text-[11px]" style={{ color: '#8e8e8e' }}>
          {formatTime(time)}
        </span>
      </div>
    </div>
  );
}

// ─── ChatWindow ──────────────────────────────────────────────────────────────

function ChatWindow({ chatId, onBack }: { chatId: number; onBack: () => void }) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const chat = useAppSelector((s) => s.chat.chats.find((c) => c.id === chatId));
  const messages = useAppSelector((s) => s.chat.messages[chatId] ?? []);
  const isSending = useAppSelector((s) => s.chat.isSending);
  const isLoadingMessages = useAppSelector((s) => s.chat.isLoadingMessages);

  const [text, setText] = useState('');
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchChatMessages(chatId));
  }, [dispatch, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !preview) return;

    if (preview) {
      await dispatch(sendMediaMessage({ chatId, file: preview.file, content: trimmed || undefined }));
      setPreview(null);
    } else {
      await dispatch(sendMessage({ chatId, content: trimmed }));
    }
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview({ file, url: URL.createObjectURL(file) });
    e.target.value = '';
  };

  const name = chat ? getChatDisplayName(chat, currentUser?.id) : '';
  const avatar = chat ? getChatAvatar(chat, currentUser?.id) : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: '#dbdbdb', background: '#fff' }}
      >
        <button
          onClick={onBack}
          className="mr-1 flex items-center justify-center rounded-full p-1 text-text-primary transition-colors hover:bg-[#f0f0f0] md:hidden"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar src={avatar} alt={name} size="sm" />
        <div>
          <p className="text-[14px] font-semibold" style={{ color: '#262626' }}>
            {name}
          </p>
          {chat?.type === 'group' && (
            <p className="text-[12px]" style={{ color: '#8e8e8e' }}>
              {chat.participants.length} members
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: '#fff' }}>
        {isLoadingMessages ? (
          <div className="flex h-full items-center justify-center">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: '#dbdbdb', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                isMine={msg.senderId === currentUser?.id}
                content={msg.content}
                mediaUrl={msg.mediaUrl}
                time={msg.createdAt}
                senderName={msg.senderName}
                senderAvatar={msg.senderAvatar}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Image preview strip */}
      {preview && (
        <div
          className="flex items-center gap-2 border-t px-4 py-2"
          style={{ borderColor: '#dbdbdb', background: '#fafafa' }}
        >
          <div className="relative">
            <img
              src={preview.url}
              alt="preview"
              className="h-16 w-16 rounded-lg object-cover"
            />
            <button
              onClick={() => setPreview(null)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white"
              style={{ background: '#262626', border: 'none', cursor: 'pointer' }}
            >
              <X size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex items-center gap-2 border-t px-4 py-3"
        style={{ borderColor: '#dbdbdb', background: '#fff' }}
      >
        <button
          onClick={() => fileRef.current?.click()}
          className="flex shrink-0 items-center justify-center rounded-full p-2 transition-colors hover:bg-[#f0f0f0]"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#262626' }}
        >
          <ImagePlus size={22} />
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

        <div
          className="flex flex-1 items-center rounded-3xl px-4 py-2.5"
          style={{ background: '#efefef' }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-[14px] outline-none"
            style={{
              color: '#262626',
              fontFamily: 'inherit',
              lineHeight: '20px',
              maxHeight: '100px',
              overflowY: 'auto',
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={(!text.trim() && !preview) || isSending}
          className="flex shrink-0 items-center justify-center rounded-full p-2 transition-opacity"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: (!text.trim() && !preview) || isSending ? 'default' : 'pointer',
            color: (!text.trim() && !preview) || isSending ? '#b2dffc' : '#0095f6',
          }}
        >
          <Send size={22} />
        </button>
      </div>
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4" style={{ color: '#8e8e8e' }}>
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full"
        style={{ border: '2px solid #dbdbdb' }}
      >
        <MessageCircle size={48} strokeWidth={1} style={{ color: '#262626' }} />
      </div>
      <div className="text-center">
        <p className="text-[18px] font-semibold" style={{ color: '#262626' }}>
          Your messages
        </p>
        <p className="mt-1 text-[14px]" style={{ color: '#8e8e8e' }}>
          Send private photos and messages to a friend or group.
        </p>
      </div>
    </div>
  );
}

// ─── ChatPage ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const chats = useAppSelector((s) => s.chat.chats);
  const activeChatId = useAppSelector((s) => s.chat.activeChatId);
  const isLoadingChats = useAppSelector((s) => s.chat.isLoadingChats);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  useChatSignalR();

  useEffect(() => {
    console.log('Fetching user chats...');
    dispatch(fetchUserChats());
  }, [dispatch]);

  const handleSelectChat = useCallback(
    (chatId: number) => {
      dispatch(setActiveChatId(chatId));
      setMobileShowChat(true);
    },
    [dispatch],
  );

  const handleBack = useCallback(() => {
    setMobileShowChat(false);
  }, []);

  return (
    <div
      className="flex overflow-hidden rounded-none md:rounded-2xl md:border"
      style={{
        height: 'calc(100vh - 73px)',
        background: '#fff',
        borderColor: '#dbdbdb',
      }}
    >
      {/* ── Left Panel: Conversation List ── */}
      <div
        className={`flex h-full w-full flex-col border-r md:w-[360px] md:flex ${
          mobileShowChat ? 'hidden' : 'flex'
        }`}
        style={{ borderColor: '#dbdbdb', background: '#fff' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <h1 className="text-[18px] font-bold" style={{ color: '#262626' }}>
            {currentUser?.userName ?? 'Messages'}
          </h1>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {isLoadingChats ? (
            <div className="flex flex-col gap-3 px-3 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full" style={{ background: '#efefef' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded" style={{ background: '#efefef' }} />
                    <div className="h-3 w-48 rounded" style={{ background: '#efefef' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageCircle size={40} strokeWidth={1} style={{ color: '#8e8e8e' }} />
              <p className="mt-3 text-[14px]" style={{ color: '#8e8e8e' }}>
                No conversations yet
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <ConversationItem
                key={chat.id}
                chat={chat}
                isActive={activeChatId === chat.id}
                currentUserId={currentUser?.id}
                onClick={() => handleSelectChat(chat.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel: Chat Window ── */}
      <div
        className={`flex-1 ${mobileShowChat ? 'flex' : 'hidden md:flex'} h-full flex-col`}
        style={{ background: '#fff' }}
      >
        {activeChatId ? (
          <ChatWindow chatId={activeChatId} onBack={handleBack} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
