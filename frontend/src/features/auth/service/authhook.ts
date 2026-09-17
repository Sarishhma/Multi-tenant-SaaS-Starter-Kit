import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "./authservice";
import type { LoginFormData, SignupFormData } from "../schema/auth.schema";

/**
 * React Query hook for fetching the current user profile.
 * Automatically refetches when the window regains focus.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.getProfile,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query mutation for login.
 * On success, stores the token and invalidates the user query.
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginFormData) => authService.login(data),
    onSuccess: (response) => {
      localStorage.setItem("auth_token", response.token);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

/**
 * React Query mutation for signup.
 * On success, stores the token and invalidates the user query.
 */
export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<SignupFormData, "confirmPassword">) =>
      authService.signup(data),
    onSuccess: (response) => {
      localStorage.setItem("auth_token", response.token);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

/**
 * React Query mutation for logout.
 * Clears the user cache and removes the stored token.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
