import { useEffect } from 'react';
import { fetchMe, refreshSessionRequest } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';

/** Restores a session exclusively from the server's httpOnly cookies. */
export function AuthSessionRestorer() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const finishRestoring = useAuthStore((state) => state.finishRestoring);

  useEffect(() => {
    let isMounted = true;

    async function restore() {
      try {
        const user = await fetchMe();
        if (isMounted) setAuth(user, '');
      } catch {
        try {
          const accessToken = await refreshSessionRequest();
          const user = await fetchMe();
          if (isMounted) setAuth(user, accessToken);
        } catch {
          if (isMounted) logout();
          return;
        }
      }

      if (isMounted) finishRestoring();
    }

    void restore();
    return () => { isMounted = false; };
  }, [finishRestoring, logout, setAuth]);

  return null;
}
