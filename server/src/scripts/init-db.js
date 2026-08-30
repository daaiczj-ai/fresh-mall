require('dotenv').config();
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const { sequelize, Category, Product, ProductSku, Store, Banner, Coupon, MemberLevel, Admin } = require('../models');

async function init() {
  try {
    await sequelize.sync({ force: true });
    console.log('数据库表创建完成');

    const categories = await Category.bulkCreate([
      { name: '新鲜水果', icon: '/images/cat-fruit.png', sort: 1 },
      { name: '时令蔬菜', icon: '/images/cat-vegetable.png', sort: 2 },
      { name: '肉禽蛋品', icon: '/images/cat-meat.png', sort: 3 },
      { name: '乳制品', icon: '/images/cat-dairy.png', sort: 4 },
      { name: '粮油调味', icon: '/images/cat-grain.png', sort: 5 },
      { name: '零食饮料', icon: '/images/cat-snack.png', sort: 6 },
      { name: '日用百货', icon: '/images/cat-daily.png', sort: 7 }
    ]);

    await Store.create({
      name: '鲜果鲜蔬社区店',
      address: '北京市朝阳区某某街道123号',
      phone: '010-12345678',
      latitude: 39.9042,
      longitude: 116.4074,
      business_hours: '07:00-21:00',
      delivery_radius: 5,
      delivery_fee: 5,
      free_delivery_amount: 39
    });

    const products = [
      { category_id: 1, name: '红富士苹果', subtitle: '脆甜多汁 产地直供', cover: '/images/products/apple.png', price: 12.8, original_price: 15.8, stock: 200, unit: '斤', is_hot: true, is_recommend: true, sales: 156 },
      { category_id: 1, name: '进口香蕉', subtitle: '香甜软糯', cover: '/images/products/banana.png', price: 6.9, stock: 300, unit: '斤', is_hot: true, sales: 289 },
      { category_id: 1, name: '赣南脐橙', subtitle: '皮薄肉厚 汁多味甜', cover: '/images/products/orange.png', price: 9.9, original_price: 12.9, stock: 150, unit: '斤', is_new: true, sales: 78 },
      { category_id: 2, name: '新鲜西红柿', subtitle: '自然成熟 沙瓤多汁', cover: '/images/products/tomato.png', price: 4.5, stock: 500, unit: '斤', is_hot: true, sales: 432 },
      { category_id: 2, name: '有机生菜', subtitle: '无农药 新鲜采摘', cover: '/images/products/lettuce.png', price: 5.8, stock: 200, unit: '份', is_recommend: true, sales: 167 },
      { category_id: 2, name: '新鲜黄瓜', subtitle: '顶花带刺 清脆爽口', cover: '/images/products/cucumber.png', price: 3.9, stock: 400, unit: '斤', sales: 234 },
      { category_id: 3, name: '土鸡蛋', subtitle: '农家散养 30枚装', cover: '/images/products/egg.png', price: 28.8, stock: 100, unit: '盒', is_hot: true, sales: 198 },
      { category_id: 3, name: '鲜猪肉(五花肉)', subtitle: '当日新鲜 按重量计价', cover: '/images/products/pork.png', price: 32.8, stock: 50, unit: '斤', product_type: 'weight', price_per_unit: 32.8, min_weight: 250, weight_step: 50, sales: 89 },
      { category_id: 4, name: '纯牛奶', subtitle: '250ml*12盒', cover: '/images/products/milk.png', price: 45.9, original_price: 52.0, stock: 80, unit: '箱', is_recommend: true, sales: 145 },
      { category_id: 5, name: '东北大米', subtitle: '5kg装 香软可口', cover: '/images/products/rice.png', price: 39.9, stock: 120, unit: '袋', sales: 67 },
      { category_id: 6, name: '薯片大礼包', subtitle: '多种口味混合', cover: '/images/products/chips.png', price: 19.9, stock: 200, unit: '包', product_type: 'sku', sales: 312 },
      { category_id: 7, name: '抽纸', subtitle: '3层130抽*6包', cover: '/images/products/tissue.png', price: 15.9, stock: 300, unit: '提', sales: 178 }
    ];
    const createdProducts = await Product.bulkCreate(products);

    await ProductSku.bulkCreate([
      { product_id: 11, sku_name: '原味', price: 19.9, stock: 80 },
      { product_id: 11, sku_name: '番茄味', price: 19.9, stock: 60 },
      { product_id: 11, sku_name: '烧烤味', price: 21.9, stock: 60 }
    ]);

    await Banner.bulkCreate([
      { title: '新人专享', image: '/images/banner/newuser.png', link_type: 'category', link_value: '1', sort: 1 },
      { title: '时令水果', image: '/images/banner/fruit.png', link_type: 'category', link_value: '1', sort: 2 },
      { title: '满39免配送', image: '/images/banner/delivery.png', link_type: 'none', sort: 3 }
    ]);

    await Coupon.bulkCreate([
      { name: '新人专享券', type: 'new_user', value: 10, min_amount: 30, total_count: 1000, per_limit: 1, start_time: new Date(), end_time: dayjs().add(30, 'day').toDate(), valid_days: 7, description: '新用户首单满30减10' },
      { name: '满50减8', type: 'full_reduce', value: 8, min_amount: 50, total_count: -1, per_limit: 3, start_time: new Date(), end_time: dayjs().add(60, 'day').toDate(), valid_days: 15, description: '满50元可用' },
      { name: '9折优惠券', type: 'discount', value: 0.9, min_amount: 20, max_discount: 15, total_count: 500, per_limit: 1, start_time: new Date(), end_time: dayjs().add(30, 'day').toDate(), valid_days: 7, description: '全场9折，最高减15元' },
      { name: '免配送费券', type: 'delivery', value: 5, min_amount: 0, total_count: 200, per_limit: 2, start_time: new Date(), end_time: dayjs().add(30, 'day').toDate(), valid_days: 7, description: '免配送费' }
    ]);

    await MemberLevel.bulkCreate([
      { name: '普通会员', level: 0, min_spent: 0, discount: 1, points_rate: 1 },
      { name: '银卡会员', level: 1, min_spent: 500, discount: 0.98, points_rate: 1.2, benefits: ['98折优惠', '积分1.2倍'] },
      { name: '金卡会员', level: 2, min_spent: 2000, discount: 0.95, points_rate: 1.5, benefits: ['95折优惠', '积分1.5倍', '生日礼券'] },
      { name: '钻石会员', level: 3, min_spent: 5000, discount: 0.9, points_rate: 2, benefits: ['9折优惠', '积分2倍', '专属客服', '免配送费'] }
    ]);

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await Admin.create({
      username: 'admin',
      password: hashedPassword,
      name: '超级管理员',
      role: 'super'
    });

    console.log('初始数据导入完成');
    console.log('管理员账号: admin / admin123');
    process.exit(0);
  } catch (err) {
    console.error('初始化失败:', err);
    process.exit(1);
  }
}

init();
