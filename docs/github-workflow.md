# GitHub 使用流程

这份文档给你一个最稳的日常流程：本地改代码，提交到 Git，再推送到 GitHub。

## 第一次上传项目

1. 在 GitHub 新建一个仓库，比如：

```text
tripwise-planner
```

2. 在项目目录初始化 Git：

```bash
git init
git add .
git commit -m "Initial MVP"
```

3. 连接远程仓库。把下面地址换成你自己的 GitHub 仓库地址：

```bash
git remote add origin https://github.com/你的用户名/tripwise-planner.git
git branch -M main
git push -u origin main
```

## 以后每次更新

每次你改完代码后，在项目目录执行：

```bash
git status
git add .
git commit -m "描述这次改了什么"
git push
```

例如：

```bash
git add .
git commit -m "Add travel planning API"
git push
```

## 从 GitHub 拉取最新代码

如果你在另一台电脑上也改了代码，回到这台电脑时先执行：

```bash
git pull
```

## 推荐分支习惯

主分支 `main` 放稳定版本。开发新功能时可以创建分支：

```bash
git checkout -b feature/hotel-search
```

开发完成后：

```bash
git add .
git commit -m "Add hotel search draft"
git checkout main
git merge feature/hotel-search
git push
```

## 不要提交这些内容

- `.env`
- API Key
- 密码
- `node_modules/`
- 本地日志文件
- 临时压缩包

项目里的 `.gitignore` 已经帮你排除了常见本地文件。

## 如果 GitHub 要登录

GitHub 现在推荐用 Personal Access Token 或 GitHub CLI 登录。最省事的方式是安装 GitHub CLI 后执行：

```bash
gh auth login
```

如果你不用 GitHub CLI，也可以继续用 HTTPS 仓库地址，按终端提示登录。
