import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { identityApi } from "@/modules/identity/api";
import type { PublicAccount } from "@/modules/identity/types";
import { sessionCookies } from "@/shared/cookies";

export type SessionState = {
  account: PublicAccount | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  hydrated: boolean;
  authBusy: boolean;
};

const initialState: SessionState = {
  account: null,
  status: "idle",
  error: null,
  hydrated: false,
  authBusy: false,
};

export const bootstrapSession = createAsyncThunk(
  "session/bootstrap",
  async () => {
    const access = sessionCookies.getAccessToken();
    const refresh = sessionCookies.getRefreshToken();

    // 1) Existing access token → /me
    if (access) {
      try {
        const account = await identityApi.me(access);
        sessionCookies.saveAccount(account);
        return { account };
      } catch {
        // try refresh below
      }
    }

    // 2) Refresh with stored refresh token (body) — works even when httpOnly cookie is missing
    if (refresh) {
      try {
        const refreshed = await identityApi.refresh(refresh);
        if (refreshed.data?.account && refreshed.data.accessToken) {
          sessionCookies.saveSession(
            refreshed.data.account,
            refreshed.data.accessToken,
            refreshed.data.refreshToken || refresh,
          );
          return { account: refreshed.data.account };
        }
      } catch {
        // try cookie-only refresh
      }
    }

    // 3) Refresh via httpOnly cookie only
    try {
      const refreshed = await identityApi.refresh();
      if (refreshed.data?.account && refreshed.data.accessToken) {
        sessionCookies.saveSession(
          refreshed.data.account,
          refreshed.data.accessToken,
          refreshed.data.refreshToken,
        );
        return { account: refreshed.data.account };
      }
    } catch {
      // no session
    }

    // No recoverable session
    sessionCookies.clear();
    return { account: null as PublicAccount | null };
  },
);

export const signOut = createAsyncThunk("session/signOut", async () => {
  try {
    await identityApi.logout(sessionCookies.getAccessToken());
  } catch {
    // ignore
  }
  sessionCookies.clear();
});

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSession(
      state,
      action: PayloadAction<{
        account: PublicAccount;
        accessToken?: string;
        refreshToken?: string;
      }>,
    ) {
      state.account = action.payload.account;
      state.status = "ready";
      state.error = null;
      sessionCookies.saveSession(
        action.payload.account,
        action.payload.accessToken,
        action.payload.refreshToken,
      );
    },
    setAccount(state, action: PayloadAction<PublicAccount>) {
      state.account = action.payload;
      sessionCookies.saveAccount(action.payload);
    },
    setAuthBusy(state, action: PayloadAction<boolean>) {
      state.authBusy = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        state.status = "loading";
        // Keep cached account during hydrate so RequireAuth does not flash-redirect
        if (!state.account) {
          state.account = sessionCookies.getAccount();
        }
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.account = action.payload.account;
        state.status = "ready";
        state.hydrated = true;
        state.error = null;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.account = null;
        state.status = "ready";
        state.hydrated = true;
        state.error = null;
      })
      .addCase(signOut.pending, (state) => {
        state.authBusy = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.account = null;
        state.authBusy = false;
        state.status = "ready";
        state.error = null;
      })
      .addCase(signOut.rejected, (state) => {
        state.account = null;
        state.authBusy = false;
      });
  },
});

export const { setSession, setAccount, setAuthBusy, clearError } = sessionSlice.actions;
export default sessionSlice.reducer;
