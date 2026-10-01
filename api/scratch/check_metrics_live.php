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

$ch = curl_init("http://127.0.0.1:8000/int/v1/transport/metrics");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Accept: application/json",
    "Authorization: Bearer $token",
    "Company: $company",
    "Company-Header: $company"
]);
$mRes = json_decode(curl_exec($ch), true);
echo "Metrics returned:\n" . json_encode($mRes, JSON_PRETTY_PRINT) . "\n";
