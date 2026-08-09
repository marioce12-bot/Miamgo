import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiamGo",
  description: "Commandez auprès des restaurants qui vous entourent.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
