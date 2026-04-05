import MercadoPagoConfig, { Customer, Payment, PreApproval, Preference } from "mercadopago"
import type {
  IPaymentProvider,
  CreateCustomerResult,
  ChargeCardResult,
  SetupIntentResult,
  PaymentLinkResult,
} from "./types"

function getMPClient(): MercadoPagoConfig {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado")
  return new MercadoPagoConfig({ accessToken: token })
}

export const mercadopagoProvider: IPaymentProvider = {
  async createCustomer({ email, gymId, memberId }): Promise<CreateCustomerResult> {
    const client = getMPClient()
    const customerClient = new Customer(client)

    // MercadoPago no tiene un endpoint explícito de customer, usamos email como ID único
    // Intentar buscar existente
    try {
      const existing = await customerClient.search({ options: { email } })
      const results = existing.results ?? []
      if (results.length > 0 && results[0]?.id) {
        return { customerId: results[0].id }
      }
    } catch {
      // Si falla la búsqueda, crear nuevo
    }

    const customer = await customerClient.create({
      body: {
        email,
        // metadata no soportado en CustomerRequestBody de MP SDK
        description: `gymId:${gymId} memberId:${memberId}`,
      },
    })

    return { customerId: customer.id ?? email }
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async chargeCard({ customerId, paymentMethodId, amount, currency, description, metadata }): Promise<ChargeCardResult> {
    const client = getMPClient()
    const paymentClient = new Payment(client)

    try {
      const payment = await paymentClient.create({
        body: {
          transaction_amount: amount / 100, // MP usa unidades, no centavos
          payment_method_id: paymentMethodId,
          payer: { id: customerId },
          description,
          metadata,
          capture: true,
        },
      })

      const status = payment.status === "approved" ? "succeeded" : payment.status === "pending" ? "pending" : "failed"

      return {
        paymentId: payment.id?.toString() ?? "",
        status,
        failureMessage: payment.status_detail ?? undefined,
      }
    } catch (e) {
      return {
        paymentId: "",
        status: "failed",
        failureMessage: e instanceof Error ? e.message : "Error de pago",
      }
    }
  },

  async createSetupIntent({ customerId, metadata }): Promise<SetupIntentResult> {
    // MercadoPago no tiene SetupIntent nativo — usamos PreApproval para obtener token
    const client = getMPClient()
    const preApproval = new PreApproval(client)

    const result = await preApproval.create({
      body: {
        payer_email: customerId, // en MP usamos email como referencia
        reason: "Registro de método de pago",
        external_reference: metadata.memberId ?? "",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 0,
          currency_id: "ARS",
        },
      },
    })

    return {
      clientSecret: result.id ?? "",
      setupIntentId: result.id ?? "",
    }
  },

  async createPaymentLink({ amount, currency, description, customerEmail, metadata, expiresInMinutes = 60 * 24 }): Promise<PaymentLinkResult> {
    const client = getMPClient()
    const preference = new Preference(client)

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)

    const result = await preference.create({
      body: {
        items: [
          {
            id: metadata.memberId ?? "member",
            title: description,
            quantity: 1,
            unit_price: amount / 100,
            currency_id: currency,
          },
        ],
        payer: { email: customerEmail },
        metadata,
        expiration_date_to: expiresAt.toISOString(),
        external_reference: metadata.memberId ?? "",
      },
    })

    return {
      url: result.init_point ?? "",
      expiresAt,
    }
  },
}
