"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { showToast } from "nextjs-toast-notify";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loginUser, hydrateAuth, clearAuthError, logout } from "../../store/authSlice";
import Link from "next/link";

const loginSchema = Yup.object({
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(4, "Password must be at least 4 characters")
    .required("Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token, role, loading, error } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  useEffect(() => {
    if (token && role === "Member") {
      router.replace("/events");
    }
  }, [token, role, router]);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: async (values, { resetForm }) => {
      dispatch(clearAuthError());
      const result = await dispatch(loginUser(values));

      if (loginUser.fulfilled.match(result)) {
        const { role: userRole } = result.payload;
        if (userRole === "Member") {
          showToast.success("Login successful!", {
            duration: 3000,
            position: "top-right",
            transition: "bounceIn",
            progress: true,
          });
          router.push("/events");
        } else {
          dispatch(logout());
          resetForm();
          showToast.warning("Upgrade Your Account to access events", {
            duration: 5000,
            position: "top-right",
            transition: "bounceIn",
            sound: true,
            progress: true,
          });
        }
      }

      if (loginUser.rejected.match(result)) {
        resetForm();
        showToast.error((result.payload as string) || "Login failed", {
          duration: 4000,
          position: "top-right",
          transition: "bounceIn",
          sound: true,
          progress: true,
        });
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`input-base ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                    : ""
                }`}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {formik.errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={`input-base ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                    : ""
                }`}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {formik.errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || formik.isSubmitting}
              className="btn-primary"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      fill="currentColor"
                      className="opacity-75"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="link">
            ← Back to Trip Planner
          </Link>
        </p>
      </div>
    </div>
  );
}
