import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

const recipes = [
  {
    name: "Pepperoni Pizza",
    category: "pizza",
    size: "16-inch",
    menu_price: 14.99,
    ingredients: [
      { name: "Dough ball", qty: "1", unit: "each", cost: 0.85 },
      { name: "Mozzarella", qty: "8", unit: "oz", cost: 1.60 },
      { name: "Pepperoni", qty: "3", unit: "oz", cost: 0.90 },
      { name: "Pizza sauce", qty: "4", unit: "oz", cost: 0.40 },
    ],
  },
  {
    name: "Cheese Pizza",
    category: "pizza",
    size: "16-inch",
    menu_price: 12.99,
    ingredients: [
      { name: "Dough ball", qty: "1", unit: "each", cost: 0.85 },
      { name: "Mozzarella", qty: "10", unit: "oz", cost: 2.00 },
      { name: "Pizza sauce", qty: "4", unit: "oz", cost: 0.40 },
    ],
  },
  {
    name: "Supreme Pizza",
    category: "pizza",
    size: "16-inch",
    menu_price: 17.99,
    ingredients: [
      { name: "Dough ball", qty: "1", unit: "each", cost: 0.85 },
      { name: "Mozzarella", qty: "8", unit: "oz", cost: 1.60 },
      { name: "Pepperoni", qty: "2", unit: "oz", cost: 0.60 },
      { name: "Sausage", qty: "2", unit: "oz", cost: 0.55 },
      { name: "Green pepper", qty: "1", unit: "oz", cost: 0.15 },
      { name: "Onion", qty: "1", unit: "oz", cost: 0.10 },
      { name: "Mushroom", qty: "1", unit: "oz", cost: 0.20 },
      { name: "Black olive", qty: "1", unit: "oz", cost: 0.25 },
      { name: "Pizza sauce", qty: "4", unit: "oz", cost: 0.40 },
    ],
  },
  {
    name: "Pepperoni Pizza",
    category: "pizza",
    size: "12-inch",
    menu_price: 10.99,
    ingredients: [
      { name: "Dough ball (sm)", qty: "1", unit: "each", cost: 0.55 },
      { name: "Mozzarella", qty: "5", unit: "oz", cost: 1.00 },
      { name: "Pepperoni", qty: "2", unit: "oz", cost: 0.60 },
      { name: "Pizza sauce", qty: "3", unit: "oz", cost: 0.30 },
    ],
  },
  {
    name: "Garlic Bread",
    category: "appetizer",
    size: null,
    menu_price: 5.99,
    ingredients: [
      { name: "Italian bread", qty: "1", unit: "each", cost: 0.45 },
      { name: "Garlic butter", qty: "2", unit: "oz", cost: 0.30 },
      { name: "Mozzarella", qty: "2", unit: "oz", cost: 0.40 },
    ],
  },
  {
    name: "Mozzarella Sticks (6pc)",
    category: "appetizer",
    size: null,
    menu_price: 7.99,
    ingredients: [
      { name: "Mozz sticks", qty: "6", unit: "each", cost: 1.20 },
      { name: "Marinara cup", qty: "1", unit: "each", cost: 0.25 },
    ],
  },
  {
    name: "Italian Sub",
    category: "sub",
    size: "12-inch",
    menu_price: 9.99,
    ingredients: [
      { name: "Sub roll", qty: "1", unit: "each", cost: 0.55 },
      { name: "Ham", qty: "3", unit: "oz", cost: 0.90 },
      { name: "Salami", qty: "2", unit: "oz", cost: 0.70 },
      { name: "Provolone", qty: "2", unit: "oz", cost: 0.50 },
      { name: "Lettuce/tomato", qty: "2", unit: "oz", cost: 0.20 },
    ],
  },
  {
    name: "Buffalo Wings (10pc)",
    category: "wing",
    size: null,
    menu_price: 12.99,
    ingredients: [
      { name: "Chicken wings", qty: "10", unit: "each", cost: 3.50 },
      { name: "Buffalo sauce", qty: "3", unit: "oz", cost: 0.45 },
      { name: "Ranch cup", qty: "1", unit: "each", cost: 0.20 },
    ],
  },
  {
    name: "Caesar Salad",
    category: "salad",
    size: null,
    menu_price: 8.99,
    ingredients: [
      { name: "Romaine", qty: "4", unit: "oz", cost: 0.50 },
      { name: "Caesar dressing", qty: "2", unit: "oz", cost: 0.35 },
      { name: "Croutons", qty: "1", unit: "oz", cost: 0.15 },
      { name: "Parmesan", qty: "1", unit: "oz", cost: 0.30 },
    ],
  },
  {
    name: "2-Liter Soda",
    category: "drink",
    size: null,
    menu_price: 3.49,
    ingredients: [
      { name: "2-liter bottle", qty: "1", unit: "each", cost: 1.10 },
    ],
  },
];

async function seed() {
  for (const r of recipes) {
    const theoretical_cost = r.ingredients.reduce((sum, i) => sum + i.cost, 0);
    const food_cost_pct = r.menu_price > 0 ? +((theoretical_cost / r.menu_price) * 100).toFixed(1) : 0;

    const { error } = await supabase.from("recipes").insert({
      name: r.name,
      category: r.category,
      size: r.size,
      menu_price: r.menu_price,
      ingredients: r.ingredients,
      theoretical_cost,
      food_cost_pct,
    });

    if (error) {
      console.log("ERROR:", r.name, error.message);
    } else {
      console.log("OK:", r.name, r.size || "", `$${theoretical_cost.toFixed(2)} cost / $${r.menu_price} price = ${food_cost_pct}%`);
    }
  }
}

seed();
