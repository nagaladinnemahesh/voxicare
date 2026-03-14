"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./page.module.css";

interface Stats {
  totalPatients: number;
  totalDoctors: number;
  pendingDoctors: number;
  totalAppointments: number;
  todayAppointments: number;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  city: string;
  status: string;
  experienceYears: number;
  consultationFee: number;
  createdAt: string;
  specializations: { specialization: { name: string } }[];
}

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  bookingId: string | null;
  startTime: string;
  status: string;
  reason: string | null;
  doctor: { name: string; city: string };
  user: { name: string; email: string };
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const getToken = () => localStorage.getItem("adminToken");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setAdminName(localStorage.getItem("adminName") || "Admin");
    fetchData();
  }, []);

  //   const fetchData = async () => {
  //     try {
  //       const headers = { Authorization: `Bearer ${getToken()}` };

  //       const [statsRes, doctorsRes] = await Promise.all([
  //         axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
  //           headers,
  //         }),
  //         axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/doctors`, {
  //           headers,
  //         }),
  //       ]);

  //       setStats(statsRes.data.data);
  //       setDoctors(doctorsRes.data.data.doctors);
  //     } catch (err) {
  //       console.error("Failed to fetch admin data:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };

      const [statsRes, doctorsRes, patientsRes, appointmentsRes] =
        await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
            headers,
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/doctors`, {
            headers,
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/patients`, {
            headers,
          }),
          axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/appointments`,
            { headers },
          ),
        ]);

      setStats(statsRes.data.data);
      setDoctors(doctorsRes.data.data.doctors);
      setPatients(patientsRes.data.data.patients);
      setAppointments(appointmentsRes.data.data.appointments);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateDoctorStatus = async (doctorId: string, status: string) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/doctors/${doctorId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      // Refresh data
      fetchData();
    } catch (err) {
      console.error("Failed to update doctor status:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    router.push("/admin/login");
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return styles.statusAPPROVED;
      case "PENDING":
        return styles.statusPENDING;
      case "REJECTED":
        return styles.statusREJECTED;
      case "SUSPENDED":
        return styles.statusSUSPENDED;
      default:
        return styles.statusPENDING;
    }
  };

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div>
          <span className={styles.navBrand}>Voxicare</span>
          <span className={styles.navBadge}>Admin</span>
        </div>
        <div className={styles.navRight}>
          <span className={styles.navUser}>{adminName}</span>
          <button className={styles.btnLogout} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className={styles.main}>
        {/* Stats */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.totalPatients}</div>
              <div className={styles.statLabel}>Total Patients</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.totalDoctors}</div>
              <div className={styles.statLabel}>Active Doctors</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.pendingDoctors}</div>
              <div className={styles.statLabel}>Pending Approval</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.totalAppointments}</div>
              <div className={styles.statLabel}>Total Appointments</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.todayAppointments}</div>
              <div className={styles.statLabel}>Today</div>
            </div>
          </div>
        )}

        {/* Doctors Table */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>All Doctors</h2>

          {loading ? (
            <p className={styles.emptyState}>Loading...</p>
          ) : doctors.length === 0 ? (
            <p className={styles.emptyState}>No doctors found</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>City</th>
                  <th>Experience</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>
                      <div className={styles.doctorName}>{doctor.name}</div>
                      <div className={styles.doctorEmail}>{doctor.email}</div>
                    </td>
                    <td>
                      {doctor.specializations[0]?.specialization.name || "—"}
                    </td>
                    <td>{doctor.city}</td>
                    <td>{doctor.experienceYears} yrs</td>
                    <td>₹{doctor.consultationFee}</td>
                    <td>
                      <span
                        className={`${styles.status} ${getStatusClass(doctor.status)}`}
                      >
                        {doctor.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {doctor.status !== "APPROVED" && (
                          <button
                            className={styles.btnApprove}
                            onClick={() =>
                              updateDoctorStatus(doctor.id, "APPROVED")
                            }
                          >
                            Approve
                          </button>
                        )}
                        {doctor.status !== "REJECTED" && (
                          <button
                            className={styles.btnReject}
                            onClick={() =>
                              updateDoctorStatus(doctor.id, "REJECTED")
                            }
                          >
                            Reject
                          </button>
                        )}
                        {doctor.status === "APPROVED" && (
                          <button
                            className={styles.btnSuspend}
                            onClick={() =>
                              updateDoctorStatus(doctor.id, "SUSPENDED")
                            }
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Patients Table */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>All Patients ({patients.length})</h2>
          {patients.length === 0 ? (
            <p className={styles.emptyState}>No patients found</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td className={styles.doctorName}>{patient.name}</td>
                    <td>{patient.email}</td>
                    <td>{patient.phone}</td>
                    <td>{patient.gender}</td>
                    <td>
                      {new Date(patient.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Appointments Table */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            All Appointments ({appointments.length})
          </h2>
          {appointments.length === 0 ? (
            <p className={styles.emptyState}>No appointments found</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id}>
                    <td>{appt.bookingId || appt.id.slice(0, 8)}</td>
                    <td>
                      <div className={styles.doctorName}>{appt.user.name}</div>
                      <div className={styles.doctorEmail}>
                        {appt.user.email}
                      </div>
                    </td>
                    <td>{appt.doctor.name}</td>
                    <td>
                      {new Date(appt.startTime).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td>{appt.reason || "—"}</td>
                    <td>
                      <span
                        className={`${styles.status} ${getStatusClass(appt.status)}`}
                      >
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
