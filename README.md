# Reactive Data Libraries

这是一个专为游戏开发设计的响应式数据管理库，特别针对游戏中的对象状态同步需求。

## 设计理念

### 游戏开发中的状态管理特点

在游戏开发中，状态管理有其特殊性：

1. **基于 ID 的同步**：游戏中的对象通常通过唯一 ID 进行标识和同步，而不是通过数组索引
2. **对象生命周期复杂**：游戏对象会频繁创建、销毁、移动，数组索引会变得不稳定
3. **网络同步需求**：需要精确控制哪些数据发生变化，避免不必要的网络传输

### 与 Unreal Engine FastArray 的对比

Unreal Engine 的 FastArray 系统采用基于 ID 的同步机制：

```cpp
// Unreal FastArray 示例
struct FGameObject {
    int32 ID;           // 唯一标识符
    FVector Position;   // 位置数据
    float Health;       // 生命值
};

// 通过 ID 查找，而不是数组索引
UObject* FindObjectById(int32 ObjectId);
```

我们的库采用相同的设计理念：

```typescript
// 使用对象路径，而不是数组索引
const gameState = new ReactiveData();
gameState.setValue(['objects', 'player_123'], { position: [100, 200], health: 100 });
gameState.setValue(['objects', 'enemy_456'], { position: [300, 400], health: 80 });
```

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
├── reactive-data-patch/     # 批量更新和补丁合并库
│   ├── src/
│   │   ├── patch_merger.ts
│   │   ├── types.ts
│   │   ├── index.ts
│   │   └── __tests__/
│   ├── example.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── package.json            # 工作区根配置
```

## 库说明

### reactive-data
核心响应式数据管理库，专为游戏开发设计：
- `ReactiveData` 类用于管理响应式数据
- 支持路径监听和值变更通知
- 类型安全的 API
- **不支持数组索引，只支持对象嵌套结构**
- 基于 ID 的对象管理，适合游戏对象状态同步

### reactive-data-solid
Solid.js 集成库，提供：
- `createReactiveData` 函数创建 Solid.js 信号
- 强类型支持的路径访问
- 与 Solid.js 生态系统的无缝集成
- **自动清理监听器**（仅在 Solid.js 组件中使用时）
- 游戏 UI 状态管理的理想选择

### reactive-data-patch
批量更新和补丁合并库，提供：
- `mergePatches` 函数将多个数据补丁合并成一个根节点数据对象
- `DataPatch` 类型定义，包含路径和值信息
- 支持复杂的嵌套路径合并
- 正确处理删除操作（null 值）
- 适合网络同步中的批量状态更新

## 为什么不支持数组？

### 1. 游戏对象生命周期问题
```typescript
// ❌ 数组索引方式 - 不稳定
const players = ['player1', 'player2', 'player3'];
players.splice(1, 1); // 删除第二个玩家
// 现在 players[1] 变成了 'player3'，索引关系混乱

// ✅ 基于 ID 的方式 - 稳定
const gameState = new ReactiveData();
gameState.setValue(['players', 'player_001'], { name: 'Alice', health: 100 });
gameState.setValue(['players', 'player_002'], { name: 'Bob', health: 80 });
// 删除玩家不会影响其他玩家的引用
```

### 2. 网络同步效率
```typescript
// ✅ 命令模式同步 setValue 调用
gameState.addChangeListener(['players', 'player_001', 'health'], (health) => {
    // 发送 setValue 命令，而不是数据本身
    networkSync.sendCommand({
        type: 'setValue',
        path: ['players', 'player_001', 'health'],
        value: health === undefined ? null : health, // 将 undefined 转换为 null
        timestamp: Date.now()
    });
});

// 接收端执行相同的 setValue 命令
networkSync.onCommand((command) => {
    if (command.type === 'setValue') {
        gameState.setValue(command.path, command.value);
    }
});
```

### 3. 内存管理
```typescript
// 需要手动移除监听器以避免内存泄漏
const handler = (playerData) => { /* 处理逻辑 */ };
gameState.addChangeListener(['players', 'player_001', 'health'], handler);

// 当不再需要监听时，必须手动移除
gameState.removeChangeListener(['players', 'player_001', 'health'], handler);

// 或者使用 Solid.js 集成，它会自动清理
const playerHealthSignal = gameStore.useSignal('players', 'player_001', 'health');
// 当组件销毁时，监听器会自动移除
```

## 网络同步设计

### 命令模式的优势

这个库的设计使得网络同步变得简单而高效：

1. **统一的 API**：所有状态变更都通过 `setValue` 进行
2. **命令可序列化**：`setValue` 的参数可以轻松序列化为网络消息
3. **确定性**：相同的命令在不同客户端产生相同的结果
4. **增量同步**：只同步发生变化的数据路径

### 网络同步示例

```typescript
// 定义网络命令类型
interface NetworkCommand {
    type: 'setValue';
    path: string[];
    value: any; // 使用 null 代替 undefined
    timestamp: number;
}

// 发送端：监听状态变化并发送命令
class NetworkSync {
    private gameState: ReactiveData;
    
    constructor(gameState: ReactiveData) {
        this.gameState = gameState;
        this.setupListeners();
    }
    
    private setupListeners() {
        // 监听所有玩家状态变化
        this.gameState.addChangeListener(['players'], (players) => {
            // 这里可以发送完整的玩家状态，或者
            // 更精细地监听每个玩家的变化
        });
        
        // 监听特定玩家的生命值变化
        this.gameState.addChangeListener(['players', 'player_001', 'health'], (health) => {
            this.sendCommand({
                type: 'setValue',
                path: ['players', 'player_001', 'health'],
                value: health === undefined ? null : health, // 将 undefined 转换为 null
                timestamp: Date.now()
            });
        });
    }
    
    private sendCommand(command: NetworkCommand) {
        // 发送到网络
        network.send(JSON.stringify(command));
    }
    
    // 接收端：处理网络命令
    public handleCommand(commandData: string) {
        const command: NetworkCommand = JSON.parse(commandData);
        
        if (command.type === 'setValue') {
            // setValue 内部会自动将 null 转换为 undefined
            this.gameState.setValue(command.path, command.value);
        }
    }
}
```

### 批量更新和补丁合并

对于需要批量处理多个状态变更的场景，可以使用 `reactive-data-patch` 模块：

```typescript
import { mergePatches, DataPatch } from 'reactive-data-patch';

// 收集多个状态变更
const patches: DataPatch[] = [
    { path: ['players', 'player_001', 'health'], value: 75 },
    { path: ['players', 'player_001', 'level'], value: 6 },
    { path: ['players', 'player_002', 'health'], value: 50 },
    { path: ['gameTime'], value: Date.now() }
];

// 合并成单个状态对象
const mergedState = mergePatches(patches);
console.log(mergedState);
// 输出:
// {
//   players: {
//     player_001: { health: 75, level: 6 },
//     player_002: { health: 50 }
//   },
//   gameTime: 1234567890
// }

// 直接应用合并后的状态
gameState.setValue([], mergedState);
```

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

### 游戏状态管理
```typescript
import { ReactiveData } from 'reactive-data';

const gameState = new ReactiveData();

// 初始化游戏对象
gameState.setValue(['players', 'player_001'], {
    name: 'Alice',
    health: 100,
    level: 5,
    inventory: { weapon: 'sword', armor: 'leather' }
});

// 监听特定玩家的生命值变化
const healthHandler = (health) => {
    console.log('Player health changed:', health);
    if (health <= 0) {
        handlePlayerDeath('player_001');
    }
};
gameState.addChangeListener(['players', 'player_001', 'health'], healthHandler);

// 更新玩家等级
gameState.setValue(['players', 'player_001', 'level'], 6);

// 当不再需要监听时，记得移除监听器
// gameState.removeChangeListener(['players', 'player_001', 'health'], healthHandler);
```

### Solid.js 游戏 UI
```typescript
import { createReactiveData } from 'reactive-data-solid';

const gameStore = createReactiveData<{
    players: Record<string, { health: number; level: number; name: string }>;
    gameTime: number;
}>();

const playerHealthSignal = gameStore.useSignal('players', 'player_001', 'health');
const playerLevelSignal = gameStore.useSignal('players', 'player_001', 'level');
const gameTimeSignal = gameStore.useSignal('gameTime');

// 在 Solid.js 组件中使用
const health = playerHealthSignal();
const level = playerLevelSignal();
const time = gameTimeSignal();

// 更新游戏状态
gameStore.setValue('players', 'player_001', 'health', 75);
gameStore.setValue('players', 'player_001', 'level', 6);
gameStore.setValue('gameTime', Date.now());

// 注意：在 Solid.js 中使用时，监听器会在组件销毁时自动清理
```

### 批量状态更新
```typescript
import { mergePatches, DataPatch } from 'reactive-data-patch';

// 收集游戏中的多个状态变更
const gamePatches: DataPatch[] = [
    { path: ['players', 'player_001', 'health'], value: 75 },
    { path: ['players', 'player_001', 'experience'], value: 1250 },
    { path: ['players', 'player_002', 'health'], value: 50 },
    { path: ['gameTime'], value: Date.now() },
    { path: ['score'], value: 1500 }
];

// 合并所有补丁
const mergedState = mergePatches(gamePatches);

// 直接应用合并后的状态
gameState.setValue([], mergedState);
```

### 网络同步中的批量更新
```typescript
// 收集一段时间内的所有状态变更
class BatchNetworkSync {
    private pendingPatches: DataPatch[] = [];
    private batchInterval: number = 100; // 100ms 批量发送
    
    constructor(private gameState: ReactiveData) {
        this.setupBatchTimer();
    }
    
    private setupBatchTimer() {
        setInterval(() => {
            if (this.pendingPatches.length > 0) {
                this.sendBatchUpdate();
            }
        }, this.batchInterval);
    }
    
    // 添加补丁到待发送队列
    addPatch(patch: DataPatch) {
        this.pendingPatches.push(patch);
    }
    
    // 发送批量更新
    private sendBatchUpdate() {
        const mergedState = mergePatches(this.pendingPatches);
        
        // 发送合并后的状态
        network.send(JSON.stringify({
            type: 'batchUpdate',
            data: mergedState,
            timestamp: Date.now()
        }));
        
        // 清空待发送队列
        this.pendingPatches = [];
    }
}

// 使用批量同步
const batchSync = new BatchNetworkSync(gameState);

// 监听状态变化并添加到批量队列
gameState.addChangeListener(['players', 'player_001', 'health'], (health) => {
    batchSync.addPatch({
        path: ['players', 'player_001', 'health'],
        value: health === undefined ? null : health
    });
});
```

## 与其他响应式库的对比

| 特性 | 这个库 | Vue 3 Reactive | MobX | Zustand |
|------|--------|----------------|------|---------|
| **数组支持** | ❌ 不支持 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **游戏对象管理** | ✅ 专为设计 | ⚠️ 通用 | ⚠️ 通用 | ⚠️ 通用 |
| **网络同步友好** | ✅ 低频同步优秀 | ❌ 困难 | ⚠️ 中等 | ⚠️ 中等 |
| **包大小** | 轻量级 | 较重 | 中等 | 轻量级 |

## 适用场景

### ✅ 特别适合：
- **游戏状态管理** - 玩家、敌人、道具等对象状态
- **配置管理** - 游戏设置、关卡配置等
- **游戏 UI 状态** - 与 Solid.js 配合使用
- **低频状态同步** - 生命值、分数、装备等不频繁变化的数据
- **回合制游戏** - 状态变化相对缓慢的游戏类型
- **批量状态更新** - 使用 `reactive-data-patch` 进行批量操作
- **网络同步优化** - 减少网络传输频率，提高性能

### ❌ 不适合：
- **需要数组操作的场景**
- **通用业务应用**
- **需要复杂状态管理功能**
- **高频实时同步** - 60fps 位置更新等场景

## 实时同步性能考虑

### 当前实现的限制

这个库的网络同步示例使用 JSON 序列化，对于高频实时数据可能存在性能问题：

```typescript
// ❌ 当前实现 - 每次都要序列化完整路径
{
    "type": "setValue",
    "path": ["players", "player_001", "health"],
    "value": 75,
    "timestamp": 1234567890
}
// 大小：约 80 字节

// ✅ 优化方案 - 使用数字ID和二进制协议
{
    "objId": 1,        // 玩家ID
    "fieldId": 2,      // 生命值字段ID  
    "value": 75,
    "timestamp": 1234567890
}
// 大小：约 20 字节
```

### 实际使用建议

- **低频状态**：生命值、分数、装备等 - 直接使用当前库
- **中频状态**：技能冷却、buff状态等 - 使用批量更新
- **高频状态**：位置、旋转等 - 使用专门的二进制协议实时同步库（如 Colyseus、Socket.IO 等）

## 许可证

MIT