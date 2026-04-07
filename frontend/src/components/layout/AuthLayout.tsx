import { Outlet } from 'react-router';
import { Camera } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Left branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-[420px] flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-accent p-12 text-white">
        <Camera className="mb-5 h-16 w-16 opacity-90" />
        <h1 className="mb-2 text-4xl font-extrabold tracking-tight">Instory</h1>
        <p className="max-w-[260px] text-center text-base leading-relaxed opacity-80">
          Share your stories, connect with friends, and discover the world around you.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <Camera className="mb-2 h-10 w-10 text-primary" />
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
              Instory
            </h1>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
