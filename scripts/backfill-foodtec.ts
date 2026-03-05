import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function backfill() {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  // Use the live URL directly
  const syncUrl = 'https://getprimeos.com/api/foodtec/sync';
  
  const today = new Date();
  const days = 30;
  
  console.log(`=== Backfilling ${days} days of FoodTec data ===\n`);
  
  for (let i = 1; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const isoDay = date.toISOString().split('T')[0];
    
    try {
      const res = await fetch(`${syncUrl}?day=${isoDay}`);
      const data = await res.json();
      
      if (data.success) {
        console.log(`${isoDay}: ✅ orders=${data.orders} labor=${data.labor} products=${data.products}`);
      } else {
        console.log(`${isoDay}: ❌ ${data.error || 'unknown error'}`);
      }
    } catch (err: any) {
      console.log(`${isoDay}: ❌ ${err.message}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n=== Backfill complete ===');
}

backfill();
