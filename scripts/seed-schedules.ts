import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function getStoreId(slug: string): Promise<string | null> {
  const { data } = await supabase.from("stores").select("id").eq("slug", slug).single();
  return data?.id || null;
}

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return +((eh + em / 60) - (sh + sm / 60)).toFixed(2);
}

async function seed() {
  const kent = await getStoreId("kent");
  const aurora = await getStoreId("aurora");
  const lindseys = await getStoreId("lindseys");

  if (!kent || !aurora || !lindseys) {
    console.log("Missing store IDs:", { kent, aurora, lindseys });
    return;
  }

  // Current week: Feb 23 - Mar 1 (Mon-Sun)
  const weekStart = "2026-02-23";
  
  const shifts = [
    // Kent - Monday
    { store_id: kent, employee_name: "Rosario Gonzales", role: "shift_lead", shift_date: "2026-02-23", start_time: "10:00", end_time: "18:00", pay_rate: 16 },
    { store_id: kent, employee_name: "Ashley Torres", role: "cook", shift_date: "2026-02-23", start_time: "10:00", end_time: "17:00", pay_rate: 14.50 },
    { store_id: kent, employee_name: "Marcus Williams", role: "driver", shift_date: "2026-02-23", start_time: "11:00", end_time: "19:00", pay_rate: 12 },
    { store_id: kent, employee_name: "Destiny Johnson", role: "cashier", shift_date: "2026-02-23", start_time: "11:00", end_time: "17:00", pay_rate: 12.50 },
    // Kent - Tuesday
    { store_id: kent, employee_name: "Rosario Gonzales", role: "shift_lead", shift_date: "2026-02-24", start_time: "10:00", end_time: "18:00", pay_rate: 16 },
    { store_id: kent, employee_name: "Brandon Smith", role: "cook", shift_date: "2026-02-24", start_time: "10:00", end_time: "17:00", pay_rate: 14 },
    { store_id: kent, employee_name: "Tyler Brown", role: "driver", shift_date: "2026-02-24", start_time: "11:00", end_time: "19:00", pay_rate: 12 },
    { store_id: kent, employee_name: "Kayla Martinez", role: "team", shift_date: "2026-02-24", start_time: "16:00", end_time: "21:00", pay_rate: 12 },
    // Kent - Wednesday
    { store_id: kent, employee_name: "Rosario Gonzales", role: "shift_lead", shift_date: "2026-02-25", start_time: "10:00", end_time: "18:00", pay_rate: 16 },
    { store_id: kent, employee_name: "Ashley Torres", role: "cook", shift_date: "2026-02-25", start_time: "10:00", end_time: "18:00", pay_rate: 14.50 },
    { store_id: kent, employee_name: "Brandon Smith", role: "cook", shift_date: "2026-02-25", start_time: "16:00", end_time: "22:00", pay_rate: 14 },
    { store_id: kent, employee_name: "Marcus Williams", role: "driver", shift_date: "2026-02-25", start_time: "11:00", end_time: "20:00", pay_rate: 12 },
    { store_id: kent, employee_name: "Destiny Johnson", role: "cashier", shift_date: "2026-02-25", start_time: "11:00", end_time: "18:00", pay_rate: 12.50 },
    // Kent - Thursday
    { store_id: kent, employee_name: "Rosario Gonzales", role: "shift_lead", shift_date: "2026-02-26", start_time: "10:00", end_time: "18:00", pay_rate: 16 },
    { store_id: kent, employee_name: "Ashley Torres", role: "cook", shift_date: "2026-02-26", start_time: "10:00", end_time: "17:00", pay_rate: 14.50 },
    { store_id: kent, employee_name: "Tyler Brown", role: "driver", shift_date: "2026-02-26", start_time: "11:00", end_time: "19:00", pay_rate: 12 },
    { store_id: kent, employee_name: "Kayla Martinez", role: "team", shift_date: "2026-02-26", start_time: "16:00", end_time: "21:00", pay_rate: 12 },
    // Kent - Friday
    { store_id: kent, employee_name: "Rosario Gonzales", role: "shift_lead", shift_date: "2026-02-27", start_time: "10:00", end_time: "20:00", pay_rate: 16 },
    { store_id: kent, employee_name: "Ashley Torres", role: "cook", shift_date: "2026-02-27", start_time: "10:00", end_time: "20:00", pay_rate: 14.50 },
    { store_id: kent, employee_name: "Brandon Smith", role: "cook", shift_date: "2026-02-27", start_time: "16:00", end_time: "23:00", pay_rate: 14 },
    { store_id: kent, employee_name: "Marcus Williams", role: "driver", shift_date: "2026-02-27", start_time: "11:00", end_time: "21:00", pay_rate: 12 },
    { store_id: kent, employee_name: "Tyler Brown", role: "driver", shift_date: "2026-02-27", start_time: "16:00", end_time: "23:00", pay_rate: 12 },
    { store_id: kent, employee_name: "Destiny Johnson", role: "cashier", shift_date: "2026-02-27", start_time: "11:00", end_time: "20:00", pay_rate: 12.50 },
    { store_id: kent, employee_name: "Kayla Martinez", role: "team", shift_date: "2026-02-27", start_time: "16:00", end_time: "23:00", pay_rate: 12 },
    // Kent - Saturday
    { store_id: kent, employee_name: "Rosario Gonzales", role: "shift_lead", shift_date: "2026-02-28", start_time: "10:00", end_time: "20:00", pay_rate: 16 },
    { store_id: kent, employee_name: "Ashley Torres", role: "cook", shift_date: "2026-02-28", start_time: "10:00", end_time: "18:00", pay_rate: 14.50 },
    { store_id: kent, employee_name: "Brandon Smith", role: "cook", shift_date: "2026-02-28", start_time: "14:00", end_time: "22:00", pay_rate: 14 },
    { store_id: kent, employee_name: "Marcus Williams", role: "driver", shift_date: "2026-02-28", start_time: "11:00", end_time: "21:00", pay_rate: 12 },
    { store_id: kent, employee_name: "Destiny Johnson", role: "cashier", shift_date: "2026-02-28", start_time: "11:00", end_time: "19:00", pay_rate: 12.50 },
    { store_id: kent, employee_name: "Kayla Martinez", role: "team", shift_date: "2026-02-28", start_time: "14:00", end_time: "22:00", pay_rate: 12 },
    // Kent - Sunday
    { store_id: kent, employee_name: "Rosario Gonzales", role: "shift_lead", shift_date: "2026-03-01", start_time: "11:00", end_time: "19:00", pay_rate: 16 },
    { store_id: kent, employee_name: "Brandon Smith", role: "cook", shift_date: "2026-03-01", start_time: "11:00", end_time: "19:00", pay_rate: 14 },
    { store_id: kent, employee_name: "Tyler Brown", role: "driver", shift_date: "2026-03-01", start_time: "11:00", end_time: "18:00", pay_rate: 12 },

    // Aurora - Monday
    { store_id: aurora, employee_name: "Greg Patterson", role: "manager", shift_date: "2026-02-23", start_time: "9:00", end_time: "17:00", pay_rate: 18 },
    { store_id: aurora, employee_name: "Darius Jackson", role: "cook", shift_date: "2026-02-23", start_time: "10:00", end_time: "17:00", pay_rate: 14.50 },
    { store_id: aurora, employee_name: "Kevin Moore", role: "driver", shift_date: "2026-02-23", start_time: "11:00", end_time: "19:00", pay_rate: 12 },
    { store_id: aurora, employee_name: "Nicole Adams", role: "cashier", shift_date: "2026-02-23", start_time: "11:00", end_time: "17:00", pay_rate: 12.50 },
    // Aurora - Tuesday
    { store_id: aurora, employee_name: "Greg Patterson", role: "manager", shift_date: "2026-02-24", start_time: "9:00", end_time: "17:00", pay_rate: 18 },
    { store_id: aurora, employee_name: "Samantha Cruz", role: "shift_lead", shift_date: "2026-02-24", start_time: "10:00", end_time: "18:00", pay_rate: 15.50 },
    { store_id: aurora, employee_name: "Darius Jackson", role: "cook", shift_date: "2026-02-24", start_time: "10:00", end_time: "18:00", pay_rate: 14.50 },
    { store_id: aurora, employee_name: "Kevin Moore", role: "driver", shift_date: "2026-02-24", start_time: "11:00", end_time: "19:00", pay_rate: 12 },
    // Aurora - Wednesday
    { store_id: aurora, employee_name: "Greg Patterson", role: "manager", shift_date: "2026-02-25", start_time: "9:00", end_time: "17:00", pay_rate: 18 },
    { store_id: aurora, employee_name: "Darius Jackson", role: "cook", shift_date: "2026-02-25", start_time: "10:00", end_time: "18:00", pay_rate: 14.50 },
    { store_id: aurora, employee_name: "Alexis Rivera", role: "team", shift_date: "2026-02-25", start_time: "16:00", end_time: "22:00", pay_rate: 12 },
    { store_id: aurora, employee_name: "Nicole Adams", role: "cashier", shift_date: "2026-02-25", start_time: "11:00", end_time: "18:00", pay_rate: 12.50 },
    { store_id: aurora, employee_name: "Kevin Moore", role: "driver", shift_date: "2026-02-25", start_time: "11:00", end_time: "20:00", pay_rate: 12 },
    // Aurora - Thursday
    { store_id: aurora, employee_name: "Samantha Cruz", role: "shift_lead", shift_date: "2026-02-26", start_time: "10:00", end_time: "18:00", pay_rate: 15.50 },
    { store_id: aurora, employee_name: "Darius Jackson", role: "cook", shift_date: "2026-02-26", start_time: "10:00", end_time: "17:00", pay_rate: 14.50 },
    { store_id: aurora, employee_name: "Kevin Moore", role: "driver", shift_date: "2026-02-26", start_time: "11:00", end_time: "19:00", pay_rate: 12 },
    { store_id: aurora, employee_name: "Alexis Rivera", role: "team", shift_date: "2026-02-26", start_time: "16:00", end_time: "21:00", pay_rate: 12 },
    // Aurora - Friday
    { store_id: aurora, employee_name: "Greg Patterson", role: "manager", shift_date: "2026-02-27", start_time: "9:00", end_time: "19:00", pay_rate: 18 },
    { store_id: aurora, employee_name: "Samantha Cruz", role: "shift_lead", shift_date: "2026-02-27", start_time: "10:00", end_time: "20:00", pay_rate: 15.50 },
    { store_id: aurora, employee_name: "Darius Jackson", role: "cook", shift_date: "2026-02-27", start_time: "10:00", end_time: "20:00", pay_rate: 14.50 },
    { store_id: aurora, employee_name: "Kevin Moore", role: "driver", shift_date: "2026-02-27", start_time: "11:00", end_time: "21:00", pay_rate: 12 },
    { store_id: aurora, employee_name: "Nicole Adams", role: "cashier", shift_date: "2026-02-27", start_time: "11:00", end_time: "20:00", pay_rate: 12.50 },
    { store_id: aurora, employee_name: "Alexis Rivera", role: "team", shift_date: "2026-02-27", start_time: "16:00", end_time: "23:00", pay_rate: 12 },
    // Aurora - Saturday
    { store_id: aurora, employee_name: "Greg Patterson", role: "manager", shift_date: "2026-02-28", start_time: "10:00", end_time: "20:00", pay_rate: 18 },
    { store_id: aurora, employee_name: "Samantha Cruz", role: "shift_lead", shift_date: "2026-02-28", start_time: "10:00", end_time: "20:00", pay_rate: 15.50 },
    { store_id: aurora, employee_name: "Darius Jackson", role: "cook", shift_date: "2026-02-28", start_time: "10:00", end_time: "19:00", pay_rate: 14.50 },
    { store_id: aurora, employee_name: "Kevin Moore", role: "driver", shift_date: "2026-02-28", start_time: "11:00", end_time: "21:00", pay_rate: 12 },
    { store_id: aurora, employee_name: "Nicole Adams", role: "cashier", shift_date: "2026-02-28", start_time: "11:00", end_time: "19:00", pay_rate: 12.50 },
    { store_id: aurora, employee_name: "Alexis Rivera", role: "team", shift_date: "2026-02-28", start_time: "14:00", end_time: "22:00", pay_rate: 12 },
    // Aurora - Sunday
    { store_id: aurora, employee_name: "Samantha Cruz", role: "shift_lead", shift_date: "2026-03-01", start_time: "11:00", end_time: "19:00", pay_rate: 15.50 },
    { store_id: aurora, employee_name: "Darius Jackson", role: "cook", shift_date: "2026-03-01", start_time: "11:00", end_time: "18:00", pay_rate: 14.50 },
    { store_id: aurora, employee_name: "Kevin Moore", role: "driver", shift_date: "2026-03-01", start_time: "11:00", end_time: "18:00", pay_rate: 12 },

    // Lindsey's - Monday
    { store_id: lindseys, employee_name: "Lindsey Gonzales", role: "manager", shift_date: "2026-02-23", start_time: "9:00", end_time: "17:00", pay_rate: 19 },
    { store_id: lindseys, employee_name: "Maria Hernandez", role: "shift_lead", shift_date: "2026-02-23", start_time: "10:00", end_time: "18:00", pay_rate: 16 },
    { store_id: lindseys, employee_name: "James Rodriguez", role: "cook", shift_date: "2026-02-23", start_time: "10:00", end_time: "17:00", pay_rate: 15 },
    { store_id: lindseys, employee_name: "David Chen", role: "driver", shift_date: "2026-02-23", start_time: "11:00", end_time: "19:00", pay_rate: 13 },
    { store_id: lindseys, employee_name: "Amy Nguyen", role: "cashier", shift_date: "2026-02-23", start_time: "11:00", end_time: "17:00", pay_rate: 13 },
    // Lindsey's - Friday
    { store_id: lindseys, employee_name: "Lindsey Gonzales", role: "manager", shift_date: "2026-02-27", start_time: "9:00", end_time: "20:00", pay_rate: 19 },
    { store_id: lindseys, employee_name: "Maria Hernandez", role: "shift_lead", shift_date: "2026-02-27", start_time: "10:00", end_time: "21:00", pay_rate: 16 },
    { store_id: lindseys, employee_name: "James Rodriguez", role: "cook", shift_date: "2026-02-27", start_time: "10:00", end_time: "20:00", pay_rate: 15 },
    { store_id: lindseys, employee_name: "Sarah Kim", role: "cook", shift_date: "2026-02-27", start_time: "15:00", end_time: "23:00", pay_rate: 14.50 },
    { store_id: lindseys, employee_name: "Carlos Ruiz", role: "cook", shift_date: "2026-02-27", start_time: "16:00", end_time: "23:00", pay_rate: 14 },
    { store_id: lindseys, employee_name: "David Chen", role: "driver", shift_date: "2026-02-27", start_time: "11:00", end_time: "21:00", pay_rate: 13 },
    { store_id: lindseys, employee_name: "Jessica Taylor", role: "driver", shift_date: "2026-02-27", start_time: "16:00", end_time: "23:00", pay_rate: 12.50 },
    { store_id: lindseys, employee_name: "Amy Nguyen", role: "cashier", shift_date: "2026-02-27", start_time: "11:00", end_time: "20:00", pay_rate: 13 },
    { store_id: lindseys, employee_name: "Omar Hassan", role: "team", shift_date: "2026-02-27", start_time: "16:00", end_time: "23:00", pay_rate: 12.50 },
    { store_id: lindseys, employee_name: "Lisa Park", role: "team", shift_date: "2026-02-27", start_time: "16:00", end_time: "22:00", pay_rate: 12 },
    // Lindsey's - Saturday
    { store_id: lindseys, employee_name: "Maria Hernandez", role: "shift_lead", shift_date: "2026-02-28", start_time: "10:00", end_time: "20:00", pay_rate: 16 },
    { store_id: lindseys, employee_name: "James Rodriguez", role: "cook", shift_date: "2026-02-28", start_time: "10:00", end_time: "20:00", pay_rate: 15 },
    { store_id: lindseys, employee_name: "Sarah Kim", role: "cook", shift_date: "2026-02-28", start_time: "14:00", end_time: "22:00", pay_rate: 14.50 },
    { store_id: lindseys, employee_name: "Carlos Ruiz", role: "cook", shift_date: "2026-02-28", start_time: "16:00", end_time: "23:00", pay_rate: 14 },
    { store_id: lindseys, employee_name: "David Chen", role: "driver", shift_date: "2026-02-28", start_time: "11:00", end_time: "21:00", pay_rate: 13 },
    { store_id: lindseys, employee_name: "Jessica Taylor", role: "driver", shift_date: "2026-02-28", start_time: "15:00", end_time: "23:00", pay_rate: 12.50 },
    { store_id: lindseys, employee_name: "Amy Nguyen", role: "cashier", shift_date: "2026-02-28", start_time: "11:00", end_time: "20:00", pay_rate: 13 },
    { store_id: lindseys, employee_name: "Omar Hassan", role: "team", shift_date: "2026-02-28", start_time: "14:00", end_time: "22:00", pay_rate: 12.50 },
  ];

  for (const s of shifts) {
    const hours = calcHours(s.start_time, s.end_time);
    const labor_cost = +(hours * s.pay_rate).toFixed(2);

    const { error } = await supabase.from("schedules").insert({
      store_id: s.store_id,
      employee_name: s.employee_name,
      role: s.role,
      shift_date: s.shift_date,
      start_time: s.start_time,
      end_time: s.end_time,
      hours,
      labor_cost,
    });

    if (error) {
      console.log("ERROR:", s.employee_name, s.shift_date, error.message);
    } else {
      console.log("OK:", s.employee_name, s.shift_date, `${s.start_time}-${s.end_time}`, `${hours}hrs`, `$${labor_cost}`);
    }
  }

  console.log(`\nDone. ${shifts.length} shifts seeded.`);
}

seed();
