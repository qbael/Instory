import { ArrowUp } from 'lucide-react';

interface NewPostsBannerProps {
  visible: boolean;
  onRefresh: () => void;
}

export function NewPostsBanner({ visible, onRefresh }: NewPostsBannerProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onRefresh}
      className="sticky top-0 z-30 mx-auto mb-3 flex w-fit cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
    >
      <ArrowUp className="h-4 w-4" />
      New posts available
    </button>
  );
}
