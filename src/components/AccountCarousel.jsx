"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bike, Store, UtensilsCrossed } from "lucide-react";

const slides = [
  { title: "Commander un repas", text: "Découvrez les plats autour de vous, gardez vos favoris et suivez vos commandes en direct.", action: "Créer un compte client", href: "/inscription-client", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=90", Icon: UtensilsCrossed },
  { title: "Mettre son restaurant en ligne", text: "Créez une boutique professionnelle, publiez vos plats et pilotez vos commandes simplement.", action: "Créer un compte restaurant", href: "/inscription-resto", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=90", Icon: Store },
  { title: "Devenir livreur", text: "Recevez les courses des restaurants partenaires et gérez votre disponibilité depuis votre espace.", action: "Créer un compte livreur", href: "/inscription-livreur", image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1600&q=90", Icon: Bike },
];

export default function AccountCarousel() {
  const [index, setIndex] = useState(0);
  useEffect(() => { const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), 4200); return () => clearInterval(timer); }, []);
  const previous = () => setIndex((current) => (current + slides.length - 1) % slides.length);
  const next = () => setIndex((current) => (current + 1) % slides.length);
  return <section className="account-carousel"><div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>{slides.map(({ title, text, action, href, image, Icon }) => <article className="carousel-slide" style={{ backgroundImage: `linear-gradient(90deg, rgba(12,36,27,.86), rgba(12,36,27,.18)), url(${image})` }} key={title}><div className="carousel-content"><span className="carousel-icon"><Icon size={24} /></span><p className="eyebrow">MIAMGO POUR VOUS</p><h2>{title}</h2><p>{text}</p><Link href={href}>{action} <ArrowRight size={17} /></Link></div></article>)}</div><div className="carousel-controls"><button aria-label="Précédent" onClick={previous}><ArrowLeft size={17} /></button><div>{slides.map((_, itemIndex) => <button className={itemIndex === index ? "active" : ""} aria-label={`Slide ${itemIndex + 1}`} onClick={() => setIndex(itemIndex)} key={itemIndex} />)}</div><button aria-label="Suivant" onClick={next}><ArrowRight size={17} /></button></div></section>;
}
