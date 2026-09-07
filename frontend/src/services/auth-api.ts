import api from "../lib/api";
import type { User } from "../context/auth-context";

/** Login and get token */
export async function login(
  email: string,
  password: string,
): Promise<{ user: User; token: string; message: string }> {
  const response = await api.post<{
    user: User;
    token: string;
    message: string;
  }>("/login", { email, password });
  return response.data;
}

/** Register a new user */
export async function register(
  name: string,
  email: string,
  password: string,
  password_confirmation: string,
): Promise<{ user: User; token: string; message: string }> {
  const response = await api.post<{
    user: User;
    token: string;
    message: string;
  }>("/register", {
    name,
    email,
    password,
    password_confirmation,
    terms: true,
  });
  return response.data;
}

/** Get current user */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<{ user: User }>("/user");
  return response.data.user;
}

/** Logout */
export async function logout(): Promise<void> {
  await api.post("/logout");
}
