import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function getStoreId(slug: string): Promise<string | null> {
  const { data } = await supabase.from("stores").select("id").eq("slug", slug).single();
  return data?.id || null;
}

async function seed() {
  const kent = await getStoreId("kent");
  const aurora = await getStoreId("aurora");
  const lindseys = await getStoreId("lindseys");

  if (!kent || !aurora || !lindseys) {
    console.log("Missing store IDs:", { kent, aurora, lindseys });
    return;
  }

  const employees = [
    // Kent - Active
    { store_id: kent, name: "Rosario Gonzales", role: "shift_lead", pay_rate: 16.00, hire_date: "2024-03-15", status: "active", source: "Family" },
    { store_id: kent, name: "Marcus Williams", role: "driver", pay_rate: 12.00, hire_date: "2024-08-01", status: "active", source: "Indeed" },
    { store_id: kent, name: "Ashley Torres", role: "cook", pay_rate: 14.50, hire_date: "2024-11-10", status: "active", source: "Walk-in" },
    { store_id: kent, name: "Brandon Smith", role: "cook", pay_rate: 14.00, hire_date: "2025-01-05", status: "active", source: "Indeed" },
    { store_id: kent, name: "Destiny Johnson", role: "cashier", pay_rate: 12.50, hire_date: "2025-06-15", status: "active", source: "Referral" },
    { store_id: kent, name: "Tyler Brown", role: "driver", pay_rate: 12.00, hire_date: "2025-09-01", status: "active", source: "Craigslist" },
    { store_id: kent, name: "Kayla Martinez", role: "team", pay_rate: 12.00, hire_date: "2025-12-01", status: "active", source: "Indeed" },
    // Kent - Exited
    { store_id: kent, name: "Derek Hall", role: "cook", pay_rate: 14.00, hire_date: "2024-06-01", exit_date: "2024-09-15", exit_reason: "Scheduling", status: "exited", source: "Indeed" },
    { store_id: kent, name: "Jasmine Lee", role: "cashier", pay_rate: 12.00, hire_date: "2024-10-01", exit_date: "2024-12-20", exit_reason: "Pay", status: "exited", source: "Walk-in" },
    { store_id: kent, name: "Chris Evans", role: "driver", pay_rate: 11.50, hire_date: "2025-03-01", exit_date: "2025-05-10", exit_reason: "No call/no show", status: "exited", source: "Craigslist" },
    { store_id: kent, name: "Mia Davis", role: "team", pay_rate: 12.00, hire_date: "2025-07-15", exit_date: "2025-09-30", exit_reason: "School", status: "exited", source: "Referral" },
    { store_id: kent, name: "Jake Thompson", role: "cook", pay_rate: 13.50, hire_date: "2025-10-01", exit_date: "2025-12-15", exit_reason: "Management", status: "exited", source: "Indeed" },
    { store_id: kent, name: "Brianna Wilson", role: "cashier", pay_rate: 12.00, hire_date: "2026-01-05", exit_date: "2026-02-10", exit_reason: "No call/no show", status: "exited", source: "Walk-in" },

    // Aurora - Active
    { store_id: aurora, name: "Greg Patterson", role: "manager", pay_rate: 18.00, hire_date: "2023-06-01", status: "active", source: "Internal" },
    { store_id: aurora, name: "Samantha Cruz", role: "shift_lead", pay_rate: 15.50, hire_date: "2024-02-10", status: "active", source: "Referral" },
    { store_id: aurora, name: "Darius Jackson", role: "cook", pay_rate: 14.50, hire_date: "2024-07-01", status: "active", source: "Indeed" },
    { store_id: aurora, name: "Nicole Adams", role: "cashier", pay_rate: 12.50, hire_date: "2025-01-15", status: "active", source: "Walk-in" },
    { store_id: aurora, name: "Kevin Moore", role: "driver", pay_rate: 12.00, hire_date: "2025-04-01", status: "active", source: "Indeed" },
    { store_id: aurora, name: "Alexis Rivera", role: "team", pay_rate: 12.00, hire_date: "2025-11-01", status: "active", source: "Referral" },
    // Aurora - Exited
    { store_id: aurora, name: "Ryan Cooper", role: "cook", pay_rate: 14.00, hire_date: "2024-05-01", exit_date: "2024-08-20", exit_reason: "Pay", status: "exited", source: "Indeed" },
    { store_id: aurora, name: "Taylor White", role: "driver", pay_rate: 11.50, hire_date: "2024-09-15", exit_date: "2025-01-05", exit_reason: "Scheduling", status: "exited", source: "Craigslist" },
    { store_id: aurora, name: "Jordan Clark", role: "team", pay_rate: 12.00, hire_date: "2025-05-01", exit_date: "2025-07-15", exit_reason: "Personal", status: "exited", source: "Walk-in" },
    { store_id: aurora, name: "Emma Lewis", role: "cashier", pay_rate: 12.00, hire_date: "2025-08-01", exit_date: "2025-10-20", exit_reason: "School", status: "exited", source: "Indeed" },

    // Lindsey's - Active
    { store_id: lindseys, name: "Lindsey Gonzales", role: "manager", pay_rate: 19.00, hire_date: "2022-01-01", status: "active", source: "Family" },
    { store_id: lindseys, name: "Maria Hernandez", role: "shift_lead", pay_rate: 16.00, hire_date: "2023-03-15", status: "active", source: "Referral" },
    { store_id: lindseys, name: "James Rodriguez", role: "cook", pay_rate: 15.00, hire_date: "2023-09-01", status: "active", source: "Indeed" },
    { store_id: lindseys, name: "Sarah Kim", role: "cook", pay_rate: 14.50, hire_date: "2024-04-01", status: "active", source: "Walk-in" },
    { store_id: lindseys, name: "David Chen", role: "driver", pay_rate: 13.00, hire_date: "2024-08-15", status: "active", source: "Indeed" },
    { store_id: lindseys, name: "Amy Nguyen", role: "cashier", pay_rate: 13.00, hire_date: "2025-02-01", status: "active", source: "Referral" },
    { store_id: lindseys, name: "Carlos Ruiz", role: "cook", pay_rate: 14.00, hire_date: "2025-05-15", status: "active", source: "Indeed" },
    { store_id: lindseys, name: "Jessica Taylor", role: "driver", pay_rate: 12.50, hire_date: "2025-08-01", status: "active", source: "Walk-in" },
    { store_id: lindseys, name: "Omar Hassan", role: "team", pay_rate: 12.50, hire_date: "2025-11-15", status: "active", source: "Indeed" },
    { store_id: lindseys, name: "Lisa Park", role: "team", pay_rate: 12.00, hire_date: "2026-01-10", status: "active", source: "Craigslist" },
    // Lindsey's - Exited
    { store_id: lindseys, name: "Mike Johnson", role: "cook", pay_rate: 14.00, hire_date: "2024-01-15", exit_date: "2024-06-30", exit_reason: "Pay", status: "exited", source: "Indeed" },
    { store_id: lindseys, name: "Rachel Green", role: "cashier", pay_rate: 12.00, hire_date: "2024-07-01", exit_date: "2024-09-15", exit_reason: "No call/no show", status: "exited", source: "Walk-in" },
    { store_id: lindseys, name: "Tony Stark", role: "driver", pay_rate: 12.00, hire_date: "2024-10-01", exit_date: "2025-01-20", exit_reason: "Scheduling", status: "exited", source: "Craigslist" },
    { store_id: lindseys, name: "Hannah Lee", role: "team", pay_rate: 11.50, hire_date: "2025-03-15", exit_date: "2025-05-01", exit_reason: "Management", status: "exited", source: "Indeed" },
    { store_id: lindseys, name: "Ethan Brown", role: "cook", pay_rate: 13.50, hire_date: "2025-06-01", exit_date: "2025-08-30", exit_reason: "Pay", status: "exited", source: "Referral" },
    { store_id: lindseys, name: "Sophie Wang", role: "cashier", pay_rate: 12.00, hire_date: "2025-10-01", exit_date: "2026-01-05", exit_reason: "Personal", status: "exited", source: "Walk-in" },
  ];

  for (const emp of employees) {
    const { error } = await supabase.from("employees").insert(emp);
    if (error) {
      console.log("ERROR:", emp.name, error.message);
    } else {
      console.log("OK:", emp.name, emp.role, emp.status, emp.store_id === kent ? "Kent" : emp.store_id === aurora ? "Aurora" : "Lindsey's");
    }
  }

  console.log(`\nDone. ${employees.length} employees seeded.`);
}

seed();
