import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

type Payload = {
  name?: string;
  email?: string;
  phone?: string;
  storeName?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const name = body.name?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim() || null;
    const storeName = body.storeName?.trim();

    if (!name || !email || !storeName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.from("access_requests").insert({
      name,
      email,
      phone,
      store_name: storeName,
    });

    if (error) {
      console.error("Error inserting access request:", error);
      return NextResponse.json(
        { error: "Failed to save request" },
        { status: 500 }
      );
    }

    // Fire-and-forget email notification; do not block user response.
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const resend = new Resend(resendKey);
        const timestamp = new Date().toISOString();
        const safePhone = phone && phone.trim().length > 0 ? phone : "Not provided";
        const html = `
          <div style="background-color:#020617;padding:24px;font-family:System,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#F9FAFB;">
            <div style="max-width:600px;margin:0 auto;border-radius:16px;background-color:#020617;border:1px solid #1F2937;padding:24px;">
              <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#F9FAFB;">
                <span style="color:#E65100;">PrimeOS</span> · New Access Request
              </h1>
              <p style="margin:0 0 16px;font-size:14px;color:#9CA3AF;">
                Someone just requested access from the public landing page.
              </p>
              <div style="margin:16px 0;padding:16px;border-radius:12px;background-color:#020617;border:1px solid #1F2937;">
                <p style="margin:0 0 8px;font-size:14px;"><strong style="color:#F9FAFB;">Name:</strong> ${name}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong style="color:#F9FAFB;">Email:</strong> ${email}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong style="color:#F9FAFB;">Phone:</strong> ${safePhone}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong style="color:#F9FAFB;">Store Name:</strong> ${storeName}</p>
                <p style="margin:8px 0 0;font-size:12px;color:#9CA3AF;"><strong style="color:#F9FAFB;">Received:</strong> ${timestamp}</p>
              </div>
              <p style="margin:16px 0 0;font-size:12px;color:#6B7280;">
                This email was generated automatically by the PrimeOS landing page.
              </p>
            </div>
          </div>
        `;

        await resend.emails.send({
          from: "PrimeOS <onboarding@resend.dev>",
          to: "leeangelos.corp@gmail.com",
          subject: `New PrimeOS Access Request — ${name}`,
          html,
        });
      } else {
        console.error("RESEND_API_KEY is not configured; skipping email send.");
      }
    } catch (emailError) {
      console.error("Error sending access request email:", emailError);
      // Do not fail the request if email sending fails.
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error in access request:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}

