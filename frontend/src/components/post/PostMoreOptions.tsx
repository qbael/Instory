import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import MenuToggleItem from "./MenuToggleItem";
interface PostMorOptionsProps {
    allowComment: boolean,
    onToggleAllowComment: () => void,
}
export default function PostMoreOptions({
allowComment,
onToggleAllowComment
}:PostMorOptionsProps) {
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setOpen(prev => !prev);
  };

//   const handleToggleAllowComment = () => {
//     setAllowComment(prev => !prev);
//   };

  // click outside -> close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* button 3 dots */}
      <button
        type="button"
        onClick={toggleMenu}
        className="rounded-full p-2 hover:bg-gray-100 cursor-pointer"
      >
        <MoreHorizontal size={20} />
      </button>

      {/* dropdown */}
      {open && (
        <div className="absolute right-0 top-7 z-50 w-72 rounded-xl border bg-white p-3 shadow-lg ">
          <MenuToggleItem
            label="Cho phép bình luận"
            checked={allowComment}
            onChange={onToggleAllowComment}
          />
        </div>
      )}
    </div>
  );
}

