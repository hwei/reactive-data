import { describe, it, expect } from 'vitest';
import { mergePatches } from '../patch_merger';
import { DataPatch } from '../types';

describe('mergePatches', () => {
    it('应该合并多个不同路径的补丁', () => {
        const patches: DataPatch[] = [
            { path: ['players', 'player1'], value: { name: 'Alice', health: 100 } },
            { path: ['players', 'player2'], value: { name: 'Bob', health: 80 } }
        ];

        const result = mergePatches(patches);

        expect(result).toEqual({
            players: {
                player1: { name: 'Alice', health: 100 },
                player2: { name: 'Bob', health: 80 }
            }
        });
    });

    it('应该处理相同路径的覆盖', () => {
        const patches: DataPatch[] = [
            { path: ['players', 'player1', 'health'], value: 100 },
            { path: ['players', 'player1', 'health'], value: 75 }
        ];

        const result = mergePatches(patches);

        expect(result).toEqual({
            players: {
                player1: {
                    health: 75
                }
            }
        });
    });

    it('应该处理先设置后删除的情况', () => {
        const patches: DataPatch[] = [
            { path: ['players', 'player1'], value: { name: 'Alice' } },
            { path: ['players', 'player1'], value: null }
        ];

        const result = mergePatches(patches);

        expect(result).toEqual({
            players: {
                player1: null
            }
        }); // 删除操作应保留为 null
    });

    it('应该处理先删除后设置的情况', () => {
        const patches: DataPatch[] = [
            { path: ['players', 'player1'], value: null },
            { path: ['players', 'player1'], value: { name: 'Alice' } }
        ];

        const result = mergePatches(patches);

        expect(result).toEqual({
            players: {
                player1: { name: 'Alice' }
            }
        });
    });

    it('应该保留对不存在路径的删除操作为 null', () => {
        const patches: DataPatch[] = [
            { path: ['players', 'player1'], value: null } // 删除不存在的路径
        ];

        const result = mergePatches(patches);

        expect(result).toEqual({
            players: {
                player1: null
            }
        }); // 删除操作应保留为 null
    });

    it('应该在传入空数组时抛出错误', () => {
        expect(() => mergePatches([])).toThrow('patches is empty');
    });

    it('应该处理嵌套路径中的删除操作', () => {
        const patches: DataPatch[] = [
            { path: ['game', 'players', 'player1', 'inventory', 'weapon'], value: 'sword' },
            {
                path: ['game', 'players', 'player1'], value: {
                    inventory: {
                        weapon: null,
                        armor: 'leather'
                    }
                }
            },
        ];

        const result = mergePatches(patches);

        expect(result).toEqual({
            game: {
                players: {
                    player1: {
                        inventory: {
                            weapon: null,
                            armor: 'leather'
                        }
                    }
                }
            }
        });
    });
}); 