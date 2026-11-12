import { configureStore } from "@reduxjs/toolkit";
import sessionReducer from "./slices/sessionSlice";
import uiPrefsReducer from "./slices/uiPrefsSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      session: sessionReducer,
      uiPrefs: uiPrefsReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
