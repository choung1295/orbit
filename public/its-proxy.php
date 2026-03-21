<?php
$secret = $_SERVER['HTTP_X_PROXY_SECRET'] ?? '';
if ($secret !== 'orbit2026sync123456abc') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$apiKey = '5ea3b5e4f9a34f95b14619c285a10522';
$url = "https://openapi.its.go.kr:9443/cctvInfo?apiKey={$apiKey}&type=all&cctvType=1&minX=124.0&maxX=132.0&minY=33.0&maxY=43.0&getType=json";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

header('Content-Type: application/json');
if ($result === false || $httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'ITS API 호출 실패', 'curl_error' => $err, 'http_code' => $httpCode]);
} else {
    echo $result;
}
