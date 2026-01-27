
import { Client } from "npm:pg";
import data from "../FoodData_Central_foundation_food_json_2025-12-18.json" with { type: "json" };

const DB_URL = Deno.env.get("DATABASE_URL");
const PGUSER = Deno.env.get("PGUSER");

if (!DB_URL && !PGUSER) {
  console.error("DATABASE_URL or PGUSER is not set.");
  Deno.exit(1);
}

const client = DB_URL ? new Client(DB_URL) : new Client();

async function main() {
  await client.connect();

  try {
    // 1. Ensure System User
    const systemUserEmail = "system@nutrition-llama.com";
    let userId;

    const userRes = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [systemUserEmail]
    );

    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      console.log(`Found existing System User: ${userId}`);
    } else {
      console.log("Creating System User...");
      const insertRes = await client.query(
        `INSERT INTO users (email, password_hash, display_name)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [systemUserEmail, "system_hash_placeholder", "System User"]
      );
      userId = insertRes.rows[0].id;
      console.log(`Created System User: ${userId}`);
    }

    // 2. Process Foods
    console.log(`Processing ${data.FoundationFoods.length} foods...`);
    let count = 0;

    for (const food of data.FoundationFoods) {
      const name = food.description;
      
      // Default to 100g as FDC data is per 100g
      const servingSizeValue = 100;
      const servingSizeUnit = "g";

      // Nutrients
      // Map based on nutrient number
      const getNutrient = (number) => {
        const n = food.foodNutrients.find((fn) => fn.nutrient.number === number);
        return n ? n.amount : null;
      };

      const calories = getNutrient("208"); // Energy (kcal)
      const protein = getNutrient("203");
      const totalFat = getNutrient("204");
      const carbohydrates = getNutrient("205");
      const fiber = getNutrient("291");
      const sugars = getNutrient("269.3"); // Sugars, Total
      const sodium = getNutrient("307");
      const cholesterol = getNutrient("601");

      if (calories === null) {
        console.warn(`Skipping ${name} - No calories found.`);
        continue;
      }

      await client.query(
        `INSERT INTO nutrition_records 
        (user_id, name, serving_size_value, serving_size_unit, calories, 
         protein, total_fat, carbohydrates, fiber, sugars, sodium, cholesterol, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'api')`,
        [
          userId,
          name,
          servingSizeValue,
          servingSizeUnit,
          calories,
          protein || 0,
          totalFat || 0,
          carbohydrates || 0,
          fiber || 0,
          sugars || 0,
          sodium || 0,
          cholesterol || 0
        ]
      );
      count++;
      if (count % 100 === 0) {
        console.log(`Imported ${count} records...`);
      }
    }

    console.log(`Successfully imported ${count} foundation foods.`);

  } catch (err) {
    console.error("Error importing data:", err);
  } finally {
    await client.end();
  }
}

main();
