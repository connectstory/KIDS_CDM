require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const ppRoutes = require("./routes/pp");
const caAuthRoutes = require("./routes/caAuth");
const pool = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 전체 통과 설정 - credentials 지원을 위한 동적 origin 설정
app.use((req, res, next) => {
  // 요청의 origin을 동적으로 허용 (모든 origin 허용)
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.header("Access-Control-Expose-Headers", "Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // OPTIONS 요청에 대한 즉시 응답
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// CORS 미들웨어도 함께 사용 - credentials 지원
app.use(
  cors({
    origin: function (origin, callback) {
      // 모든 origin 허용
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Authorization"],
    credentials: true, // credentials 지원
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Body parser 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 데이터베이스 연결 테스트 (비밀번호 미설정 시 스킵)
if (process.env.PGPASSWORD) {
  pool.query("SELECT NOW()", (err) => {
    if (err) {
      console.error("Database connection error:", err);
    } else {
      console.log("Database connected successfully");
    }
  });
} else {
  console.warn(
    "PGPASSWORD가 없어 DB 연결 테스트를 건너뜁니다. (운영/검증 환경에서는 PGPASSWORD 설정 필요)"
  );
}

// 라우트 설정
app.use("/api/pp", ppRoutes);
app.use("/api/ca/auth", caAuthRoutes);

// 기본 라우트
app.get("/", (req, res) => {
  res.json({
    message: "KIDS JWT API",
    endpoints: {
      pp: {
        adminLogin: "POST /api/pp/adminLogin",
        adminSessionCheck: "GET /api/pp/adminSessionCheck",
        adminExtend: "POST /api/pp/adminExtend",
        adminLogout: "POST /api/pp/adminLogout",
        partnerLogin: "POST /api/pp/partnerLogin",
      },
      ca: {
        login: "POST /api/ca/auth/login",
        logout: "POST /api/ca/auth/logout",
        extend: "POST /api/ca/auth/extend",
        isLoggedIn: "GET /api/ca/auth/isLoggedIn",
      },
    },
  });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/pp/adminLogin`);
});

module.exports = app;
