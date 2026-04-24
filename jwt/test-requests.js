// JWT 로그인 시스템 테스트 스크립트 (Node.js)

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/auth`;

async function testLogin() {
  console.log('=== JWT 로그인 시스템 테스트 ===\n');

  try {
    // 1. 로그인 요청
    console.log('1. 로그인 요청...');
    console.log(`POST ${API_URL}/login\n`);

    const loginResponse = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mbr_id: 'user123',
        mbr_enpswd: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('응답:');
    console.log(JSON.stringify(loginData, null, 2));
    console.log('');

    if (loginData.success && loginData.token) {
      const token = loginData.token;
      console.log('토큰 추출 성공!\n');

      // 2. 토큰 검증 요청
      console.log('2. 토큰 검증 요청...');
      console.log(`GET ${API_URL}/verify`);
      console.log(`Authorization: Bearer ${token.substring(0, 20)}...\n`);

      const verifyResponse = await fetch(`${API_URL}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const verifyData = await verifyResponse.json();
      console.log('응답:');
      console.log(JSON.stringify(verifyData, null, 2));
      console.log('');
    } else {
      console.log('로그인 실패 - 토큰을 받을 수 없습니다.');
    }

    console.log('=== 테스트 완료 ===');
  } catch (error) {
    console.error('에러 발생:', error.message);
    console.error('서버가 실행 중인지 확인하세요: npm start');
  }
}

// Node.js 18+ 에서 fetch 사용 가능
// 그 이전 버전의 경우 node-fetch 패키지 필요
if (typeof fetch === 'undefined') {
  console.error('이 스크립트는 Node.js 18+ 또는 node-fetch 패키지가 필요합니다.');
  console.error('npm install node-fetch 로 설치하거나 Node.js를 업그레이드하세요.');
  process.exit(1);
}

testLogin();
