"use client";
import { useState } from "react";
import { CalendarClock, ScanLine } from "lucide-react";
import Link from "next/link";
import PlatformShell from "../../../components/PlatformShell";
const tabs=["Nouvelles","En préparation","Prêtes","En livraison","Programmées"];
export default function RestaurantOrders(){const[active,setActive]=useState("Nouvelles");return <PlatformShell><main className="content-wrap restaurant-orders"><div className="restaurant-orders-heading"><div><p className="eyebrow">GESTION DES COMMANDES</p><h1>Commandes</h1><p>Les commandes réelles reçues apparaîtront ici.</p></div><Link href="/espace-resto/scanner"><ScanLine size={18}/>Scanner un retrait</Link></div><div className="restaurant-order-tabs">{tabs.map(tab=><button type="button" className={active===tab?"active":""} onClick={()=>setActive(tab)} key={tab}>{tab}{tab==="Programmées"&&<CalendarClock size={14}/>}</button>)}</div><div className="admin-table-placeholder"><CalendarClock size={32}/><h3>Aucune commande {active.toLowerCase()}</h3><p>Les commandes réelles apparaîtront ici dans cette section.</p></div></main></PlatformShell>}
