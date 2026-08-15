import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, getAdminRealtimeDb } from "../../../../../lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const { orderId } = await params;
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  let actor;
  try { actor = await getAdminAuth().verifyIdToken(authorization.slice(7)); } catch { return NextResponse.json({ error: "Session invalide." }, { status: 401 }); }
  const body = await request.json();
  const rawQr = String(body.qr || "");
  const qr = rawQr.trim();
  const match = qr.match(/^miamgo\s*:\s*(pickup|delivery)\s*:\s*([^:\s]+)\s*$/i);
  console.info("[QR_VALIDATE] received", { rawQr, normalizedQr: qr, routeOrderId: orderId, parsedMode: match?.[1] || null, parsedReference: match?.[2] || null, actorId: actor.uid });
  if (!match) { console.warn("[QR_VALIDATE] rejected: invalid format", { rawQr, expected: "miamgo:{pickup|delivery}:{orderId}" }); return NextResponse.json({ error: "QR invalide. Format attendu : miamgo:pickup:ID ou miamgo:delivery:ID." }, { status: 400 }); }
  const qrReference = match[2];
  if (qrReference !== orderId) { console.warn("[QR_VALIDATE] rejected: route/reference mismatch", { routeOrderId: orderId, qrReference }); return NextResponse.json({ error: "QR invalide ou non associé à cette commande." }, { status: 400 }); }
  const db = getAdminDb();
  let orderRef = db.collection("orders").doc(orderId);
  if (!(await orderRef.get()).exists) { const bySerial = await db.collection("orders").where("serialNumber", "==", orderId).limit(1).get(); if (bySerial.empty) { console.warn("[QR_VALIDATE] rejected: order not found", { orderId, qrReference }); return NextResponse.json({ error: "Commande introuvable." }, { status: 404 }); } orderRef = bySerial.docs[0].ref; }
  let assignedDriverId = null;
  let validatedOrder = null;
  const result = await db.runTransaction(async (transaction) => {
     const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists) throw new Error("ORDER_NOT_FOUND");
      const order = snapshot.data();
      assignedDriverId = order.assignedDriverId || null;
      const restaurantSnapshot = await db.collection("restaurants").doc(String(order.restaurantId)).get();
      const isOwner = restaurantSnapshot.exists && restaurantSnapshot.data().ownerId === actor.uid;
      if (!isOwner && assignedDriverId !== actor.uid) throw new Error("NOT_ALLOWED");
    if (order.validationStatus === "validated" || order.fulfilledAt) throw new Error("QR_ALREADY_USED");
    if (order.paymentStatus !== "paid") throw new Error("ORDER_NOT_PAID");
    const expectedStatus = match[1] === "pickup" ? ["ready", "paid", "pending"] : ["out_for_delivery"];
    if (!expectedStatus.includes(order.status)) throw new Error("ORDER_STATUS_INVALID");
     const update = { validationStatus: "validated", fulfilledAt: new Date(), fulfilledBy: actor.uid, fulfillmentValidation: match[1], status: "completed", deliveryStatus: "livree", trackingActive: false, updatedAt: new Date() };
      transaction.set(orderRef, update, { merge: true });
      validatedOrder = { id: snapshot.id, serialNumber: order.serialNumber || snapshot.id, customerId: order.customerId, restaurantId: order.restaurantId, customerName: "Client", items: order.items || [], deliveryMode: order.deliveryMode };
    return update;
  }).catch((error) => ({ error: error.message }));
   if (result.error) {
     console.warn("[QR_VALIDATE] rejected during order validation", { orderId: orderRef.id, qrReference, mode: match[1], reason: result.error, actorId: actor.uid });
     const messages = { ORDER_NOT_FOUND: "Commande introuvable.", QR_ALREADY_USED: "Ce QR a déjà été utilisé.", ORDER_NOT_PAID: "Cette commande n'est pas encore payée.", ORDER_STATUS_INVALID: "La commande n'est pas dans un statut validable.", NOT_ALLOWED: "Vous n’êtes pas autorisé à valider cette commande." };
    return NextResponse.json({ error: messages[result.error] || "Validation refusée." }, { status: 409 });
  }
  if (assignedDriverId) await getAdminRealtimeDb().ref(`deliveryLocations/${orderRef.id}/${assignedDriverId}`).remove();
   const customerSnapshot = await getAdminDb().collection("users").doc(String(validatedOrder.customerId)).get();
   const customer = customerSnapshot.exists ? customerSnapshot.data() : {};
   const menuSnapshot = await getAdminDb().collection("restaurants").doc(String(validatedOrder.restaurantId || "")).collection("menuItems").get().catch(() => ({ docs: [] }));
   const menu = new Map(menuSnapshot.docs.map((item) => [item.id, item.data()]));
   validatedOrder.customerName = customer.displayName || customer.email || "Client";
   validatedOrder.customerPhoto = customer.photoURL || null;
   validatedOrder.items = validatedOrder.items.map((item) => ({ ...item, imageUrl: item.imageUrl || menu.get(item.id)?.imageUrl || null }));
   return NextResponse.json({ ok: true, message: "Commande validée.", validation: result, order: validatedOrder });
}
