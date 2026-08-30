export function resolveImage(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return url;
  if (url.startsWith('/images/')) return url.replace('/images/', '/static/');
  if (url.startsWith('/static/')) return url;
  return `/static/${url.replace(/^\//, '')}`;
}
