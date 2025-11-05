<?php
define('GEMINI_API_KEY', 'AIzaSyB-81Tk8NeMIjXJAb_iFJry3D60cHaAMGU');

$url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" . GEMINI_API_KEY;

$body = json_encode([
  "contents" => [[
    "role" => "user",
    "parts" => [["text" => "สวัสดี Gemini!"]]
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
curl_close($ch);

echo $response;