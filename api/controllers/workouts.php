<?php
// CORS for Vite dev
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['http://localhost:5173','http://127.0.0.1:5173'], true)) {
  header("Access-Control-Allow-Origin: $origin");
  header('Access-Control-Allow-Credentials: true');
  header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config.php'; // starts session + $pdo

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
  http_response_code(401); echo json_encode(['error'=>'unauthorized']); exit;
}
$me        = $_SESSION['user'];
$actorId   = (int)$me['user_id'];
$actorRole = (string)($me['role'] ?? 'member');

// (optional) let triggers know who we are
$pdo->exec("SET @app_user_id = {$actorId}");
$pdo->exec("SET @app_role    = " . $pdo->quote($actorRole));

function fail($msg,$code=400){ http_response_code($code); echo json_encode(['error'=>$msg]); exit; }

// -------- GET: list my workouts (admin could extend with ?user_id=) --------
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

    $sql = "SELECT workout_id, user_id, started_at, duration_min, intensity, note
            FROM workouts
            WHERE user_id=?";
    $params = [$actorId];
    if ($useRangeFilter) {
      $sql .= " AND started_at >= ?";
      $params[] = $start->setTime(0, 0)->format('Y-m-d H:i:s');
    }
    $sql .= " ORDER BY started_at DESC";

    $st = $pdo->prepare($sql);
    $st->execute($params);
    $ws = $st->fetchAll();

    $stActs = $pdo->prepare("SELECT workout_id, activity_type, minutes, intensity, note
                             FROM workout_activities WHERE workout_id=? ORDER BY activity_id ASC");
    foreach ($ws as &$w) {
      $stActs->execute([$w['workout_id']]);
      $w['activities'] = $stActs->fetchAll();
    }

    echo json_encode(['ok'=>true, 'workouts'=>$ws]);
  } catch (Throwable $e) {
    fail($e->getMessage(), 500);
  }
  exit;
}

// -------- POST: create workout + activities --------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $b = json_decode(file_get_contents('php://input'), true) ?? [];

  $started_at   = $b['started_at'] ?? '';
  $duration_min = (int)($b['duration_min'] ?? 0);
  $intensity    = trim((string)($b['intensity'] ?? 'moderate'));
  $note         = trim((string)($b['note'] ?? ''));
  $activities   = is_array($b['activities'] ?? null) ? $b['activities'] : [];

  // strict datetime parse
  $dt = DateTime::createFromFormat('Y-m-d H:i:s', $started_at);
  if (!$dt) fail('bad datetime');

  if ($duration_min <= 0) fail('duration_min required');

  $cleanActivities = [];
  $activityTotalMin = 0;
  if ($activities) {
    foreach ($activities as $a) {
      $atype = trim((string)($a['activity_type'] ?? ''));
      $mins  = (int)($a['minutes'] ?? 0);
      $aint  = trim((string)($a['intensity'] ?? ''));
      $anote = trim((string)($a['note'] ?? ''));
      if ($atype === '' || $mins <= 0) {
        continue;
      }
      $cleanActivities[] = [
        'activity_type' => $atype,
        'minutes' => $mins,
        'intensity' => $aint,
        'note' => $anote,
      ];
      $activityTotalMin += $mins;
    }
  }

  if (!$cleanActivities) {
    fail('activities_required');
  }
  if ($activityTotalMin !== $duration_min) {
    fail('activities_duration_mismatch');
  }

  try {
    $pdo->beginTransaction();

    $insW = $pdo->prepare("INSERT INTO workouts (user_id, started_at, duration_min, intensity, note)
                           VALUES (?, ?, ?, ?, ?)");
    $insW->execute([$actorId, $dt->format('Y-m-d H:i:s'), $duration_min, $intensity, $note]);
    $workout_id = (int)$pdo->lastInsertId();

    $insA = $pdo->prepare("INSERT INTO workout_activities (workout_id, activity_type, minutes, intensity, note)
                           VALUES (?, ?, ?, ?, ?)");
    foreach ($cleanActivities as $a) {
      $insA->execute([$workout_id, $a['activity_type'], $a['minutes'], $a['intensity'], $a['note']]);
    }

    $pdo->commit();
    echo json_encode(['ok'=>true, 'workout_id'=>$workout_id]);
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fail($e->getMessage(), 500);
  }
  exit;
}

// -------- DELETE: remove a workout (and its activities via FK cascade) --------
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $wid = isset($_GET['workout_id']) ? (int)$_GET['workout_id'] : 0;
  if (!$wid) {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $wid  = (int)($body['workout_id'] ?? 0);
  }
  if ($wid <= 0) fail('missing workout_id');

  try {
    $st = $pdo->prepare("SELECT user_id FROM workouts WHERE workout_id=?");
    $st->execute([$wid]);
    $row = $st->fetch();
    if (!$row) fail('not_found', 404);
    if ($actorRole !== 'admin' && (int)$row['user_id'] !== $actorId) fail('forbidden', 403);

    // if FK has ON DELETE CASCADE you only need to delete parent
    $pdo->prepare("DELETE FROM workouts WHERE workout_id=?")->execute([$wid]);

    echo json_encode(['ok'=>true]);
  } catch (Throwable $e) {
    fail($e->getMessage(), 500);
  }
  exit;
}

fail('method_not_allowed', 405);
