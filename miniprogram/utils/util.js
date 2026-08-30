function formatPrice(price) {
  return parseFloat(price).toFixed(2);
}

function formatDate(date, fmt = 'YYYY-MM-DD HH:mm') {
  const d = new Date(date);
  const pad = n => String(n).padStart(2, '0');
  return fmt
    .replace('YYYY', d.getFullYear())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()));
}

const ORDER_STATUS = {
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

const COUPON_TYPE = {
  new_user: '新人券',
  full_reduce: '满减券',
  discount: '折扣券',
  product: '商品券',
  delivery: '配送券'
};

module.exports = { formatPrice, formatDate, ORDER_STATUS, COUPON_TYPE };
