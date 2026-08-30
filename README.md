# 鲜果鲜蔬 - 社区生鲜店微信小程序

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

一套完整的社区生鲜店线上经营系统，包含微信小程序用户端、Node.js 后端 API 和 Vue3 商家管理后台。支持同城配送、到店自提、优惠券、会员积分、称重商品、商家后台（含手机模式）。

> **开源说明**：本项目以 [MIT](LICENSE) 协议发布。部署前请复制 `server/.env.example` 为 `server/.env` 并填入你自己的配置，**切勿将密钥提交到 Git**。详见 [SECURITY.md](SECURITY.md)。

## 项目结构

```
同城商城/
├── server/          # 后端 API (Node.js + Express + MySQL)
├── miniprogram/     # 微信小程序用户端
├── admin/           # 商家管理后台 (Vue3 + Element Plus)
└── README.md
```

## 功能概览

### 用户端（微信小程序）

| 模块 | 功能 |
|------|------|
| 首页 | 轮播图、分类入口、热销/新品/推荐商品 |
| 分类 | 左侧分类导航 + 右侧商品列表 |
| 搜索 | 关键词搜索商品 |
| 商品详情 | 普通商品 / 多规格 SKU / 按重量计价 |
| 购物车 | 增删改查、全选、结算 |
| 下单结算 | 同城配送 / 到店自提、预约配送时间 |
| 订单管理 | 待付款、备货中、配送中、已完成、取消、退款 |
| 地址管理 | 收货地址 CRUD、默认地址 |
| 优惠券 | 领取、查看、使用 |
| 会员中心 | 等级、积分、权益 |
| 收藏 | 商品收藏 |
| 支付 | 微信支付（可配置）/ 开发模拟支付 |

### 商家后台

| 模块 | 功能 |
|------|------|
| 数据概览 | 今日订单/营业额、7日趋势图、热销 TOP10、库存预警 |
| 商品管理 | 商品 CRUD、SKU、库存、上下架 |
| 分类管理 | 分类 CRUD |
| 订单管理 | 订单列表、状态流转 |
| 用户管理 | 用户列表、会员信息 |
| 优惠券 | 新人券/满减券/折扣券/配送券 |
| 门店管理 | 门店信息、配送费、免配送门槛 |
| 售后管理 | 退款/退货/换货审核 |

## 技术栈

- **后端**: Node.js, Express, Sequelize, MySQL, JWT
- **小程序**: 微信原生小程序
- **管理后台**: Vue 3, Vite, Element Plus, ECharts, Pinia

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 5.7
- 微信开发者工具

### 1. 安装依赖

```bash
# 根目录
npm install

# 管理后台
cd admin && npm install
```

### 2. 配置数据库

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE fresh_mall CHARACTER SET utf8mb4;"

# 复制环境变量
cp server/.env.example server/.env
# 编辑 server/.env 填入数据库密码和微信配置
```

### 3. 初始化数据

```bash
cd server
npm run db:init
```

初始化后会创建：
- 7 个商品分类（水果、蔬菜、肉禽蛋等）
- 12 个示例商品（含 SKU 和称重商品）
- 4 张优惠券
- 4 个会员等级
- 1 个门店
- 管理员账号：**admin / admin123**

### 4. 启动后端

```bash
cd server
npm run dev
# 服务运行在 http://localhost:3000
```

### 5. 启动管理后台

```bash
cd admin
npm run dev
# 访问 http://localhost:5173
# 登录: admin / admin123
```

### 6. 启动小程序

1. 用微信开发者工具打开 `miniprogram` 目录
2. 将 `project.config.json` 或 `project.private.config.json` 中的 `appid` 改为你的小程序 AppID（可参考 `project.private.config.example.json`）
3. 配置 API 地址：复制 `utils/config.local.example.js` 为 `utils/config.local.js`，填入后端地址（真机预览需用电脑局域网 IP）
4. 开发阶段勾选「不校验合法域名」

### 7. 配置代码上传密钥（发布用）

微信的**代码上传密钥是一个 `.key` 文件**，不是写在 `.env` 里的字符串，也与 `WX_SECRET`（AppSecret）不同：

| 配置项 | 用途 | 存放位置 |
|--------|------|----------|
| `WX_APPID` / `WX_SECRET` | 用户登录、调微信接口 | `server/.env` |
| 代码上传密钥 `.key` | 开发者工具「上传」代码 | `miniprogram/private/`（本地，勿提交 Git） |

**操作步骤（推荐，最简单）：**

1. 用微信开发者工具打开 `miniprogram` 目录（不是整个「同城商城」根目录）
2. 确认右上角已登录**小程序管理员**微信（和该 AppID 绑定的账号）
3. 点击工具栏右上角 **「上传」** 按钮（不是「预览」）
4. 若弹出「配置代码上传密钥」→ 选择 `miniprogram/private/` 目录下你下载的 `.key` 文件
5. 填写 **版本号**（如 `1.0.0`）和 **项目备注**
6. 点 **上传**，成功后去微信公众平台 → 版本管理 里能看到开发版

> 部分版本的开发者工具**没有**「详情 → 本地设置 → 代码上传密钥」这一项，**直接点「上传」时选择密钥**即可，不用单独找设置页。

**若上传按钮是灰色的 / 点不了：**

- 检查 `appid` 是否为你的真实 AppID
- 确认登录的微信是该小程序的**管理员或开发者**
- 不要用「测试号」模式打开正式小程序项目

> 密钥文件已加入 `.gitignore`，请勿上传到代码仓库。

## 商品类型说明

| 类型 | product_type | 说明 |
|------|-------------|------|
| 普通商品 | normal | 固定价格，按件购买 |
| 多规格 SKU | sku | 多种规格（如口味），各有独立价格和库存 |
| 称重商品 | weight | 按重量计价（如鲜肉），支持步进选择克数 |

## 订单状态流转

```
待付款 → 已付款 → 备货中 → 配送中 → 已完成
                ↘ 待自提 → 已完成
待付款/备货中 → 已取消
已付款 → 退款中 → 已退款
```

## 配送与自提

- **同城配送**: 收货地址、配送费、满额免配送（默认满39免5元配送费）、预约配送时段
- **到店自提**: 选择门店、预约取货时间、6位取货码

## 营销功能

- 新人优惠券、满减券、折扣券、商品券、配送券
- 会员等级（普通/银卡/金卡/钻石）
- 积分（购物获得、订单抵扣）
- 限时特价、秒杀（数据模型已就绪）
- 会员专享价

## 真机调试：微信登录与支付

### 微信登录（打开小程序自动登录）

小程序启动时会自动调用 `wx.login` 静默登录，无需用户点「授权」按钮。

**真机要能登录，必须在 `server/.env` 配置 AppSecret：**

1. 登录 [微信公众平台](https://mp.weixin.qq.com/) → **开发** → **开发管理** → **开发设置**
2. 复制 **AppID** 和 **AppSecret**（需管理员扫码）
3. 写入 `server/.env`：
   ```
   WX_APPID=wx你的AppID
   WX_SECRET=你的AppSecret
   ```
4. 重启后端 `cd server && npm run dev`
5. 微信开发者工具重新编译，真机调试扫码

> 当前若 `WX_SECRET=your_wx_secret` 仍是占位符，真机会登录失败。模拟器可能走开发模式，真机必须用真实 Secret。

### 微信支付（真机能否用真实付款？）

| 条件 | 说明 |
|------|------|
| **可以** | 真机调试 + 已开通微信支付商户号 + 商户号已绑定该小程序 |
| **当前默认** | 未配置商户号 → **模拟支付**（弹窗确认，不扣真钱） |

**启用真实微信支付，在 `server/.env` 配置：**

```
WX_MCH_ID=你的商户号
WX_API_KEY=商户API密钥（V2）
WX_NOTIFY_URL=https://你的公网域名/api/pay/notify
```

注意：
- `WX_NOTIFY_URL` 必须是 **HTTPS 公网地址**，`localhost` 微信服务器访问不到
- 本地开发可用内网穿透（如 ngrok、花生壳）把 3000 端口映射到公网 HTTPS
- 商户平台需将小程序 AppID 与商户号关联
- 配置完成后，真机支付会调起微信收银台；未配置则仍走模拟支付

## 微信支付配置

在 `server/.env` 中配置：

```
WX_APPID=你的小程序AppID
WX_SECRET=你的小程序Secret
WX_MCH_ID=商户号
WX_API_KEY=API密钥
WX_NOTIFY_URL=支付回调地址
```

开发阶段可使用模拟支付接口 `POST /api/pay/:orderId/mock`。

## API 接口

| 前缀 | 说明 |
|------|------|
| `/api/auth` | 微信登录、用户信息 |
| `/api` | 商品、分类、搜索、轮播图 |
| `/api/cart` | 购物车 |
| `/api/orders` | 订单 |
| `/api/addresses` | 收货地址 |
| `/api/user` | 优惠券、会员、收藏、评价、售后 |
| `/api/pay` | 支付 |
| `/api/admin` | 管理后台 |

## 扩展规划

系统架构支持后续扩展：

- 多门店独立库存
- 骑手配送系统
- 进销存管理
- 供应商管理
- AI 商品推荐
- 直播带货

## 开源与部署

| 文档 | 说明 |
|------|------|
| [LICENSE](LICENSE) | MIT 开源协议 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 参与贡献指南 |
| [SECURITY.md](SECURITY.md) | 密钥与敏感信息安全 |

**发布到 GitHub 前建议：**

1. 确认 `server/.env`、`.key`、`config.local.js` 未被纳入版本控制
2. 若仓库中曾出现真实密钥，先在微信后台重置，再清理 Git 历史
3. 删除或忽略 `admin/dist` 构建产物（已写入 `.gitignore`）

## License

MIT © Fresh Mall Contributors
