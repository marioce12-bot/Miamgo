export interface PickupPayload {
  orderId: string;
  validationCode: string;
}

export function createOrderSerial(now = new Date(), suffix?: string): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const random = suffix ?? crypto.randomUUID().slice(0, 6).toUpperCase();
  return `MG-${date}-${random}`;
}

export function createPickupQrValue(orderId: string, validationCode: string): string {
  return `miamgo:${orderId}:${validationCode}`;
}

export function parsePickupQrValue(value: string): PickupPayload {
  const [scheme, orderId, validationCode, extra] = value.trim().split(":");

  if (scheme !== "miamgo" || !orderId || !validationCode || extra) {
    throw new Error("QR MiamGo invalide.");
  }

  return { orderId, validationCode };
}
