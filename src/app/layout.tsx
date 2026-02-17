import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import ChatPanel from "@/components/chat-panel";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "JFDI - Personal Command Center",
  description: "Your personal productivity and life management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <ToastProvider>
            <Sidebar />
            <main className="ml-16 lg:ml-56 min-h-screen p-4 lg:p-6">
              {children}
            </main>
            <ChatPanel />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
