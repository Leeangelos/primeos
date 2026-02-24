/**
 * Vendor database and cost history for all stores.
 * All three stores have 12 months of cost data (Mar 2025 – Feb 2026). Kent is the base; Aurora ~15% higher, Lindsey's ~20% lower, with per-month variation.
 */

export interface Vendor {
  id: string;
  store_id: string;
  vendor_name: string;
  category: string;
  contact_name: string;
  phone: string;
  email: string;
  account_number: string;
  is_active: boolean;
  notes: string;
}

export interface VendorCost {
  id: string;
  store_id: string;
  vendor_id: string;
  amount: number;
  date: string;
  month: number;
  year: number;
  invoice_number: string;
  notes: string;
}

export const VENDOR_CATEGORIES = [
  "Food Distribution",
  "Beverage",
  "Utilities — Electric",
  "Utilities — Gas",
  "Utilities — Water",
  "Internet/Phone",
  "Waste/Trash",
  "Insurance",
  "Rent/Lease",
  "Technology/Software",
  "Cleaning/Supplies",
  "Equipment Maintenance",
  "Marketing/Advertising",
  "Payroll Services",
  "Credit Card Processing",
  "Delivery Platforms",
  "Other",
];

export const VENDORS: Vendor[] = [
  // === KENT ===
  { id: "v-knt-1", store_id: "kent", vendor_name: "Hillcrest Food Services", category: "Food Distribution", contact_name: "Dave Morrison", phone: "(216) 555-0180", email: "orders@hillcrestfoods.com", account_number: "HFS-10247", is_active: true, notes: "Primary distributor. Weekly delivery Tue/Fri. 99% of food product." },
  { id: "v-knt-2", store_id: "kent", vendor_name: "Pepsi Beverages", category: "Beverage", contact_name: "Mike Reynolds", phone: "(330) 555-0222", email: "mreynolds@pepsi.com", account_number: "PEP-44240", is_active: true, notes: "Bi-weekly delivery. Fountain and bottle." },
  { id: "v-knt-3", store_id: "kent", vendor_name: "Ohio Edison / FirstEnergy", category: "Utilities — Electric", contact_name: "", phone: "(800) 633-4766", email: "", account_number: "OE-8827441", is_active: true, notes: "Walk-in cooler and ovens are biggest draws." },
  { id: "v-knt-4", store_id: "kent", vendor_name: "Dominion Energy Ohio", category: "Utilities — Gas", contact_name: "", phone: "(800) 362-7557", email: "", account_number: "DEO-554219", is_active: true, notes: "Gas ovens." },
  { id: "v-knt-5", store_id: "kent", vendor_name: "City of Kent Water", category: "Utilities — Water", contact_name: "", phone: "(330) 678-8108", email: "", account_number: "CKW-10051", is_active: true, notes: "" },
  { id: "v-knt-6", store_id: "kent", vendor_name: "Spectrum Business", category: "Internet/Phone", contact_name: "Service Dept", phone: "(855) 757-7328", email: "", account_number: "SPB-771902", is_active: true, notes: "Internet + phone line. 400 Mbps." },
  { id: "v-knt-7", store_id: "kent", vendor_name: "Republic Services", category: "Waste/Trash", contact_name: "", phone: "(330) 562-8681", email: "", account_number: "RS-442280", is_active: true, notes: "2x/week pickup." },
  { id: "v-knt-8", store_id: "kent", vendor_name: "Erie Insurance", category: "Insurance", contact_name: "Tom Barker", phone: "(330) 555-0190", email: "tbarker@erie.com", account_number: "EI-PZ20187", is_active: true, notes: "GL + property + workers comp bundle." },
  { id: "v-knt-9", store_id: "kent", vendor_name: "Kent Plaza LLC", category: "Rent/Lease", contact_name: "Property Manager", phone: "(330) 555-0300", email: "leasing@kentplaza.com", account_number: "", is_active: true, notes: "Lease renewal 2027. 1,800 sq ft." },
  { id: "v-knt-10", store_id: "kent", vendor_name: "FoodTec Solutions", category: "Technology/Software", contact_name: "Dan", phone: "(555) 555-0100", email: "dan@foodtecsolutions.com", account_number: "FT-1024", is_active: true, notes: "POS system." },
  { id: "v-knt-11", store_id: "kent", vendor_name: "Cintas", category: "Cleaning/Supplies", contact_name: "", phone: "(800) 246-8271", email: "", account_number: "CIN-88401", is_active: true, notes: "Towels, mats, uniforms." },
  { id: "v-knt-12", store_id: "kent", vendor_name: "DoorDash", category: "Delivery Platforms", contact_name: "Merchant Support", phone: "", email: "merchant@doordash.com", account_number: "DD-LEEKNT", is_active: true, notes: "Commission varies 15-25%." },
  { id: "v-knt-13", store_id: "kent", vendor_name: "Square", category: "Credit Card Processing", contact_name: "Support", phone: "(855) 700-6000", email: "", account_number: "SQ-LK2024", is_active: true, notes: "Quoted 2.6% + $0.10. Effective rate typically higher." },

  // === AURORA ===
  { id: "v-aur-1", store_id: "aurora", vendor_name: "Hillcrest Food Services", category: "Food Distribution", contact_name: "Dave Morrison", phone: "(216) 555-0180", email: "orders@hillcrestfoods.com", account_number: "HFS-10248", is_active: true, notes: "Primary distributor. Weekly delivery Mon/Thu." },
  { id: "v-aur-2", store_id: "aurora", vendor_name: "Pepsi Beverages", category: "Beverage", contact_name: "Mike Reynolds", phone: "(330) 555-0222", email: "mreynolds@pepsi.com", account_number: "PEP-44202", is_active: true, notes: "Bi-weekly delivery." },
  { id: "v-aur-3", store_id: "aurora", vendor_name: "Ohio Edison / FirstEnergy", category: "Utilities — Electric", contact_name: "", phone: "(800) 633-4766", email: "", account_number: "OE-9914552", is_active: true, notes: "" },
  { id: "v-aur-4", store_id: "aurora", vendor_name: "Dominion Energy Ohio", category: "Utilities — Gas", contact_name: "", phone: "(800) 362-7557", email: "", account_number: "DEO-667320", is_active: true, notes: "" },
  { id: "v-aur-5", store_id: "aurora", vendor_name: "City of Aurora Water", category: "Utilities — Water", contact_name: "", phone: "(330) 562-6131", email: "", account_number: "CAW-20083", is_active: true, notes: "" },
  { id: "v-aur-6", store_id: "aurora", vendor_name: "Spectrum Business", category: "Internet/Phone", contact_name: "Service Dept", phone: "(855) 757-7328", email: "", account_number: "SPB-882014", is_active: true, notes: "300 Mbps." },
  { id: "v-aur-7", store_id: "aurora", vendor_name: "Republic Services", category: "Waste/Trash", contact_name: "", phone: "(330) 562-8681", email: "", account_number: "RS-442201", is_active: true, notes: "2x/week." },
  { id: "v-aur-8", store_id: "aurora", vendor_name: "Erie Insurance", category: "Insurance", contact_name: "Tom Barker", phone: "(330) 555-0190", email: "tbarker@erie.com", account_number: "EI-PZ20188", is_active: true, notes: "Same bundle as Kent." },
  { id: "v-aur-9", store_id: "aurora", vendor_name: "Aurora Town Center", category: "Rent/Lease", contact_name: "Leasing Office", phone: "(330) 555-0400", email: "leasing@auroratc.com", account_number: "", is_active: true, notes: "Lease renewal 2028. 2,200 sq ft." },
  { id: "v-aur-10", store_id: "aurora", vendor_name: "FoodTec Solutions", category: "Technology/Software", contact_name: "Dan", phone: "(555) 555-0100", email: "dan@foodtecsolutions.com", account_number: "FT-1025", is_active: true, notes: "POS system." },
  { id: "v-aur-11", store_id: "aurora", vendor_name: "Cintas", category: "Cleaning/Supplies", contact_name: "", phone: "(800) 246-8271", email: "", account_number: "CIN-88402", is_active: true, notes: "" },
  { id: "v-aur-12", store_id: "aurora", vendor_name: "DoorDash", category: "Delivery Platforms", contact_name: "Merchant Support", phone: "", email: "merchant@doordash.com", account_number: "DD-LEEAUR", is_active: true, notes: "" },
  { id: "v-aur-13", store_id: "aurora", vendor_name: "Square", category: "Credit Card Processing", contact_name: "Support", phone: "(855) 700-6000", email: "", account_number: "SQ-LA2024", is_active: true, notes: "" },

  // === LINDSEY'S ===
  { id: "v-lin-1", store_id: "lindseys", vendor_name: "Hillcrest Food Services", category: "Food Distribution", contact_name: "Dave Morrison", phone: "(216) 555-0180", email: "orders@hillcrestfoods.com", account_number: "HFS-10249", is_active: true, notes: "Primary distributor. Weekly delivery Wed." },
  { id: "v-lin-2", store_id: "lindseys", vendor_name: "Pepsi Beverages", category: "Beverage", contact_name: "Mike Reynolds", phone: "(330) 555-0222", email: "mreynolds@pepsi.com", account_number: "PEP-44266", is_active: true, notes: "" },
  { id: "v-lin-3", store_id: "lindseys", vendor_name: "Ohio Edison / FirstEnergy", category: "Utilities — Electric", contact_name: "", phone: "(800) 633-4766", email: "", account_number: "OE-7728330", is_active: true, notes: "" },
  { id: "v-lin-4", store_id: "lindseys", vendor_name: "Dominion Energy Ohio", category: "Utilities — Gas", contact_name: "", phone: "(800) 362-7557", email: "", account_number: "DEO-445108", is_active: true, notes: "" },
  { id: "v-lin-5", store_id: "lindseys", vendor_name: "Ravenna Water Dept", category: "Utilities — Water", contact_name: "", phone: "(330) 296-6459", email: "", account_number: "RWD-30042", is_active: true, notes: "" },
  { id: "v-lin-6", store_id: "lindseys", vendor_name: "Spectrum Business", category: "Internet/Phone", contact_name: "", phone: "(855) 757-7328", email: "", account_number: "SPB-990127", is_active: true, notes: "" },
  { id: "v-lin-7", store_id: "lindseys", vendor_name: "Republic Services", category: "Waste/Trash", contact_name: "", phone: "(330) 562-8681", email: "", account_number: "RS-442266", is_active: true, notes: "" },
  { id: "v-lin-8", store_id: "lindseys", vendor_name: "Erie Insurance", category: "Insurance", contact_name: "Tom Barker", phone: "(330) 555-0190", email: "tbarker@erie.com", account_number: "EI-PZ20189", is_active: true, notes: "" },
  { id: "v-lin-9", store_id: "lindseys", vendor_name: "Main Street Properties", category: "Rent/Lease", contact_name: "Owner", phone: "(330) 555-0500", email: "", account_number: "", is_active: true, notes: "Lease renewal 2026. 1,500 sq ft." },
  { id: "v-lin-10", store_id: "lindseys", vendor_name: "FoodTec Solutions", category: "Technology/Software", contact_name: "Dan", phone: "(555) 555-0100", email: "dan@foodtecsolutions.com", account_number: "FT-1026", is_active: true, notes: "" },
  { id: "v-lin-11", store_id: "lindseys", vendor_name: "Cintas", category: "Cleaning/Supplies", contact_name: "", phone: "(800) 246-8271", email: "", account_number: "CIN-88403", is_active: true, notes: "" },
  { id: "v-lin-12", store_id: "lindseys", vendor_name: "DoorDash", category: "Delivery Platforms", contact_name: "", phone: "", email: "merchant@doordash.com", account_number: "DD-LINRAV", is_active: true, notes: "" },
  { id: "v-lin-13", store_id: "lindseys", vendor_name: "Square", category: "Credit Card Processing", contact_name: "", phone: "(855) 700-6000", email: "", account_number: "SQ-LP2024", is_active: true, notes: "" },
];

// 12 months of vendor cost data for Kent (Mar 2025 - Feb 2026)
// Each vendor gets monthly entries with realistic amounts and a story arc
// Hillcrest: steady increases (food inflation), spike in Dec (holiday)
// Ohio Edison: summer spike (AC), winter spike (heating assist fans)
// Dominion: winter spike (gas heat)
// Rent: flat (lease)
// Insurance: annual renewal in July with increase
// DoorDash: growing as delivery mix increases
// Square: creeping effective rate

const kentCostsMar2025Feb2026: VendorCost[] = [
  // KENT — Hillcrest (food distributor)
  { id: "vc-k1-03", store_id: "kent", vendor_id: "v-knt-1", amount: 13200, date: "2025-03-28", month: 3, year: 2025, invoice_number: "HFS-26101", notes: "" },
  { id: "vc-k1-04", store_id: "kent", vendor_id: "v-knt-1", amount: 13450, date: "2025-04-28", month: 4, year: 2025, invoice_number: "HFS-26455", notes: "" },
  { id: "vc-k1-05", store_id: "kent", vendor_id: "v-knt-1", amount: 13800, date: "2025-05-28", month: 5, year: 2025, invoice_number: "HFS-26812", notes: "" },
  { id: "vc-k1-06", store_id: "kent", vendor_id: "v-knt-1", amount: 14100, date: "2025-06-28", month: 6, year: 2025, invoice_number: "HFS-27190", notes: "" },
  { id: "vc-k1-07", store_id: "kent", vendor_id: "v-knt-1", amount: 14350, date: "2025-07-28", month: 7, year: 2025, invoice_number: "HFS-27544", notes: "" },
  { id: "vc-k1-08", store_id: "kent", vendor_id: "v-knt-1", amount: 13900, date: "2025-08-28", month: 8, year: 2025, invoice_number: "HFS-27901", notes: "Back to school — Kent State slow start" },
  { id: "vc-k1-09", store_id: "kent", vendor_id: "v-knt-1", amount: 15200, date: "2025-09-28", month: 9, year: 2025, invoice_number: "HFS-28250", notes: "Kent State full session" },
  { id: "vc-k1-10", store_id: "kent", vendor_id: "v-knt-1", amount: 15800, date: "2025-10-28", month: 10, year: 2025, invoice_number: "HFS-28620", notes: "Homecoming week" },
  { id: "vc-k1-11", store_id: "kent", vendor_id: "v-knt-1", amount: 14600, date: "2025-11-28", month: 11, year: 2025, invoice_number: "HFS-28980", notes: "Thanksgiving week slow" },
  { id: "vc-k1-12", store_id: "kent", vendor_id: "v-knt-1", amount: 16200, date: "2025-12-28", month: 12, year: 2025, invoice_number: "HFS-29340", notes: "Holiday catering bump + price increase from Hillcrest" },
  { id: "vc-k1-01", store_id: "kent", vendor_id: "v-knt-1", amount: 14100, date: "2026-01-28", month: 1, year: 2026, invoice_number: "HFS-29700", notes: "January slow" },
  { id: "vc-k1-02", store_id: "kent", vendor_id: "v-knt-1", amount: 15400, date: "2026-02-22", month: 2, year: 2026, invoice_number: "HFS-28491", notes: "" },

  // KENT — Pepsi
  { id: "vc-k2-03", store_id: "kent", vendor_id: "v-knt-2", amount: 680, date: "2025-03-15", month: 3, year: 2025, invoice_number: "PEP-8810", notes: "" },
  { id: "vc-k2-04", store_id: "kent", vendor_id: "v-knt-2", amount: 680, date: "2025-04-15", month: 4, year: 2025, invoice_number: "PEP-8920", notes: "" },
  { id: "vc-k2-05", store_id: "kent", vendor_id: "v-knt-2", amount: 720, date: "2025-05-15", month: 5, year: 2025, invoice_number: "PEP-9030", notes: "" },
  { id: "vc-k2-06", store_id: "kent", vendor_id: "v-knt-2", amount: 780, date: "2025-06-15", month: 6, year: 2025, invoice_number: "PEP-9140", notes: "Summer bump" },
  { id: "vc-k2-07", store_id: "kent", vendor_id: "v-knt-2", amount: 800, date: "2025-07-15", month: 7, year: 2025, invoice_number: "PEP-9250", notes: "" },
  { id: "vc-k2-08", store_id: "kent", vendor_id: "v-knt-2", amount: 740, date: "2025-08-15", month: 8, year: 2025, invoice_number: "PEP-9360", notes: "" },
  { id: "vc-k2-09", store_id: "kent", vendor_id: "v-knt-2", amount: 820, date: "2025-09-15", month: 9, year: 2025, invoice_number: "PEP-9470", notes: "" },
  { id: "vc-k2-10", store_id: "kent", vendor_id: "v-knt-2", amount: 840, date: "2025-10-15", month: 10, year: 2025, invoice_number: "PEP-9580", notes: "" },
  { id: "vc-k2-11", store_id: "kent", vendor_id: "v-knt-2", amount: 760, date: "2025-11-15", month: 11, year: 2025, invoice_number: "PEP-9690", notes: "" },
  { id: "vc-k2-12", store_id: "kent", vendor_id: "v-knt-2", amount: 880, date: "2025-12-15", month: 12, year: 2025, invoice_number: "PEP-9800", notes: "" },
  { id: "vc-k2-01", store_id: "kent", vendor_id: "v-knt-2", amount: 700, date: "2026-01-15", month: 1, year: 2026, invoice_number: "PEP-9910", notes: "" },
  { id: "vc-k2-02", store_id: "kent", vendor_id: "v-knt-2", amount: 760, date: "2026-02-15", month: 2, year: 2026, invoice_number: "PEP-10020", notes: "" },

  // KENT — Ohio Edison (electric: summer spike)
  { id: "vc-k3-03", store_id: "kent", vendor_id: "v-knt-3", amount: 1280, date: "2025-03-05", month: 3, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k3-04", store_id: "kent", vendor_id: "v-knt-3", amount: 1310, date: "2025-04-05", month: 4, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k3-05", store_id: "kent", vendor_id: "v-knt-3", amount: 1420, date: "2025-05-05", month: 5, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k3-06", store_id: "kent", vendor_id: "v-knt-3", amount: 1680, date: "2025-06-05", month: 6, year: 2025, invoice_number: "", notes: "AC running hard" },
  { id: "vc-k3-07", store_id: "kent", vendor_id: "v-knt-3", amount: 1820, date: "2025-07-05", month: 7, year: 2025, invoice_number: "", notes: "Peak summer" },
  { id: "vc-k3-08", store_id: "kent", vendor_id: "v-knt-3", amount: 1750, date: "2025-08-05", month: 8, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k3-09", store_id: "kent", vendor_id: "v-knt-3", amount: 1480, date: "2025-09-05", month: 9, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k3-10", store_id: "kent", vendor_id: "v-knt-3", amount: 1350, date: "2025-10-05", month: 10, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k3-11", store_id: "kent", vendor_id: "v-knt-3", amount: 1290, date: "2025-11-05", month: 11, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k3-12", store_id: "kent", vendor_id: "v-knt-3", amount: 1380, date: "2025-12-05", month: 12, year: 2025, invoice_number: "", notes: "Holiday lights + extended hours" },
  { id: "vc-k3-01", store_id: "kent", vendor_id: "v-knt-3", amount: 1340, date: "2026-01-05", month: 1, year: 2026, invoice_number: "", notes: "" },
  { id: "vc-k3-02", store_id: "kent", vendor_id: "v-knt-3", amount: 1360, date: "2026-02-05", month: 2, year: 2026, invoice_number: "", notes: "" },

  // KENT — Dominion Gas (winter spike)
  { id: "vc-k4-03", store_id: "kent", vendor_id: "v-knt-4", amount: 520, date: "2025-03-10", month: 3, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k4-04", store_id: "kent", vendor_id: "v-knt-4", amount: 440, date: "2025-04-10", month: 4, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k4-05", store_id: "kent", vendor_id: "v-knt-4", amount: 380, date: "2025-05-10", month: 5, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k4-06", store_id: "kent", vendor_id: "v-knt-4", amount: 350, date: "2025-06-10", month: 6, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k4-07", store_id: "kent", vendor_id: "v-knt-4", amount: 340, date: "2025-07-10", month: 7, year: 2025, invoice_number: "", notes: "Summer low" },
  { id: "vc-k4-08", store_id: "kent", vendor_id: "v-knt-4", amount: 350, date: "2025-08-10", month: 8, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k4-09", store_id: "kent", vendor_id: "v-knt-4", amount: 410, date: "2025-09-10", month: 9, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k4-10", store_id: "kent", vendor_id: "v-knt-4", amount: 520, date: "2025-10-10", month: 10, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k4-11", store_id: "kent", vendor_id: "v-knt-4", amount: 680, date: "2025-11-10", month: 11, year: 2025, invoice_number: "", notes: "Heating season" },
  { id: "vc-k4-12", store_id: "kent", vendor_id: "v-knt-4", amount: 840, date: "2025-12-10", month: 12, year: 2025, invoice_number: "", notes: "Peak winter" },
  { id: "vc-k4-01", store_id: "kent", vendor_id: "v-knt-4", amount: 890, date: "2026-01-10", month: 1, year: 2026, invoice_number: "", notes: "Coldest month" },
  { id: "vc-k4-02", store_id: "kent", vendor_id: "v-knt-4", amount: 780, date: "2026-02-10", month: 2, year: 2026, invoice_number: "", notes: "" },

  // KENT — Water (steady)
  { id: "vc-k5-03", store_id: "kent", vendor_id: "v-knt-5", amount: 195, date: "2025-03-01", month: 3, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k5-04", store_id: "kent", vendor_id: "v-knt-5", amount: 190, date: "2025-04-01", month: 4, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k5-05", store_id: "kent", vendor_id: "v-knt-5", amount: 205, date: "2025-05-01", month: 5, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k5-06", store_id: "kent", vendor_id: "v-knt-5", amount: 220, date: "2025-06-01", month: 6, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k5-07", store_id: "kent", vendor_id: "v-knt-5", amount: 230, date: "2025-07-01", month: 7, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k5-08", store_id: "kent", vendor_id: "v-knt-5", amount: 225, date: "2025-08-01", month: 8, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k5-09", store_id: "kent", vendor_id: "v-knt-5", amount: 210, date: "2025-09-01", month: 9, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k5-10", store_id: "kent", vendor_id: "v-knt-5", amount: 200, date: "2025-10-01", month: 10, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k5-11", store_id: "kent", vendor_id: "v-knt-5", amount: 195, date: "2025-11-01", month: 11, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k5-12", store_id: "kent", vendor_id: "v-knt-5", amount: 200, date: "2025-12-01", month: 12, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k5-01", store_id: "kent", vendor_id: "v-knt-5", amount: 190, date: "2026-01-01", month: 1, year: 2026, invoice_number: "", notes: "" },
  { id: "vc-k5-02", store_id: "kent", vendor_id: "v-knt-5", amount: 200, date: "2026-02-01", month: 2, year: 2026, invoice_number: "", notes: "" },

  // KENT — DoorDash (growing)
  { id: "vc-k12-03", store_id: "kent", vendor_id: "v-knt-12", amount: 820, date: "2025-03-31", month: 3, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k12-04", store_id: "kent", vendor_id: "v-knt-12", amount: 850, date: "2025-04-30", month: 4, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k12-05", store_id: "kent", vendor_id: "v-knt-12", amount: 910, date: "2025-05-31", month: 5, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k12-06", store_id: "kent", vendor_id: "v-knt-12", amount: 980, date: "2025-06-30", month: 6, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k12-07", store_id: "kent", vendor_id: "v-knt-12", amount: 1020, date: "2025-07-31", month: 7, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k12-08", store_id: "kent", vendor_id: "v-knt-12", amount: 940, date: "2025-08-31", month: 8, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k12-09", store_id: "kent", vendor_id: "v-knt-12", amount: 1150, date: "2025-09-30", month: 9, year: 2025, invoice_number: "", notes: "Kent State orders up" },
  { id: "vc-k12-10", store_id: "kent", vendor_id: "v-knt-12", amount: 1280, date: "2025-10-31", month: 10, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k12-11", store_id: "kent", vendor_id: "v-knt-12", amount: 1100, date: "2025-11-30", month: 11, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k12-12", store_id: "kent", vendor_id: "v-knt-12", amount: 1350, date: "2025-12-31", month: 12, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k12-01", store_id: "kent", vendor_id: "v-knt-12", amount: 980, date: "2026-01-31", month: 1, year: 2026, invoice_number: "", notes: "" },
  { id: "vc-k12-02", store_id: "kent", vendor_id: "v-knt-12", amount: 1180, date: "2026-02-22", month: 2, year: 2026, invoice_number: "", notes: "" },

  // KENT — Square CC processing (creeping rate)
  { id: "vc-k13-03", store_id: "kent", vendor_id: "v-knt-13", amount: 1120, date: "2025-03-31", month: 3, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k13-04", store_id: "kent", vendor_id: "v-knt-13", amount: 1140, date: "2025-04-30", month: 4, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k13-05", store_id: "kent", vendor_id: "v-knt-13", amount: 1180, date: "2025-05-31", month: 5, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k13-06", store_id: "kent", vendor_id: "v-knt-13", amount: 1250, date: "2025-06-30", month: 6, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k13-07", store_id: "kent", vendor_id: "v-knt-13", amount: 1290, date: "2025-07-31", month: 7, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k13-08", store_id: "kent", vendor_id: "v-knt-13", amount: 1220, date: "2025-08-31", month: 8, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k13-09", store_id: "kent", vendor_id: "v-knt-13", amount: 1380, date: "2025-09-30", month: 9, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k13-10", store_id: "kent", vendor_id: "v-knt-13", amount: 1450, date: "2025-10-31", month: 10, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k13-11", store_id: "kent", vendor_id: "v-knt-13", amount: 1320, date: "2025-11-30", month: 11, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k13-12", store_id: "kent", vendor_id: "v-knt-13", amount: 1520, date: "2025-12-31", month: 12, year: 2025, invoice_number: "", notes: "" },
  { id: "vc-k13-01", store_id: "kent", vendor_id: "v-knt-13", amount: 1280, date: "2026-01-31", month: 1, year: 2026, invoice_number: "", notes: "" },
  { id: "vc-k13-02", store_id: "kent", vendor_id: "v-knt-13", amount: 1420, date: "2026-02-22", month: 2, year: 2026, invoice_number: "", notes: "" },
];

// Generated Kent entries: Spectrum, Republic, Erie, Rent, FoodTec, Cintas (12 months each, Mar 2025 - Feb 2026)
function buildKentRecurringCosts(): VendorCost[] {
  const months: { m: number; y: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const m = ((i + 2) % 12) + 1;
    const y = m >= 3 ? 2025 : 2026;
    months.push({ m, y });
  }
  const out: VendorCost[] = [];
  // Spectrum: $149/mo
  months.forEach(({ m, y }, i) => {
    out.push({ id: `vc-k6-${String(m).padStart(2, "0")}`, store_id: "kent", vendor_id: "v-knt-6", amount: 149, date: `${y}-${String(m).padStart(2, "0")}-20`, month: m, year: y, invoice_number: "", notes: "" });
  });
  // Republic: $285/mo, $295 from Jan 2026
  months.forEach(({ m, y }) => {
    const amt = y === 2026 ? 295 : 285;
    out.push({ id: `vc-k7-${String(m).padStart(2, "0")}`, store_id: "kent", vendor_id: "v-knt-7", amount: amt, date: `${y}-${String(m).padStart(2, "0")}-08`, month: m, year: y, invoice_number: "", notes: m === 1 && y === 2026 ? "Annual rate increase" : "" });
  });
  // Erie: $2400 until Jul 2025, then $2592 (8% renewal)
  months.forEach(({ m, y }) => {
    const amt = (y === 2025 && m >= 7) || y === 2026 ? 2592 : 2400;
    out.push({ id: `vc-k8-${String(m).padStart(2, "0")}`, store_id: "kent", vendor_id: "v-knt-8", amount: amt, date: `${y}-${String(m).padStart(2, "0")}-01`, month: m, year: y, invoice_number: "", notes: m === 7 && y === 2025 ? "Annual renewal — 8% increase" : "" });
  });
  // Rent: $3500/mo
  months.forEach(({ m, y }) => {
    out.push({ id: `vc-k9-${String(m).padStart(2, "0")}`, store_id: "kent", vendor_id: "v-knt-9", amount: 3500, date: `${y}-${String(m).padStart(2, "0")}-01`, month: m, year: y, invoice_number: "", notes: "" });
  });
  // FoodTec: $189/mo
  months.forEach(({ m, y }) => {
    out.push({ id: `vc-k10-${String(m).padStart(2, "0")}`, store_id: "kent", vendor_id: "v-knt-10", amount: 189, date: `${y}-${String(m).padStart(2, "0")}-01`, month: m, year: y, invoice_number: "", notes: "" });
  });
  // Cintas: $220/mo
  months.forEach(({ m, y }) => {
    out.push({ id: `vc-k11-${String(m).padStart(2, "0")}`, store_id: "kent", vendor_id: "v-knt-11", amount: 220, date: `${y}-${String(m).padStart(2, "0")}-15`, month: m, year: y, invoice_number: "", notes: "" });
  });
  return out;
}

// Month order: Mar 2025 … Dec 2025, Jan 2026, Feb 2026
const MONTHS_12: { m: number; y: number }[] = [];
for (let i = 0; i < 12; i++) {
  const m = i < 10 ? i + 3 : i - 9;
  const y = m >= 3 ? 2025 : 2026;
  MONTHS_12.push({ m, y });
}

function getKentAmount(kentCosts: VendorCost[], vendorNum: number, month: number, year: number): number {
  const vendorId = `v-knt-${vendorNum}`;
  const e = kentCosts.find((c) => c.vendor_id === vendorId && c.month === month && c.year === year);
  return e ? e.amount : 0;
}

/** ±2–4% variation from base multiplier (deterministic by month index). */
function vary(mult: number, monthIndex: number): number {
  const delta = 0.02 * (((monthIndex * 7) % 5) / 5) - 0.01;
  return mult * (1 + delta);
}

function buildAuroraCosts(kentCosts: VendorCost[]): VendorCost[] {
  const out: VendorCost[] = [];
  const auroraVendorIds = ["v-aur-1", "v-aur-2", "v-aur-3", "v-aur-4", "v-aur-5", "v-aur-6", "v-aur-7", "v-aur-8", "v-aur-9", "v-aur-10", "v-aur-11", "v-aur-12", "v-aur-13"];
  const dateDay: Record<number, string> = { 1: "28", 2: "15", 3: "05", 4: "10", 5: "01", 6: "20", 7: "08", 8: "01", 9: "01", 10: "01", 11: "15", 12: "31", 13: "31" };
  for (let v = 1; v <= 13; v++) {
    for (let i = 0; i < 12; i++) {
      const { m, y } = MONTHS_12[i];
      const day = dateDay[v] ?? "15";
      const date = `${y}-${String(m).padStart(2, "0")}-${day}`;
      const kentAmt = getKentAmount(kentCosts, v, m, y);
      let amt: number;
      if (v === 1) amt = Math.round(kentAmt * vary(1.12 + (i % 7) * 0.008, i));
      else if (v === 2) amt = Math.round(kentAmt * vary(1.10 + (i % 11) * 0.009, i));
      else if (v === 3) amt = Math.round(kentAmt * vary(1.15 + (i % 8) * 0.009, i));
      else if (v === 4) amt = Math.round(kentAmt * vary(1.10 + (i % 9) * 0.009, i));
      else if (v === 5) amt = Math.round(kentAmt * vary(1.08 + (i % 8) * 0.009, i));
      else if (v === 6) amt = 179;
      else if (v === 7) amt = y === 2026 ? 335 : 325;
      else if (v === 8) amt = (y === 2025 && m >= 7) || y === 2026 ? 2981 : 2760;
      else if (v === 9) amt = 4200;
      else if (v === 10) amt = 189;
      else if (v === 11) amt = 260;
      else if (v === 12) amt = Math.round(kentAmt * vary(1.15 + (i % 11) * 0.009, i));
      else amt = Math.round(kentAmt * vary(1.12 + (i % 9) * 0.009, i));
      out.push({ id: `vc-a${v}-${String(m).padStart(2, "0")}`, store_id: "aurora", vendor_id: auroraVendorIds[v - 1], amount: amt, date, month: m, year: y, invoice_number: "", notes: "" });
    }
  }
  return out;
}

function buildLindseyCosts(kentCosts: VendorCost[]): VendorCost[] {
  const out: VendorCost[] = [];
  const linVendorIds = ["v-lin-1", "v-lin-2", "v-lin-3", "v-lin-4", "v-lin-5", "v-lin-6", "v-lin-7", "v-lin-8", "v-lin-9", "v-lin-10", "v-lin-11", "v-lin-12", "v-lin-13"];
  const dateDay: Record<number, string> = { 1: "28", 2: "15", 3: "05", 4: "10", 5: "01", 6: "20", 7: "08", 8: "01", 9: "01", 10: "01", 11: "15", 12: "31", 13: "31" };
  for (let v = 1; v <= 13; v++) {
    for (let i = 0; i < 12; i++) {
      const { m, y } = MONTHS_12[i];
      const day = dateDay[v] ?? "15";
      const date = `${y}-${String(m).padStart(2, "0")}-${day}`;
      const kentAmt = getKentAmount(kentCosts, v, m, y);
      let amt: number;
      if (v === 1) amt = Math.round(kentAmt * vary(0.78 + (i % 8) * 0.009, i));
      else if (v === 2) amt = Math.round(kentAmt * vary(0.75 + (i % 8) * 0.009, i));
      else if (v === 3) amt = Math.round(kentAmt * vary(0.80 + (i % 9) * 0.009, i));
      else if (v === 4) amt = Math.round(kentAmt * vary(0.78 + (i % 8) * 0.009, i));
      else if (v === 5) amt = Math.round(kentAmt * vary(0.80 + (i % 9) * 0.009, i));
      else if (v === 6) amt = 129;
      else if (v === 7) amt = y === 2026 ? 255 : 245;
      else if (v === 8) amt = (y === 2025 && m >= 7) || y === 2026 ? 2074 : 1920;
      else if (v === 9) amt = 2800;
      else if (v === 10) amt = 189;
      else if (v === 11) amt = 180;
      else if (v === 12) amt = Math.round(kentAmt * vary(0.70 + (i % 11) * 0.009, i));
      else amt = Math.round(kentAmt * vary(0.78 + (i % 8) * 0.009, i));
      out.push({ id: `vc-l${v}-${String(m).padStart(2, "0")}`, store_id: "lindseys", vendor_id: linVendorIds[v - 1], amount: amt, date, month: m, year: y, invoice_number: "", notes: "" });
    }
  }
  return out;
}

const kentAll = [...kentCostsMar2025Feb2026, ...buildKentRecurringCosts()];
export const VENDOR_COSTS: VendorCost[] = [...kentAll, ...buildAuroraCosts(kentAll), ...buildLindseyCosts(kentAll)];

// HELPER FUNCTIONS

export function getVendorsByStore(storeId: string): Vendor[] {
  if (storeId === "all") return VENDORS;
  return VENDORS.filter((v) => v.store_id === storeId);
}

export function getVendorCostsByStore(storeId: string): VendorCost[] {
  if (storeId === "all") return VENDOR_COSTS;
  return VENDOR_COSTS.filter((vc) => vc.store_id === storeId);
}

export function getVendorCostsByVendor(vendorId: string): VendorCost[] {
  return VENDOR_COSTS.filter((vc) => vc.vendor_id === vendorId).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

export function getVendorCostForMonth(vendorId: string, month: number, year: number): number {
  const entry = VENDOR_COSTS.find((vc) => vc.vendor_id === vendorId && vc.month === month && vc.year === year);
  return entry ? entry.amount : 0;
}

export function getVendorMonthlySummary(
  storeId: string,
  month: number,
  year: number
): { vendorId: string; vendorName: string; category: string; amount: number; prevAmount: number; change: number; changePct: number }[] {
  const vendors = getVendorsByStore(storeId);
  const costs = getVendorCostsByStore(storeId);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  return vendors
    .map((v) => {
      const current = costs.find((c) => c.vendor_id === v.id && c.month === month && c.year === year);
      const prev = costs.find((c) => c.vendor_id === v.id && c.month === prevMonth && c.year === prevYear);
      const amount = current?.amount ?? 0;
      const prevAmount = prev?.amount ?? 0;
      const change = amount - prevAmount;
      const changePct = prevAmount > 0 ? (change / prevAmount) * 100 : 0;
      return { vendorId: v.id, vendorName: v.vendor_name, category: v.category, amount, prevAmount, change, changePct };
    })
    .filter((v) => v.amount > 0 || v.prevAmount > 0);
}

// Store lease details for occupancy calculations
export const STORE_DETAILS: Record<string, { sqft: number; monthlyRent: number; leaseRenewal: string }> = {
  kent: { sqft: 1800, monthlyRent: 3500, leaseRenewal: "2027" },
  aurora: { sqft: 2200, monthlyRent: 4200, leaseRenewal: "2028" },
  lindseys: { sqft: 1500, monthlyRent: 2800, leaseRenewal: "2026" },
};
