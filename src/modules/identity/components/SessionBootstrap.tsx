"use client";

import { useEffect } from "react";
import type { AppDispatch } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { bootstrapSession, setSession } from "@/store/slices/sessionSlice";
import { identityApi } from "@/modules/identity/api";
import { sessionCookies } from "@/shared/cookies";

async function silentRefresh(dispatch: AppDispatch) {
  const storedRefresh = sessionCookies.getRefreshToken();
  try {
    const refreshed = await identityApi.refresh(storedRefresh || undefined);
    if (!refreshed.data?.account || !refreshed.data.accessToken) return;
    dispatch(
      setSession({
        account: refreshed.data.account,
        accessToken: refreshed.data.accessToken,
        refreshToken: refreshed.data.refreshToken || storedRefresh || undefined,
      }),
    );
  } catch {
    // keep current tokens; next protected call will surface auth errors
  }
}

export function SessionBootstrap() {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((s) => s.session.hydrated);
  const account = useAppSelector((s) => s.session.account);

  useEffect(() => {
    if (!hydrated) {
      void dispatch(bootstrapSession());
    }
  }, [dispatch, hydrated]);

  useEffect(() => {
    if (!account || !hydrated) return;

    if (!sessionCookies.getAccessToken() && sessionCookies.getRefreshToken()) {
      void silentRefresh(dispatch);
    }

    const onFocus = () => {
      if (!sessionCookies.getAccessToken() && sessionCookies.getRefreshToken()) {
        void silentRefresh(dispatch);
      }
    };
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(() => void silentRefresh(dispatch), 12 * 60 * 60 * 1000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [account, hydrated, dispatch]);

  return null;
}
