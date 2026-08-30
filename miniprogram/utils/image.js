const config = require('./config');

const API_BASE = config.baseUrl.replace('/api', '');
const DEFAULT_IMAGE = `${config.assetBaseUrl}/default-product.png`;

function resolveImage(url) {
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  const relative = url
    .replace(/^\//, '')
    .replace(/^images\//, '')
    .replace(/\.jpe?g$/i, '.png');
  return `${config.assetBaseUrl}/${relative}`;
}

module.exports = { DEFAULT_IMAGE, resolveImage };
