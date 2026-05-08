import React, { useState, useEffect } from 'react';
import type { PostImage } from '@/types';

interface LightboxProps {
  images: PostImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ images, initialIndex = 0, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Ngưỡng tối thiểu để tính là một cú vuốt (pixel)
  const minSwipeDistance = 50;

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, initialIndex]);

  // Xử lý điều hướng
  const handleNext = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  // Logic xử lý Vuốt (Swipe)
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
  };

  if (!isOpen || !images.length) return null;

  const currentImgSrc = images[currentIndex].imageUrl;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black select-none touch-none"
      style={{ height: '100dvh' }} // Sử dụng dvh để full màn hình mobile chuẩn xác
      onClick={onClose}
    >
      {/* Header: Chỉ số và Nút đóng (Thiết kế to hơn cho ngón tay) */}
      <div className="absolute top-0 w-full flex justify-between items-center p-4 z-20 bg-gradient-to-b from-black/60 to-transparent">
        <span className="text-white font-medium drop-shadow-md">
          {currentIndex + 1} / {images.length}
        </span>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-white cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Khu vực ảnh & Vuốt */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          key={currentIndex}
          src={currentImgSrc}
          alt="Lightbox"
          className="max-h-full max-w-full object-contain animate-in fade-in zoom-in duration-300"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Nút điều hướng (Ẩn trên mobile nhỏ, chỉ hiện trên PC hoặc Tablet) */}
      <div className="hidden sm:block">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 cursor-pointer"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 cursor-pointer"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      
      {/* Tip nhỏ cho người dùng trên mobile */}
      <div className="absolute bottom-6 text-white/50 text-xs sm:hidden pointer-events-none">
        Vuốt sang trái hoặc phải để chuyển ảnh
      </div>
    </div>
  );
};

export default Lightbox;