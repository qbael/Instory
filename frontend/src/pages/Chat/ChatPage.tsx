import {useEffect, useRef, useState, useCallback} from 'react';
import {Send, ImagePlus, X, MessageCircle, ArrowLeft, Users, Search, Check} from 'lucide-react';
import {useAppDispatch, useAppSelector} from '@/store';
import {
    fetchUserChats,
    fetchChatMessages,
    sendMessage,
    sendMediaMessage,
    setActiveChatId,
} from '@/store/slices/chatSlice';
import {useChatSignalR} from '@/hooks/useChatSignalR';
import {Avatar} from '@/components/ui/Avatar';
import {chatService} from '@/services/chatService';
import type {Chat, Friend} from '@/types/chat';
import {Link} from "react-router";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return formatTime(iso);
    if (days === 1) return 'Hôm qua';
    if (days < 7)
        return d.toLocaleDateString('vi-VN', {weekday: 'short'});
    return d.toLocaleDateString('vi-VN', {month: 'short', day: 'numeric'});
}

function getChatDisplayName(chat: Chat, currentUserId: number | undefined) {
    if (chat.type === 'Group') return chat.name ?? 'Nhóm chat';
    const other = chat.participants.find((p) => p.userId !== currentUserId);
    return other?.fullName ?? 'Người dùng không xác định';
}

function getChatUsername(chat: Chat, currentUserId: number | undefined) {
    if (chat.type === 'Group') return null;
    const other = chat.participants.find((p) => p.userId !== currentUserId);
    return other?.username ? `${other.username}` : null;
}

function getChatAvatar(chat: Chat, currentUserId: number | undefined) {
    if (chat.type === 'Group') return null;
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
            style={{border: 'none', background: isActive ? '#f0f0f0' : 'transparent', cursor: 'pointer'}}
        >
            <div className="relative shrink-0">
                <Avatar src={avatar} alt={name} size="md"/>
                <span
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
                    style={{background: '#3fc14c'}}
                />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
          <span
              className="truncate text-[14px] font-semibold"
              style={{color: '#262626'}}
          >
            {name}
          </span>
                    {lastMsg && (
                        <span className="ml-2 shrink-0 text-[11px]" style={{color: '#8e8e8e'}}>
              {formatDate(lastMsg.createdAt)}
            </span>
                    )}
                </div>
                {lastMsg && (
                    <p className="truncate text-[13px]" style={{color: '#8e8e8e'}}>
                        {lastMsg.content ?? (lastMsg.mediaUrl ? '📷 Ảnh' : '')}
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
                <Avatar src={senderAvatar} alt={senderName ?? ''} size="xs"/>
            )}
            <div
                className={`flex max-w-[65%] flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}
            >
                {!isMine && (
                    <p className="px-1 text-[10px] font-semibold" style={{color: '#262626'}}>
                        {senderName}
                    </p>
                )}
                {mediaUrl && (
                    <img
                        src={mediaUrl}
                        alt="Nội dung đính kèm"
                        className="rounded-2xl object-cover shadow-sm"
                        style={{maxWidth: '260px', maxHeight: '320px'}}
                    />
                )}
                {content && (
                    <div
                        className="rounded-2xl px-4 py-2.5 text-[14px] leading-5"
                        style={
                            isMine
                                ? {background: '#0095f6', color: '#fff'}
                                : {background: '#efefef', color: '#262626'}
                        }
                    >
                        {content}
                    </div>
                )}
                <span className="px-1 text-[11px]" style={{color: '#8e8e8e'}}>
          {formatTime(time)}
        </span>
            </div>
        </div>
    );
}

// ─── ChatWindow ──────────────────────────────────────────────────────────────

function ChatWindow({chatId, onBack}: { chatId: number; onBack: () => void }) {
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
        bottomRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed && !preview) return;

        if (preview) {
            await dispatch(sendMediaMessage({chatId, file: preview.file, content: trimmed || undefined}));
            setPreview(null);
        } else {
            await dispatch(sendMessage({chatId, content: trimmed}));
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
        setPreview({file, url: URL.createObjectURL(file)});
        e.target.value = '';
    };
 
    const username = chat ? getChatUsername(chat, currentUser?.id) : null;
    const name = chat ? getChatDisplayName(chat, currentUser?.id) : '';
    const avatar = chat ? getChatAvatar(chat, currentUser?.id) : null;

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div
                className="flex items-center gap-3 border-b px-4 py-3"
                style={{borderColor: '#dbdbdb', background: '#fff'}}
            >
                <button
                    onClick={onBack}
                    className="mr-1 flex items-center justify-center rounded-full p-1 text-text-primary transition-colors hover:bg-[#f0f0f0] md:hidden"
                    style={{border: 'none', background: 'transparent', cursor: 'pointer'}}
                >
                    <ArrowLeft size={20}/>
                </button>
                <Avatar src={avatar} alt={name} size="sm"/>
                <div>
                    <Link
                        to={`/profile/${username}`}
                        className="block truncate text-sm font-semibold text-text-primary no-underline hover:underline w-fit"
                    >
                        <p className="text-[14px] font-semibold" style={{color: '#262626'}}>
                            {name}
                        </p>
                    </Link>
                    {chat?.type === 'Group' && (
                        <p className="text-[12px]" style={{color: '#8e8e8e'}}>
                            {chat.participants.length} thành viên
                        </p>
                    )}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-4" style={{background: '#fff'}}>
                {isLoadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                        <div
                            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                            style={{borderColor: '#dbdbdb', borderTopColor: 'transparent'}}
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
                        <div ref={bottomRef}/>
                    </div>
                )}
            </div>

            {/* Image preview strip */}
            {preview && (
                <div
                    className="flex items-center gap-2 border-t px-4 py-2"
                    style={{borderColor: '#dbdbdb', background: '#fafafa'}}
                >
                    <div className="relative">
                        <img
                            src={preview.url}
                            alt="Xem trước"
                            className="h-16 w-16 rounded-lg object-cover"
                        />
                        <button
                            onClick={() => setPreview(null)}
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white"
                            style={{background: '#262626', border: 'none', cursor: 'pointer'}}
                        >
                            <X size={10}/>
                        </button>
                    </div>
                </div>
            )}

            {/* Input bar */}
            <div
                className="flex items-center gap-2 border-t px-4 py-3"
                style={{borderColor: '#dbdbdb', background: '#fff'}}
            >
                <button
                    onClick={() => fileRef.current?.click()}
                    className="flex shrink-0 items-center justify-center rounded-full p-2 transition-colors hover:bg-[#f0f0f0]"
                    style={{border: 'none', background: 'transparent', cursor: 'pointer', color: '#262626'}}
                >
                    <ImagePlus size={22}/>
                </button>
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile}/>

                <div
                    className="flex flex-1 items-center rounded-3xl px-4 py-2.5"
                    style={{background: '#efefef'}}
                >
          <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn…"
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
                    <Send size={22}/>
                </button>
            </div>
        </div>
    );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4" style={{color: '#8e8e8e'}}>
            <div
                className="flex h-24 w-24 items-center justify-center rounded-full"
                style={{border: '2px solid #dbdbdb'}}
            >
                <MessageCircle size={48} strokeWidth={1} style={{color: '#262626'}}/>
            </div>
            <div className="text-center">
                <p className="text-[18px] font-semibold" style={{color: '#262626'}}>
                    Tin nhắn của bạn
                </p>
                <p className="mt-1 text-[14px]" style={{color: '#8e8e8e'}}>
                    Gửi ảnh và tin nhắn riêng tư cho bạn bè hoặc nhóm.
                </p>
            </div>
        </div>
    );
}

// ─── CreateGroupChatModal ────────────────────────────────────────────────────

function CreateGroupChatModal({
                                  isOpen,
                                  onClose,
                                  onCreated,
                              }: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (chatId: number) => void;
}) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [groupName, setGroupName] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        chatService
            .getFriends()
            .then((res) => setFriends(res.data))
            .catch(() => {
            })
            .finally(() => setLoading(false));
        return () => {
            setSelected(new Set());
            setGroupName('');
            setSearch('');
        };
    }, [isOpen]);

    const filtered = friends.filter((f) => {
        const q = search.toLowerCase();
        return (
            (f.fullName?.toLowerCase().includes(q) ?? false) ||
            (f.userName?.toLowerCase().includes(q) ?? false)
        );
    });

    const toggle = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selected.size < 1) return;
        setCreating(true);
        try {
            const {data} = await chatService.createGroupChat(
                groupName.trim(),
                Array.from(selected),
            );
            onCreated(data.id);
            onClose();
        } catch {
            /* ignore */
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl"
                style={{background: '#fff', maxHeight: '80vh'}}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between border-b px-5 py-4"
                    style={{borderColor: '#dbdbdb'}}
                >
                    <h2 className="text-[16px] font-bold" style={{color: '#262626'}}>
                        Tạo nhóm chat
                    </h2>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#f0f0f0]"
                        style={{border: 'none', background: 'transparent', cursor: 'pointer'}}
                    >
                        <X size={18}/>
                    </button>
                </div>

                {/* Group name */}
                <div className="border-b px-5 py-3" style={{borderColor: '#efefef'}}>
                    <input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Tên nhóm"
                        className="w-full rounded-xl px-4 py-2.5 text-[14px] outline-none"
                        style={{background: '#fafafa', border: '1px solid #dbdbdb', color: '#262626'}}
                    />
                </div>

                {/* Search */}
                <div className="border-b px-5 py-3" style={{borderColor: '#efefef'}}>
                    <div
                        className="flex items-center gap-2 rounded-xl px-3 py-2"
                        style={{background: '#fafafa', border: '1px solid #dbdbdb'}}
                    >
                        <Search size={16} style={{color: '#8e8e8e'}}/>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm bạn bè…"
                            className="flex-1 bg-transparent text-[14px] outline-none"
                            style={{color: '#262626', border: 'none'}}
                        />
                    </div>
                </div>

                {/* Selected chips */}
                {selected.size > 0 && (
                    <div
                        className="flex flex-wrap gap-1.5 border-b px-5 py-2.5"
                        style={{borderColor: '#efefef'}}
                    >
                        {Array.from(selected).map((id) => {
                            const f = friends.find((fr) => fr.id === id);
                            if (!f) return null;
                            return (
                                <span
                                    key={id}
                                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium"
                                    style={{background: '#e8f0fe', color: '#0095f6'}}
                                >
                  {f.fullName ?? f.userName}
                                    <button
                                        onClick={() => toggle(id)}
                                        className="ml-0.5 flex items-center justify-center"
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            color: '#0095f6'
                                        }}
                                    >
                    <X size={12}/>
                  </button>
                </span>
                            );
                        })}
                    </div>
                )}

                {/* Friends list */}
                <div className="flex-1 overflow-y-auto px-2 py-2" style={{minHeight: '200px'}}>
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <div
                                className="h-7 w-7 animate-spin rounded-full border-2 border-t-transparent"
                                style={{borderColor: '#dbdbdb', borderTopColor: 'transparent'}}
                            />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="py-10 text-center text-[14px]" style={{color: '#8e8e8e'}}>
                            {search ? 'Không tìm thấy bạn bè' : 'Chưa có bạn bè nào'}
                        </p>
                    ) : (
                        filtered.map((f) => {
                            const isChecked = selected.has(f.id);
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => toggle(f.id)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#f7f7f7]"
                                    style={{border: 'none', background: 'transparent', cursor: 'pointer'}}
                                >
                                    <Avatar src={f.avatarUrl} alt={f.fullName ?? ''} size="md"/>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[14px] font-semibold" style={{color: '#262626'}}>
                                            {f.fullName ?? 'Người dùng'}
                                        </p>
                                        {f.userName && (
                                            <p className="truncate text-[12px]" style={{color: '#8e8e8e'}}>
                                                @{f.userName}
                                            </p>
                                        )}
                                    </div>
                                    <div
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                                        style={
                                            isChecked
                                                ? {background: '#0095f6', borderColor: '#0095f6'}
                                                : {background: '#fff', borderColor: '#dbdbdb'}
                                        }
                                    >
                                        {isChecked && <Check size={14} style={{color: '#fff'}}/>}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="border-t px-5 py-4" style={{borderColor: '#dbdbdb'}}>
                    <button
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selected.size < 1 || creating}
                        className="w-full rounded-xl py-2.5 text-[14px] font-semibold transition-opacity"
                        style={{
                            background: !groupName.trim() || selected.size < 1 ? '#b2dffc' : '#0095f6',
                            color: '#fff',
                            border: 'none',
                            cursor: !groupName.trim() || selected.size < 1 || creating ? 'default' : 'pointer',
                            opacity: creating ? 0.7 : 1,
                        }}
                    >
                        {creating ? 'Đang tạo…' : `Tạo nhóm (${selected.size} thành viên)`}
                    </button>
                </div>
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
    const [showCreateGroup, setShowCreateGroup] = useState(false);

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

    const handleGroupCreated = useCallback(
        (chatId: number) => {
            dispatch(fetchUserChats());
            dispatch(setActiveChatId(chatId));
            setMobileShowChat(true);
        },
        [dispatch],
    );

    return (
        <div
            className="flex overflow-hidden rounded-none md:rounded-2xl md:border"
            style={{
                height: 'calc(100vh - 73px)',
                background: '#fff',
                borderColor: '#dbdbdb',
            }}
        >
            <div
                className={`flex h-full w-full flex-col border-r md:w-[360px] md:flex ${
                    mobileShowChat ? 'hidden' : 'flex'
                }`}
                style={{borderColor: '#dbdbdb', background: '#fff'}}
            >
                <div className="flex items-center justify-between px-6 py-5">
                    <h1 className="text-[18px] font-bold" style={{color: '#262626'}}>
                        {currentUser?.userName ?? 'Tin nhắn'}
                    </h1>
                    <button
                        onClick={() => setShowCreateGroup(true)}
                        title="Tạo nhóm chat"
                        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#f0f0f0]"
                        style={{border: 'none', background: 'transparent', cursor: 'pointer', color: '#262626'}}
                    >
                        <Users size={20}/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-4">
                    {isLoadingChats ? (
                        <div className="flex flex-col gap-3 px-3 pt-2">
                            {Array.from({length: 5}).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                    <div className="h-10 w-10 rounded-full" style={{background: '#efefef'}}/>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-32 rounded" style={{background: '#efefef'}}/>
                                        <div className="h-3 w-48 rounded" style={{background: '#efefef'}}/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <MessageCircle size={40} strokeWidth={1} style={{color: '#8e8e8e'}}/>
                            <p className="mt-3 text-[14px]" style={{color: '#8e8e8e'}}>
                                Chưa có cuộc trò chuyện
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

            <div
                className={`flex-1 ${mobileShowChat ? 'flex' : 'hidden md:flex'} h-full flex-col`}
                style={{background: '#fff'}}
            >
                {activeChatId ? (
                    <ChatWindow chatId={activeChatId} onBack={handleBack}/>
                ) : (
                    <EmptyState/>
                )}
            </div>

            <CreateGroupChatModal
                isOpen={showCreateGroup}
                onClose={() => setShowCreateGroup(false)}
                onCreated={handleGroupCreated}
            />
        </div>
    );
}
