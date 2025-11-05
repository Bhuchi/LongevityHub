<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

require_once __DIR__ . "/config.php";

// 📥 รับข้อความจาก Frontend
$input = json_decode(file_get_contents("php://input"), true);
$message = trim($input["message"] ?? "");
if ($message === "") {
  echo json_encode(["error" => "❗ Message required"]);
  exit;
}

$queryData = "";

try {
  // 🥗 MEALS
  if (stripos($message, "meal") !== false || stripos($message, "อาหาร") !== false) {
    $stmt = $pdo->query("SELECT meal_name, protein, fiber, meal_date 
                         FROM meals ORDER BY meal_date DESC LIMIT 5");
    $rows = $stmt->fetchAll();
    if ($rows) {
      $queryData = "📋 ข้อมูลมื้ออาหารล่าสุด:\n";
      foreach ($rows as $r) {
        $queryData .= "- {$r['meal_date']} : {$r['meal_name']} ({$r['protein']} g โปรตีน, {$r['fiber']} g ไฟเบอร์)\n";
      }
    } else {
      $queryData = "ไม่มีข้อมูลมื้ออาหารในฐานข้อมูล.";
    }
  }

  // 🏋 WORKOUTS
  if (stripos($message, "workout") !== false || stripos($message, "ออกกำลังกาย") !== false) {
    $stmt = $pdo->query("SELECT workout_name, duration, effort_score, workout_date 
                         FROM workouts ORDER BY workout_date DESC LIMIT 5");
    $rows = $stmt->fetchAll();
    if ($rows) {
      $queryData = "💪 ข้อมูลการออกกำลังกายล่าสุด:\n";
      foreach ($rows as $r) {
        $queryData .= "- {$r['workout_date']} : {$r['workout_name']} {$r['duration']} นาที (effort {$r['effort_score']})\n";
      }
    } else {
      $queryData = "ไม่มีข้อมูลการออกกำลังกายในฐานข้อมูล.";
    }
  }

  // 😴 SLEEP
  if (stripos($message, "sleep") !== false || stripos($message, "นอน") !== false) {
    $stmt = $pdo->query("SELECT sleep_date, hours, quality 
                         FROM sleep ORDER BY sleep_date DESC LIMIT 5");
    $rows = $stmt->fetchAll();
    if ($rows) {
      $queryData = "🛌 ข้อมูลการนอนล่าสุด:\n";
      foreach ($rows as $r) {
        $queryData .= "- {$r['sleep_date']} : {$r['hours']} ชั่วโมง (คุณภาพ {$r['quality']})\n";
      }
    } else {
      $queryData = "ไม่มีข้อมูลการนอนในฐานข้อมูล.";
    }
  }

} catch (Exception $e) {
  $queryData = "⚠️ Database error: " . $e->getMessage();
}

// 🧠 เตรียม prompt ส่งให้ Gemini
$prompt = "You are the LongevityHub AI assistant. Answer clearly and kindly in Thai.\n\n"
        . "User asked: $message\n\n"
        . "Here is recent data from the LongevityHub database:\n"
        . ($queryData ?: "ไม่มีข้อมูลที่เกี่ยวข้องในฐานข้อมูล");

// 🚀 เรียก Gemini API (เวอร์ชันใหม่ v1)
$url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" . GEMINI_API_KEY;

$body = json_encode([
  "contents" => [[
    "role" => "user",
    "parts" => [["text" => $prompt]]
  ]]
], JSON_UNESCAPED_UNICODE);

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
  CURLOPT_POSTFIELDS => $body,
]);

$response = curl_exec($ch);
if (curl_errno($ch)) {
  echo json_encode(["reply" => "⚠️ cURL error: " . curl_error($ch)], JSON_UNESCAPED_UNICODE);
  exit;
}
curl_close($ch);

$data = json_decode($response, true);

// ✅ ตรวจว่าได้ข้อความจาก Gemini หรือไม่
if (isset($data["candidates"][0]["content"]["parts"][0]["text"])) {
  $reply = $data["candidates"][0]["content"]["parts"][0]["text"];
} else {
  $reply = "❌ ไม่สามารถเชื่อมต่อกับ Gemini ได้ในตอนนี้\n\n" 
         . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

// ✅ ส่งกลับให้ frontend
echo json_encode(["reply" => $reply], JSON_UNESCAPED_UNICODE);
