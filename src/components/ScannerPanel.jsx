"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2, ScanLine } from "lucide-react";

export default function ScannerPanel({ purpose }) {
  const videoRef = useRef(null); const [camera, setCamera] = useState(false); const [code, setCode] = useState(""); const [result, setResult] = useState("");
  async function startCamera() { try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); videoRef.current.srcObject = stream; setCamera(true); } catch { setResult("Autorisez la caméra pour scanner le QR, ou entrez le numéro de commande manuellement."); } }
  function validate(event) { event.preventDefault(); setResult(code.trim() ? `Commande ${code} validée pour ${purpose}.` : "Saisissez ou scannez un code de commande."); }
  return <section className="scanner-panel"><p className="eyebrow">SCAN SÉCURISÉ</p><h1>{purpose}</h1><p>Scannez le QR du client ou saisissez le numéro de commande pour valider la remise.</p><div className="camera-frame">{camera ? <video ref={videoRef} autoPlay playsInline /> : <ScanLine size={48} />}<span>Positionnez le QR dans le cadre</span></div><button className="camera-button" onClick={startCamera}><Camera size={18} />Ouvrir la caméra</button><form onSubmit={validate}><label>Numéro ou code de commande<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Ex. MG-0842" /></label><button>Valider la commande</button></form>{result && <p className="scan-result"><CheckCircle2 size={17} />{result}</p>}</section>;
}
