import Stripe from "stripe"
import type {
  IPaymentProvider,
  CreateCustomerResult,
  ChargeCardResult,
  SetupIntentResult,
  PaymentLinkResult,
} from "./types"

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY no configurado")
  return new Stripe(key, { apiVersion: "2024-06-20" })
}

export const stripeProvider: IPaymentProvider = {
  async createCustomer({ email, name, gymId, memberId }): Promise<CreateCustomerResult> {
    const stripe = getStripeClient()
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { gymId, memberId },
    })
    return { customerId: customer.id }
  },

  async chargeCard({ customerId, paymentMethodId, amount, currency, description, metadata }): Promise<ChargeCardResult> {
    const stripe = getStripeClient()
    try {
      const intent = await stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
        description,
        metadata,
        off_session: true,
      })

      return {
        paymentId: intent.id,
        chargeId: intent.latest_charge as string | undefined,
        status: intent.status === "succeeded" ? "succeeded" : "pending",
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de pago"
      return {
        paymentId: "",
        status: "failed",
        failureMessage: msg,
      }
    }
  },

  async createSetupIntent({ customerId, metadata }): Promise<SetupIntentResult> {
    const stripe = getStripeClient()
    const intent = await stripe.setupIntents.create({
      customer: customerId,
      usage: "off_session",
      metadata,
    })
    return {
      clientSecret: intent.client_secret ?? "",
      setupIntentId: intent.id,
    }
  },

  async createPaymentLink({ amount, currency, description, customerEmail, metadata, expiresInMinutes = 60 * 24 }): Promise<PaymentLinkResult> {
    const stripe = getStripeClient()

    // Crear precio ad-hoc
    const price = await stripe.prices.create({
      unit_amount: amount,
      currency: currency.toLowerCase(),
      product_data: { name: description },
    })

    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { ...metadata, customerEmail },
    })

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)

    return {
      url: link.url,
      expiresAt,
    }
  },
}
