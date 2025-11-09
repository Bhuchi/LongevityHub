<?php
// controllers/meals.php
require_once __DIR__ . '/../config.php';  // sets CORS, JSON header, session start, $pdo

// -------- helpers --------
function parse_mysql_datetime($s) {
  if (!$s) return null;
  $dt = DateTime::createFromFormat('Y-m-d H:i:s', $s);
  return $dt ? $dt->format('Y-m-d H:i:s') : null;
}

// -------- current user from session --------
$me = $_SESSION['user'] ?? null; // shape: ['user_id'=>..,'role'=>..,'full_name'=>..]
if (!$me) {
  http_response_code(401);
  echo json_encode(['error' => 'unauthorized']); exit;
}
$actorId   = (int)$me['user_id'];
$actorRole = (string)$me['role'];

// Make DB trigger see who we are
$pdo->exec("SET @app_user_id = {$actorId}");
$pdo->exec("SET @app_role    = " . $pdo->quote($actorRole));

$method = $_SERVER['REQUEST_METHOD'];

// -------- POST: create meal (trigger enforces ACL) --------
if ($method === 'POST') {
  $body = json_decode(file_get_contents('php://input'), true) ?? [];

  // admin may create for others, members forced to self:
  $requestedUserId = isset($body['user_id']) ? (int)$body['user_id'] : $actorId;
  if ($actorRole !== 'admin') $requestedUserId = $actorId;

  $eaten_at = parse_mysql_datetime($body['at'] ?? '');
  $note     = trim((string)($body['note'] ?? ''));
  $items    = $body['items'] ?? [];

  if (!$eaten_at) { http_response_code(400); echo json_encode(['error'=>'bad datetime']); exit; }
  if (!is_array($items) || !count($items)) { http_response_code(400); echo json_encode(['error'=>'no items']); exit; }

  try {
    $pdo->beginTransaction();

    $insMeal = $pdo->prepare("INSERT INTO meals (user_id, eaten_at, note) VALUES (?, ?, ?)");
    $insMeal->execute([$requestedUserId, $eaten_at, $note]);
    $meal_id = (int)$pdo->lastInsertId();

    $insItem = $pdo->prepare("INSERT INTO meal_items (meal_id, food_id, grams) VALUES (?, ?, ?)");
    foreach ($items as $it) {
      $food_id = (int)($it['food_id'] ?? 0);
      $grams   = (float)($it['grams'] ?? 0);
      if ($food_id > 0 && $grams > 0) {
        $insItem->execute([$meal_id, $food_id, $grams]);
      }
    }

    $pdo->commit();
    echo json_encode(['ok' => true, 'meal_id' => $meal_id]);
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// -------- GET: list meals (admin can pass ?user_id=; member sees self) --------
if ($method === 'GET') {
  // by default, list own meals
  $targetUserId = $actorId;
  if ($actorRole === 'admin' && isset($_GET['user_id'])) {
    $targetUserId = (int)$_GET['user_id'];
  }

  try {
    $st = $pdo->prepare("SELECT meal_id, user_id, eaten_at, note FROM meals WHERE user_id=? ORDER BY eaten_at DESC");
    $st->execute([$targetUserId]);
    $meals = $st->fetchAll(PDO::FETCH_ASSOC);

    $stItems = $pdo->prepare("SELECT meal_item_id, meal_id, food_id, grams FROM meal_items WHERE meal_id=?");
    foreach ($meals as &$m) {
      $stItems->execute([$m['meal_id']]);
      $m['items'] = $stItems->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode(['ok' => true, 'meals' => $meals]);
  } catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

// -------- DELETE: remove a meal (owner or admin) --------
// already required config.php above and set @app_user_id / @app_role …

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $mealId = isset($_GET['meal_id']) ? (int)$_GET['meal_id'] : 0;
  if ($mealId <= 0) {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $mealId = (int)($body['meal_id'] ?? 0);
  }
  if ($mealId <= 0) { http_response_code(400); echo json_encode(['error'=>'missing meal_id']); exit; }

  try {
    $st = $pdo->prepare("SELECT user_id FROM meals WHERE meal_id=?");
    $st->execute([$mealId]);
    $row = $st->fetch();
    if (!$row) { http_response_code(404); echo json_encode(['error'=>'not_found']); exit; }
    if ($actorRole !== 'admin' && (int)$row['user_id'] !== $actorId) {
      http_response_code(403); echo json_encode(['error'=>'forbidden']); exit;
    }

    $pdo->beginTransaction();
    $pdo->prepare("DELETE FROM meals WHERE meal_id=?")->execute([$mealId]); // ON DELETE CASCADE handles items
    $pdo->commit();
    echo json_encode(['ok' => true]);
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'method_not_allowed']);
