import { MapPin, Navigation } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
export default function DriverActiveCourse(){return <PlatformShell><main className="content-wrap driver-dashboard"><p className="eyebrow">COURSE ACTIVE</p><h1>En cours</h1><section className="driver-empty"><Navigation size={34}/><h2>Aucune course active</h2><p>Une course acceptée avec ses adresses et sa carte de suivi apparaîtra ici.</p><MapPin size={18}/></section></main></PlatformShell>}
