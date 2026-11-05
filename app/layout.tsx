import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shortform Engine",
  description: "Programmatic vertical shorts in Remotion. Voice uses the browser speech engine. Music is an original bed.",
};

export const viewport: Viewport = {
  themeColor: "#efe6d6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
