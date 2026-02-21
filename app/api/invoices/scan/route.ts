import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ ok: false, error: "No file uploaded" });
  }

  // Convert to base64
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: `You are an invoice scanner for a pizza restaurant. Extract all data from this vendor invoice image.

Return ONLY valid JSON with this exact structure, no other text:
{
  "vendor_name": "string",
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "total": number or null,
  "line_items": [
    {
      "product": "string - product name",
      "qty": number,
      "unit": "string - lb, oz, case, each, etc",
      "unit_price": number,
      "extended_price": number
    }
  ]
}

Rules:
- Extract every line item you can read
- Use the exact product names from the invoice
- unit_price is the per-unit cost
- extended_price is qty × unit_price (the line total)
- If you can't read a value clearly, use your best guess and note it
- The total should match the invoice total, not your sum of line items
- Return ONLY the JSON object, no markdown, no backticks, no explanation`,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    
    // Parse the JSON response
    let extraction;
    try {
      const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extraction = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ ok: false, error: "Failed to parse invoice data", raw: responseText });
    }

    return NextResponse.json({ ok: true, extraction });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Claude API error" });
  }
}
