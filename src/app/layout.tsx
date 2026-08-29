import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Q-Logistics — 風險感知全球供應鏈路徑優化",
  description:
    "Fujitsu Quantum Simulator Challenge 2025-26。16-qubit QUBO 與蒙地卡羅災害模擬在瀏覽器端即時重算。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
