export function extractFedaPayTransactionId(payload) {
  const transaction = payload?.transaction || payload;
  return transaction?.id || transaction?.data?.id || transaction?.["v1/transaction"]?.id || transaction?.["v1/transaction"]?.data?.id || null;
}