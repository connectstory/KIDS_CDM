const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET } = require("../middleware/auth");
const { authenticateToken } = require("../middleware/auth");

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "14d" });
}

function isBcryptHash(value) {
  return typeof value === "string" && value.startsWith("$2");
}

async function verifyPassword(input, stored) {
  if (!stored) return false;
  if (isBcryptHash(stored)) return bcrypt.compare(input, stored);
  return String(input) === String(stored);
}

// 임시: tokenSn 기반 세션(메모리)
const tokenStore = new Map(); // tokenSn -> { mbrId, refreshToken }

router.post("/login", async (req, res, next) => {
  try {
    const { prgrmId, mbrId, encptMbrPswd } = req.body || {};
    if (!prgrmId || !mbrId || !encptMbrPswd) {
      return res.status(400).json({
        code: "400",
        msg: "필수값이 누락되었습니다",
        data: {},
      });
    }

    const sql = `
      SELECT
        mbr_no,
        mbr_id,
        encpt_mbr_flnm,
        encpt_mbr_eml_nm,
        encpt_mbr_telno,
        encpt_mbr_pswd,
        mbr_type_cd,
        mbr_join_stts_cd,
        mbr_join_dt,
        mbr_whdwl_rsn,
        mbr_whdwl_dt,
        encpt_bfr_pswd,
        pswd_chg_dt,
        pswd_err_nmtm,
        link_info_idntf_id,
        cert_token_vl,
        rgtr_id,
        reg_dt,
        mdfr_id,
        mdfcn_dt
      FROM kids_own.tb_pp_m_mbr_info
      WHERE mbr_id = $1
      LIMIT 1
    `;
    const r = await pool.query(sql, [mbrId]);
    if (r.rows.length === 0) {
      return res.status(401).json({
        code: "401",
        msg: "아이디 또는 비밀번호가 올바르지 않습니다",
        data: {},
      });
    }

    const u = r.rows[0];
    console.log(u);
    const retryCnt = Number(u.pswd_err_nmtm || 0);
    // if (retryCnt >= 5) {
    //   return res.status(401).json({
    //     code: "401",
    //     msg: "계정이 잠겼습니다. 관리자에게 문의하세요.",
    //     data: {},
    //   });
    // }

    const ok = encptMbrPswd === u.encpt_mbr_pswd;
    console.log(encptMbrPswd, u.encpt_mbr_pswd);
    if (!ok) {
      const nextCnt = retryCnt + 1;
      await pool.query(
        `UPDATE kids_own.tb_pp_m_mbr_info SET pswd_err_nmtm = $1 WHERE mbr_id = $2`,
        [nextCnt, mbrId],
      );
      return res.status(401).json({
        code: "401",
        msg: "아이디 또는 비밀번호가 올바르지 않습니다",
        data: { pswdErrNmtm: nextCnt },
      });
    }

    if (retryCnt !== 0) {
      await pool.query(
        `UPDATE kids_own.tb_pp_m_mbr_info SET pswd_err_nmtm = 0 WHERE mbr_id = $1`,
        [mbrId],
      );
    }

    const tokenSn = Number(Date.now()); // 임시
    const accessToken = signAccessToken({
      sub: mbrId,
      kind: "CA",
      prgrmId,
      mbrId,
      mbrNo: u.mbr_no,
      mbrTypeCd: "G",
      userSeCd: "E",
      userNm: u.encpt_mbr_flnm || mbrId,
      loginTime: Date.now(),
      tokenSn,
    });
    const refreshToken = signRefreshToken({
      sub: mbrId,
      kind: "CA_REFRESH",
      prgrmId,
      mbrId,
      tokenSn,
    });

    tokenStore.set(tokenSn, { mbrId, refreshToken });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      code: "0",
      msg: "로그인되었습니다",
      data: {
        userInfo: {
          mbrNo: u.mbr_no,
          mbrId: u.mbr_id,
          encptMbrFlnm: u.encpt_mbr_flnm,
          encptMbrEmlNm: u.encpt_mbr_eml_nm,
          encptMbrTelno: u.encpt_mbr_telno,
          mbrTypeCd: u.mbr_type_cd,
          mbrJoinSttsCd: u.mbr_join_stts_cd,
          mbrJoinDt: u.mbr_join_dt,
          mbrWhdwlRsn: u.mbr_whdwl_rsn,
          mbrWhdwlDt: u.mbr_whdwl_dt,
          encptBfrPswd: u.encpt_bfr_pswd,
          pswdChgDt: u.pswd_chg_dt,
          pswdErrNmtm: 0,
          linkInfoIdntfId: u.link_info_idntf_id,
          certToken: u.cert_token_vl,
          rgtrId: u.rgtr_id,
          regDt: u.reg_dt,
          regPrgrmId: u.reg_prgm_id,
          mdfrId: u.mdfr_id,
          mdfcnDt: u.mdfcn_dt,
          mdfcnPrgrmId: u.mdfcn_prgm_id,
          tokenId: tokenSn,
          updtToken: refreshToken,
          acsToken: accessToken,
          mbrEnpswd: u.mbr_enpswd,
        },
        tokenSn,
        accessToken,
        pswdErrNmtm: 0,
        refreshToken,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", async (req, res) => {
  const { mbrId, tokenSn } = req.body || {};
  if (tokenSn) tokenStore.delete(Number(tokenSn));
  res.clearCookie("accessToken");
  return res.json({ code: "0", msg: "로그아웃되었습니다", data: {} });
});

router.post("/extend", authenticateToken, async (req, res) => {
  return res.json({ code: "0", msg: "성공", data: {} });
});

router.get("/isLoggedIn", authenticateToken, async (req, res) => {
  const u = req.user || {};
  const mbrId = u.mbrId || u.sub || "";

  // DB에서 최소 정보 재조회(마스킹 등은 이후 확장)
  const sql = `
    SELECT mbr_no, mbr_id, encpt_mbr_flnm, encpt_mbr_eml_nm, encpt_mbr_telno,
           mbr_type_cd, mbr_join_stts_cd, mbr_join_dt, pswd_err_nmtm, link_info_idntf_id, cert_token_vl,
           rgtr_id, reg_dt, mdfr_id, mdfcn_dt
    FROM kids_own.tb_pp_m_mbr_info
    WHERE mbr_id = $1
    LIMIT 1
  `;
  const r = await pool.query(sql, [mbrId]);
  const row = r.rows[0] || {};

  return res.json({
    code: "0",
    msg: "성공",
    data: {
      userInfo: {
        mbrNo: row.mbr_no || "",
        mbrId: row.mbr_id || mbrId,
        encptMbrFlnm: row.encpt_mbr_flnm || null,
        encptMbrEmlNm: row.encpt_mbr_eml_nm || null,
        encptMbrTelno: row.encpt_mbr_telno || null,
        mbrTypeCd: row.mbr_type_cd || null,
        mbrJoinSttsCd: row.mbr_join_stts_cd || null,
        mbrJoinDt: row.mbr_join_dt || null,
        pswdErrNmtm: row.pswd_err_nmtm || 0,
        linkInfoIdntfId: row.link_info_idntf_id || null,
        certTokenVl: row.cert_token_vl || null,
        rgtrId: row.rgtr_id || null,
        regDt: row.reg_dt || null,
        mdfrId: row.mdfr_id || null,
        mdfcnDt: row.mdfcn_dt || null,
        tokenSn: u.tokenSn || null,
      },
      mbrId,
      loging: "true",
      token: req.headers.authorization?.split(" ")[1] || "",
    },
  });
});

module.exports = router;
