import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Aryak Lalwani",
  description: "Made by aryak",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        >
        {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
