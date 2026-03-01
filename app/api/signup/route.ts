import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const VALID_INVITE_CODES = ["HILLCREST2026", "PRIMEOS2026", "MARZIC2026"];

type Payload = {
  invite_code?: string;
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  store_name?: string;
  city_state?: string;
  pos_system?: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "store";
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const invite_code = (body.invite_code ?? "").trim().toUpperCase();
    const name = body.name?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim() || null;
    const password = body.password;
    const store_name = body.store_name?.trim();
    const city_state = body.city_state?.trim();
    const pos_system = body.pos_system?.trim() || null;

    if (!invite_code) {
      return NextResponse.json(
        { error: "Invalid invite code. PrimeOS is currently available by invitation only.", detail: "invite_code missing", step: "validate_invite" },
        { status: 400 }
      );
    }
    if (!VALID_INVITE_CODES.includes(invite_code)) {
      return NextResponse.json(
        { error: "Invalid invite code. PrimeOS is currently available by invitation only.", detail: `code: ${invite_code}`, step: "validate_invite" },
        { status: 400 }
      );
    }

    if (!name || !email || !phone || !password || !store_name || !city_state) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, phone, password, store_name, city_state", detail: "one or more required fields empty", step: "validate_fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters", detail: `length: ${password.length}`, step: "validate_password" },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address", detail: `email: ${email}`, step: "validate_email" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error", detail: "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing", step: "config" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        store_name,
        city_state,
        phone: phone ?? undefined,
        pos_system: pos_system ?? undefined,
        invite_code,
      },
    });

    if (userError) {
      const msg = userError.message || String(userError);
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return NextResponse.json({ error: "An account with this email already exists. Try logging in.", detail: msg, step: "createUser" }, { status: 400 });
      }
      if (msg.includes("password") || msg.includes("Password")) {
        return NextResponse.json({ error: "Password does not meet requirements. Use at least 8 characters.", detail: msg, step: "createUser" }, { status: 400 });
      }
      console.error("Signup createUser error:", userError);
      return NextResponse.json({ error: "Could not create account", detail: msg, step: "createUser" }, { status: 500 });
    }

    const userId = userData?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Account creation failed", detail: "userData.user.id missing after createUser", step: "createUser" }, { status: 500 });
    }

    const baseSlug = slugify(store_name);
    const slug = `${baseSlug}-${userId.slice(0, 8)}`;

    const storeRow: Record<string, unknown> = { name: store_name, slug };
    const { error: storeError } = await supabase.from("stores").insert(storeRow);

    if (storeError) {
      console.error("Signup stores insert error:", storeError);
      return NextResponse.json(
        { error: "Could not create store record", detail: storeError.message || String(storeError), step: "stores_insert" },
        { status: 500 }
      );
    }

    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const resend = new Resend(resendKey);
        const welcomeHtml = `
          <div style="background-color:#020617;padding:24px;font-family:system-ui,sans-serif;color:#F9FAFB;">
            <div style="max-width:560px;margin:0 auto;border-radius:16px;border:1px solid #374151;padding:24px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#F9FAFB;">
                <span style="color:#E65100;">PrimeOS</span> — You're In
              </h1>
              <p style="margin:0 0 16px;font-size:16px;color:#F9FAFB;">Welcome to PrimeOS, ${name.replace(/</g, "&lt;")}!</p>
              <p style="margin:0 0 16px;font-size:15px;color:#9CA3AF;">Your account is ready. Log in at <a href="https://getprimeos.com" style="color:#E65100;">getprimeos.com</a> and start exploring your dashboard.</p>
              <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#F9FAFB;">What's next:</p>
              <ol style="margin:0 0 16px;padding-left:20px;color:#9CA3AF;font-size:14px;line-height:1.8;">
                <li>Log in with your email and password</li>
                <li>Enter a few numbers about your store</li>
                <li>See your dashboard come alive</li>
              </ol>
              <p style="margin:16px 0 0;font-size:14px;color:#6B7280;">Questions? Reply to this email.</p>
            </div>
          </div>
        `;
        await resend.emails.send({
          from: "PrimeOS <onboarding@resend.dev>",
          to: email,
          subject: "Welcome to PrimeOS — You're In",
          html: welcomeHtml,
        });
      }

      const notifyHtml = `
        <div style="background-color:#020617;padding:24px;font-family:system-ui,sans-serif;color:#F9FAFB;">
          <div style="max-width:560px;margin:0 auto;border-radius:16px;border:1px solid #374151;padding:24px;">
            <h1 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#E65100;">New PrimeOS Signup</h1>
            <p style="margin:0 0 8px;font-size:14px;"><strong>Name:</strong> ${name.replace(/</g, "&lt;")}</p>
            <p style="margin:0 0 8px;font-size:14px;"><strong>Email:</strong> ${email.replace(/</g, "&lt;")}</p>
            <p style="margin:0 0 8px;font-size:14px;"><strong>Phone:</strong> ${(phone || "—").replace(/</g, "&lt;")}</p>
            <p style="margin:0 0 8px;font-size:14px;"><strong>Store Name:</strong> ${store_name.replace(/</g, "&lt;")}</p>
            <p style="margin:0 0 8px;font-size:14px;"><strong>City / State:</strong> ${city_state.replace(/</g, "&lt;")}</p>
            <p style="margin:0 0 8px;font-size:14px;"><strong>POS System:</strong> ${(pos_system || "—").replace(/</g, "&lt;")}</p>
            <p style="margin:0 0 0;font-size:14px;"><strong>Invite Code Used:</strong> ${invite_code.replace(/</g, "&lt;")}</p>
          </div>
        </div>
      `;
      if (resendKey) {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: "PrimeOS <onboarding@resend.dev>",
          to: "leeangelos.corp@gmail.com",
          subject: `New PrimeOS Signup — ${name} at ${store_name}`,
          html: notifyHtml,
        });
      }
    } catch (emailErr) {
      console.error("Signup email send error:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const ex = err instanceof Error ? err : new Error(String(err));
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong", detail: ex.message || String(err), step: "request" },
      { status: 500 }
    );
  }
}
