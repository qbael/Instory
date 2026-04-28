import React, { useState } from 'react';
import { postService } from '../../services/postService';
import type { Post } from '@/types';
import { formatFullDate } from '@/utils/formatDate';
import { toast } from 'sonner';

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onSuccess?: () => void;
}

const SharePostModal: React.FC<SharePostModalProps> = ({ 
  isOpen, 
  onClose, 
  post,
  onSuccess 
}) => {
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nếu Modal không mở thì không render gì cả
  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await postService.share(post.id, caption);
      
      // Reset form
      toast.success("Chia sẻ thành công");
      setCaption('');
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.detail || 
        "Lỗi hệ thống khi báo cáo bài viết";

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div 
      // Lớp phủ (Overlay): Căn đáy trên Mobile (items-end), căn giữa trên PC (sm:items-center)
      className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-black/60 sm:items-center sm:p-4 pb-0"
      onClick={(e) => {
        // Đóng Modal khi click ra ngoài vùng xám
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Khung nội dung Modal */}
      <div className="flex flex-col w-full max-w-lg bg-white shadow-2xl rounded-t-2xl sm:rounded-xl max-h-[85dvh] sm:max-h-[90dvh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 shrink-0">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Chia sẻ bài viết</h3>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-gray-500 transition-colors bg-gray-100 rounded-full hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {/* Thông tin người dùng đang chia sẻ */}
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm sm:font-semibold">
              Bạn
            </div>
            <div>
              <p className="font-semibold text-sm sm:text-base text-gray-900">Đang chia sẻ bài viết</p>
              <p className="text-xs text-gray-500">{formatFullDate(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Caption input */}
          <textarea
            className="w-full min-h-[60px] sm:min-h-[80px] text-sm sm:text-base bg-transparent border-none outline-none resize-none placeholder-gray-400 focus:ring-0 text-gray-700"
            placeholder="Hãy nói gì đó về nội dung này..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={isSubmitting}
            autoFocus={window.innerWidth > 640}            
          />
          
          {/* Box xem trước bài viết gốc */}
          <div className="mt-3 sm:mt-4 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
            {/* Thông tin người đăng bài gốc */}
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-b border-gray-200">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs sm:text-sm font-medium">
                {post.user?.userName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-xs sm:text-sm text-gray-900">{post.user?.userName || 'Người dùng'}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">{formatFullDate(post.createdAt)}</p>
              </div>
            </div>

            {/* Nội dung bài viết gốc */}
            <div className="p-2 sm:p-3">
              {post.content && (
                <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap mb-1 sm:mb-2">{post.content}</p>
              )}
              
              {/* Hình ảnh bài viết gốc */}
              {post.images && post.images.length > 0 && (
                <div className={`grid gap-0.5 sm:gap-1 mt-1 sm:mt-2 ${
                  post.images.length === 1 ? 'grid-cols-1' :
                  post.images.length === 2 ? 'grid-cols-2' :
                  'grid-cols-2'
                }`}>
                  {post.images.slice(0, 4).map((img, idx) => (
                    <div key={img.id} className="relative aspect-square bg-gray-200 rounded-md sm:rounded-lg overflow-hidden">
                      <img 
                        src={img.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                      {idx === 3 && post.images.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm sm:text-lg">+{post.images.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Hashtags */}
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
                  {post.hashtags.map((tag, idx) => (
                    <span key={idx} className="text-blue-500 text-xs sm:text-sm">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Thống kê */}
            <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-3 py-1.5 sm:py-2 border-t border-gray-200 text-[10px] sm:text-xs text-gray-500">
              <span>{post.likesCount} thích</span>
              <span>{post.commentsCount} bình luận</span>
              <span>{post.sharesCount} chia sẻ</span>
            </div>
          </div>

          {/* Error message */}
          {/* {error && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs sm:text-sm text-red-600">{error}</p>
            </div>
          )} */}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 sm:gap-3 p-3 sm:p-4 pt-2 sm:pt-4 border-t border-gray-100 shrink-0 bg-white">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang chia sẻ...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Chia sẻ
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SharePostModal;