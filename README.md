# TripWise Planner

TripWise Planner 是一个可部署的旅行规划 MVP。用户输入出发地、日期、目的地、预算和偏好后，系统会通过后端 `/api/plan` 生成多城市路线、每日安排、跨城交通建议和预算估算。

## 快速开始

```bash
npm run start
```

然后打开：

```text
http://127.0.0.1:5173
```

## 当前版本

- 前端：原生 HTML/CSS/JavaScript
- 后端：Node.js 原生 HTTP 服务，无需安装第三方依赖
- API：`POST /api/plan`、`GET /api/health`、`GET /api/map`
- 输入：支持一句话自动填写，也支持表单精确编辑
- 数据：默认使用内置样例 + 启发式估算
- 真实数据：配置 `AMAP_API_KEY` 后启用高德地理编码、POI 搜索、驾车路线估算和动态静态地图
- 行程：同一城市多日停留时会尽量分配不重复 POI，大范围目的地会按片区/地区拆分住宿圈
- 交互：路线图可点开查看，单日行程可点开查看地点图片、高德链接和小红书搜索
- 交通：支持高铁、航班、自驾、大巴偏好，并展示每段交通的多种候选方式和第三方查询入口
- 酒店：可填写已定酒店/住宿名，用于估算酒店到当天首末景点的日内交通
- 评分：展示预算匹配、省时效率和舒适度三个维度的权重与得分

## 环境变量

复制 `.env.example`，在部署平台中配置同名环境变量：

```bash
PORT=5173
HOST=127.0.0.1
AMAP_API_KEY=
```

本地运行可以不配置 `AMAP_API_KEY`。上线部署时，不要把真实 Key 写进代码或提交到 GitHub。

## 项目结构

```text
.
├── index.html
├── package.json
├── .env.example
├── assets/
│   └── route-map.png
├── docs/
│   ├── deployment.md
│   ├── github-workflow.md
│   └── product-spec.md
├── scripts/
│   ├── amap-smoke.mjs
│   ├── generate-map.mjs
│   └── smoke-test.mjs
├── server/
│   ├── index.js
│   └── services/
│       ├── amap.js
│       └── env.js
└── src/
    ├── app.js
    ├── planner.js
    └── styles.css
```

## 常用命令

```bash
npm run start
npm run check
npm run smoke
npm run smoke:amap
npm run generate:assets
```

`npm run smoke` 不访问外部网络，用于快速检查核心规划逻辑。`npm run smoke:amap` 会读取 `.env` 并访问高德 API，用于确认 Key、POI 和动态地图是否正常。

## API 示例

```bash
curl http://127.0.0.1:5173/api/health
```

```bash
curl -X POST http://127.0.0.1:5173/api/plan \
  -H "Content-Type: application/json" \
  -d '{"origin":"杭州","startDate":"2026-10-01","endDate":"2026-10-07","destinations":["新疆"],"hotelName":"丽枫酒店喀什古城景区店","budget":12000,"priority":"balanced","pace":"standard","transportModes":["rail","flight","driving"],"preferences":{"food":true,"culture":true,"nature":true}}'
```

## GitHub 和部署

- GitHub 操作看 [docs/github-workflow.md](docs/github-workflow.md)
- 部署上线看 [docs/deployment.md](docs/deployment.md)

## 下一阶段

- 接入景点营业时间、闭馆日和更精确的城市内路线排序
- 接入酒店/机票/火车票实时明细和价格
- 接入更精细的公共交通、铁路和航班实时班次
- 增加用户登录、保存方案、分享链接
- 将启发式路线算法升级为更完整的约束优化引擎
