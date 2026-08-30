export function formatDate(val) {
  if (!val) return '-';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const ORDER_STATUS = {
  pending_payment: '待付款',
  paid: '已付款',
  preparing: '备货中',
  delivering: '配送中',
  ready_pickup: '待自提',
  completed: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款'
};

export const ORDER_STATUS_TYPE = {
  pending_payment: 'warning',
  paid: 'primary',
  preparing: '',
  delivering: 'primary',
  ready_pickup: 'success',
  completed: 'success',
  cancelled: 'info',
  refunding: 'danger',
  refunded: 'info'
};

export const POINTS_TYPE = {
  earn: '获得',
  spend: '消费',
  expire: '过期',
  admin: '调整'
};

export const AFTER_SALE_TYPE = {
  refund: '退款',
  return: '退货',
  exchange: '换货'
};

export const AFTER_SALE_STATUS = {
  pending: '待处理',
  approved: '已通过',
  rejected: '已拒绝',
  completed: '已完成'
};

export const AFTER_SALE_STATUS_TYPE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'info'
};

export function maskOpenid(openid) {
  if (!openid) return '-';
  if (openid.length <= 8) return openid;
  return `${openid.slice(0, 4)}****${openid.slice(-4)}`;
}
