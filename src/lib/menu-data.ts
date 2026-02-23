/**
 * Menu data for all locations — used by Menu Intelligence.
 */

export interface MenuItem {
  id: string;
  store_id: string;
  category: string;
  item_name: string;
  description?: string;
  ingredients_listed: string[];
  sizes: { size_name: string; price: number }[];
}

export const MENU_DATA: MenuItem[] = [
  // ========== AURORA ==========
  { id: "aur-pz-1", store_id: "aurora", category: "Pizzas", item_name: "Cheese Pizza", ingredients_listed: ["Cheese", "Dough", "Sauce"], sizes: [{ size_name: "Small", price: 8.99 }, { size_name: "Medium", price: 13.99 }, { size_name: "Large", price: 18.99 }, { size_name: "Family", price: 22.99 }, { size_name: "Sheet", price: 39.99 }, { size_name: "GF", price: 17.99 }]},
  { id: "aur-pz-2", store_id: "aurora", category: "Pizzas", item_name: "Supreme", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats", "Vegetables"], sizes: [{ size_name: "Small", price: 16.99 }, { size_name: "Medium", price: 26.99 }, { size_name: "Large", price: 32.99 }, { size_name: "Family", price: 34.99 }, { size_name: "Sheet", price: 53.99 }, { size_name: "GF", price: 29.99 }]},
  { id: "aur-pz-3", store_id: "aurora", category: "Pizzas", item_name: "Veggie Gourmet", ingredients_listed: ["Cheese", "Dough", "Sauce", "Vegetables"], sizes: [{ size_name: "Small", price: 16.99 }, { size_name: "Medium", price: 26.99 }, { size_name: "Large", price: 32.99 }, { size_name: "Family", price: 34.99 }, { size_name: "Sheet", price: 53.99 }, { size_name: "GF", price: 29.99 }]},
  { id: "aur-pz-4", store_id: "aurora", category: "Pizzas", item_name: "LeeAngelo's Specialty", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats", "Vegetables"], sizes: [{ size_name: "Small", price: 17.99 }, { size_name: "Medium", price: 29.99 }, { size_name: "Large", price: 34.99 }, { size_name: "Family", price: 39.99 }, { size_name: "Sheet", price: 57.99 }, { size_name: "GF", price: 32.99 }]},
  { id: "aur-pz-5", store_id: "aurora", category: "Pizzas", item_name: "Hawaiian", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats"], sizes: [{ size_name: "Small", price: 16.99 }, { size_name: "Medium", price: 26.99 }, { size_name: "Large", price: 32.99 }, { size_name: "Family", price: 34.99 }, { size_name: "Sheet", price: 53.99 }, { size_name: "GF", price: 29.99 }]},
  { id: "aur-pz-6", store_id: "aurora", category: "Pizzas", item_name: "Chix Bacon Ranch", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats"], sizes: [{ size_name: "Small", price: 16.99 }, { size_name: "Medium", price: 26.99 }, { size_name: "Large", price: 32.99 }, { size_name: "Family", price: 34.99 }, { size_name: "Sheet", price: 53.99 }, { size_name: "GF", price: 29.99 }]},
  { id: "aur-pz-7", store_id: "aurora", category: "Pizzas", item_name: "Philly Steak", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats", "Vegetables"], sizes: [{ size_name: "Small", price: 16.99 }, { size_name: "Medium", price: 26.99 }, { size_name: "Large", price: 32.99 }, { size_name: "Family", price: 33.99 }, { size_name: "Sheet", price: 53.99 }, { size_name: "GF", price: 29.99 }]},
  { id: "aur-pz-8", store_id: "aurora", category: "Pizzas", item_name: "Buffalo Chicken", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats"], sizes: [{ size_name: "Small", price: 16.99 }, { size_name: "Medium", price: 26.99 }, { size_name: "Large", price: 32.99 }, { size_name: "Family", price: 34.99 }, { size_name: "Sheet", price: 53.99 }, { size_name: "GF", price: 29.99 }]},
  { id: "aur-pz-9", store_id: "aurora", category: "Pizzas", item_name: "BBQ Chicken", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats"], sizes: [{ size_name: "Small", price: 16.99 }, { size_name: "Medium", price: 26.99 }, { size_name: "Large", price: 32.99 }, { size_name: "Family", price: 34.99 }, { size_name: "Sheet", price: 53.99 }, { size_name: "GF", price: 29.99 }]},
  { id: "aur-pz-10", store_id: "aurora", category: "Pizzas", item_name: "Meaty Gourmet", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats"], sizes: [{ size_name: "Small", price: 16.99 }, { size_name: "Medium", price: 26.99 }, { size_name: "Large", price: 32.99 }, { size_name: "Family", price: 37.99 }, { size_name: "Sheet", price: 53.99 }, { size_name: "GF", price: 29.99 }]},
  { id: "aur-pz-11", store_id: "aurora", category: "Pizzas", item_name: "Bianca Pizza", ingredients_listed: ["Cheese", "Dough"], sizes: [{ size_name: "Small", price: 16.99 }, { size_name: "Medium", price: 26.99 }, { size_name: "Large", price: 32.99 }, { size_name: "Family", price: 34.99 }, { size_name: "Sheet", price: 53.99 }, { size_name: "GF", price: 29.99 }]},
  { id: "aur-pz-12", store_id: "aurora", category: "Pizzas", item_name: "Triple King", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats"], sizes: [{ size_name: "Small", price: 16.99 }, { size_name: "Medium", price: 26.99 }, { size_name: "Large", price: 32.99 }, { size_name: "Family", price: 37.99 }, { size_name: "Sheet", price: 53.99 }, { size_name: "GF", price: 29.99 }]},
  { id: "aur-cz-1", store_id: "aurora", category: "Calzones", item_name: "Create Your Own Calzone", ingredients_listed: ["Cheese", "Dough"], sizes: [{ size_name: "Small", price: 12.99 }, { size_name: "Medium", price: 18.99 }, { size_name: "Large", price: 22.99 }]},
  { id: "aur-cz-2", store_id: "aurora", category: "Calzones", item_name: "LeeAngelo's Calzone", ingredients_listed: ["Cheese", "Dough", "Meats", "Vegetables"], sizes: [{ size_name: "Small", price: 15.99 }, { size_name: "Medium", price: 20.99 }, { size_name: "Large", price: 24.99 }]},
  { id: "aur-st-1", store_id: "aurora", category: "Strombolis", item_name: "Cheese Stromboli", ingredients_listed: ["Cheese", "Dough"], sizes: [{ size_name: "Single", price: 9.99 }, { size_name: "Family", price: 20.99 }]},
  { id: "aur-st-2", store_id: "aurora", category: "Strombolis", item_name: "Chicken Stromboli", ingredients_listed: ["Cheese", "Dough", "Meats"], sizes: [{ size_name: "Single", price: 9.99 }, { size_name: "Family", price: 20.99 }]},
  { id: "aur-st-3", store_id: "aurora", category: "Strombolis", item_name: "Deluxe Stromboli", ingredients_listed: ["Cheese", "Dough", "Meats", "Vegetables"], sizes: [{ size_name: "Single", price: 9.99 }, { size_name: "Family", price: 20.99 }]},
  { id: "aur-st-4", store_id: "aurora", category: "Strombolis", item_name: "House Stromboli", ingredients_listed: ["Cheese", "Dough", "Meats", "Vegetables"], sizes: [{ size_name: "Single", price: 9.99 }, { size_name: "Family", price: 20.99 }]},
  { id: "aur-st-5", store_id: "aurora", category: "Strombolis", item_name: "Steak Stromboli", ingredients_listed: ["Cheese", "Dough", "Meats", "Vegetables"], sizes: [{ size_name: "Single", price: 9.99 }, { size_name: "Family", price: 20.99 }]},
  { id: "aur-su-1", store_id: "aurora", category: "Subs", item_name: "Meatball Sub", ingredients_listed: ["Meats", "Dough", "Sauce", "Cheese"], sizes: [{ size_name: "Full", price: 16.99 }]},
  { id: "aur-su-2", store_id: "aurora", category: "Subs", item_name: "Italian Sub", ingredients_listed: ["Meats", "Dough", "Cheese", "Vegetables"], sizes: [{ size_name: "Full", price: 16.99 }]},
  { id: "aur-su-3", store_id: "aurora", category: "Subs", item_name: "Chicken Parm Sub", ingredients_listed: ["Meats", "Dough", "Sauce", "Cheese"], sizes: [{ size_name: "Full", price: 16.99 }]},
  { id: "aur-su-4", store_id: "aurora", category: "Subs", item_name: "Chicken Bacon Ranch Sub", ingredients_listed: ["Meats", "Dough", "Cheese"], sizes: [{ size_name: "Full", price: 16.99 }]},
  { id: "aur-su-5", store_id: "aurora", category: "Subs", item_name: "Philly Cheese Steak Sub", ingredients_listed: ["Meats", "Dough", "Cheese", "Vegetables"], sizes: [{ size_name: "Full", price: 16.99 }]},
  { id: "aur-su-6", store_id: "aurora", category: "Subs", item_name: "Chicken Philly Sub", ingredients_listed: ["Meats", "Dough", "Cheese", "Vegetables"], sizes: [{ size_name: "Full", price: 16.99 }]},
  { id: "aur-wr-1", store_id: "aurora", category: "Wraps", item_name: "Buffalo Chicken Wrap", ingredients_listed: ["Meats", "Vegetables", "Sauce", "Cheese"], sizes: [{ size_name: "Full", price: 16.99 }]},
  { id: "aur-wr-2", store_id: "aurora", category: "Wraps", item_name: "Boom Boom Shrimp Wrap", ingredients_listed: ["Seafood", "Vegetables", "Sauce"], sizes: [{ size_name: "Full", price: 19.99 }]},
  { id: "aur-sa-1", store_id: "aurora", category: "Salads", item_name: "House Salad", ingredients_listed: ["Vegetables"], sizes: [{ size_name: "Full", price: 13.99 }]},
  { id: "aur-sa-2", store_id: "aurora", category: "Salads", item_name: "Dinner Salad", ingredients_listed: ["Vegetables"], sizes: [{ size_name: "Small", price: 5.99 }, { size_name: "Large", price: 10.99 }]},
  { id: "aur-sa-3", store_id: "aurora", category: "Salads", item_name: "Antipasto Salad", ingredients_listed: ["Vegetables", "Meats", "Cheese"], sizes: [{ size_name: "Full", price: 15.99 }]},
  { id: "aur-sa-4", store_id: "aurora", category: "Salads", item_name: "Grecian Salad", ingredients_listed: ["Vegetables", "Cheese"], sizes: [{ size_name: "Full", price: 13.99 }]},
  { id: "aur-sa-5", store_id: "aurora", category: "Salads", item_name: "Crispy Chicken Salad", ingredients_listed: ["Vegetables", "Meats", "Cheese"], sizes: [{ size_name: "Full", price: 13.99 }]},
  { id: "aur-sa-6", store_id: "aurora", category: "Salads", item_name: "Buffalo Chicken Salad", ingredients_listed: ["Vegetables", "Meats", "Sauce"], sizes: [{ size_name: "Full", price: 13.99 }]},
  { id: "aur-sa-7", store_id: "aurora", category: "Salads", item_name: "Grilled Chicken Salad", ingredients_listed: ["Vegetables", "Meats"], sizes: [{ size_name: "Full", price: 13.99 }]},
  { id: "aur-sa-8", store_id: "aurora", category: "Salads", item_name: "Boom Boom Shrimp Salad", ingredients_listed: ["Vegetables", "Seafood", "Sauce"], sizes: [{ size_name: "Full", price: 15.99 }]},
  { id: "aur-wg-1", store_id: "aurora", category: "Wings", item_name: "Traditional Wings", ingredients_listed: ["Meats", "Sauce"], sizes: [{ size_name: "6pc", price: 10.99 }, { size_name: "8pc", price: 12.99 }, { size_name: "10pc", price: 17.99 }, { size_name: "50pc", price: 86.99 }]},
  { id: "aur-wg-2", store_id: "aurora", category: "Wings", item_name: "Traditional Wings Combo", ingredients_listed: ["Meats", "Sauce", "Beverages"], sizes: [{ size_name: "6pc", price: 13.99 }, { size_name: "8pc", price: 17.99 }, { size_name: "10pc", price: 20.99 }]},
  { id: "aur-wg-3", store_id: "aurora", category: "Wings", item_name: "Boneless Wings", ingredients_listed: ["Meats", "Sauce"], sizes: [{ size_name: "6pc", price: 9.99 }, { size_name: "8pc", price: 11.99 }, { size_name: "10pc", price: 15.99 }, { size_name: "50pc", price: 75.99 }]},
  { id: "aur-wg-4", store_id: "aurora", category: "Wings", item_name: "Boneless Wings Combo", ingredients_listed: ["Meats", "Sauce", "Beverages"], sizes: [{ size_name: "6pc", price: 15.99 }, { size_name: "8pc", price: 18.99 }, { size_name: "10pc", price: 21.99 }]},
  { id: "aur-sh-1", store_id: "aurora", category: "Shareables", item_name: "Cheesy Bread", ingredients_listed: ["Cheese", "Dough"], sizes: [{ size_name: "Small", price: 10.99 }, { size_name: "Medium", price: 17.99 }, { size_name: "Large", price: 22.99 }, { size_name: "Family", price: 24.99 }, { size_name: "GF", price: 20.99 }, { size_name: "Sheet", price: 39.99 }]},
  { id: "aur-sh-2", store_id: "aurora", category: "Shareables", item_name: "Crazy Bread", ingredients_listed: ["Cheese", "Dough"], sizes: [{ size_name: "Small", price: 10.99 }, { size_name: "Medium", price: 17.99 }, { size_name: "Large", price: 22.99 }, { size_name: "Family", price: 24.99 }, { size_name: "GF", price: 20.99 }, { size_name: "Sheet", price: 39.99 }]},
  { id: "aur-sh-3", store_id: "aurora", category: "Shareables", item_name: "French Fries", ingredients_listed: ["Vegetables"], sizes: [{ size_name: "Half", price: 5.95 }, { size_name: "Full", price: 8.95 }]},
  { id: "aur-sh-4", store_id: "aurora", category: "Shareables", item_name: "Mozz Sticks", ingredients_listed: ["Cheese"], sizes: [{ size_name: "Full", price: 9.95 }]},
  { id: "aur-sh-5", store_id: "aurora", category: "Shareables", item_name: "Fried Pickles", ingredients_listed: ["Vegetables"], sizes: [{ size_name: "Full", price: 9.95 }]},
  { id: "aur-sh-6", store_id: "aurora", category: "Shareables", item_name: "Pepperoni Roll", ingredients_listed: ["Dough", "Meats", "Cheese"], sizes: [{ size_name: "Full", price: 16.99 }]},
  { id: "aur-sh-7", store_id: "aurora", category: "Shareables", item_name: "Jojo's", ingredients_listed: ["Vegetables"], sizes: [{ size_name: "6pc", price: 4.99 }, { size_name: "12pc", price: 9.99 }, { size_name: "25pc Box", price: 17.99 }]},
  { id: "aur-sh-8", store_id: "aurora", category: "Shareables", item_name: "Onion Rings", ingredients_listed: ["Vegetables"], sizes: [{ size_name: "Full", price: 9.95 }]},
  { id: "aur-sh-9", store_id: "aurora", category: "Shareables", item_name: "Mac & Cheese", ingredients_listed: ["Cheese", "Dough"], sizes: [{ size_name: "Full", price: 9.95 }]},
  { id: "aur-sh-10", store_id: "aurora", category: "Shareables", item_name: "Eggrolls", ingredients_listed: ["Meats", "Vegetables"], sizes: [{ size_name: "Full", price: 10.95 }]},
  { id: "aur-sh-11", store_id: "aurora", category: "Shareables", item_name: "Pub Pretzels", ingredients_listed: ["Dough", "Cheese"], sizes: [{ size_name: "Full", price: 11.99 }]},
  { id: "aur-sh-12", store_id: "aurora", category: "Shareables", item_name: "Jalapeno Poppers", ingredients_listed: ["Vegetables", "Cheese"], sizes: [{ size_name: "Full", price: 9.95 }]},
  { id: "aur-sh-13", store_id: "aurora", category: "Shareables", item_name: "Sweet Potato Waffle Fries", ingredients_listed: ["Vegetables"], sizes: [{ size_name: "Full", price: 12.99 }]},
  { id: "aur-sh-14", store_id: "aurora", category: "Shareables", item_name: "Seasoned Waffle Fries", ingredients_listed: ["Vegetables"], sizes: [{ size_name: "Half", price: 6.99 }, { size_name: "Full", price: 10.99 }]},
  { id: "aur-sh-15", store_id: "aurora", category: "Shareables", item_name: "Buffalo Cauliflower", ingredients_listed: ["Vegetables", "Sauce"], sizes: [{ size_name: "Full", price: 9.95 }]},
  { id: "aur-bk-1", store_id: "aurora", category: "Buckets", item_name: "3PC Mixed", ingredients_listed: ["Meats"], sizes: [{ size_name: "3pc", price: 14.99 }]},
  { id: "aur-bk-2", store_id: "aurora", category: "Buckets", item_name: "3PC All Dark", ingredients_listed: ["Meats"], sizes: [{ size_name: "3pc", price: 14.99 }]},
  { id: "aur-bk-3", store_id: "aurora", category: "Buckets", item_name: "3PC All White", ingredients_listed: ["Meats"], sizes: [{ size_name: "3pc", price: 18.99 }]},
  { id: "aur-bk-4", store_id: "aurora", category: "Buckets", item_name: "8PC Mixed", ingredients_listed: ["Meats"], sizes: [{ size_name: "8pc", price: 29.99 }]},
  { id: "aur-bk-5", store_id: "aurora", category: "Buckets", item_name: "8PC All Dark", ingredients_listed: ["Meats"], sizes: [{ size_name: "8pc", price: 29.99 }]},
  { id: "aur-bk-6", store_id: "aurora", category: "Buckets", item_name: "8PC All White", ingredients_listed: ["Meats"], sizes: [{ size_name: "8pc", price: 32.99 }]},
  { id: "aur-bk-7", store_id: "aurora", category: "Buckets", item_name: "12PC Mixed", ingredients_listed: ["Meats"], sizes: [{ size_name: "12pc", price: 38.99 }]},
  { id: "aur-bk-8", store_id: "aurora", category: "Buckets", item_name: "12PC All Dark", ingredients_listed: ["Meats"], sizes: [{ size_name: "12pc", price: 38.99 }]},
  { id: "aur-bk-9", store_id: "aurora", category: "Buckets", item_name: "12PC All White", ingredients_listed: ["Meats"], sizes: [{ size_name: "12pc", price: 43.99 }]},
  { id: "aur-co-1", store_id: "aurora", category: "Combos", item_name: "LeeAngelo's Chx Sandwich", ingredients_listed: ["Meats", "Dough", "Vegetables"], sizes: [{ size_name: "Combo", price: 18.99 }]},
  { id: "aur-co-2", store_id: "aurora", category: "Combos", item_name: "Finger & Mac Meal", ingredients_listed: ["Meats", "Cheese", "Dough"], sizes: [{ size_name: "Combo", price: 17.80 }]},
  { id: "aur-co-3", store_id: "aurora", category: "Combos", item_name: "Tender Combo", ingredients_listed: ["Meats"], sizes: [{ size_name: "Combo", price: 18.99 }]},
  { id: "aur-co-4", store_id: "aurora", category: "Combos", item_name: "Wing Combo 6pc", ingredients_listed: ["Meats", "Sauce"], sizes: [{ size_name: "Combo", price: 18.99 }]},
  { id: "aur-co-5", store_id: "aurora", category: "Combos", item_name: "Cavatelli & Meatball", ingredients_listed: ["Dough", "Meats", "Sauce"], sizes: [{ size_name: "Combo", price: 19.99 }]},
  { id: "aur-co-6", store_id: "aurora", category: "Combos", item_name: "Chicken Parm Dinner", ingredients_listed: ["Meats", "Cheese", "Sauce", "Dough"], sizes: [{ size_name: "Combo", price: 20.99 }]},
  { id: "aur-co-7", store_id: "aurora", category: "Combos", item_name: "Spaghetti & Meatball", ingredients_listed: ["Dough", "Meats", "Sauce"], sizes: [{ size_name: "Combo", price: 19.99 }]},
  { id: "aur-dr-1", store_id: "aurora", category: "Drinks", item_name: "20oz Drink", ingredients_listed: ["Beverages"], sizes: [{ size_name: "20oz", price: 2.29 }]},
  { id: "aur-dr-2", store_id: "aurora", category: "Drinks", item_name: "Dipping Sauce", ingredients_listed: ["Sauce"], sizes: [{ size_name: "Each", price: 1.25 }]},
  { id: "aur-de-1", store_id: "aurora", category: "Desserts", item_name: "Mini Cannolis", ingredients_listed: ["Dough", "Cheese"], sizes: [{ size_name: "Full", price: 7.99 }]},
  { id: "aur-de-2", store_id: "aurora", category: "Desserts", item_name: "Fried Dough", ingredients_listed: ["Dough"], sizes: [{ size_name: "Full", price: 9.99 }]},

  // ========== KENT ==========
  { id: "knt-pz-1", store_id: "kent", category: "Pizzas", item_name: "Cheese Pizza", ingredients_listed: ["Cheese", "Dough", "Sauce"], sizes: [{ size_name: "Small", price: 7.95 }, { size_name: "Medium", price: 12.95 }, { size_name: "Large", price: 15.95 }, { size_name: "Family", price: 20.95 }, { size_name: "Sheet", price: 36.95 }, { size_name: "GF", price: 15.95 }]},
  { id: "knt-pz-2", store_id: "kent", category: "Pizzas", item_name: "Supreme", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats", "Vegetables"], sizes: [{ size_name: "Small", price: 13.95 }, { size_name: "Medium", price: 24.95 }, { size_name: "Large", price: 29.95 }, { size_name: "Family", price: 31.95 }, { size_name: "Sheet", price: 49.95 }, { size_name: "GF", price: 26.95 }]},
  { id: "knt-pz-3", store_id: "kent", category: "Pizzas", item_name: "Veggie Gourmet", ingredients_listed: ["Cheese", "Dough", "Sauce", "Vegetables"], sizes: [{ size_name: "Small", price: 13.95 }, { size_name: "Medium", price: 24.95 }, { size_name: "Large", price: 29.95 }, { size_name: "Family", price: 31.95 }, { size_name: "Sheet", price: 49.95 }, { size_name: "GF", price: 26.95 }]},
  { id: "knt-pz-4", store_id: "kent", category: "Pizzas", item_name: "LeeAngelo's Specialty", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats", "Vegetables"], sizes: [{ size_name: "Small", price: 15.95 }, { size_name: "Medium", price: 26.95 }, { size_name: "Large", price: 31.95 }, { size_name: "Family", price: 36.95 }, { size_name: "Sheet", price: 52.95 }, { size_name: "GF", price: 29.95 }]},
  { id: "knt-pz-5", store_id: "kent", category: "Pizzas", item_name: "Hawaiian", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats"], sizes: [{ size_name: "Small", price: 13.95 }, { size_name: "Medium", price: 24.95 }, { size_name: "Large", price: 29.95 }, { size_name: "Family", price: 31.95 }, { size_name: "Sheet", price: 49.95 }, { size_name: "GF", price: 26.95 }]},
  { id: "knt-pz-6", store_id: "kent", category: "Pizzas", item_name: "Chix Bacon Ranch", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats"], sizes: [{ size_name: "Small", price: 13.95 }, { size_name: "Medium", price: 24.95 }, { size_name: "Large", price: 29.95 }, { size_name: "Family", price: 31.95 }, { size_name: "Sheet", price: 49.95 }, { size_name: "GF", price: 26.95 }]},
  { id: "knt-pz-7", store_id: "kent", category: "Pizzas", item_name: "Philly Steak", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats", "Vegetables"], sizes: [{ size_name: "Small", price: 13.95 }, { size_name: "Medium", price: 24.95 }, { size_name: "Large", price: 29.95 }, { size_name: "Family", price: 31.95 }, { size_name: "Sheet", price: 49.95 }, { size_name: "GF", price: 26.95 }]},
  { id: "knt-pz-8", store_id: "kent", category: "Pizzas", item_name: "Buffalo Chicken", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats"], sizes: [{ size_name: "Small", price: 13.95 }, { size_name: "Medium", price: 24.95 }, { size_name: "Large", price: 29.95 }, { size_name: "Family", price: 31.95 }, { size_name: "Sheet", price: 49.95 }, { size_name: "GF", price: 26.95 }]},
  { id: "knt-pz-9", store_id: "kent", category: "Pizzas", item_name: "BBQ Chicken", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats"], sizes: [{ size_name: "Small", price: 13.95 }, { size_name: "Medium", price: 24.95 }, { size_name: "Large", price: 29.95 }, { size_name: "Family", price: 31.95 }, { size_name: "Sheet", price: 49.95 }, { size_name: "GF", price: 26.95 }]},
  { id: "knt-pz-10", store_id: "kent", category: "Pizzas", item_name: "Meaty Gourmet", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats"], sizes: [{ size_name: "Small", price: 13.95 }, { size_name: "Medium", price: 24.95 }, { size_name: "Large", price: 29.95 }, { size_name: "Family", price: 34.95 }, { size_name: "Sheet", price: 49.95 }, { size_name: "GF", price: 26.95 }]},
  { id: "knt-pz-11", store_id: "kent", category: "Pizzas", item_name: "Bianca Pizza", ingredients_listed: ["Cheese", "Dough"], sizes: [{ size_name: "Small", price: 13.95 }, { size_name: "Medium", price: 24.95 }, { size_name: "Large", price: 29.95 }, { size_name: "Family", price: 31.95 }, { size_name: "Sheet", price: 49.95 }, { size_name: "GF", price: 26.95 }]},
  { id: "knt-pz-12", store_id: "kent", category: "Pizzas", item_name: "Triple King", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats"], sizes: [{ size_name: "Small", price: 13.95 }, { size_name: "Medium", price: 24.95 }, { size_name: "Large", price: 29.95 }, { size_name: "Family", price: 34.95 }, { size_name: "Sheet", price: 49.95 }, { size_name: "GF", price: 26.95 }]},
  { id: "knt-cz-1", store_id: "kent", category: "Calzones", item_name: "Create Your Own Calzone", ingredients_listed: ["Cheese", "Dough"], sizes: [{ size_name: "Small", price: 11.95 }, { size_name: "Medium", price: 16.95 }, { size_name: "Large", price: 20.95 }]},
  { id: "knt-cz-2", store_id: "kent", category: "Calzones", item_name: "LeeAngelo's Calzone", ingredients_listed: ["Cheese", "Dough", "Meats", "Vegetables"], sizes: [{ size_name: "Small", price: 13.95 }, { size_name: "Medium", price: 18.95 }, { size_name: "Large", price: 22.95 }]},
  { id: "knt-st-1", store_id: "kent", category: "Strombolis", item_name: "Cheese Stromboli", ingredients_listed: ["Cheese", "Dough"], sizes: [{ size_name: "Single", price: 8.95 }, { size_name: "Family", price: 18.95 }]},
  { id: "knt-st-2", store_id: "kent", category: "Strombolis", item_name: "Chicken Stromboli", ingredients_listed: ["Cheese", "Dough", "Meats"], sizes: [{ size_name: "Single", price: 8.95 }, { size_name: "Family", price: 18.95 }]},
  { id: "knt-st-3", store_id: "kent", category: "Strombolis", item_name: "Deluxe Stromboli", ingredients_listed: ["Cheese", "Dough", "Meats", "Vegetables"], sizes: [{ size_name: "Single", price: 8.95 }, { size_name: "Family", price: 18.95 }]},
  { id: "knt-st-4", store_id: "kent", category: "Strombolis", item_name: "House Stromboli", ingredients_listed: ["Cheese", "Dough", "Meats", "Vegetables"], sizes: [{ size_name: "Single", price: 8.95 }, { size_name: "Family", price: 18.95 }]},
  { id: "knt-st-5", store_id: "kent", category: "Strombolis", item_name: "Steak Stromboli", ingredients_listed: ["Cheese", "Dough", "Meats", "Vegetables"], sizes: [{ size_name: "Single", price: 8.95 }, { size_name: "Family", price: 18.95 }]},
  { id: "knt-su-1", store_id: "kent", category: "Subs", item_name: "Meatball Sub", ingredients_listed: ["Meats", "Dough", "Sauce", "Cheese"], sizes: [{ size_name: "Full", price: 14.95 }]},
  { id: "knt-su-2", store_id: "kent", category: "Subs", item_name: "Italian Sub", ingredients_listed: ["Meats", "Dough", "Cheese", "Vegetables"], sizes: [{ size_name: "Full", price: 14.95 }]},
  { id: "knt-su-3", store_id: "kent", category: "Subs", item_name: "Chicken Parm Sub", ingredients_listed: ["Meats", "Dough", "Sauce", "Cheese"], sizes: [{ size_name: "Full", price: 14.95 }]},
  { id: "knt-su-4", store_id: "kent", category: "Subs", item_name: "Chicken Bacon Ranch Sub", ingredients_listed: ["Meats", "Dough", "Cheese"], sizes: [{ size_name: "Full", price: 14.95 }]},
  { id: "knt-su-5", store_id: "kent", category: "Subs", item_name: "Philly Cheese Steak Sub", ingredients_listed: ["Meats", "Dough", "Cheese", "Vegetables"], sizes: [{ size_name: "Full", price: 14.95 }]},
  { id: "knt-su-6", store_id: "kent", category: "Subs", item_name: "Chicken Philly Sub", ingredients_listed: ["Meats", "Dough", "Cheese", "Vegetables"], sizes: [{ size_name: "Full", price: 14.95 }]},
  { id: "knt-wr-1", store_id: "kent", category: "Wraps", item_name: "Buffalo Chicken Wrap", ingredients_listed: ["Meats", "Vegetables", "Sauce", "Cheese"], sizes: [{ size_name: "Full", price: 14.95 }]},
  { id: "knt-wr-2", store_id: "kent", category: "Wraps", item_name: "Boom Boom Shrimp Wrap", ingredients_listed: ["Seafood", "Vegetables", "Sauce"], sizes: [{ size_name: "Full", price: 17.95 }]},
  { id: "knt-sa-1", store_id: "kent", category: "Salads", item_name: "House Salad", ingredients_listed: ["Vegetables"], sizes: [{ size_name: "Full", price: 10.95 }]},
  { id: "knt-sa-2", store_id: "kent", category: "Salads", item_name: "Dinner Salad", ingredients_listed: ["Vegetables"], sizes: [{ size_name: "Small", price: 4.95 }, { size_name: "Large", price: 7.95 }]},
  { id: "knt-sa-3", store_id: "kent", category: "Salads", item_name: "Antipasto Salad", ingredients_listed: ["Vegetables", "Meats", "Cheese"], sizes: [{ size_name: "Full", price: 12.95 }]},
  { id: "knt-sa-4", store_id: "kent", category: "Salads", item_name: "Grecian Salad", ingredients_listed: ["Vegetables", "Cheese"], sizes: [{ size_name: "Full", price: 11.95 }]},
  { id: "knt-sa-5", store_id: "kent", category: "Salads", item_name: "Crispy Chicken Salad", ingredients_listed: ["Vegetables", "Meats", "Cheese"], sizes: [{ size_name: "Full", price: 10.95 }]},
  { id: "knt-sa-6", store_id: "kent", category: "Salads", item_name: "Buffalo Chicken Salad", ingredients_listed: ["Vegetables", "Meats", "Sauce"], sizes: [{ size_name: "Full", price: 10.95 }]},
  { id: "knt-sa-7", store_id: "kent", category: "Salads", item_name: "Grilled Chicken Salad", ingredients_listed: ["Vegetables", "Meats"], sizes: [{ size_name: "Full", price: 10.95 }]},
  { id: "knt-sa-8", store_id: "kent", category: "Salads", item_name: "Boom Boom Shrimp Salad", ingredients_listed: ["Vegetables", "Seafood", "Sauce"], sizes: [{ size_name: "Full", price: 12.95 }]},
  { id: "knt-wg-1", store_id: "kent", category: "Wings", item_name: "Traditional Wings", ingredients_listed: ["Meats", "Sauce"], sizes: [{ size_name: "6pc", price: 9.95 }, { size_name: "8pc", price: 11.95 }, { size_name: "10pc", price: 15.95 }, { size_name: "50pc", price: 79.95 }]},
  { id: "knt-wg-2", store_id: "kent", category: "Wings", item_name: "Traditional Wings Combo", ingredients_listed: ["Meats", "Sauce", "Beverages"], sizes: [{ size_name: "6pc", price: 12.95 }, { size_name: "8pc", price: 15.95 }, { size_name: "10pc", price: 18.95 }]},
  { id: "knt-wg-3", store_id: "kent", category: "Wings", item_name: "Boneless Wings", ingredients_listed: ["Meats", "Sauce"], sizes: [{ size_name: "6pc", price: 8.95 }, { size_name: "8pc", price: 10.95 }, { size_name: "10pc", price: 13.95 }, { size_name: "50pc", price: 69.95 }]},
  { id: "knt-wg-4", store_id: "kent", category: "Wings", item_name: "Boneless Wings Combo", ingredients_listed: ["Meats", "Sauce", "Beverages"], sizes: [{ size_name: "6pc", price: 13.95 }, { size_name: "8pc", price: 16.95 }, { size_name: "10pc", price: 19.95 }]},
  { id: "knt-co-1", store_id: "kent", category: "Combos", item_name: "Fish Dinner", ingredients_listed: ["Seafood"], sizes: [{ size_name: "Combo", price: 15.95 }]},
  { id: "knt-co-2", store_id: "kent", category: "Combos", item_name: "Crispy Shrimp Dinner", ingredients_listed: ["Seafood"], sizes: [{ size_name: "Combo", price: 15.95 }]},
  { id: "knt-co-3", store_id: "kent", category: "Combos", item_name: "Spaghetti & Meatball", ingredients_listed: ["Dough", "Meats", "Sauce"], sizes: [{ size_name: "Combo", price: 16.95 }]},
  { id: "knt-co-4", store_id: "kent", category: "Combos", item_name: "Chicken Parm Dinner", ingredients_listed: ["Meats", "Cheese", "Sauce", "Dough"], sizes: [{ size_name: "Combo", price: 16.95 }]},
  { id: "knt-dr-1", store_id: "kent", category: "Drinks", item_name: "20oz Drink", ingredients_listed: ["Beverages"], sizes: [{ size_name: "20oz", price: 2.29 }]},
  { id: "knt-dr-2", store_id: "kent", category: "Drinks", item_name: "Water", ingredients_listed: ["Beverages"], sizes: [{ size_name: "Bottle", price: 2.00 }]},
  { id: "knt-dr-3", store_id: "kent", category: "Drinks", item_name: "Dipping Sauce", ingredients_listed: ["Sauce"], sizes: [{ size_name: "Each", price: 1.00 }]},
  { id: "knt-de-1", store_id: "kent", category: "Desserts", item_name: "Mini Cannolis", ingredients_listed: ["Dough", "Cheese"], sizes: [{ size_name: "Full", price: 6.99 }]},
  { id: "knt-de-2", store_id: "kent", category: "Desserts", item_name: "Fried Dough", ingredients_listed: ["Dough"], sizes: [{ size_name: "Full", price: 8.95 }]},
  { id: "knt-de-3", store_id: "kent", category: "Desserts", item_name: "MVP Brownie", ingredients_listed: ["Dough"], sizes: [{ size_name: "Full", price: 11.95 }]},

  // ========== LINDSEY'S ==========
  { id: "lin-pz-1", store_id: "lindseys", category: "Pizzas", item_name: "Cheese Pizza", ingredients_listed: ["Cheese", "Dough", "Sauce"], sizes: [{ size_name: "Individual", price: 7.50 }, { size_name: "Small", price: 14.50 }, { size_name: "Large", price: 23.00 }, { size_name: "Sheet", price: 42.50 }, { size_name: "GF", price: 14.50 }]},
  { id: "lin-pz-2", store_id: "lindseys", category: "Pizzas", item_name: "Bianco Pizza", ingredients_listed: ["Cheese", "Dough"], sizes: [{ size_name: "Individual", price: 7.50 }, { size_name: "Small", price: 14.50 }, { size_name: "Large", price: 23.00 }, { size_name: "Sheet", price: 42.50 }, { size_name: "GF", price: 14.50 }]},
  { id: "lin-pz-3", store_id: "lindseys", category: "Pizzas", item_name: "Specialty Pizza", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats", "Vegetables"], sizes: [{ size_name: "Individual", price: 10.00 }, { size_name: "Small", price: 20.50 }, { size_name: "Large", price: 31.50 }, { size_name: "Sheet", price: 55.50 }, { size_name: "GF", price: 20.50 }]},
  { id: "lin-pz-4", store_id: "lindseys", category: "Pizzas", item_name: "Deluxe Pizza", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats", "Vegetables"], sizes: [{ size_name: "Individual", price: 10.50 }, { size_name: "Small", price: 21.50 }, { size_name: "Large", price: 32.25 }, { size_name: "Sheet", price: 57.95 }, { size_name: "GF", price: 21.50 }]},
  { id: "lin-pz-5", store_id: "lindseys", category: "Pizzas", item_name: "Egg Pizza", ingredients_listed: ["Cheese", "Dough", "Sauce"], sizes: [{ size_name: "Small", price: 19.50 }, { size_name: "Large", price: 29.00 }, { size_name: "GF", price: 19.50 }]},
  { id: "lin-pz-6", store_id: "lindseys", category: "Pizzas", item_name: "Lindsey's Specialty", ingredients_listed: ["Cheese", "Dough", "Sauce", "Meats", "Vegetables"], sizes: [{ size_name: "Individual", price: 10.00 }, { size_name: "Small", price: 20.50 }, { size_name: "Large", price: 31.95 }, { size_name: "GF", price: 20.50 }]},
  { id: "lin-cz-1", store_id: "lindseys", category: "Calzones", item_name: "Cheese Calzone", ingredients_listed: ["Cheese", "Dough"], sizes: [{ size_name: "Regular", price: 8.50 }, { size_name: "Party", price: 28.00 }]},
  { id: "lin-cz-2", store_id: "lindseys", category: "Calzones", item_name: "Deluxe Calzone", ingredients_listed: ["Cheese", "Dough", "Meats", "Vegetables"], sizes: [{ size_name: "Regular", price: 10.95 }, { size_name: "Party", price: 35.95 }]},
  { id: "lin-cz-3", store_id: "lindseys", category: "Calzones", item_name: "Veggie Calzone", ingredients_listed: ["Cheese", "Dough", "Vegetables"], sizes: [{ size_name: "Regular", price: 10.95 }, { size_name: "Party", price: 35.95 }]},
  { id: "lin-st-1", store_id: "lindseys", category: "Strombolis", item_name: "Cheese Stromboli", ingredients_listed: ["Cheese", "Dough"], sizes: [{ size_name: "Regular", price: 8.50 }, { size_name: "Party", price: 26.00 }]},
  { id: "lin-st-2", store_id: "lindseys", category: "Strombolis", item_name: "Regular Stromboli", ingredients_listed: ["Cheese", "Dough", "Meats"], sizes: [{ size_name: "Regular", price: 9.50 }, { size_name: "Party", price: 29.95 }]},
  { id: "lin-st-3", store_id: "lindseys", category: "Strombolis", item_name: "Deluxe Stromboli", ingredients_listed: ["Cheese", "Dough", "Meats", "Vegetables"], sizes: [{ size_name: "Regular", price: 10.95 }, { size_name: "Party", price: 35.95 }]},
  { id: "lin-st-4", store_id: "lindseys", category: "Strombolis", item_name: "Steak Stromboli", ingredients_listed: ["Cheese", "Dough", "Meats", "Vegetables"], sizes: [{ size_name: "Regular", price: 10.95 }, { size_name: "Party", price: 35.95 }]},
  { id: "lin-st-5", store_id: "lindseys", category: "Strombolis", item_name: "Chicken Stromboli", ingredients_listed: ["Cheese", "Dough", "Meats"], sizes: [{ size_name: "Regular", price: 10.95 }, { size_name: "Party", price: 35.95 }]},
  { id: "lin-wg-1", store_id: "lindseys", category: "Wings", item_name: "Breaded Wings", ingredients_listed: ["Meats", "Sauce"], sizes: [{ size_name: "6pc", price: 9.95 }, { size_name: "10pc", price: 15.95 }, { size_name: "12pc", price: 19.00 }, { size_name: "50pc", price: 72.95 }]},
  { id: "lin-wg-2", store_id: "lindseys", category: "Wings", item_name: "Naked Wings", ingredients_listed: ["Meats", "Sauce"], sizes: [{ size_name: "6pc", price: 9.95 }, { size_name: "10pc", price: 15.95 }, { size_name: "12pc", price: 19.00 }, { size_name: "50pc", price: 72.95 }]},
  { id: "lin-wg-3", store_id: "lindseys", category: "Wings", item_name: "Boneless Wings", ingredients_listed: ["Meats", "Sauce"], sizes: [{ size_name: "6pc", price: 8.95 }, { size_name: "10pc", price: 14.95 }, { size_name: "12pc", price: 15.95 }, { size_name: "50pc", price: 59.95 }]},
  { id: "lin-su-1", store_id: "lindseys", category: "Subs", item_name: "Sub", ingredients_listed: ["Meats", "Dough", "Cheese", "Vegetables"], sizes: [{ size_name: "Full", price: 9.95 }]},
  { id: "lin-pa-1", store_id: "lindseys", category: "Pasta", item_name: "Pasta Dish", ingredients_listed: ["Dough", "Sauce", "Cheese"], sizes: [{ size_name: "Full", price: 9.95 }]},
  { id: "lin-ap-1", store_id: "lindseys", category: "Appetizers", item_name: "Big Roni Roll", ingredients_listed: ["Dough", "Meats", "Cheese"], sizes: [{ size_name: "Full", price: 16.99 }]},
  { id: "lin-ap-2", store_id: "lindseys", category: "Appetizers", item_name: "Breadsticks", ingredients_listed: ["Dough"], sizes: [{ size_name: "Full", price: 6.50 }]},
  { id: "lin-ap-3", store_id: "lindseys", category: "Appetizers", item_name: "Cheese Breadsticks", ingredients_listed: ["Dough", "Cheese"], sizes: [{ size_name: "Full", price: 7.50 }]},
  { id: "lin-ap-4", store_id: "lindseys", category: "Appetizers", item_name: "Chicken Tenders", ingredients_listed: ["Meats"], sizes: [{ size_name: "Full", price: 13.95 }]},
  { id: "lin-ap-5", store_id: "lindseys", category: "Appetizers", item_name: "Poppers", ingredients_listed: ["Vegetables", "Cheese"], sizes: [{ size_name: "Full", price: 9.95 }]},
  { id: "lin-ap-6", store_id: "lindseys", category: "Appetizers", item_name: "Cheese Sticks", ingredients_listed: ["Cheese"], sizes: [{ size_name: "Full", price: 9.95 }]},
  { id: "lin-ap-7", store_id: "lindseys", category: "Appetizers", item_name: "Mushrooms", ingredients_listed: ["Vegetables"], sizes: [{ size_name: "Full", price: 9.95 }]},
  { id: "lin-ap-8", store_id: "lindseys", category: "Appetizers", item_name: "Sampler Platter", ingredients_listed: ["Meats", "Vegetables", "Cheese"], sizes: [{ size_name: "Full", price: 18.95 }]},
  { id: "lin-ch-1", store_id: "lindseys", category: "Chicken", item_name: "Mixed Chicken Dinner", ingredients_listed: ["Meats"], sizes: [{ size_name: "Dinner", price: 11.95 }]},
  { id: "lin-ch-2", store_id: "lindseys", category: "Chicken", item_name: "8pc Chicken", ingredients_listed: ["Meats"], sizes: [{ size_name: "8pc", price: 17.00 }]},
  { id: "lin-ch-3", store_id: "lindseys", category: "Chicken", item_name: "12pc Chicken", ingredients_listed: ["Meats"], sizes: [{ size_name: "12pc", price: 26.00 }]},
  { id: "lin-ch-4", store_id: "lindseys", category: "Chicken", item_name: "16pc Chicken", ingredients_listed: ["Meats"], sizes: [{ size_name: "16pc", price: 34.00 }]},
  { id: "lin-ch-5", store_id: "lindseys", category: "Chicken", item_name: "24pc Chicken", ingredients_listed: ["Meats"], sizes: [{ size_name: "24pc", price: 44.95 }]},
  { id: "lin-dr-1", store_id: "lindseys", category: "Drinks", item_name: "20oz Drink", ingredients_listed: ["Beverages"], sizes: [{ size_name: "20oz", price: 3.49 }]},
  { id: "lin-dr-2", store_id: "lindseys", category: "Drinks", item_name: "2 Liter", ingredients_listed: ["Beverages"], sizes: [{ size_name: "2L", price: 4.49 }]},
  { id: "lin-dr-3", store_id: "lindseys", category: "Drinks", item_name: "Water", ingredients_listed: ["Beverages"], sizes: [{ size_name: "Bottle", price: 2.00 }]},
  { id: "lin-dr-4", store_id: "lindseys", category: "Drinks", item_name: "Dipping Sauce", ingredients_listed: ["Sauce"], sizes: [{ size_name: "Each", price: 1.50 }]},
  { id: "lin-de-1", store_id: "lindseys", category: "Desserts", item_name: "Cannolis", ingredients_listed: ["Dough", "Cheese"], sizes: [{ size_name: "Full", price: 6.99 }]},
  { id: "lin-de-2", store_id: "lindseys", category: "Desserts", item_name: "Snickerdoodle Blondie", ingredients_listed: ["Dough"], sizes: [{ size_name: "Full", price: 11.95 }]},
];

export function getMenuByStore(storeId: string): MenuItem[] {
  if (storeId === "all") return MENU_DATA;
  return MENU_DATA.filter((item) => item.store_id === storeId);
}

export function getCategories(storeId: string): string[] {
  const items = getMenuByStore(storeId);
  return [...new Set(items.map((i) => i.category))].sort();
}

export function getComparableItems(): {
  item_name: string;
  stores: { store_id: string; storeName: string; sizes: { size_name: string; price: number }[] }[];
}[] {
  const itemNames = [...new Set(MENU_DATA.map((i) => i.item_name))];
  const storeNames: Record<string, string> = { kent: "LeeAngelo's Kent", aurora: "LeeAngelo's Aurora", lindseys: "Lindsey's" };

  return itemNames
    .map((name) => {
      const stores = (["kent", "aurora", "lindseys"] as const)
        .map((storeId) => {
          const item = MENU_DATA.find((i) => i.store_id === storeId && i.item_name === name);
          if (!item) return null;
          return { store_id: storeId, storeName: storeNames[storeId], sizes: item.sizes };
        })
        .filter((x): x is NonNullable<typeof x> => x != null);

      return { item_name: name, stores };
    })
    .filter((item) => item.stores.length > 1);
}

export function getMenuGaps(): { store_id: string; storeName: string; uniqueItems: string[] }[] {
  const storeNames: Record<string, string> = { kent: "LeeAngelo's Kent", aurora: "LeeAngelo's Aurora", lindseys: "Lindsey's" };
  const storeIds = ["kent", "aurora", "lindseys"] as const;

  return storeIds
    .map((storeId) => {
      const myItems = MENU_DATA.filter((i) => i.store_id === storeId).map((i) => i.item_name);
      const otherItems = MENU_DATA.filter((i) => i.store_id !== storeId).map((i) => i.item_name);
      const uniqueItems = myItems.filter((name) => !otherItems.includes(name));
      return { store_id: storeId, storeName: storeNames[storeId], uniqueItems };
    })
    .filter((s) => s.uniqueItems.length > 0);
}
