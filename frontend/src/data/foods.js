export const FOODS = [
  { id: 1, name: "Chicken Breast", protein_g: 31, carb_g: 0 },
  { id: 2, name: "Oats", protein_g: 10.6, carb_g: 66 },
  { id: 3, name: "Orange", protein_g: 0.9, carb_g: 11.8 },
  { id: 4, name: "Greek Yogurt", protein_g: 10, carb_g: 4 },
  { id: 5, name: "Broccoli", protein_g: 2.8, carb_g: 7 },
];

export function computeTotals(items = [], foods = FOODS) {
  let protein = 0;
  let carbs = 0;

  for (const it of items) {
    const food = foods.find((f) => f.id === Number(it.food_id));
    if (!food) continue;
    const grams = Number(it.grams) || 0;
    const factor = grams / 100;
    protein += (food.protein_g || 0) * factor;
    carbs += (food.carb_g || 0) * factor;
  }

  return {
    protein_g: +protein.toFixed(1),
    carb_g: +carbs.toFixed(1),
  };
}
