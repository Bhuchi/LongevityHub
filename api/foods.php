<?php
require_once __DIR__ . '/config.php';

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'unauthorized']);
  exit;
}

try {
  $stmt = $pdo->query("
    SELECT
      f.food_id,
      f.name,
      COALESCE(MAX(CASE WHEN n.name = 'protein_g' THEN fn.amount_per_100g END), 0) AS protein_g,
      COALESCE(MAX(CASE WHEN n.name IN ('carb_g','Carbs_g') THEN fn.amount_per_100g END), 0) AS carb_g
    FROM foods f
    LEFT JOIN food_nutrients fn ON fn.food_id = f.food_id
    LEFT JOIN nutrients n ON n.nutrient_id = fn.nutrient_id
    GROUP BY f.food_id, f.name
    ORDER BY f.name ASC
  ");
  $foods = [];
  foreach ($stmt as $row) {
    $foods[] = [
      'id' => (int)$row['food_id'],
      'name' => $row['name'],
      'protein_g' => (float)$row['protein_g'],
      'carb_g' => (float)$row['carb_g'],
    ];
  }

  echo json_encode(['ok' => true, 'foods' => $foods], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
