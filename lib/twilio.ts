import twilio from "twilio";

/**
 * Send an SMS via Twilio.
 * Uses TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from env.
 */
export async function sendSMS(
  to: string,
  from: string,
  body: string
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
  }
  const client = twilio(accountSid, authToken);
  await client.messages.create({ to, from, body });
}
