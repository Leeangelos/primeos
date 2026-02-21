import { NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET() {
  const supabase = await getClientForRoute();
  const { data, error } = await supabase.from("trusted_contacts").select("*").limit(0);

  // Try inserting a minimal row to see what error we get
  const { data: testData, error: testError } = await supabase
    .from("trusted_contacts")
    .insert({ name: "TEST", category: "vendor" })
    .select()
    .single();

  // If it worked, delete it
  if (testData?.id) {
    await supabase.from("trusted_contacts").delete().eq("id", testData.id);
  }

  return NextResponse.json({
    selectError: error?.message || null,
    insertError: testError?.message || null,
    insertedRow: testData,
  });
}
