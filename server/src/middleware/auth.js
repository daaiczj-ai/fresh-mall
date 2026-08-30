const { verifyToken } = require('../utils/response');
const { fail } = require('../utils/response');
const { User, Admin } = require('../models');

async function authUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return fail(res, '请先登录', 401, 401);
  try {
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);
    if (!user || user.status !== 1) return fail(res, '用户不存在或已禁用', 401, 401);
    req.user = user;
    next();
  } catch {
    return fail(res, '登录已过期，请重新登录', 401, 401);
  }
}

async function authAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return fail(res, '请先登录', 401, 401);
  try {
    const decoded = verifyToken(token);
    const admin = await Admin.findByPk(decoded.id);
    if (!admin || admin.status !== 1) return fail(res, '管理员不存在或已禁用', 401, 401);
    req.admin = admin;
    next();
  } catch {
    return fail(res, '登录已过期，请重新登录', 401, 401);
  }
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    User.findByPk(decoded.id).then(user => {
      if (user && user.status === 1) req.user = user;
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return fail(res, '权限不足', 403, 403);
    }
    next();
  };
}

module.exports = { authUser, authAdmin, optionalAuth, requireRole };
