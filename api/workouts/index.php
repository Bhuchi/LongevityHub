<?php
require_once "../config.php";
$user_id = $_GET["user_id"] ?? 1;
$stmt = $pdo->prepare("SELECT * FROM workouts WHERE user_id = ? ORDER BY started_at DESC");
$stmt->execute([$user_id]);
echo json_encode(["ok" => true, "workouts" => $stmt->fetchAll()]);
