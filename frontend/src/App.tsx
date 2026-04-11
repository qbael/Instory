import { useEffect } from 'react';
import { Toaster } from 'sonner';
import AppRouter from '@/router/AppRouter';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCurrentUser } from '@/store/slices/authSlice';

export default function App() {
  const dispatch = useAppDispatch();
  const { isInitialized } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isInitialized) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isInitialized]);

  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        richColors
        expand={false}
        duration={3000}
        toastOptions={{
          style: {
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
          },
        }}
      />
    </>
  );
}
