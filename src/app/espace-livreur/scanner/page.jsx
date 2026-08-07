import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
import ScannerPanel from "../../../components/ScannerPanel";
export default function DriverScanner() { return <PlatformShell><main className="content-wrap"><Link className="back-link" href="/espace-livreur"><ArrowLeft size={17} />Retour aux courses</Link><ScannerPanel purpose="Valider une livraison" /></main></PlatformShell> }
