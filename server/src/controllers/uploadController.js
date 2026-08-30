const path = require('path');
const config = require('../config');
const { success, fail } = require('../utils/response');

function uploadImage(req, res) {
  if (!req.file) return fail(res, '请选择图片');
  const url = `/uploads/${req.file.filename}`;
  success(res, {
    url,
    fullUrl: `${config.upload.baseUrl}${url}`
  }, '上传成功');
}

module.exports = { uploadImage };
