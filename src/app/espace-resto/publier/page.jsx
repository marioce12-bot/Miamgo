"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Send } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";

export default function PublishPost() {
  const [image, setImage] = useState(""); const [published, setPublished] = useState(false);
  function publish(event) { event.preventDefault(); setPublished(true); }
  return <PlatformShell><main className="content-wrap publish-page"><Link className="back-link" href="/espace-resto"><ArrowLeft size={17} />Retour au dashboard</Link><p className="eyebrow">FIL MIAMGO</p><h1>Publier une publicité</h1><p>Votre publication apparaîtra dans le fil des clients proches de votre restaurant après activation de votre plan.</p><form onSubmit={publish}><label>Texte de votre publication<textarea required placeholder="Ex. Le riz gras au poulet est prêt pour le déjeuner..." /></label><label>Lien de votre image Imgbb<input type="url" value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://i.ibb.co/..." required /></label>{image && <div className="publish-preview"><img src={image} alt="Aperçu de publication" onError={(event) => event.currentTarget.style.display = "none"} /><span><ImagePlus size={18} />Aperçu de votre photo</span></div>}<label>Plat ou promotion mise en avant<input required placeholder="Ex. Riz gras au poulet fumé" /></label><label>Prix<input required placeholder="Ex. 2 500 FCFA" /></label><button><Send size={17} />Publier dans le fil</button></form>{published && <p className="settings-notice">Publication prête. L&apos;activation du plan est requise avant sa diffusion publique.</p>}</main></PlatformShell>;
}
