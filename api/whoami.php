<?php
require __DIR__ . '/config.php';

echo json_encode([
  'ok'   => true,
  'user' => $_SESSION['user'] ?? null
]);
