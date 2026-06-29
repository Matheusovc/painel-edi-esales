import mysql from 'mysql2/promise'

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'testes_esales',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  })
}

// Em dev, o HMR recria o módulo a cada mudança — reutiliza a pool global
// para não estourar o limite de conexões do MySQL.
const pool = global._mysqlPool ?? createPool()

if (process.env.NODE_ENV !== 'production') {
  global._mysqlPool = pool
}

export default pool
