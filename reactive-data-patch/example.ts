import { mergePatches, DataPatch } from './src/index';

// 示例 1: 合并多个不同路径的补丁
console.log('=== 示例 1: 合并多个不同路径的补丁 ===');
const patches1: DataPatch[] = [
  { path: ['players', 'player1'], value: { name: 'Alice', health: 100 } },
  { path: ['players', 'player2'], value: { name: 'Bob', health: 80 } },
  { path: ['gameTime'], value: Date.now() }
];

const result1 = mergePatches(patches1);
console.log('输入补丁:', JSON.stringify(patches1, null, 2));
console.log('合并结果:', JSON.stringify(result1, null, 2));

// 示例 2: 处理相同路径的覆盖
console.log('\n=== 示例 2: 处理相同路径的覆盖 ===');
const patches2: DataPatch[] = [
  { path: ['players', 'player1', 'health'], value: 100 },
  { path: ['players', 'player1', 'health'], value: 75 },
  { path: ['players', 'player1', 'level'], value: 5 }
];

const result2 = mergePatches(patches2);
console.log('输入补丁:', JSON.stringify(patches2, null, 2));
console.log('合并结果:', JSON.stringify(result2, null, 2));

// 示例 3: 处理先设置后删除的情况
console.log('\n=== 示例 3: 处理先设置后删除的情况 ===');
const patches3: DataPatch[] = [
  { path: ['players', 'player1'], value: { name: 'Alice' } },
  { path: ['players', 'player1'], value: null } // 删除
];

const result3 = mergePatches(patches3);
console.log('输入补丁:', JSON.stringify(patches3, null, 2));
console.log('合并结果:', JSON.stringify(result3, null, 2));

// 示例 4: 处理先删除后设置的情况
console.log('\n=== 示例 4: 处理先删除后设置的情况 ===');
const patches4: DataPatch[] = [
  { path: ['players', 'player1'], value: null }, // 删除
  { path: ['players', 'player1'], value: { name: 'Alice' } } // 重新设置
];

const result4 = mergePatches(patches4);
console.log('输入补丁:', JSON.stringify(patches4, null, 2));
console.log('合并结果:', JSON.stringify(result4, null, 2));

// 示例 5: 处理复杂的嵌套路径
console.log('\n=== 示例 5: 处理复杂的嵌套路径 ===');
const patches5: DataPatch[] = [
  { path: ['game', 'players', 'player1', 'inventory', 'weapon'], value: 'sword' },
  { path: ['game', 'players', 'player1', 'inventory', 'armor'], value: 'leather' },
  { path: ['game', 'players', 'player1', 'inventory', 'weapon'], value: 'axe' },
  { path: ['game', 'players', 'player2', 'inventory', 'weapon'], value: 'bow' }
];

const result5 = mergePatches(patches5);
console.log('输入补丁:', JSON.stringify(patches5, null, 2));
console.log('合并结果:', JSON.stringify(result5, null, 2));

// 示例 6: 处理混合的增删操作
console.log('\n=== 示例 6: 处理混合的增删操作 ===');
const patches6: DataPatch[] = [
  { path: ['players', 'player1'], value: { name: 'Alice', health: 100 } },
  { path: ['players', 'player2'], value: { name: 'Bob', health: 80 } },
  { path: ['players', 'player1'], value: null }, // 删除 player1
  { path: ['players', 'player3'], value: { name: 'Charlie', health: 90 } }
];

const result6 = mergePatches(patches6);
console.log('输入补丁:', JSON.stringify(patches6, null, 2));
console.log('合并结果:', JSON.stringify(result6, null, 2)); 