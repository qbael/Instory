import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import AppRouter from '@/router/AppRouter';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCurrentUser } from '@/store/slices/authSlice';

export default function App() {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, user]);

  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#262626',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#58C322', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ED4956', secondary: '#fff' },
          },
        }}
      />
    </>
  );
}
