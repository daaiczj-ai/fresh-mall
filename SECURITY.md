# 安全说明

## 切勿提交到仓库的文件

| 文件 | 说明 |
|------|------|
| `server/.env` | 数据库密码、JWT、微信 AppSecret、支付密钥 |
| `miniprogram/utils/config.local.js` | 本机 API 地址 |
| `miniprogram/private/*.key` | 小程序代码上传密钥 |
| `uploads/` | 用户上传的图片 |

仓库仅提供 `server/.env.example` 等示例配置，请复制后本地填写。

## 开源前自检

```bash
# 确认 .env 未被跟踪（应在 .gitignore 中）
git check-ignore -v server/.env

# 搜索是否误提交了密钥（不应有真实 Secret）
rg "WX_SECRET=|WX_API_KEY=|private\.wx" --glob '!*.example*' --glob '!.env.example'
```

若曾将密钥提交到 Git 历史，请在微信公众平台/商户平台**重置密钥**，并使用 `git filter-repo` 等工具清理历史后再公开仓库。
