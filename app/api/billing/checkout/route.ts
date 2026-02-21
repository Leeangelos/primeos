import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: NextRequest) {
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
