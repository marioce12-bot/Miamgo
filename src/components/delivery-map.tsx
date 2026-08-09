"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Coordinates } from "@/lib/firestore/models";

export function DeliveryMap({ courier, destination }: { courier?: Coordinates; destination?: Coordinates }) {
  const center = courier ?? destination ?? { latitude: 6.3703, longitude: 2.3912 };
  return (
    <MapContainer center={[center.latitude, center.longitude]} zoom={13} scrollWheelZoom={false} style={{ height: 300, width: "100%" }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {courier && <Marker position={[courier.latitude, courier.longitude]}><Popup>Livreur en temps réel</Popup></Marker>}
      {destination && <Marker position={[destination.latitude, destination.longitude]}><Popup>Destination</Popup></Marker>}
    </MapContainer>
  );
}
