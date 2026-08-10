import "./globals.css";
import "./interactive.css";
import "./modals.css";
import "./marketing.css";
import "./theme.css";
import "./admin.css";
import "./landing-overrides.css";
import "./subscription.css";
import "./account-ui.css";
import MobileRoleNav from "../components/MobileRoleNav";
import { PreferencesProvider } from "../components/PreferencesProvider";

export const metadata = {
  title: "Miamgo | Le fil qui donne faim",
  description: "Découvrez les restaurants, plats du jour et promotions près de chez vous.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head><link rel="preload" as="image" href="/miamgo-logo.png" fetchPriority="high" /></head>
      <body><PreferencesProvider>{children}<MobileRoleNav /></PreferencesProvider></body>
    </html>
  );
}
