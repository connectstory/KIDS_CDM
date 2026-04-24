const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET } = require("../middleware/auth");
const { authenticateToken } = require("../middleware/auth");
const adminMenuAuthList = require("../data/adminMenuAuthList");

function requireXRequestedWith(req, res, next) {
  const v = req.headers["x-requested-with"];
  if (v !== "XMLHttpRequest") {
    return res.status(400).json({
      result: "fail",
      message: "X-Requested-With: XMLHttpRequest 헤더가 필요합니다.",
    });
  }
  next();
}

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

function isBcryptHash(value) {
  return typeof value === "string" && value.startsWith("$2");
}

async function verifyPassword(input, stored) {
  if (!stored) return false;
  if (isBcryptHash(stored)) return bcrypt.compare(input, stored);
  return String(input) === String(stored);
}

async function adminLogin(req, res) {
  const { empNo, password } = req.body || {};
  if (!empNo || !password) {
    return res.status(400).json({
      result: "fail",
      messageCode: "BAD_REQUEST",
      message: "empNo/password가 필요합니다.",
    });
  }

  const mngrSql = `
    SELECT emp_no, encpt_mngr_pswd, tmpr_pswd_yn, pswd_err_nmtm
    FROM kids_own.tb_pp_m_mngr_info
    WHERE emp_no = $1
    LIMIT 1
  `;
  const empSql = `
    SELECT emp_no, emp_nm, dept_no
    FROM kids_own.tb_pp_m_emp_info
    WHERE emp_no = $1
    LIMIT 1
  `;

  const mngrResult = await pool.query(mngrSql, [empNo]);
  if (mngrResult.rows.length === 0) {
    return res.status(401).json({
      result: "fail",
      messageCode: "WRONG_PASSWORD:1",
      message: "사번 또는 비밀번호를 확인해 주세요.",
      retryCnt: "1",
    });
  }

  const mngr = mngrResult.rows[0];
  const retryCnt = Number(mngr.pswd_err_nmtm || 0);
  if (retryCnt >= 5) {
    return res.status(401).json({
      result: "fail",
      messageCode: "LOCKED",
      message: "계정이 잠겼습니다. 관리자에게 문의하세요.",
    });
  }

  const ok = await verifyPassword(password, mngr.encpt_mngr_pswd);
  if (!ok) {
    const nextCnt = retryCnt + 1;
    await pool.query(
      `UPDATE kids_own.tb_pp_m_mngr_info SET pswd_err_nmtm = $1 WHERE emp_no = $2`,
      [nextCnt, empNo],
    );

    if (nextCnt >= 5) {
      return res.status(401).json({
        result: "fail",
        messageCode: "LOCKED",
        message: "계정이 잠겼습니다. 관리자에게 문의하세요.",
      });
    }

    return res.status(401).json({
      result: "fail",
      messageCode: `WRONG_PASSWORD:${nextCnt}`,
      message: "비밀번호가 일치하지 않습니다.",
      retryCnt: String(nextCnt),
    });
  }

  // 성공 시 오류횟수 초기화
  if (retryCnt !== 0) {
    await pool.query(
      `UPDATE kids_own.tb_pp_m_mngr_info SET pswd_err_nmtm = 0 WHERE emp_no = $1`,
      [empNo],
    );
  }

  const empResult = await pool.query(empSql, [empNo]);
  const emp = empResult.rows[0] || {};

  const accessToken = signAccessToken({
    sub: empNo,
    kind: "PP_ADMIN",
    mbrId: empNo,
    mbrTypeCd: "A",
    empNo,
    empNm: emp.emp_nm || "",
    userNm: emp.emp_nm || "",
    deptNo: emp.dept_no || "",
    userSeCd: "A",
    instId: "KIDS",
    instNm: "KIDS",
    loginTime: Date.now(),
  });

  // 쿠키(옵션)도 같이 내려줌
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.json({
    result: "success",
    tmprPswdYn: mngr.tmpr_pswd_yn || "N",
    empNm: emp.emp_nm || "",
    empNo,
    accessToken,
    menuAuthList: adminMenuAuthList,
  });
}

async function partnerLogin(req, res) {
  const { mbrId, password } = req.body || {};
  if (!mbrId || !password) {
    return res.status(400).json({
      result: "fail",
      messageCode: "BAD_REQUEST",
      message: "mbrId/password가 필요합니다.",
    });
  }

  const sql = `
    SELECT mbr_no, mbr_id, encpt_mbr_flnm, mbr_enpswd, pswd_err_nmtm, mbr_join_stts_cd, mbr_type_cd
    FROM kids_own.tb_pp_m_mbr_info
    WHERE mbr_id = $1
    LIMIT 1
  `;
  const r = await pool.query(sql, [mbrId]);
  if (r.rows.length === 0) {
    return res.status(401).json({
      result: "fail",
      messageCode: "WRONG_PASSWORD:1",
      message: "아이디 또는 비밀번호를 확인해 주세요.",
      retryCnt: "1",
    });
  }

  const u = r.rows[0];
  const retryCnt = Number(u.pswd_err_nmtm || 0);
  if (retryCnt >= 5) {
    return res.status(401).json({
      result: "fail",
      messageCode: "LOCKED",
      message: "계정이 잠겼습니다. 관리자에게 문의하세요.",
    });
  }

  if (u.mbr_join_stts_cd && String(u.mbr_join_stts_cd).trim() !== "A") {
    return res.status(403).json({
      result: "fail",
      messageCode: "INACTIVE",
      message: "계정이 활성 상태가 아닙니다.",
    });
  }

  const ok = await verifyPassword(password, u.mbr_enpswd);
  if (!ok) {
    const nextCnt = retryCnt + 1;
    await pool.query(
      `UPDATE kids_own.tb_pp_m_mbr_info SET pswd_err_nmtm = $1 WHERE mbr_id = $2`,
      [nextCnt, mbrId],
    );

    if (nextCnt >= 5) {
      return res.status(401).json({
        result: "fail",
        messageCode: "LOCKED",
        message: "계정이 잠겼습니다. 관리자에게 문의하세요.",
      });
    }

    return res.status(401).json({
      result: "fail",
      messageCode: `WRONG_PASSWORD:${nextCnt}`,
      message: "비밀번호가 일치하지 않습니다.",
      retryCnt: String(nextCnt),
    });
  }

  if (retryCnt !== 0) {
    await pool.query(
      `UPDATE kids_own.tb_pp_m_mbr_info SET pswd_err_nmtm = 0 WHERE mbr_id = $1`,
      [mbrId],
    );
  }

  const instSql = `
    SELECT i.brno AS inst_id, i.inst_nm AS inst_nm
    FROM kids_own.TB_PP_M_MBR_INFO m
    INNER JOIN kids_own.TB_PP_M_EXPRT_INFO e ON m.mbr_no = e.mbr_no
    INNER JOIN kids_own.TB_PP_M_INST i ON e.brno = i.brno
    WHERE m.mbr_id = $1
      AND (i.del_yn IS NULL OR TRIM(i.del_yn) = '' OR UPPER(TRIM(i.del_yn)) = 'N')
    LIMIT 1
  `;
  const instR = await pool.query(instSql, [mbrId]);
  const inst = instR.rows[0] || {};

  const accessToken = signAccessToken({
    sub: mbrId,
    kind: "PP_PARTNER",
    mbrId,
    mbrNo: u.mbr_no,
    empNo: mbrId, // 호환용
    empNm: u.encpt_mbr_flnm || mbrId,
    userNm: u.encpt_mbr_flnm || mbrId,
    mbrTypeCd: "P",
    userSeCd: "P",
    instId: inst.inst_id || null,
    instNm: inst.inst_nm || null,
    loginTime: Date.now(),
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.json({
    result: "success",
    tmprPswdYn: "N",
    empNm: u.encpt_mbr_flnm || mbrId,
    empNo: mbrId,
    accessToken,
  });
}

router.post("/adminLogin", (req, res, next) =>
  adminLogin(req, res).catch(next),
);
router.get(
  "/adminSessionCheck",
  requireXRequestedWith,
  authenticateToken,
  (req, res) => {
    const u = req.user || {};
    return res.json({
      result: "success",
      data: {
        accessToken: req.headers.authorization?.split(" ")[1] || "",
        empNo: u.empNo || u.sub || "",
        empNm: u.empNm || "",
        deptNo: u.deptNo || "",
        deptNm: u.deptNm || "",
        menuAuthList: adminMenuAuthList,
      },
    });
  },
);
router.post(
  "/adminExtend",
  requireXRequestedWith,
  authenticateToken,
  (req, res) => {
    return res.json({
      result: "success",
      message: "세션이 정상적으로 연장되었습니다.",
    });
  },
);
router.post(
  "/adminLogout",
  requireXRequestedWith,
  authenticateToken,
  (req, res) => {
    res.clearCookie("accessToken");
    return res.json({
      result: "success",
      message: "정상적으로 로그아웃 되었습니다.",
    });
  },
);

router.post("/partnerLogin", (req, res, next) =>
  partnerLogin(req, res).catch(next),
);
router.get(
  "/partnerSessionCheck",
  requireXRequestedWith,
  authenticateToken,
  (req, res) => {
    const u = req.user || {};
    return res.json({
      result: "success",
      data: {
        accessToken: req.headers.authorization?.split(" ")[1] || "",
        empNo: u.empNo || u.sub || "",
        empNm: u.empNm || "",
        deptNo: u.deptNo || "",
        deptNm: u.deptNm || "",
      },
    });
  },
);
router.post(
  "/partnerExtend",
  requireXRequestedWith,
  authenticateToken,
  (req, res) => {
    return res.json({
      result: "success",
      message: "세션이 정상적으로 연장되었습니다.",
    });
  },
);
router.post(
  "/partnerLogout",
  requireXRequestedWith,
  authenticateToken,
  (req, res) => {
    res.clearCookie("accessToken");
    return res.json({
      result: "success",
      message: "정상적으로 로그아웃 되었습니다.",
    });
  },
);

module.exports = router;
