# 参与贡献

感谢关注本项目！欢迎提交 Issue 和 Pull Request。

## 本地开发

1. Fork 本仓库并克隆到本地
2. `npm install`（根目录，含 server、admin workspace）
3. 配置 `server/.env`（参考 `server/.env.example`）
4. `cd server && npm run db:init` 初始化数据库
5. 分别启动后端与后台：`npm run dev:server`、`npm run dev:admin`
6. 微信开发者工具打开 `miniprogram` 目录，配置自己的 AppID

## 提交规范

- 一个 PR 只做一件事，便于审查
- 不要提交 `.env`、`.key`、`config.local.js`、上传文件
- 涉及数据库变更请说明迁移方式，避免使用 `DB_ALTER=1` 长期自动改表

## 报告问题

Issue 请尽量包含：复现步骤、期望行为、实际行为、环境（Node 版本、是否真机调试等）。
