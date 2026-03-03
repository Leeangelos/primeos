import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = (body.name as string)?.trim();
    const email = (body.email as string)?.trim();
    const phone = (body.phone as string)?.trim() || null;
    const business_name = (body.business_name as string)?.trim();
    const business_type = (body.business_type as string)?.trim();
    const city_state = (body.city_state as string)?.trim() || null;
    const locations = (body.locations as string)?.trim() || null;
    const weekly_sales = (body.weekly_sales as string)?.trim() || null;
    const years_in_business = (body.years_in_business as string)?.trim() || null;
    const biggest_challenge = (body.biggest_challenge as string)?.trim() || null;
    const referral_source = (body.referral_source as string)?.trim() || null;
    const message = (body.message as string)?.trim() || null;

    if (!name || !email || !business_name || !business_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error: dbError } = await supabase.from("waitlist").insert({
      name,
      email,
      phone: phone || null,
      business_name,
      business_type,
      city_state: city_state || null,
      locations: locations || null,
      weekly_sales: weekly_sales || null,
      years_in_business: years_in_business || null,
      biggest_challenge: biggest_challenge || null,
      referral_source: referral_source || null,
      message: message || null,
      status: "new",
    });

    if (dbError) {
      console.error("Waitlist insert error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const isPizza = business_type === "pizza";
    const leadType = isPizza ? "🍕 PIZZA OPERATOR — Fast Track" : "📋 FOOD BUSINESS — Hillcrest Lead";

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: "PrimeOS <onboarding@resend.dev>",
          to: "leeangelos.corp@gmail.com",
          subject: `PrimeOS Waitlist: ${business_name} (${business_type})`,
          html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px;">
          <h2 style="color: #E65100;">${leadType}</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          <p><strong>Business:</strong> ${business_name}</p>
          <p><strong>Type:</strong> ${business_type}</p>
          <p><strong>City/State:</strong> ${city_state || "Not provided"}</p>
          <p><strong>Locations:</strong> ${locations || "Not provided"}</p>
          <p><strong>Weekly Sales:</strong> ${weekly_sales || "Not provided"}</p>
          <p><strong>Years in Business:</strong> ${years_in_business || "Not provided"}</p>
          <p><strong>Biggest Challenge:</strong> ${biggest_challenge || "Not provided"}</p>
          <p><strong>How They Heard About Us:</strong> ${referral_source || "Not provided"}</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
          <hr style="border-color: #3f3f46;" />
          <p style="color: #71717a; font-size: 12px;">
            ${isPizza
              ? "This operator sells pizza. Consider sending them an invite code directly."
              : "This is a non-pizza food business. Consider passing this lead to Hillcrest."}
          </p>
        </div>
      `,
        });
      } catch (emailErr) {
        console.error("Waitlist email error:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
