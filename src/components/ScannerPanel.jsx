"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, CheckCircle2, ScanLine, X } from "lucide-react";

export default function ScannerPanel({ purpose }) {
  const videoRef = useRef(null); const controlsRef = useRef(null);
  const [camera, setCamera] = useState(false); const [code, setCode] = useState(""); const [result, setResult] = useState(""); const [error, setError] = useState("");
  useEffect(() => () => controlsRef.current?.stop(), []);
  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) { setError("La caméra nécessite HTTPS et un navigateur compatible."); return; }
    try {
      setError("");
      const reader = new BrowserMultiFormatReader();
      controlsRef.current?.stop();
      controlsRef.current = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } }, videoRef.current, (scanResult) => {
        if (!scanResult) return;
        const value = scanResult.getText(); setCode(value); setResult(`Code ${value} détecté. Vérifiez puis validez.`); controlsRef.current?.stop(); setCamera(false);
      });
      setCamera(true);
    } catch (cameraError) { setError(cameraError?.name === "NotAllowedError" ? "Autorisez la caméra dans les réglages du navigateur." : "Impossible d'ouvrir la caméra. Vérifiez HTTPS et les autorisations."); }
  }
  function stopCamera() { controlsRef.current?.stop(); setCamera(false); }
  function validate(event) { event.preventDefault(); setResult(code.trim() ? `Commande ${code} validée pour ${purpose}.` : "Saisissez ou scannez un code de commande."); }
  return <section className="scanner-panel"><p className="eyebrow">SCAN SÉCURISÉ</p><h1>{purpose}</h1><p>Scannez le QR du client ou saisissez le numéro de commande.</p><div className="camera-frame">{camera ? <video ref={videoRef} autoPlay muted playsInline /> : <><ScanLine size={48} /><span>Positionnez le QR dans le cadre</span></>}</div>{camera ? <button className="camera-button" onClick={stopCamera}><X size={18} />Fermer la caméra</button> : <button className="camera-button" onClick={startCamera}><Camera size={18} />Ouvrir la caméra</button>}{error && <p className="scan-error">{error}</p>}<form onSubmit={validate}><label>Numéro ou code de commande<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Ex. MG-0842" /></label><button>Valider la commande</button></form>{result && <p className="scan-result"><CheckCircle2 size={17} />{result}</p>}</section>;
}
