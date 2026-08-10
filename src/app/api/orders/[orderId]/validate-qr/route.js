import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, getAdminRealtimeDb } from "../../../../../lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  let actor;
  try { actor = await getAdminAuth().verifyIdToken(authorization.slice(7)); } catch { return NextResponse.json({ error: "Session invalide." }, { status: 401 }); }
  const body = await request.json();
  const qr = String(body.qr || "");
  const match = qr.match(/^miamgo:(pickup|delivery):(.+)$/);
  if (!match || match[2] !== params.orderId) return NextResponse.json({ error: "QR invalide ou non associé à cette commande." }, { status: 400 });
  const db = getAdminDb();
  let orderRef = db.collection("orders").doc(params.orderId);
  if (!(await orderRef.get()).exists) { const bySerial = await db.collection("orders").where("serialNumber", "==", params.orderId).limit(1).get(); if (bySerial.empty) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 }); orderRef = bySerial.docs[0].ref; }
  let assignedDriverId = null;
  const result = await db.runTransaction(async (transaction) => {
     const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists) throw new Error("ORDER_NOT_FOUND");
     const order = snapshot.data();
     assignedDriverId = order.assignedDriverId || null;
    if (order.validationStatus === "validated" || order.fulfilledAt) throw new Error("QR_ALREADY_USED");
    if (order.paymentStatus !== "paid") throw new Error("ORDER_NOT_PAID");
    const expectedStatus = match[1] === "pickup" ? ["ready", "paid", "pending"] : ["out_for_delivery"];
    if (!expectedStatus.includes(order.status)) throw new Error("ORDER_STATUS_INVALID");
     const update = { validationStatus: "validated", fulfilledAt: new Date(), fulfilledBy: actor.uid, fulfillmentValidation: match[1], status: "completed", deliveryStatus: "livree", trackingActive: false, updatedAt: new Date() };
     transaction.set(orderRef, update, { merge: true });
    return update;
  }).catch((error) => ({ error: error.message }));
  if (result.error) {
    const messages = { ORDER_NOT_FOUND: "Commande introuvable.", QR_ALREADY_USED: "Ce QR a déjà été utilisé.", ORDER_NOT_PAID: "Cette commande n'est pas encore payée.", ORDER_STATUS_INVALID: "La commande n'est pas dans un statut validable." };
    return NextResponse.json({ error: messages[result.error] || "Validation refusée." }, { status: 409 });
  }
  if (assignedDriverId) await getAdminRealtimeDb().ref(`deliveryLocations/${orderRef.id}/${assignedDriverId}`).remove();
  return NextResponse.json({ ok: true, message: "Commande validée.", validation: result });
}
