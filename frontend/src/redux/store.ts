import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";

/**
 * Redux store — add feature slices here as the project grows.
 *
 * Example:
 *   import userReducer from "@/features/auth/userSlice";
 *   reducer: { user: userReducer }
 */
export const store = configureStore({
  reducer: {
    // Add slices here
  },
});

// Infer types from the store itself so they stay in sync automatically
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Pre-typed hooks — use these instead of plain useDispatch/useSelector
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
