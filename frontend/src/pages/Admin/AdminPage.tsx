import { useState } from 'react';
import { useAppSelector } from '@/store';
import { AdminSidebar } from './components/AdminSidebar';
import { UserManagement } from './components/UserManagement';
import { ReportManagement } from './components/ReportManagement';
import { PostManagement } from './components/PostManagement';
import { ReportReasonManagement } from './components/ReportReasonManagement';

type AdminTab = 'users' | 'posts' | 'reports' | 'reportReasons';

export default function AdminPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  if (!user) return null;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #f8faff 0%, #f0f0ff 100%)' }}
    >
      <div className="p-5 flex flex-col md:flex-row gap-6 max-w-350 mx-auto">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 min-w-0">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'posts' && <PostManagement />}
          {activeTab === 'reports' && <ReportManagement />}
          {activeTab === 'reportReasons' && <ReportReasonManagement />}
        </div>
      </div>
    </div>
  );
}
