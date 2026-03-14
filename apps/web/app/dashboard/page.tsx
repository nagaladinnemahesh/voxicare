"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./page.module.css";

// Type definitions
interface Appointment {
  id: string;
  bookingId: string | null;
  startTime: string;
  endTime: string;
  status: string;
  reason: string | null;
  doctor: {
    name: string;
    city: string;
    consultationFee: number;
    specializations: { specialization: { name: string } }[];
  };
}

interface Message {
  role: "user" | "agent";
  content: string;
}

/**
 * Dashboard page
 * Shows appointments list and Voxia chat/voice widget
 */
export default function DashboardPage() {
  const router = useRouter();

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      content:
        "Hi! I am Voxia, your healthcare assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Chat scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get token from localStorage
  const getToken = () => localStorage.getItem("token");

  /**
   * Fetch appointments on page load
   */
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetchAppointments();
  }, []);

  /**
   * Auto scroll chat to bottom on new messages
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Fetches patient appointments from backend
   */
  const fetchAppointments = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setAppointments(response.data.data.appointments);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setLoadingAppts(false);
    }
  };

  /**
   * Sends a text message to Voxia agent
   */
  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agent/chat`,
        { message: userMessage, conversationHistory },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      const agentResponse = response.data.data.response;

      // Add agent response to chat
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: agentResponse },
      ]);

      // Update conversation history for context
      setConversationHistory(response.data.data.conversationHistory);

      // Refresh appointments in case agent booked/cancelled one
      fetchAppointments();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  /**
   * Handles Enter key in chat input
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Starts recording audio from microphone
   */
  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio chunks as they come in
      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      // When recording stops, send audio to backend
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await sendVoiceMessage(audioBlob);

        // Stop all microphone tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied. Please allow microphone access.");
    }
  };

  /**
   * Stops recording audio
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  /**
   * Sends recorded audio to voice endpoint
   * Gets back audio response and plays it
   */
  const sendVoiceMessage = async (audioBlob: Blob) => {
    setVoiceLoading(true);

    try {
      // Create form data with audio file and conversation history
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append(
        "conversationHistory",
        JSON.stringify(conversationHistory),
      );

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/voice/chat`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "multipart/form-data",
          },
          responseType: "arraybuffer", // receive audio bytes
        },
      );

      // Get transcript and agent response from headers
      const transcript = decodeURIComponent(
        response.headers["x-transcript"] || "",
      );
      const agentResponse = decodeURIComponent(
        response.headers["x-agent-response"] || "",
      );

      // Add messages to chat
      if (transcript) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: `🎤 ${transcript}` },
        ]);
      }
      if (agentResponse) {
        setMessages((prev) => [
          ...prev,
          { role: "agent", content: agentResponse },
        ]);
      }

      // update conversatio history, context for next voice message
      const updatedHistory = response.headers["x-conversation-history"];
      console.log(
        "History header received:",
        updatedHistory
          ? "Yes, length: " + updatedHistory.length
          : "No-undefined",
      );
      if (updatedHistory) {
        try {
          setConversationHistory(
            JSON.parse(decodeURIComponent(updatedHistory)),
          );
        } catch (e) {
          console.log("parse error:", e);
        }
      }

      // Play the audio response
      const audioBuffer = response.data;
      const audioBlob2 = new Blob([audioBuffer], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob2);
      const audio = new Audio(audioUrl);
      audio.play();

      // Refresh appointments
      fetchAppointments();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content:
            "Sorry, I could not process your voice message. Please try again.",
        },
      ]);
    } finally {
      setVoiceLoading(false);
    }
  };

  /**
   * Returns CSS class for appointment status badge
   */
  const getStatusClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return styles.statusPending;
      case "CONFIRMED":
        return styles.statusConfirmed;
      case "CANCELLED":
        return styles.statusCancelled;
      case "COMPLETED":
        return styles.statusCompleted;
      default:
        return styles.statusPending;
    }
  };

  /**
   * Formats ISO date string to readable format
   */
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  /**
   * Handles logout
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <span className={styles.navBrand}>Voxicare</span>
        <button className={styles.btnLogout} onClick={handleLogout}>
          Logout
        </button>
      </nav>

      {/* Main content */}
      <div className={styles.main}>
        {/* Left — Appointments */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>My Appointments</h2>

          {loadingAppts ? (
            <p className={styles.emptyState}>Loading...</p>
          ) : appointments.length === 0 ? (
            <p className={styles.emptyState}>
              No appointments yet. Ask Voxia to book one!
            </p>
          ) : (
            <div className={styles.appointmentList}>
              {appointments.map((appt) => (
                <div key={appt.id} className={styles.appointmentItem}>
                  <div className={styles.appointmentDoctor}>
                    {appt.doctor.name}
                  </div>
                  <div className={styles.appointmentTime}>
                    {appt.doctor.specializations[0]?.specialization.name} —{" "}
                    {appt.doctor.city}
                  </div>
                  <div className={styles.appointmentTime}>
                    {formatDate(appt.startTime)}
                  </div>
                  {appt.reason && (
                    <div className={styles.appointmentTime}>
                      Reason: {appt.reason}
                    </div>
                  )}
                  <span
                    className={`${styles.appointmentStatus} ${getStatusClass(appt.status)}`}
                  >
                    {appt.status}
                  </span>
                  <div
                    className={styles.appointmentTime}
                    style={{ fontSize: "0.75rem", color: "#9ca3af" }}
                  >
                    {appt.bookingId || appt.id.slice(0, 8)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Voxia Chat + Voice */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Chat with Voxia</h2>

          {/* Chat messages */}
          <div className={styles.chatMessages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={
                  msg.role === "user" ? styles.messageUser : styles.messageAgent
                }
              >
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className={styles.messageAgent}>Voxia is thinking...</div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Text input */}
          <div className={styles.chatInput}>
            <input
              type="text"
              className={styles.input}
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={chatLoading}
            />
            <button
              className={styles.btnSend}
              onClick={sendMessage}
              disabled={chatLoading}
            >
              Send
            </button>
          </div>

          {/* Voice button */}
          <div className={styles.voiceSection}>
            <button
              className={`${styles.btnVoice} ${isRecording ? styles.btnVoiceRecording : ""}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={voiceLoading}
            >
              {voiceLoading ? "⏳" : isRecording ? "⏹" : "🎤"}
            </button>
            <p className={styles.voiceHint}>
              {isRecording
                ? "Recording... click to stop"
                : voiceLoading
                  ? "Processing..."
                  : "Click to speak with Voxia"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
