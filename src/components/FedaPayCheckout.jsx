"use client";

import { forwardRef, useImperativeHandle, useState } from "react";

const FedaPayCheckout = forwardRef(function FedaPayCheckout({ transactionId, customer, onError }, ref) {
  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    open: async () => {
      if (!transactionId) throw new Error("Transaction FedaPay absente.");
      setLoading(true);
      try {
        if (!window.FedaPay) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.fedapay.com/checkout.js?v=1.1.7";
            script.onload = resolve;
            script.onerror = () => reject(new Error("Impossible de charger FedaPay."));
            document.body.appendChild(script);
          });
        }
        const response = await fetch("/api/fedapay/public-config");
        const config = await response.json();
        if (!response.ok) throw new Error(config.error);
        window.FedaPay.init({ public_key: config.publicKey, transaction: { id: transactionId }, customer: { email: customer?.email || undefined } });
        window.FedaPay.open();
      } catch (error) {
        onError?.(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
  }), [transactionId, customer, onError]);

  return <span className="fedapay-widget-status">{loading ? "Ouverture de FedaPay..." : ""}</span>;
});

export default FedaPayCheckout;
