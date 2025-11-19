<?php
require_once __DIR__ . '/../config.php';

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'unauthorized']);
  exit;
}

if (($_SESSION['user']['role'] ?? '') !== 'admin') {
  http_response_code(403);
  echo json_encode(['ok' => false, 'error' => 'forbidden']);
  exit;
}

function json_fail($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  try {
    $foodsStmt = $pdo->query("SELECT food_id, name FROM foods ORDER BY name ASC");
    $foods = [];
    foreach ($foodsStmt as $row) {
      $foods[$row['food_id']] = [
        'id' => (int)$row['food_id'],
        'name' => $row['name'],
        'nutrients' => [],
      ];
    }

    if ($foods) {
      $ids = array_keys($foods);
      $ph = implode(',', array_fill(0, count($ids), '?'));
      $fnStmt = $pdo->prepare("
        SELECT fn.food_id, fn.nutrient_id, fn.amount_per_100g, n.name, n.unit
        FROM food_nutrients fn
        JOIN nutrients n ON n.nutrient_id = fn.nutrient_id
        WHERE fn.food_id IN ($ph)
        ORDER BY n.name ASC
      ");
      $fnStmt->execute($ids);
      foreach ($fnStmt as $fn) {
        $foodId = (int)$fn['food_id'];
        if (!isset($foods[$foodId])) continue;
        $foods[$foodId]['nutrients'][] = [
          'nutrient_id' => (int)$fn['nutrient_id'],
          'name' => $fn['name'],
          'unit' => $fn['unit'],
          'amount' => (float)$fn['amount_per_100g'],
        ];
      }
    }

    $nutrientsStmt = $pdo->query("SELECT nutrient_id AS id, name, unit FROM nutrients ORDER BY name ASC");
    $nutrients = $nutrientsStmt->fetchAll();

    echo json_encode([
      'ok' => true,
      'foods' => array_values($foods),
      'nutrients' => $nutrients,
    ], JSON_UNESCAPED_UNICODE);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

if ($method === 'POST') {
  $body = json_decode(file_get_contents('php://input'), true) ?? [];
  $name = trim((string)($body['name'] ?? ''));
  $nutrients = is_array($body['nutrients'] ?? null) ? $body['nutrients'] : [];

  if ($name === '') json_fail('name required');

  try {
    $pdo->beginTransaction();
    $ins = $pdo->prepare("INSERT INTO foods (name) VALUES (?)");
    $ins->execute([$name]);
    $foodId = (int)$pdo->lastInsertId();

    if ($nutrients) {
      $insN = $pdo->prepare("INSERT INTO food_nutrients (food_id, nutrient_id, amount_per_100g) VALUES (?, ?, ?)");
      foreach ($nutrients as $n) {
        $nid = (int)($n['nutrient_id'] ?? 0);
        $amt = (float)($n['amount'] ?? 0);
        if ($nid > 0 && $amt > 0) {
          $insN->execute([$foodId, $nid, $amt]);
        }
      }
    }

    $pdo->commit();
    echo json_encode(['ok' => true, 'food_id' => $foodId]);
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    json_fail($e->getMessage(), 500);
  }
  exit;
}

if ($method === 'PUT') {
  $body = json_decode(file_get_contents('php://input'), true) ?? [];
  $foodId = (int)($body['food_id'] ?? 0);
  if ($foodId <= 0) json_fail('food_id required');

  $name = array_key_exists('name', $body) ? trim((string)$body['name']) : null;
  $nutrients = is_array($body['nutrients'] ?? null) ? $body['nutrients'] : null;

  try {
    $pdo->beginTransaction();

    $fields = [];
    $params = [];
    if ($name !== null) {
      if ($name === '') json_fail('name cannot be empty');
      $fields[] = "name=?";
      $params[] = $name;
    }
    if ($fields) {
      $params[] = $foodId;
      $pdo->prepare("UPDATE foods SET " . implode(",", $fields) . " WHERE food_id=?")->execute($params);
    }

    if (is_array($nutrients)) {
      $pdo->prepare("DELETE FROM food_nutrients WHERE food_id=?")->execute([$foodId]);
      if ($nutrients) {
        $ins = $pdo->prepare("INSERT INTO food_nutrients (food_id, nutrient_id, amount_per_100g) VALUES (?, ?, ?)");
        foreach ($nutrients as $n) {
          $nid = (int)($n['nutrient_id'] ?? 0);
          $amt = (float)($n['amount'] ?? 0);
          if ($nid > 0 && $amt > 0) {
            $ins->execute([$foodId, $nid, $amt]);
          }
        }
      }
    }

    $pdo->commit();
    echo json_encode(['ok' => true]);
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    json_fail($e->getMessage(), 500);
  }
  exit;
}

if ($method === 'DELETE') {
  $payload = json_decode(file_get_contents('php://input'), true) ?? [];
  $foodId = (int)($payload['food_id'] ?? ($_GET['food_id'] ?? 0));
  if ($foodId <= 0) json_fail('food_id required');

  try {
    $pdo->prepare("DELETE FROM foods WHERE food_id=?")->execute([$foodId]);
    echo json_encode(['ok' => true]);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

json_fail('method_not_allowed', 405);
