const retiredGateways = new Set(["mercadopago", "paystack", "midtrans"]);
const implementedBillingGateways = new Set(["stripe", "paddle", "manual"]);

export function isRetiredGateway(id: string): boolean {
  return retiredGateways.has(id);
}

export function isImplementedBillingGateway(id: string): boolean {
  return implementedBillingGateways.has(id);
}

export function assertImplementedBillingGateway(id: string): void {
  if (!isImplementedBillingGateway(id)) {
    throw new Error("This gateway has no active platform billing adapter.");
  }
}
