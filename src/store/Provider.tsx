"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { makeStore, type AppStore } from "./index";
import { SessionBootstrap } from "@/modules/identity/components/SessionBootstrap";
import { SignedInRouteGuard } from "@/modules/identity/components/SignedInRouteGuard";
import { AutoPlaceOnLogin } from "@/modules/location/AutoPlaceOnLogin";
import { ThemeLanguageSync } from "@/modules/layout/ThemeLanguageSync";
import { CookieConsent } from "@/modules/layout/CookieConsent";
import { ToastProvider } from "@/shared/toast/ToastProvider";
import { ConfirmProvider } from "@/shared/confirm/ConfirmProvider";
import { OfflineBanner } from "@/shared/ui/OfflineBanner";
import { SocketProvider } from "@/modules/chat/SocketProvider";
import { PushRegistrar } from "@/modules/notifications/PushRegistrar";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  const tree = (
    <Provider store={storeRef.current}>
      <ToastProvider>
        <ConfirmProvider>
          <SocketProvider>
            <SessionBootstrap />
            <SignedInRouteGuard />
            <ThemeLanguageSync />
            <AutoPlaceOnLogin />
            <PushRegistrar />
            <CookieConsent />
            <OfflineBanner />
            {children}
          </SocketProvider>
        </ConfirmProvider>
      </ToastProvider>
    </Provider>
  );

  if (!googleClientId) return tree;
  return <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>;
}
