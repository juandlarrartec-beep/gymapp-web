// Interface de abstracción para providers de pago
// Implementado por: Stripe (AR/MX) y MercadoPago (AR/CO/MX)

export interface CreateCustomerResult {
  customerId: string
}

export interface ChargeCardResult {
  paymentId: string
  chargeId?: string
  status: "succeeded" | "failed" | "pending"
  failureMessage?: string
}

export interface SetupIntentResult {
  clientSecret: string
  setupIntentId: string
}

export interface PaymentLinkResult {
  url: string
  expiresAt: Date
}

export interface IPaymentProvider {
  /**
   * Crear cliente en el proveedor de pagos
   */
  createCustomer(params: {
    email: string
    name: string
    gymId: string
    memberId: string
  }): Promise<CreateCustomerResult>

  /**
   * Cobrar a un cliente con su método de pago registrado
   */
  chargeCard(params: {
    customerId: string
    paymentMethodId: string
    amount: number
    currency: string
    description: string
    metadata: Record<string, string>
  }): Promise<ChargeCardResult>

  /**
   * Crear un SetupIntent para registrar un método de pago sin cobrar
   */
  createSetupIntent(params: {
    customerId: string
    metadata: Record<string, string>
  }): Promise<SetupIntentResult>

  /**
   * Crear link de pago único con expiración
   */
  createPaymentLink(params: {
    amount: number
    currency: string
    description: string
    customerEmail: string
    metadata: Record<string, string>
    expiresInMinutes?: number
  }): Promise<PaymentLinkResult>
}
