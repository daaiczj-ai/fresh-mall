const jwt = require('jsonwebtoken');
const config = require('../config');

function success(res, data = null, message = 'success') {
  res.json({ code: 0, message, data });
}

function fail(res, message = 'error', code = 1, status = 400) {
  res.status(status).json({ code, message, data: null });
}

function paginate(res, { rows, count }, page, pageSize) {
  success(res, {
    list: rows,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(count / pageSize)
  });
}

function generateToken(payload, expiresIn) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: expiresIn || config.jwt.expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

function generateOrderNo() {
  const now = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
}

function generatePickupCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = { success, fail, paginate, generateToken, verifyToken, generateOrderNo, generatePickupCode };
