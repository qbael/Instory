import React from "react";

interface MenuToggleItemProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

export default function MenuToggleItem({
  label,
  checked,
  onChange,
}: MenuToggleItemProps) {
  return (
    <label 
      className="flex cursor-pointer items-center justify-between rounded-lg transition-colors hover:bg-gray-50"
    >
      <span 
        className={`text-sm font-medium transition-colors select-none ${
          checked ? "text-gray-900" : "text-gray-600"
        }`}
      >
        {label}
      </span>

      <div className="relative flex items-center">
        {/* Input gốc bị ẩn đi (sr-only) nhưng vẫn nhận các sự kiện click/keyboard từ thẻ <label> */}
        <input 
          type="checkbox" 
          className="peer sr-only" 
          checked={checked} 
          onChange={onChange} 
        />
        
        {/* Giao diện nút gạt ảo, sử dụng 'peer' của Tailwind để bắt trạng thái focus từ thẻ input ở trên */}
        <div
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out 
            focus:outline-none 
            peer-focus-visible:ring-2 
            peer-focus-visible:ring-[var(--color-accent)]
            peer-focus-visible:ring-offset-2

            ${checked ? "bg-[var(--color-accent)]" : "bg-gray-200"}
          `}
        >
          <span
            className={`
              inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 
              transition duration-200 ease-in-out
              ${checked ? "translate-x-5" : "translate-x-0"}
            `}
          />
        </div>
      </div>
    </label>
  );
}