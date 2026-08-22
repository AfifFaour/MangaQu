// Remove options that are no longer supported by mysql2.
const mysql = require("mysql2/promise");

const originalCreatePool = mysql.createPool;

mysql.createPool = function createPool(config) {
  if (config && Object.prototype.hasOwnProperty.call(config, "acquireTimeout")) {
    const cleanConfig = { ...config };
    delete cleanConfig.acquireTimeout;
    return originalCreatePool.call(this, cleanConfig);
  }

  return originalCreatePool.apply(this, arguments);
};
