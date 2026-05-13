const { Pool } = require("pg");

const useSsl =
  process.env.PGSSLMODE === "require" ||
  process.env.DATABASE_SSL === "true";

const poolConfig = {
  // host: "34.47.107.166",
  host: "localhost",
  port: 5432,
  database: "postgres",
  user: "postgres",
  // password: "!Misotech123",
  password: "dprtm123",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

if (useSsl) {
  // pg_hba.conf에서 SSL만 허용(hostssl)하거나 호스팅 DB가 sslmode=require인 경우
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports = pool;
