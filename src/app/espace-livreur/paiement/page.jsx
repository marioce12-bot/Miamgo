import PlatformShell from "../../../components/PlatformShell";
import PayoutSettings from "../../../components/PayoutSettings";
export default function DriverPayment(){return <PlatformShell><main className="content-wrap payment-page"><p className="eyebrow">PAIEMENTS LIVREUR</p><h1>Mon compte de dépôt</h1><PayoutSettings collectionName="users" documentId="current-user" title="Bénéficiaire livreur"/></main></PlatformShell>}
