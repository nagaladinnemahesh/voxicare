"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import styles from "./page.module.css";

/**
 * Login page — supports both patient and doctor login
 * Uses tabs to switch between patient and doctor login
 */
export default function LoginPage() {
  const router = useRouter();

  // Which tab is active — patient or doctor
  const [role, setRole] = useState<"patient" | "doctor">("patient");

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handles form submission
   * Calls the appropriate login endpoint based on role
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Call the correct endpoint based on selected role
      const endpoint =
        role === "patient"
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/patient/login`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/auth/doctor/login`;

      const response = await axios.post(endpoint, { email, password });

      // Save token to localStorage
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("role", role);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Login to your Voxicare account</p>

        {/* Role tabs — Patient or Doctor */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${role === "patient" ? styles.tabActive : ""}`}
            onClick={() => setRole("patient")}
          >
            Patient
          </button>
          <button
            className={`${styles.tab} ${role === "doctor" ? styles.tabActive : ""}`}
            onClick={() => setRole("doctor")}
          >
            Doctor
          </button>
        </div>

        {/* Error message */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Login form */}
        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account?{" "}
          <Link href="/register" className={styles.link}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
