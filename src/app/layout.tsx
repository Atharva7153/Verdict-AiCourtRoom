import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VERDICT — The Hackathon Court",
  description: "Put your hackathon idea on trial. Hear the case, weigh the evidence, and leave with a buildable next step.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#f3efe6]">
        {children}
      </body>
    </html>
  );
}
