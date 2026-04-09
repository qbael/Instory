const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();

  if (diff < MINUTE) return 'vừa xong';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} phút`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} giờ`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)} ngày`;

  return new Date(dateString).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric',
    year:
      new Date(dateString).getFullYear() !== new Date().getFullYear()
        ? 'numeric'
        : undefined,
  });
}

export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
