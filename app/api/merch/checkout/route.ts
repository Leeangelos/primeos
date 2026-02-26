import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Stripe not configured" }, { status: 500 });
  }
  try {
    const supabase = await getClientForRoute();
    const body = await req.json();
    const { employee_name, employee_email, items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ ok: false, error: "No items in cart" });
    }

    const subtotal = items.reduce((s: number, i: any) => s + (Number(i.price) * Number(i.qty) || 0), 0);
    const tax = +(subtotal * 0.075).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("merch_orders")
      .insert({
        employee_name: employee_name || "Team Member",
        employee_email: employee_email || null,
        items,
        subtotal: +subtotal.toFixed(2),
        tax,
        total,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) return NextResponse.json({ ok: false, error: orderError.message });

    // Create Stripe checkout session
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.name}${item.size ? ` (${item.size})` : ""}`,
          description: `${item.brand === "lindseys" ? "Lindsey's Pizza" : "LeeAngelo's Pizza"} Team Merch`,
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: Number(item.qty) || 1,
    }));

    // Add tax as line item
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Sales Tax (7.5%)",
            description: "Ohio sales tax",
          },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      });
    }

    const origin = req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: employee_email || undefined,
      line_items: lineItems,
      metadata: {
        order_id: order.id,
        employee_name: employee_name || "",
      },
      success_url: `${origin}/merch?success=true&order=${order.id}`,
      cancel_url: `${origin}/merch?canceled=true`,
    });

    // Update order with stripe session id
    await supabase
      .from("merch_orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message });
  }
}
