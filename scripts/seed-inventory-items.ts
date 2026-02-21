import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

const items = [
  // Cheese
  { name: "Mozzarella (shredded)", category: "cheese", default_unit: "lb", unit_cost: 3.20, sort_order: 1 },
  { name: "Mozzarella (fresh)", category: "cheese", default_unit: "lb", unit_cost: 5.50, sort_order: 2 },
  { name: "Provolone", category: "cheese", default_unit: "lb", unit_cost: 4.10, sort_order: 3 },
  { name: "Parmesan", category: "cheese", default_unit: "lb", unit_cost: 7.80, sort_order: 4 },
  { name: "Ricotta", category: "cheese", default_unit: "lb", unit_cost: 3.40, sort_order: 5 },

  // Meats
  { name: "Pepperoni", category: "meats", default_unit: "lb", unit_cost: 4.80, sort_order: 1 },
  { name: "Italian Sausage", category: "meats", default_unit: "lb", unit_cost: 3.60, sort_order: 2 },
  { name: "Ham", category: "meats", default_unit: "lb", unit_cost: 4.20, sort_order: 3 },
  { name: "Bacon", category: "meats", default_unit: "lb", unit_cost: 5.90, sort_order: 4 },
  { name: "Salami", category: "meats", default_unit: "lb", unit_cost: 5.40, sort_order: 5 },
  { name: "Chicken Wings", category: "meats", default_unit: "lb", unit_cost: 3.10, sort_order: 6 },
  { name: "Ground Beef", category: "meats", default_unit: "lb", unit_cost: 4.50, sort_order: 7 },
  { name: "Anchovies", category: "meats", default_unit: "can", unit_cost: 2.80, sort_order: 8 },

  // Produce
  { name: "Tomatoes (canned)", category: "produce", default_unit: "can", unit_cost: 3.20, sort_order: 1 },
  { name: "Green Peppers", category: "produce", default_unit: "lb", unit_cost: 1.80, sort_order: 2 },
  { name: "Onions", category: "produce", default_unit: "lb", unit_cost: 1.20, sort_order: 3 },
  { name: "Mushrooms", category: "produce", default_unit: "lb", unit_cost: 3.50, sort_order: 4 },
  { name: "Black Olives", category: "produce", default_unit: "can", unit_cost: 2.90, sort_order: 5 },
  { name: "Romaine Lettuce", category: "produce", default_unit: "head", unit_cost: 1.60, sort_order: 6 },
  { name: "Tomatoes (fresh)", category: "produce", default_unit: "lb", unit_cost: 2.20, sort_order: 7 },
  { name: "Jalapeños", category: "produce", default_unit: "lb", unit_cost: 2.00, sort_order: 8 },
  { name: "Banana Peppers", category: "produce", default_unit: "lb", unit_cost: 2.10, sort_order: 9 },
  { name: "Garlic (minced)", category: "produce", default_unit: "lb", unit_cost: 4.50, sort_order: 10 },
  { name: "Basil (fresh)", category: "produce", default_unit: "oz", unit_cost: 1.00, sort_order: 11 },
  { name: "Spinach", category: "produce", default_unit: "lb", unit_cost: 3.00, sort_order: 12 },
  { name: "Pineapple", category: "produce", default_unit: "can", unit_cost: 2.40, sort_order: 13 },

  // Dough & Dry
  { name: "Dough Balls (16\")", category: "dough_dry", default_unit: "each", unit_cost: 0.85, sort_order: 1 },
  { name: "Dough Balls (12\")", category: "dough_dry", default_unit: "each", unit_cost: 0.55, sort_order: 2 },
  { name: "Sub Rolls", category: "dough_dry", default_unit: "each", unit_cost: 0.55, sort_order: 3 },
  { name: "Italian Bread", category: "dough_dry", default_unit: "each", unit_cost: 0.45, sort_order: 4 },
  { name: "Flour (50lb)", category: "dough_dry", default_unit: "bag", unit_cost: 18.50, sort_order: 5 },
  { name: "Pizza Sauce", category: "dough_dry", default_unit: "can", unit_cost: 4.20, sort_order: 6 },
  { name: "Olive Oil", category: "dough_dry", default_unit: "gal", unit_cost: 22.00, sort_order: 7 },
  { name: "Croutons", category: "dough_dry", default_unit: "bag", unit_cost: 3.50, sort_order: 8 },

  // Sauces & Dressings
  { name: "Buffalo Sauce", category: "sauces", default_unit: "gal", unit_cost: 12.50, sort_order: 1 },
  { name: "Ranch Dressing", category: "sauces", default_unit: "gal", unit_cost: 8.90, sort_order: 2 },
  { name: "Caesar Dressing", category: "sauces", default_unit: "gal", unit_cost: 9.50, sort_order: 3 },
  { name: "Marinara (dipping)", category: "sauces", default_unit: "can", unit_cost: 3.80, sort_order: 4 },
  { name: "Garlic Butter", category: "sauces", default_unit: "lb", unit_cost: 3.20, sort_order: 5 },
  { name: "BBQ Sauce", category: "sauces", default_unit: "gal", unit_cost: 10.00, sort_order: 6 },

  // Paper & Supplies
  { name: "Pizza Boxes (16\")", category: "paper", default_unit: "bundle", unit_cost: 28.00, sort_order: 1 },
  { name: "Pizza Boxes (12\")", category: "paper", default_unit: "bundle", unit_cost: 22.00, sort_order: 2 },
  { name: "Sub Wrappers", category: "paper", default_unit: "bundle", unit_cost: 15.00, sort_order: 3 },
  { name: "To-Go Containers", category: "paper", default_unit: "case", unit_cost: 45.00, sort_order: 4 },
  { name: "Napkins", category: "paper", default_unit: "case", unit_cost: 32.00, sort_order: 5 },
  { name: "Gloves (box)", category: "paper", default_unit: "box", unit_cost: 8.50, sort_order: 6 },
  { name: "Foil Sheets", category: "paper", default_unit: "box", unit_cost: 24.00, sort_order: 7 },
  { name: "Sauce Cups", category: "paper", default_unit: "sleeve", unit_cost: 5.50, sort_order: 8 },

  // Beverages
  { name: "2-Liter Sodas", category: "beverages", default_unit: "each", unit_cost: 1.10, sort_order: 1 },
  { name: "Canned Sodas", category: "beverages", default_unit: "case", unit_cost: 9.50, sort_order: 2 },
  { name: "Bottled Water", category: "beverages", default_unit: "case", unit_cost: 5.00, sort_order: 3 },
];

async function seed() {
  for (const item of items) {
    const { error } = await supabase.from("inventory_items").insert(item);
    if (error) {
      console.log("ERROR:", item.name, error.message);
    } else {
      console.log("OK:", item.name, `${item.category} / ${item.default_unit} @ $${item.unit_cost}`);
    }
  }
  console.log(`\nDone. ${items.length} items seeded.`);
}

seed();
