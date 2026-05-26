import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./components/NavBar";

export const metadata: Metadata = {
  title: "NyayaTech — Online Dispute Resolution",
  description: "India's AI-assisted dispute resolution platform. File your case, track progress, and resolve disputes faster.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <main style={{ flex: 1 }}>{children}</main>
        <footer style={{
          background: '#050810',
          borderTop: '1px solid rgba(212,175,55,0.08)',
          padding: '1.75rem 2rem',
          textAlign: 'center',
          fontFamily: "'Crimson Pro', serif",
          color: 'rgba(251,249,245,0.22)',
          fontSize: '0.82rem',
          letterSpacing: '0.03em',
        }}>
          NyayaTech Infrastructure Pvt Ltd &nbsp;·&nbsp; Not a law firm &nbsp;·&nbsp; Does not provide legal advice &nbsp;·&nbsp; Mediation Act 2023 Compliant
        </footer>
      </body>
    </html>
  );
}
