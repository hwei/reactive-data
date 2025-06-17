import { describe, it, expect } from 'vitest';
import { mergePatches, DataPatch } from '../index';
import { ReactiveData } from '../../../reactive-data/src/reactive_data';

describe('mergePatches 与 ReactiveData.setValue 等效性测试', () => {
    it('应该验证多个 patch 合并后 setValue 与多次 setValue 效果一致', () => {
        // 准备测试数据
        const patches: DataPatch[] = [
            { path: ['players', 'player1'], value: { name: 'Alice', health: 100 } },
            { path: ['players', 'player2'], value: { name: 'Bob', health: 80 } },
            { path: ['gameTime'], value: Date.now() },
            { path: ['players', 'player1', 'level'], value: 5 },
            { path: ['players', 'player2', 'inventory', 'weapon'], value: 'sword' }
        ];

        // 方法1: 使用 mergePatches 合并后一次性 setValue
        const reactiveData1 = new ReactiveData();
        const mergedData = mergePatches(patches);
        reactiveData1.setValue([], mergedData);

        // 方法2: 逐个 patch 调用 setValue
        const reactiveData2 = new ReactiveData();
        for (const patch of patches) {
            reactiveData2.setValue(patch.path, patch.value);
        }

        // 验证两种方法的结果一致
        expect(reactiveData1.getValue([])).toEqual(reactiveData2.getValue([]));
    });

    it('应该处理包含删除操作的 patch 序列', () => {
        const patches: DataPatch[] = [
            { path: ['players', 'player1'], value: { name: 'Alice', health: 100 } },
            { path: ['players', 'player2'], value: { name: 'Bob', health: 80 } },
            { path: ['players', 'player1'], value: null }, // 删除 player1
            { path: ['players', 'player3'], value: { name: 'Charlie', health: 90 } }
        ];

        // 方法1: 使用 mergePatches 合并后一次性 setValue
        const reactiveData1 = new ReactiveData();
        const mergedData = mergePatches(patches);
        reactiveData1.setValue([], mergedData);

        // 方法2: 逐个 patch 调用 setValue
        const reactiveData2 = new ReactiveData();
        for (const patch of patches) {
            reactiveData2.setValue(patch.path, patch.value);
        }

        // 验证两种方法的结果一致
        expect(reactiveData1.getValue([])).toEqual(reactiveData2.getValue([]));
    });

    it('应该处理相同路径的覆盖操作', () => {
        const patches: DataPatch[] = [
            { path: ['players', 'player1', 'health'], value: 100 },
            { path: ['players', 'player1', 'health'], value: 75 },
            { path: ['players', 'player1', 'level'], value: 5 },
            { path: ['players', 'player1', 'level'], value: 6 }
        ];

        // 方法1: 使用 mergePatches 合并后一次性 setValue
        const reactiveData1 = new ReactiveData();
        const mergedData = mergePatches(patches);
        reactiveData1.setValue([], mergedData);

        // 方法2: 逐个 patch 调用 setValue
        const reactiveData2 = new ReactiveData();
        for (const patch of patches) {
            reactiveData2.setValue(patch.path, patch.value);
        }

        // 验证两种方法的结果一致
        expect(reactiveData1.getValue([])).toEqual(reactiveData2.getValue([]));
    });

    it('应该处理复杂的嵌套结构操作', () => {
        const patches: DataPatch[] = [
            { path: ['game', 'players', 'player1', 'inventory', 'weapon'], value: 'sword' },
            { path: ['game', 'players', 'player1', 'inventory', 'armor'], value: 'leather' },
            { path: ['game', 'players', 'player1', 'inventory', 'weapon'], value: 'axe' },
            { path: ['game', 'players', 'player2', 'inventory', 'weapon'], value: 'bow' },
            { path: ['game', 'players', 'player1', 'inventory', 'potion'], value: null }, // 删除药水
            { path: ['game', 'settings', 'difficulty'], value: 'hard' }
        ];

        // 方法1: 使用 mergePatches 合并后一次性 setValue
        const reactiveData1 = new ReactiveData();
        const mergedData = mergePatches(patches);
        reactiveData1.setValue([], mergedData);

        // 方法2: 逐个 patch 调用 setValue
        const reactiveData2 = new ReactiveData();
        for (const patch of patches) {
            reactiveData2.setValue(patch.path, patch.value);
        }

        // 验证两种方法的结果一致
        expect(reactiveData1.getValue([])).toEqual(reactiveData2.getValue([]));
    });

    it('应该处理空数组的情况', () => {
        const patches: DataPatch[] = [];

        // 方法1: 使用 mergePatches 合并后一次性 setValue
        const reactiveData1 = new ReactiveData();
        const mergedData = mergePatches(patches);
        reactiveData1.setValue([], mergedData);

        // 方法2: 逐个 patch 调用 setValue (不会有任何调用)
        const reactiveData2 = new ReactiveData();
        for (const patch of patches) {
            reactiveData2.setValue(patch.path, patch.value);
        }

        // 验证两种方法的结果一致
        expect(reactiveData1.getValue([])).toEqual(reactiveData2.getValue([]));
    });

    it('应该验证监听器触发的一致性', () => {
        const patches: DataPatch[] = [
            { path: ['players', 'player1'], value: { name: 'Alice', health: 100 } },
            { path: ['players', 'player2'], value: { name: 'Bob', health: 80 } }
        ];

        // 方法1: 使用 mergePatches 合并后一次性 setValue
        const reactiveData1 = new ReactiveData();
        const listener1Calls: any[] = [];
        reactiveData1.addChangeListener(['players'], (value) => {
            listener1Calls.push(value);
        });

        const mergedData = mergePatches(patches);
        reactiveData1.setValue([], mergedData);

        // 方法2: 逐个 patch 调用 setValue
        const reactiveData2 = new ReactiveData();
        const listener2Calls: any[] = [];
        reactiveData2.addChangeListener(['players'], (value) => {
            listener2Calls.push(value);
        });

        for (const patch of patches) {
            reactiveData2.setValue(patch.path, patch.value);
        }

        // 验证最终状态一致
        expect(reactiveData1.getValue([])).toEqual(reactiveData2.getValue([]));
        
        // 注意：监听器触发次数可能不同，因为方法1只触发一次，方法2可能触发多次
        // 但最终状态应该一致
        expect(listener1Calls.length).toBeGreaterThan(0);
        expect(listener2Calls.length).toBeGreaterThan(0);
    });
}); 