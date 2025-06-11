# obj-patch

一个用于对象补丁操作的 TypeScript 库。仅仅支持 object 而不支持 array。
并非 JSON Patch 规范。主要面向游戏数据同步。
其中 set 操作既能新增，也能修改，也能删除。set null 即是删除。Object 中禁止存在 null 值。

## 安装

```bash
npm install obj-patch
```

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 测试

```bash
# 运行测试
npm test

# 运行测试并生成报告
npm run test:run
```

### 代码检查

```bash
npm run lint
npm run type-check
```

## 许可证

MIT 