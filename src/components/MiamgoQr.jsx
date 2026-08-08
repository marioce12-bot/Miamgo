"use client";
import { QRCodeSVG } from "qrcode.react";
export default function MiamgoQr({ value, size = 220 }) { return <div className="miamgo-qr"><QRCodeSVG value={value} size={size} level="H" bgColor="#fffaf1" fgColor="#173d2e" imageSettings={{ src: "/miamgo-logo.png", height: size * 0.2, width: size * 0.2, excavate: true }} /></div>; }
