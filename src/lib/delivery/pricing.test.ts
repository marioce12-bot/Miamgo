import { describe, expect, it } from "vitest";
import { deliveryQuote, distanceInKm } from "./pricing";

describe("delivery pricing", () => {
  it("calculates geographic distance", () => {
    expect(distanceInKm({ latitude: 6.37, longitude: 2.42 }, { latitude: 6.38, longitude: 2.42 })).toBeCloseTo(1.11, 1);
  });

  it("includes base price and price per kilometre", () => {
    expect(deliveryQuote({ latitude: 6.37, longitude: 2.42 }, { latitude: 6.38, longitude: 2.42 }, { basePrice: 500, pricePerKm: 250 })).toEqual({ distanceKm: 1.1, price: 775 });
  });
});
