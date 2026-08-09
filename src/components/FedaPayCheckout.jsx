"use client";

import { forwardRef, useImperativeHandle, useState } from "react";

const FedaPayCheckout = forwardRef(function FedaPayCheckout({ transactionId, amount, description, customer, ready, onError, onComplete }, ref) {
  const [loading, setLoading] = useState(false);
  useImperativeHandle(ref, () => ({
    open: async () => {
      if (!ready || !window.FedaPay) throw new Error("Le widget FedaPay n'est pas encore chargé.");
      if (!transactionId) throw new Error("Transaction FedaPay absente.");
      setLoading(true);
      try {
        const response = await fetch("/api/fedapay/public-config");
        const config = await response.json();
        if (!response.ok) throw new Error(config.error);
        const widget = window.FedaPay.init({
          public_key: config.publicKey,
          transaction: { id: transactionId, amount, description },
          customer: { email: customer?.email || undefined },
          currency: { iso: "XOF" },
          onComplete,
        });
        if (!widget || typeof widget.open !== "function") throw new Error("FedaPay n'a pas retourné un widget ouvrable.");
        widget.open();
      } catch (error) {
        onError?.(error.message || "Impossible d'ouvrir FedaPay.");
        throw error;
      } finally { setLoading(false); }
    },
  }), [transactionId, amount, description, customer, ready, onError, onComplete]);
  return <span className="fedapay-widget-status">{loading ? "Ouverture de FedaPay..." : ""}</span>;
});

export default FedaPayCheckout;
