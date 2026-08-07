import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
import ScannerPanel from "../../../components/ScannerPanel";
export default function RestaurantScanner() { return <PlatformShell><main className="content-wrap"><Link className="back-link" href="/espace-resto"><ArrowLeft size={17} />Retour au dashboard</Link><ScannerPanel purpose="Valider un retrait client" /></main></PlatformShell> }
