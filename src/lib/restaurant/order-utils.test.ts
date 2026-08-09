import { describe, expect, it } from "vitest";
import { createOrderSerial, createPickupQrValue, parsePickupQrValue } from "./order-utils";

describe("restaurant order utilities", () => {
  it("creates a stable serial number", () => {
    expect(createOrderSerial(new Date("2026-08-07T08:00:00Z"), "ABC123")).toBe("MG-20260807-ABC123");
  });

  it("round-trips a pickup QR value", () => {
    const value = createPickupQrValue("order-42", "938271");
    expect(parsePickupQrValue(value)).toEqual({ orderId: "order-42", validationCode: "938271" });
  });

  it("rejects an invalid QR value", () => {
    expect(() => parsePickupQrValue("other:value")).toThrow("QR MiamGo invalide.");
  });
});
