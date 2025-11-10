<?php
// ---------- CORS (Vite dev) ----------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['http://localhost:5173','http://127.0.0.1:5173'], true)) {
  header("Access-Control-Allow-Origin: $origin");
  header('Access-Control-Allow-Credentials: true');
  header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// ---------- DB + session ----------
require_once __DIR__ . '/../config.php';   // your PDO ($pdo) and session_start()

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit;
}
$me = $_SESSION['user'];
$user_id = (int)$me['user_id'];

// ---------- helpers ----------
function json_fail($msg, $code=400) {
  http_response_code($code);
  echo json_encode(['ok'=>false,'error'=>$msg], JSON_UNESCAPED_UNICODE);
  exit;
}
function to_decimal_or_null($v) {
  if ($v === '' || $v === null) return null;
  if (!is_numeric($v)) return null;
  return (float)$v;
}

// ---------- GET: load profile ----------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    // user basics
    $u = $pdo->prepare("SELECT user_id, full_name, tz FROM users WHERE user_id=?");
    $u->execute([$user_id]);
    $user = $u->fetch();

    // latest body measurement for this user
    $bm = $pdo->prepare("
      SELECT measurement_id, measured_at, height_cm, weight_kg, body_fat_pct, waist_cm, note
      FROM body_measurements
      WHERE user_id=?
      ORDER BY measured_at DESC, measurement_id DESC
      LIMIT 1
    ");
    $bm->execute([$user_id]);
    $latest = $bm->fetch() ?: null;

    // selected goals
    $goalsStmt = $pdo->prepare("
      SELECT goal_type, target_value
      FROM user_goals
      WHERE user_id=? AND is_active=1
        AND goal_type IN ('steps','sleep_hours','workout_min')
    ");
    $goalsStmt->execute([$user_id]);
    $goals = ['steps'=>null,'sleep_hours'=>null,'workout_min'=>null];
    foreach ($goalsStmt->fetchAll() as $g) {
      $goals[$g['goal_type']] = (float)$g['target_value'];
    }

    echo json_encode(['ok'=>true,'user'=>$user,'latest'=>$latest,'goals'=>$goals], JSON_UNESCAPED_UNICODE);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

// ---------- POST: save profile ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $body = json_decode(file_get_contents('php://input'), true) ?? [];

  $full_name = trim((string)($body['full_name'] ?? ''));
  $tz        = trim((string)($body['tz'] ?? ''));
  // measurements (optional but we’ll insert a row if weight/height etc provided)
  $height_cm   = to_decimal_or_null($body['height_cm'] ?? null);
  $weight_kg   = to_decimal_or_null($body['weight_kg'] ?? null);
  $body_fat_pct= to_decimal_or_null($body['body_fat_pct'] ?? null);
  $waist_cm    = to_decimal_or_null($body['waist_cm'] ?? null);
  $note        = trim((string)($body['note'] ?? ''));

  // goals (optional)
  $steps        = to_decimal_or_null($body['steps'] ?? null);
  $sleep_hours  = to_decimal_or_null($body['sleep_hours'] ?? null);
  $workout_min  = to_decimal_or_null($body['workout_min'] ?? null);

  try {
    $pdo->beginTransaction();

    // 1) update user name + tz (if provided)
    if ($full_name !== '' || $tz !== '') {
      $set = []; $params = [];
      if ($full_name !== '') { $set[] = "full_name=?"; $params[] = $full_name; }
      if ($tz !== '')        { $set[] = "tz=?";        $params[] = $tz; }
      if ($set) {
        $params[] = $user_id;
        $pdo->prepare("UPDATE users SET ".implode(",", $set)." WHERE user_id=?")->execute($params);
      }
    }

    // 2) insert a new body_measurements row IF at least one metric is provided
    $anyMetric = ($height_cm!==null || $weight_kg!==null || $body_fat_pct!==null || $waist_cm!==null || $note!=='');
    if ($anyMetric) {
      $ins = $pdo->prepare("
        INSERT INTO body_measurements (user_id, measured_at, height_cm, weight_kg, body_fat_pct, waist_cm, note)
        VALUES (?, NOW(), ?, ?, ?, ?, ?)
      ");
      $ins->execute([$user_id, $height_cm, $weight_kg, $body_fat_pct, $waist_cm, $note]);
    }

    // 3) upsert 3 goals (steps, sleep_hours, workout_min) if present
    $upsert = $pdo->prepare("
      INSERT INTO user_goals (user_id, goal_type, target_value, unit, starts_on, is_active)
      VALUES (?, ?, ?, ?, CURDATE(), 1)
      ON DUPLICATE KEY UPDATE
        target_value=VALUES(target_value),
        unit=VALUES(unit),
        is_active=VALUES(is_active)
    ");
    // make sure you have a UNIQUE KEY on (user_id, goal_type) in user_goals
    if ($steps !== null)       { $upsert->execute([$user_id, 'steps',       $steps,      'steps']); }
    if ($sleep_hours !== null) { $upsert->execute([$user_id, 'sleep_hours', $sleep_hours,'hours']); }
    if ($workout_min !== null) { $upsert->execute([$user_id, 'workout_min', $workout_min,'min']); }

    $pdo->commit();
    echo json_encode(['ok'=>true], JSON_UNESCAPED_UNICODE);
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    json_fail($e->getMessage(), 500);
  }
  exit;
}

json_fail('method_not_allowed', 405);
