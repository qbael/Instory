import { createContext, useContext } from 'react';

interface SignalRContextValue {
  hasNewPosts: boolean;
  dismissNewPosts: () => void;
}

export const SignalRContext = createContext<SignalRContextValue>({
  hasNewPosts: false,
  dismissNewPosts: () => {},
});

export function useSignalRContext() {
  return useContext(SignalRContext);
}
