# API 요청 예시

## 1. 로그인 요청

### cURL
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "mbr_id": "user123",
    "mbr_enpswd": "password123"
  }'
```

### JavaScript (Fetch API)
```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mbr_id: 'user123',
    mbr_enpswd: 'password123'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
  // 토큰 저장
  localStorage.setItem('token', data.token);
})
.catch((error) => {
  console.error('Error:', error);
});
```

### JavaScript (async/await)
```javascript
async function login(mbrId, password) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mbr_id: mbrId,
        mbr_enpswd: password
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Login successful!');
      console.log('Token:', data.token);
      console.log('User:', data.user);
      return data;
    } else {
      console.error('Login failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// 사용 예시
login('user123', 'password123');
```

### Axios
```javascript
const axios = require('axios');

axios.post('http://localhost:3000/api/auth/login', {
  mbr_id: 'user123',
  mbr_enpswd: 'password123'
})
.then(response => {
  console.log('Token:', response.data.token);
  console.log('User:', response.data.user);
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});
```

### Python (requests)
```python
import requests

url = "http://localhost:3000/api/auth/login"
payload = {
    "mbr_id": "user123",
    "mbr_enpswd": "password123"
}

response = requests.post(url, json=payload)
data = response.json()

if response.status_code == 200:
    print("Token:", data["token"])
    print("User:", data["user"])
else:
    print("Error:", data.get("error"))
```

---

## 2. 토큰 검증 요청

### cURL
```bash
# 먼저 로그인하여 토큰을 받아옵니다
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mbr_id": "user123", "mbr_enpswd": "password123"}' \
  | jq -r '.token')

# 토큰으로 검증 요청
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

또는 직접 토큰을 사용:
```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript (Fetch API)
```javascript
// 로그인 후 받은 토큰 사용
const token = 'your-jwt-token-here';

fetch('http://localhost:3000/api/auth/verify', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('Verification result:', data);
})
.catch((error) => {
  console.error('Error:', error);
});
```

### JavaScript (async/await)
```javascript
async function verifyToken(token) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Token is valid');
      console.log('User info:', data.user);
      return data;
    } else {
      console.error('Token verification failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// 사용 예시
const token = localStorage.getItem('token');
verifyToken(token);
```

### Axios
```javascript
const axios = require('axios');

const token = 'your-jwt-token-here';

axios.get('http://localhost:3000/api/auth/verify', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => {
  console.log('Verification result:', response.data);
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});
```

### Python (requests)
```python
import requests

token = "your-jwt-token-here"
url = "http://localhost:3000/api/auth/verify"
headers = {
    "Authorization": f"Bearer {token}"
}

response = requests.get(url, headers=headers)
data = response.json()

if response.status_code == 200:
    print("Token is valid")
    print("User info:", data["user"])
else:
    print("Error:", data.get("error"))
```

---

## 3. 전체 로그인 플로우 예시

### JavaScript (완전한 예시)
```javascript
// 1. 로그인
async function loginAndVerify(mbrId, password) {
  try {
    // 로그인
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mbr_id: mbrId,
        mbr_enpswd: password
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('Login failed:', loginData.error);
      return;
    }

    const token = loginData.token;
    console.log('Login successful! Token:', token);

    // 2. 토큰 검증
    const verifyResponse = await fetch('http://localhost:3000/api/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const verifyData = await verifyResponse.json();
    console.log('Token verification:', verifyData);

    return { token, user: loginData.user };
  } catch (error) {
    console.error('Error:', error);
  }
}

// 사용
loginAndVerify('user123', 'password123');
```

---

## 4. Postman 설정

### 로그인 요청
- **Method**: POST
- **URL**: `http://localhost:3000/api/auth/login`
- **Headers**:
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "mbr_id": "user123",
  "mbr_enpswd": "password123"
}
```

### 토큰 검증 요청
- **Method**: GET
- **URL**: `http://localhost:3000/api/auth/verify`
- **Headers**:
  - `Authorization: Bearer <your-token>`

---

## 5. 응답 예시

### 성공적인 로그인 응답
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtYnJfbm8iOiIwMDAwMDAwMDAxIiwibWJyX2lkIjoidXNlcjEyMyIsIm1icl90eXBlX2NkIjoiMSIsImlhdCI6MTY5ODc2NTQzMiwiZXhwIjoxNjk4ODUxODMyfQ.xxxxx",
  "user": {
    "mbr_no": "0000000001",
    "mbr_id": "user123",
    "mbr_type_cd": "1"
  }
}
```

### 로그인 실패 응답
```json
{
  "error": "Invalid credentials"
}
```

### 토큰 검증 성공 응답
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

### 토큰 검증 실패 응답
```json
{
  "error": "Invalid or expired token"
}
```
