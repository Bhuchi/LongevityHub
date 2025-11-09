<?php
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'POST required']); exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim((string)($body['email'] ?? ''));
$pass  = (string)($body['password'] ?? '');

if ($email === '' || $pass === '') {
  http_response_code(400);
  echo json_encode(['error'=>'Missing fields']); exit;
}

try {
  $st = $pdo->prepare('SELECT * FROM users WHERE email=? LIMIT 1');
  $st->execute([$email]);
  $u = $st->fetch();

  if (!$u || !password_verify($pass, $u['password_hash'])) {
    http_response_code(401);
    echo json_encode(['error'=>'Invalid credentials']); exit;
  }

  // build the session user (match names you already use)
  $sessUser = [
    'user_id'   => (int)$u['user_id'],
    'full_name' => $u['full_name'],
    'email'     => $u['email'],
    'role'      => $u['role'],          // 'member' | 'premium' | 'admin'
    'tz'        => $u['tz'] ?? 'UTC',
  ];
  $_SESSION['user'] = $sessUser;

  // reply (you also keep a copy in localStorage if you want)
  echo json_encode(['ok'=>true,'user'=>$sessUser]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error'=>'server','details'=>$e->getMessage()]);
}
