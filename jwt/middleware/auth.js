const jwt = require("jsonwebtoken");

/**
 * Spring backend uses `jwt.secret-key` as a Base64-encoded HMAC key bytes:
 * - it Base64-decodes the value
 * - then verifies JWT signature with those raw bytes
 *
 * To be compatible, Node must sign/verify using the SAME raw bytes.
 */
const DEFAULT_JWT_SECRET_BASE64 =
  // matches `cdm-backend/src/main/resources/application-local.yml` (jwt.secret-key)
  "ZGQtaW90LXBjd2ViLWFwaS1hZG1pbi1zZWNyZXRrZXk=";

const JWT_SECRET_BASE64 =
  process.env.JWT_SECRET_BASE64 ||
  process.env.JWT_SECRET_KEY_BASE64 ||
  DEFAULT_JWT_SECRET_BASE64;

const JWT_SECRET = Buffer.from(JWT_SECRET_BASE64, "base64");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  const cookieToken =
    req.cookies?.accessToken || req.cookies?.token || req.cookies?.jwt;

  const resolvedToken = token || cookieToken;

  if (!resolvedToken) {
    return res.status(401).json({
      success: false,
      error: "Access token required",
    });
  }

  jwt.verify(resolvedToken, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: "Invalid or expired token",
      });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken, JWT_SECRET };
