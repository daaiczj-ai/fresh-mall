const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/error');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: ['text/xml', 'application/xml'] }));
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));
app.use('/static', express.static(path.join(__dirname, '../../miniprogram/images')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/product'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/addresses', require('./routes/address'));
app.use('/api/user', require('./routes/user'));
app.use('/api/pay', require('./routes/pay'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use(errorHandler);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    // 仅在显式设置 DB_ALTER=1 时自动改表，避免每次启动 ALTER 堆积索引导致启动失败
    await sequelize.sync({ alter: process.env.DB_ALTER === '1' });
    console.log('数据库同步完成');

    app.listen(config.port, () => {
      console.log(`服务已启动: http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
