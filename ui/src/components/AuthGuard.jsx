import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import useBoundStore from '../stores';

function AuthGuard({ children }) {
  const navigate = useNavigate();
  const token = useBoundStore((state) => state.token);
  const setUser = useBoundStore((state) => state.setUser);
  const setToken = useBoundStore((state) => state.setToken);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useBoundStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    if (useBoundStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => unsub();
  }, []);

  useEffect(() => {
    if (hydrated && !token) {
      setUser(null);
      setToken(null);
      useBoundStore.persist.clearStorage();
      navigate('/auth/login', { replace: true });
    } else {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error?.response?.status === 401) {
            setUser(null);
            setToken(null);
            useBoundStore.persist.clearStorage();
            navigate('/auth/login', { replace: true });
          }
          return Promise.reject(error);
        }
      );
    }
  }, [hydrated, token]);

  if (hydrated && token) {
    return children;
  } else {
    return <></>;
  }
}

export default AuthGuard;
