"use client";
import { CalendarClock, ScanLine } from "lucide-react";
import Link from "next/link";
import PlatformShell from "../../../components/PlatformShell";
export default function RestaurantOrders(){return <PlatformShell><main className="content-wrap restaurant-orders"><div className="restaurant-orders-heading"><div><p className="eyebrow">GESTION DES COMMANDES</p><h1>Commandes</h1><p>Les commandes réelles reçues apparaîtront ici.</p></div><Link href="/espace-resto/scanner"><ScanLine size={18}/>Scanner un retrait</Link></div><div className="restaurant-order-tabs"><button className="active">Nouvelles</button><button>En préparation</button><button>Prêtes</button><button>En livraison</button><button><CalendarClock size={14}/>Programmées</button></div><div className="admin-table-placeholder"><CalendarClock size={32}/><h3>Aucune commande</h3><p>Il n&apos;y a encore aucune commande enregistrée pour cette boutique.</p></div></main></PlatformShell>}
