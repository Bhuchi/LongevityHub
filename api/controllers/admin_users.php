<?php
// Admin-only user management controller
require_once __DIR__ . '/../config.php';

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'unauthorized']);
  exit;
}

$actor = $_SESSION['user'];
if (($actor['role'] ?? '') !== 'admin') {
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
  $search = trim((string)($_GET['q'] ?? ''));
  try {
    if ($search === '') {
      $stmt = $pdo->query("SELECT user_id, full_name, email, role, tz, created_at FROM users ORDER BY created_at DESC");
    } else {
      $stmt = $pdo->prepare("
        SELECT user_id, full_name, email, role, tz, created_at
        FROM users
        WHERE MATCH(full_name, email) AGAINST (? IN BOOLEAN MODE)
           OR full_name LIKE CONCAT('%', ?, '%')
           OR email LIKE CONCAT('%', ?, '%')
           OR role LIKE CONCAT('%', ?, '%')
        ORDER BY created_at DESC
      ");
      $stmt->execute([$search, $search, $search, $search]);
    }
    $rows = $stmt->fetchAll();
    echo json_encode(['ok' => true, 'users' => $rows], JSON_UNESCAPED_UNICODE);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

if ($method === 'POST') {
  $body = json_decode(file_get_contents('php://input'), true) ?? [];
  $fullName = trim((string)($body['full_name'] ?? ''));
  $email    = filter_var($body['email'] ?? '', FILTER_VALIDATE_EMAIL);
  $role     = strtolower((string)($body['role'] ?? 'member'));
  $password = (string)($body['password'] ?? '');

  if (!$fullName) json_fail('full_name required');
  if (!$email) json_fail('valid email required');
  if (!in_array($role, ['member', 'premium', 'admin'], true)) json_fail('invalid role');
  if ($password === '') json_fail('password required');

  try {
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, role, tz) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$fullName, $email, $hash, $role, $body['tz'] ?? 'Asia/Bangkok']);
    echo json_encode(['ok' => true, 'user_id' => (int)$pdo->lastInsertId()]);
  } catch (PDOException $e) {
    if ((int)$e->getCode() === 23000) {
      json_fail('email already exists', 409);
    }
    json_fail($e->getMessage(), 500);
  }
  exit;
}

if ($method === 'PUT') {
  $body = json_decode(file_get_contents('php://input'), true) ?? [];
  $userId = (int)($body['user_id'] ?? 0);
  if ($userId <= 0) json_fail('user_id required');

  $role = array_key_exists('role', $body) ? strtolower((string)$body['role']) : null;
  $tz   = array_key_exists('tz', $body) ? trim((string)$body['tz']) : null;

  $fields = [];
  $params = [];

  if ($role !== null) {
    if (!in_array($role, ['member', 'premium', 'admin'], true)) {
      json_fail('invalid role');
    }
    $fields[] = "role=?";
    $params[] = $role;
  }

  if ($tz !== null) {
    $fields[] = "tz=?";
    $params[] = ($tz === '' ? 'Asia/Bangkok' : $tz);
  }

  if (!$fields) json_fail('no changes provided');

  try {
    $params[] = $userId;
    $pdo->prepare("UPDATE users SET " . implode(',', $fields) . " WHERE user_id=?")->execute($params);
    echo json_encode(['ok' => true]);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

if ($method === 'DELETE') {
  $payload = $_GET;
  if ($_SERVER['CONTENT_TYPE'] ?? '' === 'application/json') {
    $body = json_decode(file_get_contents('php://input'), true);
    if (is_array($body)) $payload = array_merge($payload, $body);
  }
  $userId = (int)($payload['user_id'] ?? 0);
  if ($userId <= 0) json_fail('user_id required');
  if ($userId === (int)$actor['user_id']) json_fail('cannot delete self', 400);

  try {
    $pdo->prepare("DELETE FROM users WHERE user_id=?")->execute([$userId]);
    echo json_encode(['ok' => true]);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

json_fail('method_not_allowed', 405);
