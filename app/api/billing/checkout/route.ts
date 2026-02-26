import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Stripe not configured" }, { status: 500 });
  }
  try {
    const body = await req.json();
    const { priceId, customerEmail, locationName, locationCount } = body;

    if (!priceId) {
      return NextResponse.json({ ok: false, error: "Missing priceId" });
    }

    const origin = req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price: priceId,
          quantity: locationCount || 1,
        },
      ],
      subscription_data: {
        metadata: {
          plan: "founding_operator",
          locations: locationName || "1 location",
          guarantee: "90-day money-back",
        },
      },
      metadata: {
        locationName: locationName || "",
      },
      success_url: `${origin}/billing?success=true`,
      cancel_url: `${origin}/billing?canceled=true`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message });
  }
}
