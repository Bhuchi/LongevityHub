<?php
require __DIR__ . '/config.php';

if (!isset($_SESSION['user_id'])) {
  echo json_encode(["ok"=>true, "user"=>null]);
  exit;
}

$stmt = $pdo->prepare("SELECT id, full_name, email FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
echo json_encode(["ok"=>true, "user"=>$stmt->fetch()]);
