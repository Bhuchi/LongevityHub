<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173'); // Vite dev
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }


header('Content-Type: application/json');
require __DIR__.'/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error'=>'POST required']); exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$email || !$password) {
  http_response_code(400);
  echo json_encode(['error'=>'Missing fields']); exit;
}

try {
  $st = $pdo->prepare('SELECT * FROM users WHERE email=? LIMIT 1');
  $st->execute([$email]);
  $u = $st->fetch();

  if (!$u || !password_verify($password, $u['password_hash'])) {
    http_response_code(401);
    echo json_encode(['error'=>'Invalid credentials']); exit;
  }

  unset($u['password_hash']);
  echo json_encode(['ok'=>true,'user'=>$u]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error'=>'server','details'=>$e->getMessage()]);
}
