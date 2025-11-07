<?php
require_once "config.php";
$q = $pdo->query("SHOW TABLES");
echo json_encode(["connected" => true, "tables" => $q->fetchAll(PDO::FETCH_COLUMN)]);
