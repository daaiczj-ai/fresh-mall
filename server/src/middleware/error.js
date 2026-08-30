const { fail } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('[Error]', err);
  if (err.name === 'SequelizeValidationError') {
    return fail(res, err.errors.map(e => e.message).join(', '));
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return fail(res, '数据已存在');
  }
  fail(res, err.message || '服务器内部错误', 500, 500);
}

module.exports = errorHandler;
