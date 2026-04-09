import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { RightPanel } from './RightPanel';
import { PostCreator } from '@/components/post/PostCreator';
import { useSignalR } from '@/hooks/useSignalR';
import { SignalRContext } from '@/hooks/useSignalRContext';

export function AppLayout() {
  const signalR = useSignalR();

  return (
    <SignalRContext.Provider value={signalR}>
      <div className="min-h-screen bg-bg">
        <TopBar />
        <Sidebar />

        <div className="pb-14 md:pb-0 md:pl-[72px] lg:pl-[220px]">
          <div className="mx-auto flex max-w-[935px] justify-center gap-0 px-4 pt-4 md:px-5 md:pt-8">
            <main className="w-full max-w-[630px]">
              <Outlet />
            </main>
            <RightPanel />
          </div>
        </div>

        <MobileNav />
        <PostCreator />
      </div>
    </SignalRContext.Provider>
  );
}
