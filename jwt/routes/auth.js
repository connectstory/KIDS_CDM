const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/auth");

// 로그인
router.post("/login", async (req, res) => {
  try {
    const { mbr_id, mbr_enpswd } = req.body;

    // 입력값 검증
    if (!mbr_id || !mbr_enpswd) {
      return res.status(400).json({
        success: false,
        error: "mbr_id and mbr_enpswd are required",
      });
    }

    // 데이터베이스에서 사용자 조회
    const query = `
      SELECT 
        mbr_no,
        mbr_id,
        mbr_encpt_flnm,
        mbr_enpswd,
        mbr_type_cd,
        mbr_join_stts_cd
      FROM pp_own.tb_pp_m_mbr_info
      WHERE mbr_id = $1
    `;

    const result = await pool.query(query, [mbr_id]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const user = result.rows[0];

    // 비밀번호 확인 (평문 비교 - 실제로는 암호화된 비밀번호와 비교해야 함)
    // 현재 mbr_enpswd가 평문으로 저장되어 있다고 가정
    if (user.mbr_enpswd !== mbr_enpswd) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // 회원 상태 확인
    if (user.mbr_join_stts_cd !== "A") {
      return res.status(403).json({
        success: false,
        error: "Account is not active",
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        mbr_no: user.mbr_no,
        mbr_id: user.mbr_id,
        mbr_encpt_flnm: user.mbr_encpt_flnm,
        mbr_type_cd: user.mbr_type_cd,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({
      success: true,
      token,
      user: {
        mbr_no: user.mbr_no,
        mbr_id: user.mbr_id,
        mbr_encpt_flnm: user.mbr_encpt_flnm,
        mbr_type_cd: user.mbr_type_cd,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// 토큰 검증 테스트 엔드포인트
router.get(
  "/verify",
  require("../middleware/auth").authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      message: "Token is valid",
      user: req.user,
    });
  }
);

module.exports = router;
