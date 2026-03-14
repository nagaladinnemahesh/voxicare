"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import styles from "./page.module.css";

/**
 * Register page — supports both patient and doctor registration
 * Patient form — name, email, phone, password, dob, gender, blood group
 * Doctor form — name, email, phone, password, city, experience, fee
 */
export default function RegisterPage() {
  const router = useRouter();

  // Which tab is active
  const [role, setRole] = useState<"patient" | "doctor">("patient");

  // Shared fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Patient specific fields
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  // Doctor specific fields
  const [city, setCity] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [consultationFee, setConsultationFee] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /**
   * Handles form submission for both patient and doctor
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (role === "patient") {
        // Patient registration
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/patient/register`,
          {
            name,
            email,
            phone,
            password,
            dateOfBirth,
            gender,
            bloodGroup: bloodGroup || undefined,
          },
        );

        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        // Doctor registration
        // For V1 we hardcode a specialization ID
        // In V2 we'll add a dropdown to select specializations
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/doctor/register`,
          {
            name,
            email,
            phone,
            password,
            city,
            experienceYears: Number(experienceYears),
            consultationFee: Number(consultationFee),
            specializationIds: [], // will add specialization picker in V2
          },
        );

        setSuccess(
          "Registration successful! Your account is pending approval.",
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Join Voxicare today</p>

        {/* Role tabs */}
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

        {/* Error / Success messages */}
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleRegister}>
          {/* Shared fields */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.row}>
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
              <label className={styles.label}>Phone</label>
              <input
                type="tel"
                className={styles.input}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Patient specific fields */}
          {role === "patient" && (
            <>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Date of Birth</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Gender</label>
                  <select
                    className={styles.select}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Blood Group
                  <span className={styles.optional}>(optional)</span>
                </label>
                <select
                  className={styles.select}
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="A_POS">A+</option>
                  <option value="A_NEG">A-</option>
                  <option value="B_POS">B+</option>
                  <option value="B_NEG">B-</option>
                  <option value="AB_POS">AB+</option>
                  <option value="AB_NEG">AB-</option>
                  <option value="O_POS">O+</option>
                  <option value="O_NEG">O-</option>
                </select>
              </div>
            </>
          )}

          {/* Doctor specific fields */}
          {role === "doctor" && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>City</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Hyderabad"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Experience (years)</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Consultation Fee (₹)</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="500"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{" "}
          <Link href="/login" className={styles.link}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
