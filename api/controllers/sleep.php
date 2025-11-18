<?php
// ---------- CORS ----------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['http://localhost:5173','http://127.0.0.1:5173'], true)) {
  header("Access-Control-Allow-Origin: $origin");
  header('Access-Control-Allow-Credentials: true');
  header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// ---------- DB + session ----------
require_once __DIR__ . '/../config.php';

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
  http_response_code(401);
  echo json_encode(['error' => 'unauthorized']); 
  exit;
}

$actor   = $_SESSION['user'];
$actorId = (int)$actor['user_id'];
$actorRole = (string)($actor['role'] ?? 'member');

function json_fail($msg, $code=400) {
  http_response_code($code);
  echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

function parse_mysql_dt($s) {
  if (!$s) return null;
  $dt = DateTime::createFromFormat('Y-m-d H:i:s', $s);
  return $dt ? $dt->format('Y-m-d H:i:s') : null;
}

// ---------- GET: list sessions ----------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    $rangeParam = strtolower((string)($_GET['range'] ?? '7d'));
    $today = new DateTimeImmutable('today');
    $start = $today;
    $useRangeFilter = true;
    switch ($rangeParam) {
      case '30d':
        $start = $today->sub(new DateInterval('P29D'));
        break;
      case '1y':
        $start = $today->sub(new DateInterval('P1Y'));
        break;
      case 'all':
        $useRangeFilter = false;
        break;
      case '7d':
      default:
        $start = $today->sub(new DateInterval('P6D'));
        $rangeParam = '7d';
        break;
    }

    $targetUserId = $actorId;
    $sql = "
      SELECT sleep_id, user_id, start_time, end_time,
             TIMESTAMPDIFF(MINUTE, start_time, end_time) AS minutes
      FROM sleep_sessions
      WHERE user_id = ?";
    $params = [$targetUserId];
    if ($useRangeFilter) {
      $sql .= " AND start_time >= ?";
      $params[] = $start->setTime(0, 0)->format('Y-m-d H:i:s');
    }
    $sql .= " ORDER BY start_time DESC, sleep_id DESC";

    $st = $pdo->prepare($sql);
    $st->execute($params);
    $rows = $st->fetchAll();
    echo json_encode(['ok'=>true, 'sessions'=>$rows], JSON_UNESCAPED_UNICODE);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

// ---------- POST: create ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $b = json_decode(file_get_contents('php://input'), true) ?? [];
  $start = parse_mysql_dt($b['start'] ?? '');
  $end   = parse_mysql_dt($b['end'] ?? '');

  if (!$start || !$end) json_fail('missing start/end');

  try {
    $ins = $pdo->prepare("
      INSERT INTO sleep_sessions (user_id, start_time, end_time)
      VALUES (?, ?, ?)
    ");
    $ins->execute([$actorId, $start, $end]);
    echo json_encode(['ok'=>true, 'sleep_id'=>(int)$pdo->lastInsertId()]);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

// ---------- PUT: update ----------
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $b = json_decode(file_get_contents('php://input'), true) ?? [];
  $sleepId = (int)($b['sleep_id'] ?? 0);
  $start   = isset($b['start']) ? parse_mysql_dt($b['start']) : null;
  $end     = isset($b['end']) ? parse_mysql_dt($b['end']) : null;

  if ($sleepId <= 0) json_fail('missing sleep_id');

  try {
    $chk = $pdo->prepare("SELECT user_id FROM sleep_sessions WHERE sleep_id=?");
    $chk->execute([$sleepId]);
    $row = $chk->fetch();
    if (!$row) json_fail('not_found', 404);
    if ($actorRole !== 'admin' && (int)$row['user_id'] !== $actorId) json_fail('forbidden', 403);

    $set = []; $params = [];
    if ($start !== null) { $set[] = "start_time=?"; $params[] = $start; }
    if ($end !== null) { $set[] = "end_time=?"; $params[] = $end; }
    if (!$set) json_fail('nothing_to_update');

    $params[] = $sleepId;
    $pdo->prepare("UPDATE sleep_sessions SET ".implode(", ", $set)." WHERE sleep_id=?")->execute($params);
    echo json_encode(['ok'=>true]);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

// ---------- DELETE ----------
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $sleepId = isset($_GET['sleep_id']) ? (int)$_GET['sleep_id'] : 0;
  if ($sleepId <= 0) {
    $b = json_decode(file_get_contents('php://input'), true) ?? [];
    $sleepId = (int)($b['sleep_id'] ?? 0);
  }
  if ($sleepId <= 0) json_fail('missing sleep_id');

  try {
    $chk = $pdo->prepare("SELECT user_id FROM sleep_sessions WHERE sleep_id=?");
    $chk->execute([$sleepId]);
    $row = $chk->fetch();
    if (!$row) json_fail('not_found', 404);
    if ($actorRole !== 'admin' && (int)$row['user_id'] !== $actorId) json_fail('forbidden', 403);

    $pdo->prepare("DELETE FROM sleep_sessions WHERE sleep_id=?")->execute([$sleepId]);
    echo json_encode(['ok'=>true]);
  } catch (Throwable $e) {
    json_fail($e->getMessage(), 500);
  }
  exit;
}

json_fail('method_not_allowed', 405);
