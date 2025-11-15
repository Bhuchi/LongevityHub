<?php
require_once __DIR__ . "/config.php";

function json_response($payload, $code = 200) {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

function format_number($value, $precision = 0) {
  if ($value === null || $value === '') {
    return null;
  }
  $num = (float)$value;
  return $precision > 0 ? number_format($num, $precision) : number_format($num);
}

function build_user_context(PDO $pdo, int $userId): array {
  $parts = [];
  $today = new DateTimeImmutable('today');
  $todayStr = $today->format('Y-m-d');
  $rangeStart = $today->sub(new DateInterval('P6D'))->format('Y-m-d');

  // profile + latest body metrics
  $profileStmt = $pdo->prepare("SELECT full_name, role, tz FROM users WHERE user_id=?");
  $profileStmt->execute([$userId]);
  $profile = $profileStmt->fetch() ?: [];

  $measureStmt = $pdo->prepare("
    SELECT measured_at, height_cm, weight_kg, body_fat_pct
    FROM body_measurements
    WHERE user_id=?
    ORDER BY measured_at DESC, measurement_id DESC
    LIMIT 1
  ");
  $measureStmt->execute([$userId]);
  $latest = $measureStmt->fetch() ?: null;

  if ($profile) {
    $profileLine = "👤 Profile: {$profile['full_name']} ({$profile['role']}) · TZ {$profile['tz']}";
    if ($latest) {
      $bits = [];
      if ($latest['weight_kg'] !== null) $bits[] = format_number($latest['weight_kg'], 1) . " kg";
      if ($latest['body_fat_pct'] !== null) $bits[] = format_number($latest['body_fat_pct'], 1) . "% body fat";
      if ($latest['height_cm'] !== null) $bits[] = format_number($latest['height_cm'], 0) . " cm";
      if ($bits) {
        $profileLine .= " | Latest body data (" . date('Y-m-d', strtotime($latest['measured_at'])) . "): " . implode(", ", $bits);
      }
    }
    $parts[] = $profileLine;
  }

  // goals + today progress
  $goalStmt = $pdo->prepare("
    SELECT goal_type, target_value
    FROM user_goals
    WHERE user_id=? AND is_active=1
  ");
  $goalStmt->execute([$userId]);
  $goalMap = [];
  foreach ($goalStmt->fetchAll() as $row) {
    $goalMap[$row['goal_type']] = (float)$row['target_value'];
  }

  $metrics = fetch_today_metrics($pdo, $userId, $todayStr);
  $goalSummary = build_goal_summary($goalMap, $metrics);
  if ($goalSummary) {
    $parts[] = $goalSummary;
  }

  $weekly = build_weekly_summary($pdo, $userId, $rangeStart, $todayStr);
  if ($weekly['text']) {
    $parts[] = $weekly['text'];
  }

  foreach (build_recent_sections($pdo, $userId) as $section) {
    $parts[] = $section;
  }

  return [
    'sections' => array_values(array_filter($parts)),
    'stats' => [
      'profile' => $profile,
      'latest_body' => $latest,
      'goals' => $goalMap,
      'today_metrics' => $metrics,
      'weekly' => $weekly['stats'],
    ],
  ];
}

function fetch_today_metrics(PDO $pdo, int $userId, string $day): array {
  $metrics = [
    'steps' => null,
    'sleep_hours' => null,
    'workout_min' => null,
    'protein_g' => null,
    'carb_g' => null,
  ];

  $stepsStmt = $pdo->prepare("SELECT SUM(value) FROM wearable_readings WHERE user_id=? AND metric='steps' AND DATE(ts)=?");
  $stepsStmt->execute([$userId, $day]);
  $val = $stepsStmt->fetchColumn();
  $metrics['steps'] = $val !== null ? (float)$val : null;

  $sleepStmt = $pdo->prepare("
    SELECT SUM(TIMESTAMPDIFF(SECOND,start_time,end_time))/3600
    FROM sleep_sessions
    WHERE user_id=? AND DATE(start_time)=?
  ");
  $sleepStmt->execute([$userId, $day]);
  $val = $sleepStmt->fetchColumn();
  $metrics['sleep_hours'] = $val !== null ? (float)$val : null;

  $workoutStmt = $pdo->prepare("SELECT SUM(duration_min) FROM workouts WHERE user_id=? AND DATE(started_at)=?");
  $workoutStmt->execute([$userId, $day]);
  $val = $workoutStmt->fetchColumn();
  $metrics['workout_min'] = $val !== null ? (float)$val : null;

  $nutStmt = $pdo->prepare("
    SELECT n.name, dn.amount
    FROM v_daily_nutrients dn
    JOIN nutrients n ON n.nutrient_id = dn.nutrient_id
    WHERE dn.user_id=? AND dn.day=? AND n.name IN ('protein_g','carb_g')
  ");
  $nutStmt->execute([$userId, $day]);
  foreach ($nutStmt->fetchAll() as $row) {
    $metrics[$row['name']] = (float)$row['amount'];
  }

  return $metrics;
}

function build_goal_summary(array $goals, array $metrics): ?string {
  $labels = [
    'steps' => ['label' => 'Steps', 'unit' => 'steps', 'precision' => 0],
    'sleep_hours' => ['label' => 'Sleep', 'unit' => 'hrs', 'precision' => 1],
    'workout_min' => ['label' => 'Workouts', 'unit' => 'min', 'precision' => 0],
    'protein_g' => ['label' => 'Protein', 'unit' => 'g', 'precision' => 0],
    'carb_g' => ['label' => 'Carbs', 'unit' => 'g', 'precision' => 0],
  ];
  $lines = [];
  foreach ($labels as $key => $meta) {
    $goal = $goals[$key] ?? null;
    $value = $metrics[$key] ?? null;
    if ($goal === null && $value === null) {
      continue;
    }
    $current = $value !== null ? number_format($value, $meta['precision']) : "0";
    $goalText = $goal !== null ? number_format($goal, $meta['precision']) . " {$meta['unit']}" : "no goal yet";
    $lines[] = "- {$meta['label']}: {$current} / {$goalText}";
  }
  if (!$lines) {
    return null;
  }
  return "🎯 Today's targets:\n" . implode("\n", $lines);
}

function build_weekly_summary(PDO $pdo, int $userId, string $rangeStart, string $todayStr): array {
  $readinessMap = [];
  $ensureDay = function ($day) use (&$readinessMap) {
    if (!isset($readinessMap[$day])) {
      $readinessMap[$day] = [
        'avg_hrv' => null,
        'avg_rhr' => null,
        'steps' => 0,
        'sleep_hours' => 0,
        'workout_min' => 0,
      ];
    }
  };

  $wearStmt = $pdo->prepare("
    SELECT DATE(ts) AS day,
           AVG(CASE WHEN metric='hrv' THEN value END) AS avg_hrv,
           AVG(CASE WHEN metric='resting_hr' THEN value END) AS avg_rhr,
           SUM(CASE WHEN metric='steps' THEN value END) AS steps
    FROM wearable_readings
    WHERE user_id = ? AND DATE(ts) BETWEEN ? AND ?
    GROUP BY day
  ");
  $wearStmt->execute([$userId, $rangeStart, $todayStr]);
  foreach ($wearStmt->fetchAll() as $row) {
    $day = $row['day'];
    $ensureDay($day);
    if ($row['avg_hrv'] !== null) {
      $readinessMap[$day]['avg_hrv'] = (float)$row['avg_hrv'];
    }
    if ($row['avg_rhr'] !== null) {
      $readinessMap[$day]['avg_rhr'] = (float)$row['avg_rhr'];
    }
    $readinessMap[$day]['steps'] = (float)($row['steps'] ?? 0);
  }

  $sleepStmt = $pdo->prepare("
    SELECT DATE(start_time) AS day,
           SUM(TIMESTAMPDIFF(SECOND,start_time,end_time))/3600 AS sleep_hours
    FROM sleep_sessions
    WHERE user_id = ? AND DATE(start_time) BETWEEN ? AND ?
    GROUP BY day
  ");
  $sleepStmt->execute([$userId, $rangeStart, $todayStr]);
  foreach ($sleepStmt->fetchAll() as $row) {
    $day = $row['day'];
    $ensureDay($day);
    $readinessMap[$day]['sleep_hours'] = (float)($row['sleep_hours'] ?? 0);
  }

  $wkStmt = $pdo->prepare("
    SELECT DATE(started_at) AS day,
           SUM(duration_min) AS workout_min
    FROM workouts
    WHERE user_id = ? AND DATE(started_at) BETWEEN ? AND ?
    GROUP BY day
  ");
  $wkStmt->execute([$userId, $rangeStart, $todayStr]);
  foreach ($wkStmt->fetchAll() as $row) {
    $day = $row['day'];
    $ensureDay($day);
    $readinessMap[$day]['workout_min'] = (float)($row['workout_min'] ?? 0);
  }

  ksort($readinessMap);
  if (!$readinessMap) {
    return ['text' => null, 'stats' => []];
  }

  $stepTotal = 0;
  $stepDays = 0;
  $sleepTotal = 0;
  $sleepDays = 0;
  $workoutTotal = 0;
  $hrvTotal = 0;
  $hrvDays = 0;
  $rhrTotal = 0;
  $rhrDays = 0;
  $bestSteps = ['day' => null, 'value' => 0];

  foreach ($readinessMap as $day => $row) {
    if (($row['steps'] ?? 0) > 0) {
      $stepTotal += $row['steps'];
      $stepDays++;
      if ($row['steps'] > $bestSteps['value']) {
        $bestSteps = ['day' => $day, 'value' => $row['steps']];
      }
    }
    if (($row['sleep_hours'] ?? 0) > 0) {
      $sleepTotal += $row['sleep_hours'];
      $sleepDays++;
    }
    if (($row['workout_min'] ?? 0) > 0) {
      $workoutTotal += $row['workout_min'];
    }
    if ($row['avg_hrv'] !== null) {
      $hrvTotal += $row['avg_hrv'];
      $hrvDays++;
    }
    if ($row['avg_rhr'] !== null) {
      $rhrTotal += $row['avg_rhr'];
      $rhrDays++;
    }
  }

  $lines = [];
  if ($stepDays) {
    $avgSteps = round($stepTotal / $stepDays);
    $line = "• Avg steps " . number_format($avgSteps) . "/day";
    if ($bestSteps['day']) {
      $line .= " (peak " . number_format((int)$bestSteps['value']) . " on {$bestSteps['day']})";
    }
    $lines[] = $line;
  }
  if ($sleepDays) {
    $avgSleep = round($sleepTotal / $sleepDays, 1);
    $lines[] = "• Sleep " . $avgSleep . " hrs/day";
  }
  if ($workoutTotal > 0) {
    $lines[] = "• Workouts " . number_format($workoutTotal) . " min this week";
  }
  if ($hrvDays) {
    $avgHrv = round($hrvTotal / $hrvDays);
    $lines[] = "• HRV avg {$avgHrv} ms | RHR avg " . ($rhrDays ? round($rhrTotal / $rhrDays) : 'n/a') . " bpm";
  }

  $nutLines = build_nutrient_summary($pdo, $userId, $rangeStart, $todayStr);
  $lines = array_merge($lines, $nutLines);

  $stats = [
    'avg_steps' => $stepDays ? round($stepTotal / $stepDays) : null,
    'avg_sleep_hours' => $sleepDays ? round($sleepTotal / $sleepDays, 1) : null,
    'total_workout_min' => $workoutTotal ?: null,
    'avg_hrv' => $hrvDays ? round($hrvTotal / $hrvDays) : null,
    'avg_rhr' => $rhrDays ? round($rhrTotal / $rhrDays) : null,
  ];

  if (!$lines) {
    return ['text' => null, 'stats' => $stats];
  }
  return [
    'text' => "📈 Last 7 days:\n" . implode("\n", $lines),
    'stats' => $stats,
  ];
}

function build_nutrient_summary(PDO $pdo, int $userId, string $rangeStart, string $todayStr): array {
  $stmt = $pdo->prepare("
    SELECT dn.day, n.name, dn.amount
    FROM v_daily_nutrients dn
    JOIN nutrients n ON n.nutrient_id = dn.nutrient_id
    WHERE dn.user_id=? AND dn.day BETWEEN ? AND ? AND n.name IN ('protein_g','carb_g')
    ORDER BY dn.day ASC
  ");
  $stmt->execute([$userId, $rangeStart, $todayStr]);
  $rows = $stmt->fetchAll();
  if (!$rows) {
    return [];
  }

  $protein = ['total' => 0, 'days' => 0, 'latest' => null];
  $carb = ['total' => 0, 'days' => 0, 'latest' => null];
  foreach ($rows as $row) {
    if ($row['name'] === 'protein_g') {
      $protein['total'] += (float)$row['amount'];
      $protein['days']++;
      if ($row['day'] === $todayStr) {
        $protein['latest'] = (float)$row['amount'];
      }
    } elseif ($row['name'] === 'carb_g') {
      $carb['total'] += (float)$row['amount'];
      $carb['days']++;
      if ($row['day'] === $todayStr) {
        $carb['latest'] = (float)$row['amount'];
      }
    }
  }

  $lines = [];
  if ($protein['days']) {
    $avg = round($protein['total'] / $protein['days']);
    $latest = $protein['latest'] !== null ? round($protein['latest']) : 'n/a';
    $lines[] = "• Protein avg {$avg} g/day (today {$latest} g)";
  }
  if ($carb['days']) {
    $avg = round($carb['total'] / $carb['days']);
    $latest = $carb['latest'] !== null ? round($carb['latest']) : 'n/a';
    $lines[] = "• Carbs avg {$avg} g/day (today {$latest} g)";
  }
  return $lines;
}

function build_recent_sections(PDO $pdo, int $userId): array {
  $sections = [];
  $meals = build_recent_meals($pdo, $userId);
  if ($meals) $sections[] = $meals;
  $workouts = build_recent_workouts($pdo, $userId);
  if ($workouts) $sections[] = $workouts;
  $sleep = build_recent_sleep($pdo, $userId);
  if ($sleep) $sections[] = $sleep;
  return $sections;
}

function build_recent_meals(PDO $pdo, int $userId): ?string {
  $stmt = $pdo->prepare("
    SELECT m.meal_id, m.eaten_at, m.note,
           COUNT(mi.meal_item_id) AS items,
           COALESCE(SUM(mi.grams),0) AS grams
    FROM meals m
    LEFT JOIN meal_items mi ON mi.meal_id = m.meal_id
    WHERE m.user_id = ?
    GROUP BY m.meal_id
    ORDER BY m.eaten_at DESC
    LIMIT 3
  ");
  $stmt->execute([$userId]);
  $rows = $stmt->fetchAll();
  if (!$rows) {
    return null;
  }
  $lines = [];
  foreach ($rows as $r) {
    $dt = date('Y-m-d H:i', strtotime($r['eaten_at']));
    $details = [];
    if ($r['items'] > 0) $details[] = "{$r['items']} items";
    if ($r['grams'] > 0) $details[] = number_format($r['grams']) . " g";
    $note = $r['note'] ? " – {$r['note']}" : "";
    $meta = $details ? " (" . implode(", ", $details) . ")" : "";
    $lines[] = "- {$dt}{$meta}{$note}";
  }
  return "🍽️ Latest meals:\n" . implode("\n", $lines);
}

function build_recent_workouts(PDO $pdo, int $userId): ?string {
  $stmt = $pdo->prepare("
    SELECT workout_id, started_at, duration_min, intensity, note
    FROM workouts
    WHERE user_id = ?
    ORDER BY started_at DESC
    LIMIT 3
  ");
  $stmt->execute([$userId]);
  $rows = $stmt->fetchAll();
  if (!$rows) {
    return null;
  }
  $ids = array_column($rows, 'workout_id');
  $actsByWorkout = [];
  if ($ids) {
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $actStmt = $pdo->prepare("
      SELECT workout_id, activity_type, minutes
      FROM workout_activities
      WHERE workout_id IN ($placeholders)
      ORDER BY activity_id ASC
    ");
    $actStmt->execute($ids);
    foreach ($actStmt->fetchAll() as $act) {
      $actsByWorkout[$act['workout_id']][] = $act;
    }
  }
  $lines = [];
  foreach ($rows as $r) {
    $dt = date('Y-m-d H:i', strtotime($r['started_at']));
    $acts = $actsByWorkout[$r['workout_id']] ?? [];
    $actText = $acts
      ? implode(", ", array_map(fn($a) => "{$a['activity_type']} {$a['minutes']} min", $acts))
      : null;
    $note = $r['note'] ? " – {$r['note']}" : "";
    $detail = "{$r['duration_min']} min • {$r['intensity']}";
    if ($actText) {
      $detail .= " ({$actText})";
    }
    $lines[] = "- {$dt}: {$detail}{$note}";
  }
  return "💪 Latest workouts:\n" . implode("\n", $lines);
}

function build_recent_sleep(PDO $pdo, int $userId): ?string {
  $stmt = $pdo->prepare("
    SELECT start_time, end_time
    FROM sleep_sessions
    WHERE user_id = ?
    ORDER BY start_time DESC
    LIMIT 3
  ");
  $stmt->execute([$userId]);
  $rows = $stmt->fetchAll();
  if (!$rows) {
    return null;
  }
  $lines = [];
  foreach ($rows as $r) {
    $start = strtotime($r['start_time']);
    $end = strtotime($r['end_time']);
    $hrs = ($end > $start) ? round(($end - $start) / 3600, 1) : 0;
    $lines[] = "- " . date('Y-m-d H:i', $start) . " → " . date('H:i', $end) . " • {$hrs} hrs";
  }
  return "🛌 Latest sleep:\n" . implode("\n", $lines);
}

function build_local_coach_reply(string $message, array $stats, string $context, string $error = ''): string {
  $lower = strtolower($message);
  $name = $stats['profile']['full_name'] ?? 'there';
  $goalWorkout = (int)($stats['goals']['workout_min'] ?? 40);
  $goalSleep = (float)($stats['goals']['sleep_hours'] ?? 7);
  $goalSteps = (int)($stats['goals']['steps'] ?? 8000);
  $goalProtein = (int)($stats['goals']['protein_g'] ?? 100);
  $today = $stats['today_metrics'] ?? [];

  if (strpos($lower, 'workout') !== false || strpos($lower, 'exercise') !== false) {
    $session = $goalWorkout ?: 40;
    return "4-day strength plan (~{$session} min each): Day 1 Lower — back squats, Romanian deadlifts, walking lunges, plank holds. Day 2 Upper — incline push-ups or bench, bent-over rows, shoulder press, face pulls. Day 3 Power/Core — kettlebell swings, Bulgarian split squats, pull-ups, Pallof press. Day 4 Conditioning — trap-bar deadlifts, push-ups, assault bike intervals, farmer carries. Log RPE after each day and ask again if you need swaps.";
  }

  if (strpos($lower, 'sleep') !== false) {
    $slept = $today['sleep_hours'] ?? null;
    $sleptText = $slept !== null ? number_format($slept, 1) . " hrs tonight" : "no sleep logged yet";
    return "Sleep pulse: target {$goalSleep} hrs/night; you're at {$sleptText}. Keep a 60-minute screen-free wind-down and track the next few nights so I can refine recovery tips.";
  }

  if (strpos($lower, 'protein') !== false || strpos($lower, 'meal') !== false || strpos($lower, 'nutrition') !== false) {
    $protein = $today['protein_g'] ?? 0;
    return "Nutrition check: today's protein sits at " . number_format($protein) . " g vs. a ~{$goalProtein} g goal. Anchor each meal with 25-30 g of lean protein and log the next dish for deeper feedback.";
  }

  if (strpos($lower, 'step') !== false) {
    $steps = $today['steps'] ?? 0;
    $avgSteps = $stats['weekly']['avg_steps'] ?? null;
    $avgText = $avgSteps ? number_format($avgSteps) . " avg" : "no weekly average";
    return "Movement update: " . number_format($steps) . " steps today ({$avgText}); push toward " . number_format($goalSteps) . ". Split it into three brisk 10-minute walks and check back if you want pace ideas.";
  }

  $prefix = "Gemini is busy";
  if ($error) {
    $prefix .= " ({$error})";
  }
  return "{$prefix}, {$name}. Snapshot below—log another metric or ask again soon for deeper coaching.\n\n{$context}";
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

function is_longevity_topic(string $text): bool {
  $lower = strtolower($text);
  if (preg_match('/\b(hi|hello|hey|sup|hola|good morning|good evening|good night|what\'s up|how are you)\b/', $lower)) {
    return true;
  }
  $topics = [
    'longevity','health','sleep','workout','exercise','training','fitness',
    'meal','meals','nutrition','diet','calorie','protein','carb','fat','macro',
    'steps','walking','run','running','cycle','cycling','swim','swimming',
    'hrv','resting heart','resting hr','body','weight','waist','body fat',
    'goal','stress','recovery','rest','wearable','aura','oura','garmin','fitbit',
    'supplement','hydration','mindfulness','meditation','habit','smoke','smoking',
    'cigarette','nicotine','alcohol','drinking','addiction','detox','lifestyle',
    'marijuana','cannabis','weed','vape','vaping','e-cig','e cigarette','tobacco'
  ];
  foreach ($topics as $word) {
    if (strpos($lower, $word) !== false) {
      return true;
    }
  }
  return false;
}

if (!is_longevity_topic($message)) {
  json_response([
    'reply' =>
      "Sorry, I can only help with longevity, health, sleep, meals or workout topics. Ask me anything in those areas!"
  ]);
}

$userId = (int)$user['user_id'];

try {
  $contextBundle = build_user_context($pdo, $userId);
  $sections = $contextBundle['sections'];
  $stats = $contextBundle['stats'];
} catch (Throwable $e) {
  $sections = ["⚠️ Database error: " . $e->getMessage()];
  $stats = [];
}

if (!defined('GEMINI_API_KEY')) {
  $envKey = getenv('GEMINI_API_KEY');
  if ($envKey) {
    define('GEMINI_API_KEY', $envKey);
  }
}

$context = $sections ? implode("\n\n", $sections) : "— no related data —";

if (!defined('GEMINI_API_KEY') || GEMINI_API_KEY === '') {
  $hint = "⚠️ Gemini API key is missing (copy api/.env.example to .env.local and set GEMINI_API_KEY=YOUR_KEY).";
  $fallback = $sections
    ? "{$hint}\n\n{$context}"
    : "{$hint}\n\n(No personal data is available yet)";
  json_response(['reply' => $fallback, 'mode' => 'fallback']);
}

$prompt = <<<PROMPT
You are the LongevityHub AI Coach, a virtual panel made up of: (1) a board-certified longevity physician, (2) a strength & conditioning coach, and (3) a registered dietitian. Blend their expertise into one clear voice. Reply **in English only** using compact paragraphs separated by a blank line.
- Default: at most two sentences total.
- If the user explicitly asks for deeper detail or technical breakdowns, give at most **three short paragraphs**, each no more than two sentences, ordered from most important to supporting info.
- Focus on the single most relevant metric, give one actionable next step, and invite further questions only if space allows.
- If data is missing, clearly state what is missing and suggest what to log.
- Never use bullet lists or long enumerations; rely on brief paragraphs only.
- When the user asks for workouts/strength programming, always mention specific exercises (e.g., squats, rows, planks) and outline up to four focused sessions or circuits with clear intent.

User snapshot (user_id={$userId}):
{$context}

User question:
{$message}
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
  CURLOPT_TIMEOUT        => 45,
  CURLOPT_CONNECTTIMEOUT => 10,
]);
$response = curl_exec($ch);
$httpCode = $response === false ? null : curl_getinfo($ch, CURLINFO_HTTP_CODE);
if ($response === false || ($httpCode !== null && $httpCode >= 400)) {
  $err = $response === false ? curl_error($ch) : "HTTP {$httpCode}";
  curl_close($ch);
  $fallback = build_local_coach_reply($message, $stats, $context, $err);
  json_response(['reply' => $fallback, 'mode' => 'local_fallback', 'meta_error' => $err]);
}
curl_close($ch);

$data = json_decode($response, true);
if (!is_array($data) || isset($data['error'])) {
  $errDetail = is_array($data) ? ($data['error']['message'] ?? 'Gemini error') : 'invalid_response';
  $fallback = build_local_coach_reply($message, $stats, $context, $errDetail);
  json_response(['reply' => $fallback, 'mode' => 'local_fallback', 'meta_error' => $errDetail], 200);
}
$reply = $data["candidates"][0]["content"]["parts"][0]["text"] ?? null;
if (!$reply) {
  $reply = build_local_coach_reply($message, $stats, $context);
}

json_response(['reply' => $reply]);
