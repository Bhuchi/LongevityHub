<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173'); // Vite dev
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST required']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$full_name = trim($data['full_name'] ?? '');
$email = strtolower(trim($data['email'] ?? ''));
$password = (string) ($data['password'] ?? '');
$is_premium = !empty($data['is_premium']); // coerce to boolean

// basic validation
if (!$full_name || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fields']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Password too short']);
    exit;
}

try {
    // unique email check
    $st = $pdo->prepare('SELECT user_id FROM users WHERE email=? LIMIT 1');
    $st->execute([$email]);
    if ($st->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Email already exists']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $tz = 'Asia/Bangkok';

    $is_premium = !empty($data['is_premium']);
    $role = $is_premium ? 'premium' : 'member';

    $ins = $pdo->prepare('
  INSERT INTO users (full_name, email, password_hash, role, tz)
  VALUES (?, ?, ?, ?, ?)
');
    $ins->execute([$full_name, $email, $hash, $role, $tz]);


    echo json_encode(['ok' => true, 'message' => 'registered', 'role' => $role]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'server', 'details' => $e->getMessage()]);
}
