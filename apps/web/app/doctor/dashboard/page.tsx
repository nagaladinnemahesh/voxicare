"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./page.module.css";

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  experienceYears: number;
  consultationFee: number;
  specializations: { specialization: { name: string } }[];
  availability: { dayOfWeek: string; startTime: string; endTime: string }[];
}

interface Appointment {
  id: string;
  bookingId: string | null;
  startTime: string;
  status: string;
  reason: string | null;
  user: { name: string; email: string; phone: string };
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function DoctorDashboardPage() {
  const router = useRouter();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  // Availability state — map of day -> { enabled, startTime, endTime }
  const [availability, setAvailability] = useState<
    Record<
      string,
      {
        enabled: boolean;
        startTime: string;
        endTime: string;
      }
    >
  >({
    MON: { enabled: false, startTime: "09:00", endTime: "17:00" },
    TUE: { enabled: false, startTime: "09:00", endTime: "17:00" },
    WED: { enabled: false, startTime: "09:00", endTime: "17:00" },
    THU: { enabled: false, startTime: "09:00", endTime: "17:00" },
    FRI: { enabled: false, startTime: "09:00", endTime: "17:00" },
    SAT: { enabled: false, startTime: "09:00", endTime: "17:00" },
    SUN: { enabled: false, startTime: "09:00", endTime: "17:00" },
  });

  const getToken = () => localStorage.getItem("doctorToken");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/doctor/login");
      return;
    }
    setDoctorName(localStorage.getItem("doctorName") || "Doctor");
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [profileRes, apptRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/doctors/me/profile`, {
          headers,
        }),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/doctors/me/appointments`,
          { headers },
        ),
      ]);

      const doc = profileRes.data.data.doctor;
      setDoctor(doc);
      setAppointments(apptRes.data.data.appointments);

      // Load existing availability into state
      const avail = { ...availability };
      doc.availability.forEach((a: any) => {
        avail[a.dayOfWeek] = {
          enabled: true,
          startTime: a.startTime,
          endTime: a.endTime,
        };
      });
      setAvailability(avail);
    } catch (err) {
      console.error("Failed to fetch doctor data:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveAvailability = async () => {
    try {
      const payload = Object.entries(availability)
        .filter(([_, v]) => v.enabled)
        .map(([day, v]) => ({
          dayOfWeek: day,
          startTime: v.startTime,
          endTime: v.endTime,
        }));

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/doctors/me/availability`,
        { availability: payload },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      setSaveMsg("Availability saved successfully!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      console.error("Failed to save availability:", err);
    }
  };

  const addLeave = async () => {
    if (!leaveDate) return;
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/doctors/me/leave`,
        { date: leaveDate, reason: leaveReason },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setLeaveDate("");
      setLeaveReason("");
      setSaveMsg("Leave added successfully!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      console.error("Failed to add leave:", err);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return styles.statusConfirmed;
      case "PENDING":
        return styles.statusPending;
      case "CANCELLED":
        return styles.statusCancelled;
      case "COMPLETED":
        return styles.statusCompleted;
      default:
        return styles.statusPending;
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string,
    status: string,
  ) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/doctors/me/appointments/${appointmentId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      fetchData(); // refresh
      setSaveMsg(`Appointment ${status.toLowerCase()} successfully!`);
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      console.error("Failed to update appointment:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    localStorage.removeItem("doctorName");
    router.push("/doctor/login");
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div>
          <span className={styles.navBrand}>Voxicare</span>
          <span className={styles.navBadge}>Doctor</span>
        </div>
        <div className={styles.navRight}>
          <span className={styles.navUser}>{doctorName}</span>
          <button className={styles.btnLogout} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className={styles.main}>
        {/* Profile */}
        {doctor && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>My Profile</h2>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Name</span>
              <span className={styles.profileValue}>{doctor.name}</span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Email</span>
              <span className={styles.profileValue}>{doctor.email}</span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Phone</span>
              <span className={styles.profileValue}>{doctor.phone}</span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>City</span>
              <span className={styles.profileValue}>{doctor.city}</span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Specialization</span>
              <span className={styles.profileValue}>
                {doctor.specializations[0]?.specialization.name || "—"}
              </span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Experience</span>
              <span className={styles.profileValue}>
                {doctor.experienceYears} years
              </span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Fee</span>
              <span className={styles.profileValue}>
                ₹{doctor.consultationFee}
              </span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Status</span>
              <span
                className={`${styles.statusBadge} ${styles[`status${doctor.status}`]}`}
              >
                {doctor.status}
              </span>
            </div>
          </div>
        )}

        {/* Availability */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>My Availability</h2>

          {saveMsg && <div className={styles.success}>{saveMsg}</div>}

          {DAYS.map((day) => (
            <div key={day} className={styles.dayRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={availability[day].enabled}
                onChange={(e) =>
                  setAvailability((prev) => ({
                    ...prev,
                    [day]: { ...prev[day], enabled: e.target.checked },
                  }))
                }
              />
              <span className={styles.dayLabel}>{day}</span>
              {availability[day].enabled && (
                <>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={availability[day].startTime}
                    onChange={(e) =>
                      setAvailability((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], startTime: e.target.value },
                      }))
                    }
                  />
                  <span>to</span>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={availability[day].endTime}
                    onChange={(e) =>
                      setAvailability((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], endTime: e.target.value },
                      }))
                    }
                  />
                </>
              )}
            </div>
          ))}

          <button className={styles.btnSave} onClick={saveAvailability}>
            Save Availability
          </button>
        </div>

        {/* Leave */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Mark Leave</h2>
          <div className={styles.leaveForm}>
            <input
              type="date"
              className={styles.input}
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
            />
            <input
              type="text"
              className={styles.input}
              placeholder="Reason (optional)"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
            />
            <button className={styles.btnAddLeave} onClick={addLeave}>
              Add
            </button>
          </div>
        </div>

        {/* Appointments */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <h2 className={styles.cardTitle}>
            My Appointments ({appointments.length})
          </h2>

          {appointments.length === 0 ? (
            <p className={styles.emptyState}>No appointments yet</p>
          ) : (
            appointments.map((appt) => (
              <div key={appt.id} className={styles.appointmentItem}>
                <div className={styles.appointmentPatient}>
                  {appt.user.name}
                </div>
                <div className={styles.appointmentTime}>
                  {appt.user.email} • {appt.user.phone}
                </div>
                <div className={styles.appointmentTime}>
                  {new Date(appt.startTime).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
                {appt.reason && (
                  <div className={styles.appointmentTime}>
                    Reason: {appt.reason}
                  </div>
                )}
                <div className={styles.appointmentTime}>
                  {appt.bookingId || appt.id.slice(0, 8)}
                </div>
                <span
                  className={`${styles.appointmentStatus} ${getStatusClass(appt.status)}`}
                >
                  {appt.status}
                </span>
                <div
                  className={styles.actions}
                  style={{ marginTop: "8px", display: "flex", gap: "8px" }}
                >
                  {appt.status === "PENDING" && (
                    <>
                      <button
                        onClick={() =>
                          updateAppointmentStatus(appt.id, "CONFIRMED")
                        }
                        style={{
                          padding: "4px 12px",
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() =>
                          updateAppointmentStatus(appt.id, "CANCELLED")
                        }
                        style={{
                          padding: "4px 12px",
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {appt.status === "CONFIRMED" && (
                    <button
                      onClick={() =>
                        updateAppointmentStatus(appt.id, "COMPLETED")
                      }
                      style={{
                        padding: "4px 12px",
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
