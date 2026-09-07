import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

import api from "../api";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  terms: boolean;
}

interface RegisterResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  token: string;
}

interface ValidationErrors {
  [key: string]: string[];
}

function Register() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    terms: false,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post<RegisterResponse>("/register", form);
      setMessage(response.data.message);
      setForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        terms: false,
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: unknown) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 422) {
          const errors = error.response.data.errors as ValidationErrors;
          const messages = Object.values(errors).flat();
          setError(messages.join("\n"));
        } else {
          setError(error.response?.data?.message || "مشکلی پیش آمده است");
        }
      } else {
        setError("مشکلی پیش آمده است");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12"
    >
      {/* ── Animated gradient background ── */}
      <div className="absolute inset-0 bg-linear-to-bl from-[#eef2ff] via-[#f3e8ff] to-[#f0fdfa]" />

      {/* Floating orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-125 w-125 rounded-full bg-blue-400/20 blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 -left-20 h-100 w-100 rounded-full bg-violet-400/20 blur-[80px] animate-pulse [animation-delay:1s]" />
        <div className="absolute -bottom-20 right-1/3 h-87.5 w-87.5 rounded-full bg-emerald-400/15 blur-[80px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 h-62.5 w-62.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300/10 blur-[60px] animate-pulse [animation-delay:3s]" />
      </div>

      {/* ── Glass card ── */}
      <div className="relative z-10 w-full max-w-md">
        <div
          className="rounded-3xl border border-white/50 p-6 shadow-2xl shadow-black/4 sm:p-10"
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
          }}
        >
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center sm:mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 sm:mb-5 sm:h-14 sm:w-14">
              <svg
                className="h-6 w-6 text-white sm:h-7 sm:w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              ساخت حساب کاربری
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              اطلاعات خود را وارد کنید تا ثبت‌نام کنید
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-700"
              >
                نام و نام خانوادگی
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                  <svg
                    className="h-4.5 w-4.5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
                <input
                  id="name"
                  type="text"
                  name="name"
                  dir="rtl"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="نام خود را وارد کنید"
                  className="block w-full rounded-xl border border-white/60 bg-white/50 py-2.5 pr-10 pl-4 text-right text-sm text-gray-900 shadow-inner shadow-black/2 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-indigo-400 focus:bg-white/70 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-md focus:shadow-indigo-500/5"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700"
              >
                آدرس ایمیل
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                  <svg
                    className="h-4.5 w-4.5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  dir="ltr"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="block w-full rounded-xl border border-white/60 bg-white/50 py-2.5 pr-10 pl-4 text-left text-sm text-gray-900 shadow-inner shadow-black/2 placeholder:text-left placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-indigo-400 focus:bg-white/70 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-md focus:shadow-indigo-500/5"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700"
              >
                رمز عبور
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                  <svg
                    className="h-4.5 w-4.5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <input
                  dir="ltr"
                  id="password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="حداقل ۸ کاراکتر"
                  className="block w-full rounded-xl border border-white/60 bg-white/50 py-2.5 pr-10 pl-4 text-sm text-gray-900 shadow-inner shadow-black/2 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-indigo-400 focus:bg-white/70 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-md focus:shadow-indigo-500/5"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-semibold text-gray-700"
              >
                تکرار رمز عبور
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                  <svg
                    className="h-4.5 w-4.5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
                <input
                  dir="ltr"
                  id="password_confirmation"
                  type="password"
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  required
                  placeholder="رمز عبور را دوباره وارد کنید"
                  className="block w-full rounded-xl border border-white/60 bg-white/50 py-2.5 pr-10 pl-4 text-sm text-gray-900 shadow-inner shadow-black/2 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-indigo-400 focus:bg-white/70 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-md focus:shadow-indigo-500/5"
                />
              </div>
            </div>
            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500/20"
              />
              <label
                htmlFor="terms"
                className="text-xs leading-relaxed text-gray-500"
              >
                من قوانین و شرایط استفاده از خدمات را مطالعه کرده و با آنها
                موافقم. همچنین{" "}
                <a
                  href="#"
                  className="font-medium text-indigo-500 hover:text-indigo-600 underline-offset-2 hover:underline"
                >
                  سیاست حفظ حریم خصوصی
                </a>{" "}
                را تایید می‌کنم.
              </label>
            </div>

            {/* Submit */}
            <button
              disabled={loading || !form.terms}
              type="submit"
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-l from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  در حال ثبت‌نام...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  ثبت‌نام
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3 sm:my-6">
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-300 to-transparent" />
            <span className="text-xs font-medium text-gray-400">یا</span>
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-300 to-transparent" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500">
            قبلاً حساب کاربری دارید؟{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-500 transition-colors hover:text-indigo-600"
            >
              وارد شوید
            </Link>
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 text-center text-sm font-medium text-emerald-700 backdrop-blur-sm">
            {message}
          </div>
        )}

        {error && (
          <div
            className="mt-4 rounded-xl border border-red-200/60 bg-red-50/70 px-4 py-3 text-center text-sm font-medium text-red-600 backdrop-blur-sm"
            style={{ whiteSpace: "pre-line" }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;
