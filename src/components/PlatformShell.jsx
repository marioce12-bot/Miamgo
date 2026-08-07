import Link from "next/link";
import { Bell, Compass, Home, MapPin, ShoppingBag, UserRound } from "lucide-react";

export default function PlatformShell({ children, active = "" }) {
  const items = [
    ["Accueil", "/", Home],
    ["Explorer", "/explorer", Compass],
    ["Panier", "/panier", ShoppingBag],
    ["Commandes", "/commandes", UserRound],
  ];

  return (
    <div className="platform-page">
      <header className="portal-header">
        <Link className="brand brand-with-logo" href="/"><img src="/miamgo-logo.png" alt="Logo Miamgo" /><span>miam</span>go<i>.</i></Link>
        <div className="portal-location"><MapPin size={16} /><span>Cotonou, Bénin</span></div>
        <div className="portal-actions"><button aria-label="Notifications"><Bell size={19} /><b>2</b></button><Link href="/commandes">Mes commandes</Link></div>
      </header>
      {children}
      <nav className="portal-mobile-nav">
        {items.map(([label, href, Icon]) => <Link className={active === label ? "active" : ""} href={href} key={label}><Icon size={21} /><span>{label}</span></Link>)}
      </nav>
    </div>
  );
}
