"use client";

import { useState } from "react";
import Link from "next/link";
import { Bike, Store, UserRound, X } from "lucide-react";

export default function SignupChooser({ label = "S'inscrire" }) {
  const [open, setOpen] = useState(false);
  return <><button className="landing-signup-button" onClick={() => setOpen(true)}>{label}</button>{open && <div className="modal-backdrop" onClick={() => setOpen(false)}><section className="signup-chooser" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setOpen(false)}><X size={18}/></button><p className="eyebrow">BIENVENUE SUR MIAMGO</p><h2>Quel type de compte voulez-vous créer ?</h2><Link href="/inscription-client"><UserRound size={20}/><span><strong>Compte client</strong><small>Commander et suivre vos repas</small></span></Link><Link href="/inscription-resto"><Store size={20}/><span><strong>Compte restaurant</strong><small>Mettre votre boutique en ligne</small></span></Link><Link href="/inscription-livreur"><Bike size={20}/><span><strong>Compte livreur</strong><small>Recevoir et gérer vos courses</small></span></Link></section></div>}</>;
}
