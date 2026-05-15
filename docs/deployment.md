# 部署上线说明

这个项目现在是一个 Node.js MVP，可以部署到支持 Node 服务的平台，例如 Render、Railway、Fly.io、阿里云、腾讯云或自己的服务器。

## 本地生产方式运行

```bash
npm run start
```

不启动端口的基础验收：

```bash
npm run check
npm run smoke
```

配置了 `AMAP_API_KEY` 后，可以额外检查高德真实数据链路：

```bash
npm run smoke:amap
```

默认地址：

```text
http://127.0.0.1:5173
```

## 部署平台配置

常见部署配置如下：

```text
Build Command: 留空或 npm run check
Start Command: npm run start
Port: 由平台自动注入 PORT
```

环境变量：

```text
HOST=0.0.0.0
AMAP_API_KEY=你的高德开放平台 Key
```

本地开发使用 `HOST=127.0.0.1`，线上部署通常要用 `HOST=0.0.0.0`，这样外部流量才能访问服务。

## 当前 API

健康检查：

```text
GET /api/health
```

动态路线图：

```text
GET /api/map?points=lng,lat;lng,lat
```

生成行程：

```text
POST /api/plan
```

请求体：

```json
{
  "origin": "杭州",
  "startDate": "2026-10-01",
  "endDate": "2026-10-07",
  "destinations": ["广州", "深圳", "茂名", "澳门"],
  "budget": 6800,
  "priority": "balanced",
  "pace": "standard",
  "preferences": {
    "food": true,
    "culture": true,
    "nature": false
  }
}
```

## 数据接入路线

当前 MVP 已经把 API Key 放到后端，前端不会暴露密钥。当前已接入：

1. 高德地理编码：城市名转坐标
2. 高德 POI 搜索：生成更具体的景点、美食和文化点
3. 高德驾车路线估算：用于跨城距离、耗时和成本估算
4. 高德静态地图：后端代理生成路线图，避免前端暴露 Key
5. 高德 URI 链接：路线图和 POI 可跳转到高德 H5 地图
6. 小红书搜索跳转：POI 详情可直接跳转到相关攻略搜索
7. 第三方交通查询入口：高铁跳 12306，机票/汽车票跳携程，自驾跳高德路线
8. 酒店位置估算：用户填写酒店名后，用高德检索并估算每日首末段通勤

下一步建议接入：

1. 景点营业时间和闭馆日
2. 真实公交/步行/驾车日内路线
3. 酒店查询：推荐住宿区域、价格和可订房源
4. 票务明细：提供火车/机票实时班次和价格，不直接出票

## 安全提醒

不要把真实 `.env` 文件提交到 GitHub。部署平台里单独配置环境变量。
