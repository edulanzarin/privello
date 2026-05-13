import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

export function getMPClient(): MercadoPagoConfig | null {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) return null;
  return new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
}

export { Preference, Payment };
