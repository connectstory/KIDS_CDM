#!/bin/bash

# JWT 로그인 시스템 테스트 스크립트

BASE_URL="http://localhost:3000"
API_URL="${BASE_URL}/api/auth"

echo "=== JWT 로그인 시스템 테스트 ==="
echo ""

# 1. 로그인 요청
echo "1. 로그인 요청..."
echo "POST ${API_URL}/login"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d '{
    "mbr_id": "user123",
    "mbr_enpswd": "password123"
  }')

echo "응답:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# 토큰 추출 (jq가 있는 경우)
if command -v jq &> /dev/null; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
  
  if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "토큰 추출 성공!"
    echo ""
    
    # 2. 토큰 검증 요청
    echo "2. 토큰 검증 요청..."
    echo "GET ${API_URL}/verify"
    echo "Authorization: Bearer $TOKEN"
    echo ""
    
    VERIFY_RESPONSE=$(curl -s -X GET "${API_URL}/verify" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "응답:"
    echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
    echo ""
  else
    echo "토큰 추출 실패 - 로그인이 실패했을 수 있습니다."
  fi
else
  echo "jq가 설치되어 있지 않아 토큰 검증 단계를 건너뜁니다."
  echo "jq를 설치하거나 수동으로 토큰을 사용하여 검증하세요."
fi

echo ""
echo "=== 테스트 완료 ==="
