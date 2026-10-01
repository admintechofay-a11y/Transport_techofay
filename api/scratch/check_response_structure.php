<?php
require __DIR__ . '/../vendor/autoload.php';

$ch = curl_init("http://127.0.0.1:8000/int/v1/auth/login");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["identity" => "dispatch.admin@techofay.com", "password" => "fleet2026"]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json", "Accept: application/json"]);
$res = json_decode(curl_exec($ch), true);
$token = $res["token"];
$company = $res["company"]["uuid"];

echo "Company: $company\n";

$ch = curl_init("http://127.0.0.1:8000/int/v1/vehicles");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Accept: application/json", "Authorization: Bearer $token", "Company: $company", "Company-Header: $company"]);
$vRes = json_decode(curl_exec($ch), true);

echo "GET /vehicles response top keys: " . implode(", ", array_keys((array)$vRes)) . "\n";
echo "Raw preview: " . substr(json_encode($vRes), 0, 300) . "\n\n";

$ch = curl_init("http://127.0.0.1:8000/int/v1/drivers");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Accept: application/json", "Authorization: Bearer $token", "Company: $company", "Company-Header: $company"]);
$dRes = json_decode(curl_exec($ch), true);

echo "GET /drivers response top keys: " . implode(", ", array_keys((array)$dRes)) . "\n";
echo "Raw preview: " . substr(json_encode($dRes), 0, 300) . "\n";
