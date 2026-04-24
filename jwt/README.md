# JWT Login System

PostgreSQL과 JWT를 사용한 로그인 시스템입니다.

## 설치

```bash
npm install
```

## 환경 설정

데이터베이스 연결 정보는 `config/database.js` 파일에서 설정되어 있습니다.

JWT 시크릿 키는 환경 변수 `JWT_SECRET`으로 설정할 수 있으며, 기본값은 `your-secret-key-change-this-in-production`입니다.

## 실행

```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## API 엔드포인트

### 1. 로그인
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "mbr_id": "user123",
  "mbr_enpswd": "password123"
}
```

**Response (성공):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "mbr_no": "0000000001",
    "mbr_id": "user123",
    "mbr_type_cd": "1"
  }
}
```

**Response (실패):**
```json
{
  "error": "Invalid credentials"
}
```

### 2. 토큰 검증
**GET** `/api/auth/verify`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "mbr_no": "0000000001",
    "mbr_id": "user123",
    "mbr_type_cd": "1"
  }
}
```

## 데이터베이스

PostgreSQL 데이터베이스를 사용하며, `pp_own.tb_pp_m_mbr_info` 테이블에서 회원 정보를 조회합니다.

로그인 시 다음 필드를 사용합니다:
- `mbr_id`: 회원 ID
- `mbr_enpswd`: 회원 비밀번호

## CORS

모든 origin에서의 요청을 허용하도록 설정되어 있습니다.

## 테스트

### 테스트 스크립트 사용

**Bash 스크립트:**
```bash
./test-requests.sh
```

**Node.js 스크립트:**
```bash
node test-requests.js
```

### 상세한 요청 예시

다양한 언어와 도구에서 사용할 수 있는 상세한 요청 예시는 `examples.md` 파일을 참고하세요.

## 보안 참고사항

- 프로덕션 환경에서는 반드시 `JWT_SECRET`을 환경 변수로 설정하세요.
- 비밀번호는 평문으로 저장되어 있다고 가정하고 구현되어 있습니다. 실제 운영 환경에서는 bcrypt 등을 사용하여 해시화된 비밀번호를 비교해야 합니다.
