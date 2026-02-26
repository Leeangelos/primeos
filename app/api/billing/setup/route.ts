import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : null;

// Creates the PrimeOS product and price in Stripe if they don't exist
export async function POST() {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  try {
    // Check if product already exists
    const products = await stripe.products.list({ limit: 10 });
    let product = products.data.find((p) => p.name === "PrimeOS - 90-Day Pizza Profit System");

    if (!product) {
      product = await stripe.products.create({
        name: "PrimeOS - 90-Day Pizza Profit System",
        description: "The only operating system built for independent pizzeria operators. $199/mo per location. Founding operator rate locked forever.",
        metadata: {
          plan: "founding",
          guarantee: "90-day money-back",
        },
      });
    }

    // Check if price exists
    const prices = await stripe.prices.list({ product: product.id, limit: 10 });
    let price = prices.data.find((p) => p.unit_amount === 19900 && p.recurring?.interval === "month");

    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: 19900, // $199.00
        currency: "usd",
        recurring: { interval: "month" },
        metadata: {
          plan: "founding",
          rate: "locked",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      productId: product.id,
      priceId: price.id,
      amount: "$199/mo",
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message });
  }
}
