<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once __DIR__ . "/config.php";  // must define $pdo and GEMINI_API_KEY

// --- Input ---
$input   = json_decode(file_get_contents("php://input"), true) ?: [];
$message = trim($input["message"] ?? "");
$user_id = intval($input["user_id"] ?? 1);   // TODO: replace with logged-in user

if ($message === "") {
  echo json_encode(["error" => "Message required"]); exit;
}

$queryData = "";
try {
  // ---- MEALS (list last 5 meals by time + note; detailed macros usually need joins) ----
  if (stripos($message, "meal") !== false || stripos($message, "อาหาร") !== false) {
    // if you have meals table: meals(meal_id, user_id, at, note)
    $st = $pdo->prepare("
      SELECT at, note
      FROM meals
      WHERE user_id = ?
      ORDER BY at DESC
      LIMIT 5
    ");
    $st->execute([$user_id]);
    $rows = $st->fetchAll();
    if ($rows) {
      $queryData = "📋 มื้ออาหารล่าสุดของคุณ:\n";
      foreach ($rows as $r) {
        $dt = date('Y-m-d H:i', strtotime($r['at']));
        $note = $r['note'] ? " – ".$r['note'] : "";
        $queryData .= "- {$dt}{$note}\n";
      }
      // If you later add a view for daily protein/fiber, append summary here.
    } else {
      $queryData = "ยังไม่มีข้อมูลมื้ออาหารในฐานข้อมูล";
    }
  }

  // ---- WORKOUTS (uses your real columns) ----
  if (stripos($message, "workout") !== false || stripos($message, "ออกกำลังกาย") !== false) {
    $st = $pdo->prepare("
      SELECT started_at, duration_min, intensity, note
      FROM workouts
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT 5
    ");
    $st->execute([$user_id]);
    $rows = $st->fetchAll();
    if ($rows) {
      $queryData = "💪 การออกกำลังกายล่าสุดของคุณ:\n";
      foreach ($rows as $r) {
        $dt = date('Y-m-d H:i', strtotime($r['started_at']));
        $int = $r['intensity'] ?? 'n/a';
        $note = $r['note'] ? " – ".$r['note'] : "";
        $queryData .= "- {$dt}: {$r['duration_min']} นาที • {$int}{$note}\n";
      }
    } else {
      $queryData = "ยังไม่มีข้อมูลการออกกำลังกายในฐานข้อมูล";
    }
  }

  // ---- SLEEP (table is sleep_sessions with started_at/ended_at) ----
  if (stripos($message, "sleep") !== false || stripos($message, "นอน") !== false) {
    $st = $pdo->prepare("
      SELECT started_at, ended_at
      FROM sleep_sessions
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT 5
    ");
    $st->execute([$user_id]);
    $rows = $st->fetchAll();
    if ($rows) {
      $queryData = "🛌 ข้อมูลการนอนล่าสุดของคุณ:\n";
      foreach ($rows as $r) {
        $start = strtotime($r['started_at']);
        $end   = strtotime($r['ended_at']);
        $hours = $end > $start ? round(($end - $start) / 3600, 1) : 0;
        $queryData .= "- ".date('Y-m-d H:i', $start)." → ".date('H:i', $end)." • {$hours} ชม.\n";
      }
    } else {
      $queryData = "ยังไม่มีข้อมูลการนอนในฐานข้อมูล";
    }
  }

} catch (Throwable $e) {
  $queryData = "⚠️ Database error: " . $e->getMessage();
}

// --- Build prompt ---
$prompt = "You are the LongevityHub AI assistant. Answer clearly and kindly in Thai.\n\n"
        . "User asked: {$message}\n\n"
        . "Recent data from the LongevityHub database (user_id={$user_id}):\n"
        . ($queryData ?: "— ไม่มีข้อมูลที่เกี่ยวข้อง —");

// --- Call Gemini ---
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
  CURLOPT_TIMEOUT        => 20
]);
$response = curl_exec($ch);
if (curl_errno($ch)) {
  echo json_encode(["reply" => $queryData ?: ("⚠️ cURL error: " . curl_error($ch))], JSON_UNESCAPED_UNICODE);
  exit;
}
curl_close($ch);

$data = json_decode($response, true);
$reply = $data["candidates"][0]["content"]["parts"][0]["text"] ?? $queryData ?: "❌ Gemini ไม่ตอบกลับ";

echo json_encode(["reply" => $reply], JSON_UNESCAPED_UNICODE);
