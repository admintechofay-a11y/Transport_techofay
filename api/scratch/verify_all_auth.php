<?php
$baseUrl = 'http://127.0.0.1:8000/int/v1';

function makeRequest($url, $data = null, $token = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json',
    ];
    if ($token) {
        $headers[] = "Authorization: Bearer $token";
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $res = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $status, 'data' => json_decode($res, true), 'raw' => $res];
}

echo "========================================\n";
echo "1. VERIFY DEMO LOGIN (dispatch.admin@techofay.com)\n";
echo "========================================\n";
$demoLogin = makeRequest("$baseUrl/auth/login", [
    'identity' => 'dispatch.admin@techofay.com',
    'password' => 'fleet2026'
]);
echo "Status: {$demoLogin['status']}\n";
echo "Token: " . substr($demoLogin['data']['token'] ?? 'NONE', 0, 20) . "...\n";
echo "User: " . ($demoLogin['data']['user']['name'] ?? 'NONE') . " ({$demoLogin['data']['user']['email']})\n";
echo "Company: " . ($demoLogin['data']['company']['name'] ?? 'NONE') . " (UUID: {$demoLogin['data']['company']['uuid']})\n";
if ($demoLogin['status'] !== 200 || empty($demoLogin['data']['token'])) {
    echo "FAILED Demo Login!\n";
    exit(1);
}

echo "\n========================================\n";
echo "2. VERIFY NEW USER REGISTRATION\n";
echo "========================================\n";
$uniqueEmail = 'transporter_' . time() . '@techofay.com';
$regPass = 'TechofaySecure2026';
$signUp = makeRequest("$baseUrl/auth/sign-up", [
    'name' => 'Vikram Malhotra',
    'email' => $uniqueEmail,
    'password' => $regPass,
    'phone' => '+91 98980 12345',
    'company_name' => 'Techofay Prime Carriers',
]);
echo "Status: {$signUp['status']}\n";
echo "Token: " . substr($signUp['data']['token'] ?? 'NONE', 0, 20) . "...\n";
echo "User: " . ($signUp['data']['user']['name'] ?? 'NONE') . " ({$signUp['data']['user']['email']})\n";
echo "Company: " . ($signUp['data']['company']['name'] ?? 'NONE') . " (UUID: {$signUp['data']['company']['uuid']})\n";
if ($signUp['status'] !== 200 || empty($signUp['data']['token'])) {
    echo "FAILED Registration! Raw: {$signUp['raw']}\n";
    exit(1);
}

echo "\n========================================\n";
echo "3. VERIFY LOGIN WITH NEWLY REGISTERED CREDENTIALS\n";
echo "========================================\n";
$newLogin = makeRequest("$baseUrl/auth/login", [
    'identity' => $uniqueEmail,
    'password' => $regPass
]);
echo "Status: {$newLogin['status']}\n";
echo "Token: " . substr($newLogin['data']['token'] ?? 'NONE', 0, 20) . "...\n";
echo "User: " . ($newLogin['data']['user']['name'] ?? 'NONE') . " ({$newLogin['data']['user']['email']})\n";
echo "Company: " . ($newLogin['data']['company']['name'] ?? 'NONE') . " (UUID: {$newLogin['data']['company']['uuid']})\n";
if ($newLogin['status'] !== 200 || empty($newLogin['data']['token'])) {
    echo "FAILED New User Login! Raw: {$newLogin['raw']}\n";
    exit(1);
}

echo "\n========================================\n";
echo "4. VERIFY DASHBOARD ACCESS WITH NEW USER TOKEN\n";
echo "========================================\n";
$newToken = $newLogin['data']['token'];
$metrics = makeRequest("$baseUrl/transport/metrics", null, $newToken);
echo "Status: {$metrics['status']}\n";
echo "Metrics Response: " . substr($metrics['raw'], 0, 150) . "...\n";
if ($metrics['status'] !== 200) {
    echo "FAILED Dashboard Metrics with new token!\n";
    exit(1);
}

echo "\n========================================\n";
echo "ALL AUTHENTICATION & REGISTRATION CHECKS PASSED PERFECTLY!\n";
echo "========================================\n";
