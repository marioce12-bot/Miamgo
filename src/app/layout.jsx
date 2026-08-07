import "./globals.css";

export const metadata = {
  title: "Miamgo | Le fil qui donne faim",
  description: "Découvrez les restaurants, plats du jour et promotions près de chez vous.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
