import Link from "next/link";
import styles from "./page.module.css";

/**
 * Landing page — simple hero introducing Voxicare
 */
export default function Home() {
  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Voxicare</h1>
        <p className={styles.subtitle}>Your AI-powered healthcare assistant</p>
        <p className={styles.description}>
          Book, cancel and reschedule doctor appointments using your voice or
          text — powered by AI
        </p>

        <div className={styles.buttons}>
          <Link href="/login" className={styles.btnPrimary}>
            Login
          </Link>
          <Link href="/register" className={styles.btnSecondary}>
            Register
          </Link>
        </div>
      </div>

      <p className={styles.footer}>
        Voxicare © 2026 — Built with Next.js, Fastify & Claude AI
      </p>
    </main>
  );
}
