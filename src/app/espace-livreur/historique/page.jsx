import { ClipboardList } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
export default function DriverHistory(){return <PlatformShell><main className="content-wrap driver-dashboard"><p className="eyebrow">MES COURSES</p><h1>Historique</h1><section className="driver-empty"><ClipboardList size={32}/><h2>Aucune course enregistrée</h2><p>Vos courses terminées apparaîtront ici avec leur date, restaurant et statut de validation.</p></section></main></PlatformShell>}
