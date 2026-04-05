import type { IPaymentProvider } from "./types"
import { stripeProvider } from "./stripe"
import { mercadopagoProvider } from "./mercadopago"

// Factory: selecciona el provider según el país del gym
// AR → MercadoPago (por defecto), CO → MercadoPago, MX → Stripe
export function getPaymentProvider(country: string): IPaymentProvider {
  switch (country.toUpperCase()) {
    case "MX":
      return stripeProvider
    case "AR":
    case "CO":
    default:
      return mercadopagoProvider
  }
}

export { stripeProvider, mercadopagoProvider }
export type { IPaymentProvider } from "./types"
