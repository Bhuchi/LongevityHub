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
    $rows = $pdo->query("SELECT nutrient_id AS id, name, unit FROM nutrients ORDER BY name ASC")->fetchAll();
    echo json_encode(['ok' => true, 'nutrients' => $rows], JSON_UNESCAPED_UNICODE);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

if ($method === 'POST') {
  $body = json_decode(file_get_contents('php://input'), true) ?? [];
  $name = trim((string)($body['name'] ?? ''));
  $unit = trim((string)($body['unit'] ?? ''));
  if ($name === '' || $unit === '') json_fail('name and unit required');

  try {
    $stmt = $pdo->prepare("INSERT INTO nutrients (name, unit) VALUES (?, ?)");
    $stmt->execute([$name, $unit]);
    echo json_encode(['ok' => true, 'nutrient_id' => (int)$pdo->lastInsertId()]);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

if ($method === 'PUT') {
  $body = json_decode(file_get_contents('php://input'), true) ?? [];
  $nutrientId = (int)($body['nutrient_id'] ?? 0);
  if ($nutrientId <= 0) json_fail('nutrient_id required');

  $name = array_key_exists('name', $body) ? trim((string)$body['name']) : null;
  $unit = array_key_exists('unit', $body) ? trim((string)$body['unit']) : null;
  if ($name === null && $unit === null) json_fail('nothing to update');

  $fields = [];
  $params = [];
  if ($name !== null) {
    if ($name === '') json_fail('name cannot be empty');
    $fields[] = "name=?";
    $params[] = $name;
  }
  if ($unit !== null) {
    if ($unit === '') json_fail('unit cannot be empty');
    $fields[] = "unit=?";
    $params[] = $unit;
  }
  $params[] = $nutrientId;

  try {
    $pdo->prepare("UPDATE nutrients SET " . implode(',', $fields) . " WHERE nutrient_id=?")->execute($params);
    echo json_encode(['ok' => true]);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

if ($method === 'DELETE') {
  $payload = json_decode(file_get_contents('php://input'), true) ?? [];
  $nid = (int)($payload['nutrient_id'] ?? ($_GET['nutrient_id'] ?? 0));
  if ($nid <= 0) json_fail('nutrient_id required');

  try {
    $pdo->prepare("DELETE FROM nutrients WHERE nutrient_id=?")->execute([$nid]);
    echo json_encode(['ok' => true]);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

json_fail('method_not_allowed', 405);
