<?php
require_once "../config.php";
$id = $_GET["id"] ?? 0;
$stmt = $pdo->prepare("DELETE FROM workouts WHERE workout_id = ?");
$stmt->execute([$id]);
echo json_encode(["ok" => true, "deleted" => $id]);
