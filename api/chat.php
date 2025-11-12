<?php
require_once __DIR__ . "/config.php";

function json_response($payload, $code = 200) {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
  json_response(['error' => 'unauthorized'], 401);
}

$user = $_SESSION['user'];
$role = strtolower($user['role'] ?? '');
if (!in_array($role, ['admin', 'premium'], true)) {
  json_response(['error' => 'premium_only'], 403);
}

$input = json_decode(file_get_contents("php://input"), true) ?? [];
$message = trim((string)($input['message'] ?? ''));
if ($message === '') {
  json_response(['error' => 'message_required'], 400);
}

$userId = (int)$user['user_id'];
$sections = [];

try {
  if (stripos($message, "meal") !== false || stripos($message, "อาหาร") !== false) {
    $st = $pdo->prepare("
      SELECT eaten_at, note
      FROM meals
      WHERE user_id = ?
      ORDER BY eaten_at DESC
      LIMIT 5
    ");
    $st->execute([$userId]);
    $rows = $st->fetchAll();
    if ($rows) {
      $txt = "📋 มื้ออาหารล่าสุด:\n";
      foreach ($rows as $r) {
        $dt = date('Y-m-d H:i', strtotime($r['eaten_at']));
        $note = $r['note'] ? " – {$r['note']}" : "";
        $txt .= "- {$dt}{$note}\n";
      }
      $sections[] = $txt;
    } else {
      $sections[] = "📋 ยังไม่มีข้อมูลมื้ออาหาร";
    }
  }

  if (stripos($message, "workout") !== false || stripos($message, "ออกกำลังกาย") !== false) {
    $st = $pdo->prepare("
      SELECT started_at, duration_min, intensity, note
      FROM workouts
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT 5
    ");
    $st->execute([$userId]);
    $rows = $st->fetchAll();
    if ($rows) {
      $txt = "💪 การออกกำลังกายล่าสุด:\n";
      foreach ($rows as $r) {
        $dt = date('Y-m-d H:i', strtotime($r['started_at']));
        $int = $r['intensity'] ?? 'n/a';
        $note = $r['note'] ? " – {$r['note']}" : "";
        $txt .= "- {$dt}: {$r['duration_min']} นาที • {$int}{$note}\n";
      }
      $sections[] = $txt;
    } else {
      $sections[] = "💪 ยังไม่มีข้อมูลการออกกำลังกาย";
    }
  }

  if (stripos($message, "sleep") !== false || stripos($message, "นอน") !== false) {
    $st = $pdo->prepare("
      SELECT start_time, end_time
      FROM sleep_sessions
      WHERE user_id = ?
      ORDER BY start_time DESC
      LIMIT 5
    ");
    $st->execute([$userId]);
    $rows = $st->fetchAll();
    if ($rows) {
      $txt = "🛌 การนอนล่าสุด:\n";
      foreach ($rows as $r) {
        $start = strtotime($r['start_time']);
        $end   = strtotime($r['end_time']);
        $hrs = ($end > $start) ? round(($end - $start) / 3600, 1) : 0;
        $txt .= "- ".date('Y-m-d H:i', $start)." → ".date('H:i', $end)." • {$hrs} ชม.\n";
      }
      $sections[] = $txt;
    } else {
      $sections[] = "🛌 ยังไม่มีข้อมูลการนอน";
    }
  }
} catch (Throwable $e) {
  $sections[] = "⚠️ Database error: " . $e->getMessage();
}

if (!defined('GEMINI_API_KEY')) {
  $envKey = getenv('GEMINI_API_KEY');
  if ($envKey) {
    define('GEMINI_API_KEY', $envKey);
  }
}

if (!defined('GEMINI_API_KEY') || GEMINI_API_KEY === '') {
  json_response(['error' => 'missing_gemini_api_key'], 500);
}

$context = $sections ? implode("\n\n", $sections) : "— ไม่มีข้อมูลที่เกี่ยวข้อง —";

$prompt = <<<PROMPT
You are the LongevityHub assistant. Reply in Thai, be concise, friendly, and use the supplied data when helpful.

User role: {$user['role']}
User question: {$message}

Recent data (user_id={$userId}):
{$context}
PROMPT;

$url  = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" . GEMINI_API_KEY;
$body = json_encode([
  "contents" => [[
    "role"  => "user",
    "parts" => [["text" => $prompt]]
  ]]
], JSON_UNESCAPED_UNICODE);

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST           => true,
  CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
  CURLOPT_POSTFIELDS     => $body,
  CURLOPT_TIMEOUT        => 20,
]);
$response = curl_exec($ch);
if ($response === false) {
  $err = curl_error($ch);
  curl_close($ch);
  json_response(['error' => 'gemini_request_failed', 'details' => $err], 502);
}
curl_close($ch);

$data = json_decode($response, true);
$reply = $data["candidates"][0]["content"]["parts"][0]["text"] ?? null;
if (!$reply) {
  $reply = $context ?: "❌ Gemini ไม่ตอบกลับ";
}

json_response(['reply' => $reply]);
