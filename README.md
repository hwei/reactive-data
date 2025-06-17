# Reactive Data Libraries

这是一个包含两个相关库的工作区：

## 项目结构

```
├── reactive-data/           # 核心响应式数据管理库
│   ├── src/
│   │   ├── reactive_data.ts
│   │   ├── index.ts
│   │   └── __tests__/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── reactive-data-solid/     # Solid.js 集成库
│   ├── reactive_data_solid.ts
│   ├── index.ts
│   ├── __tests__/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── package.json            # 工作区根配置
```

## 库说明

### reactive-data
核心响应式数据管理库，提供：
- `ReactiveData` 类用于管理响应式数据
- 支持路径监听和值变更通知
- 类型安全的 API

### reactive-data-solid
Solid.js 集成库，提供：
- `createReactiveData` 函数创建 Solid.js 信号
- 强类型支持的路径访问
- 与 Solid.js 生态系统的无缝集成

## 开发

```bash
# 安装依赖
npm install

# 构建所有库
npm run build

# 运行测试
npm run test

# 类型检查
npm run type-check
```

## 使用示例

### reactive-data
```typescript
import { ReactiveData } from 'reactive-data';

const data = new ReactiveData();
data.setValue(['user', 'name'], 'Alice');
data.addChangeListener(['user', 'name'], (value) => {
  console.log('Name changed:', value);
});
```

### reactive-data-solid
```typescript
import { createReactiveData } from 'reactive-data-solid';

const store = createReactiveData<{ user: { name: string } }>();
const nameSignal = store.useSignal('user', 'name');
const setName = store.setValue;

// 在 Solid.js 组件中使用
const name = nameSignal();
setName('user', 'name', 'Bob');
```

## 许可证

MIT 