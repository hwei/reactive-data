import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListenableData, ChangeListener } from '../listenable_data';

describe('ListenableData', () => {
    let listenableData: ListenableData;
    let mockHandler: ChangeListener;

    beforeEach(() => {
        listenableData = new ListenableData();
        mockHandler = vi.fn();
    });

    describe('基本功能测试', () => {
        it('应该能够设置和获取简单的值', () => {
            listenableData.setValue(['user', 'name'], 'Alice');
            expect(listenableData.getValue(['user', 'name'])).toBe('Alice');
        });

        it('应该能够设置和获取嵌套对象', () => {
            const userData = {
                name: 'Alice',
                age: 25,
                address: {
                    city: 'Beijing',
                    country: 'China'
                }
            };
            listenableData.setValue(['user'], userData);
            expect(listenableData.getValue(['user'])).toEqual(userData);
        });

        it('应该能够获取部分路径的值', () => {
            listenableData.setValue(['user', 'profile', 'name'], 'Alice');
            listenableData.setValue(['user', 'profile', 'age'], 25);
            
            const userProfile = listenableData.getValue(['user', 'profile']);
            expect(userProfile).toEqual({
                name: 'Alice',
                age: 25
            });
        });

        it('应该返回 undefined 对于不存在的路径', () => {
            expect(listenableData.getValue(['nonexistent'])).toBeUndefined();
            expect(listenableData.getValue(['user', 'nonexistent'])).toBeUndefined();
        });
    });

    describe('监听器测试', () => {
        it('应该能够添加监听器并触发回调', () => {
            listenableData.addListener(['user', 'name'], mockHandler);
            listenableData.setValue(['user', 'name'], 'Alice');
            
            expect(mockHandler).toHaveBeenCalledWith('Alice');
            expect(mockHandler).toHaveBeenCalledTimes(1);
        });

        it('应该能够添加多个监听器', () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            
            listenableData.addListener(['user', 'name'], handler1);
            listenableData.addListener(['user', 'name'], handler2);
            listenableData.setValue(['user', 'name'], 'Alice');
            
            expect(handler1).toHaveBeenCalledWith('Alice');
            expect(handler2).toHaveBeenCalledWith('Alice');
        });

        it('应该能够监听父级路径', () => {
            listenableData.addListener(['user'], mockHandler);
            listenableData.setValue(['user', 'name'], 'Alice');
            
            expect(mockHandler).toHaveBeenCalledWith({
                name: 'Alice'
            });
        });

        it('应该能够监听根路径', () => {
            listenableData.addListener([], mockHandler);
            listenableData.setValue(['user', 'name'], 'Alice');
            
            expect(mockHandler).toHaveBeenCalledWith({
                user: {
                    name: 'Alice'
                }
            });
        });

        it('addListener 应该返回当前值', () => {
            listenableData.setValue(['user', 'name'], 'Alice');
            const result = listenableData.addListener(['user', 'name'], mockHandler);
            expect(result).toBe('Alice');
        });

        it('监听器触发后还能再次触发', () => {
            listenableData.addListener(['user', 'name'], mockHandler);
            listenableData.setValue(['user', 'name'], 'Alice');
            
            // 第一次触发
            expect(mockHandler).toHaveBeenCalledWith('Alice');
            expect(mockHandler).toHaveBeenCalledTimes(1);
            
            // 再次设置值
            listenableData.setValue(['user', 'name'], 'Bob');
            expect(mockHandler).toHaveBeenCalledWith('Bob');
            expect(mockHandler).toHaveBeenCalledTimes(2);
        });
    });

    describe('removeListener 接口测试', () => {
        it('应该能够手动移除监听器', () => {
            listenableData.addListener(['user', 'name'], mockHandler);
            
            // 移除监听器
            listenableData.removeListener(['user', 'name'], mockHandler);
            
            // 设置值，监听器不应该被触发
            listenableData.setValue(['user', 'name'], 'Alice');
            expect(mockHandler).not.toHaveBeenCalled();
        });

        it('移除监听器后，其他监听器应该正常工作', () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            
            listenableData.addListener(['user', 'name'], handler1);
            listenableData.addListener(['user', 'name'], handler2);
            
            // 移除其中一个监听器
            listenableData.removeListener(['user', 'name'], handler1);
            
            // 设置值，只有handler2应该被触发
            listenableData.setValue(['user', 'name'], 'Alice');
            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).toHaveBeenCalledWith('Alice');
        });

        it('移除不存在的监听器应该不会报错', () => {
            const nonExistentHandler = vi.fn();
            
            // 移除不存在的监听器不应该抛出错误
            expect(() => {
                listenableData.removeListener(['user', 'name'], nonExistentHandler);
            }).not.toThrow();
        });

        it('移除监听器后，再次添加相同监听器应该正常工作', () => {
            listenableData.addListener(['user', 'name'], mockHandler);
            listenableData.removeListener(['user', 'name'], mockHandler);
            
            // 再次添加相同的监听器
            listenableData.addListener(['user', 'name'], mockHandler);
            listenableData.setValue(['user', 'name'], 'Alice');
            
            expect(mockHandler).toHaveBeenCalledWith('Alice');
            expect(mockHandler).toHaveBeenCalledTimes(1);
        });

        it('移除监听器后，节点清理应该正常工作', () => {
            listenableData.addListener(['user', 'profile', 'name'], mockHandler);
            listenableData.removeListener(['user', 'profile', 'name'], mockHandler);
            
            // 设置一个值，然后删除
            listenableData.setValue(['user', 'profile', 'name'], 'Alice');
            listenableData.setValue(['user', 'profile', 'name'], null);
            
            // 验证节点已被清理
            expect(listenableData.getValue(['user', 'profile', 'name'])).toBeUndefined();
            expect(listenableData.getValue(['user', 'profile'])).toBeUndefined();
        });

        it('移除父级路径的监听器应该正常工作', () => {
            listenableData.addListener(['user'], mockHandler);
            listenableData.removeListener(['user'], mockHandler);
            
            // 设置值，监听器不应该被触发
            listenableData.setValue(['user', 'name'], 'Alice');
            expect(mockHandler).not.toHaveBeenCalled();
        });

        it('移除根路径的监听器应该正常工作', () => {
            listenableData.addListener([], mockHandler);
            listenableData.removeListener([], mockHandler);
            
            // 设置值，监听器不应该被触发
            listenableData.setValue(['user', 'name'], 'Alice');
            expect(mockHandler).not.toHaveBeenCalled();
        });

        it('移除监听器后，仍然能添加监听器', () => {
            listenableData.addListener(['user', 'name'], mockHandler);
            listenableData.removeListener(['user', 'name'], mockHandler);
            
            // 重新添加监听器
            listenableData.addListener(['user', 'name'], mockHandler);
            listenableData.setValue(['user', 'name'], 'Alice');
            
            // 第一次触发
            expect(mockHandler).toHaveBeenCalledWith('Alice');
            expect(mockHandler).toHaveBeenCalledTimes(1);
            
            // 再次设置值，监听器应该被触发
            listenableData.setValue(['user', 'name'], 'Bob');
            expect(mockHandler).toHaveBeenCalledWith('Bob');
            expect(mockHandler).toHaveBeenCalledTimes(2);
        });
    });

    describe('值更新测试', () => {
        it('应该能够更新现有值', () => {
            listenableData.setValue(['user', 'name'], 'Alice');
            listenableData.setValue(['user', 'name'], 'Bob');
            
            expect(listenableData.getValue(['user', 'name'])).toBe('Bob');
        });

        it('应该能够更新对象的部分属性', () => {
            listenableData.setValue(['user'], {
                name: 'Alice',
                age: 25
            });
            
            listenableData.setValue(['user', 'age'], 26);
            
            expect(listenableData.getValue(['user'])).toEqual({
                name: 'Alice',
                age: 26
            });
        });

        it('应该能够添加新的属性到现有对象', () => {
            listenableData.setValue(['user'], {
                name: 'Alice'
            });
            
            listenableData.setValue(['user', 'age'], 25);
            
            expect(listenableData.getValue(['user'])).toEqual({
                name: 'Alice',
                age: 25
            });
        });

        it('应该能够将数字转换为对象', () => {
            // 先设置为数字
            listenableData.setValue(['user', 'age'], 25);
            expect(listenableData.getValue(['user', 'age'])).toBe(25);
            
            // 再设置为对象
            const userAge = {
                value: 25,
                unit: 'years',
                category: 'adult'
            };
            listenableData.setValue(['user', 'age'], userAge);
            
            expect(listenableData.getValue(['user', 'age'])).toEqual(userAge);
            expect(listenableData.getValue(['user'])).toEqual({
                age: userAge
            });
        });

        it('应该能够将对象转换为数字', () => {
            // 先设置为对象
            const userAge = {
                value: 25,
                unit: 'years'
            };
            listenableData.setValue(['user', 'age'], userAge);
            expect(listenableData.getValue(['user', 'age'])).toEqual(userAge);
            
            // 再设置为数字
            listenableData.setValue(['user', 'age'], 30);
            
            expect(listenableData.getValue(['user', 'age'])).toBe(30);
            expect(listenableData.getValue(['user'])).toEqual({
                age: 30
            });
        });

        it('应该能够从简单值转换为对象后继续设置子属性', () => {
            // 先设置为简单字符串
            listenableData.setValue(['user', 'name'], 'Alice');
            expect(listenableData.getValue(['user', 'name'])).toBe('Alice');
            
            // 转换为对象结构
            listenableData.setValue(['user', 'name'], {
                first: 'Alice'
            });
            expect(listenableData.getValue(['user', 'name'])).toEqual({
                first: 'Alice'
            });
            
            // 继续设置对象的子属性
            listenableData.setValue(['user', 'name', 'last'], 'Johnson');
            expect(listenableData.getValue(['user', 'name', 'last'])).toBe('Johnson');
            expect(listenableData.getValue(['user', 'name'])).toEqual({
                first: 'Alice',
                last: 'Johnson'
            });
            
            // 再设置一个子属性
            listenableData.setValue(['user', 'name', 'full'], 'Alice Johnson');
            expect(listenableData.getValue(['user', 'name'])).toEqual({
                first: 'Alice',
                last: 'Johnson',
                full: 'Alice Johnson'
            });
        });

        it('应该能够从数字转换为对象后继续设置子属性', () => {
            // 先设置为数字
            listenableData.setValue(['user', 'age'], 25);
            expect(listenableData.getValue(['user', 'age'])).toBe(25);
            
            // 转换为对象结构
            listenableData.setValue(['user', 'age'], {
                value: 25
            });
            expect(listenableData.getValue(['user', 'age'])).toEqual({
                value: 25
            });
            
            // 继续设置对象的子属性
            listenableData.setValue(['user', 'age', 'unit'], 'years');
            expect(listenableData.getValue(['user', 'age', 'unit'])).toBe('years');
            expect(listenableData.getValue(['user', 'age'])).toEqual({
                value: 25,
                unit: 'years'
            });
            
            // 再设置一个子属性
            listenableData.setValue(['user', 'age', 'category'], 'adult');
            expect(listenableData.getValue(['user', 'age'])).toEqual({
                value: 25,
                unit: 'years',
                category: 'adult'
            });
        });

        it('应该能够从对象转换为简单值', () => {
            // 先设置为对象
            const userName = {
                first: 'Alice',
                last: 'Johnson',
                full: 'Alice Johnson'
            };
            listenableData.setValue(['user', 'name'], userName);
            expect(listenableData.getValue(['user', 'name'])).toEqual(userName);
            
            // 转换为简单字符串
            listenableData.setValue(['user', 'name'], 'Alice Johnson');
            
            expect(listenableData.getValue(['user', 'name'])).toBe('Alice Johnson');
            expect(listenableData.getValue(['user'])).toEqual({
                name: 'Alice Johnson'
            });
        });

        it('类型转换时应该正确清理子节点', () => {
            // 先设置为对象，包含子属性
            const userProfile = {
                name: 'Alice',
                age: 25,
                address: {
                    city: 'Beijing',
                    country: 'China'
                }
            };
            listenableData.setValue(['user'], userProfile);
            
            // 验证子属性存在
            expect(listenableData.getValue(['user', 'name'])).toBe('Alice');
            expect(listenableData.getValue(['user', 'address', 'city'])).toBe('Beijing');
            
            // 转换为数字
            listenableData.setValue(['user'], 123);
            
            // 验证原对象的所有子属性都被清理
            expect(listenableData.getValue(['user'])).toBe(123);
            expect(listenableData.getValue(['user', 'name'])).toBeUndefined();
            expect(listenableData.getValue(['user', 'age'])).toBeUndefined();
            expect(listenableData.getValue(['user', 'address'])).toBeUndefined();
            expect(listenableData.getValue(['user', 'address', 'city'])).toBeUndefined();
        });

        it('类型转换时应该正确触发监听器', () => {
            const handler = vi.fn();
            
            // 添加监听器
            listenableData.addListener(['user', 'age'], handler);
            
            // 先设置为数字
            listenableData.setValue(['user', 'age'], 25);
            expect(handler).toHaveBeenCalledWith(25);
            expect(handler).toHaveBeenCalledTimes(1);
            
            // 重新添加监听器（因为第一次触发后自动删除了）
            listenableData.addListener(['user', 'age'], handler);
            
            // 转换为对象
            const userAge = { value: 25, unit: 'years' };
            listenableData.setValue(['user', 'age'], userAge);
            expect(handler).toHaveBeenCalledWith(userAge);
            expect(handler).toHaveBeenCalledTimes(2);
        });
    });

    describe('删除和清理测试', () => {
        it('应该能够删除值', () => {
            listenableData.setValue(['user', 'name'], 'Alice');
            listenableData.setValue(['user', 'name'], null);
            
            expect(listenableData.getValue(['user', 'name'])).toBeUndefined();
        });

        it('删除值时应该触发监听器', () => {
            listenableData.setValue(['user', 'name'], 'Alice');
            listenableData.addListener(['user', 'name'], mockHandler);
            listenableData.setValue(['user', 'name'], null);
            
            expect(mockHandler).toHaveBeenCalledWith(undefined);
        });

        it('删除对象时应该清理所有子节点', () => {
            listenableData.setValue(['user'], {
                name: 'Alice',
                age: 25,
                address: {
                    city: 'Beijing'
                }
            });
            
            listenableData.setValue(['user'], null);
            
            expect(listenableData.getValue(['user'])).toBeUndefined();
            expect(listenableData.getValue(['user', 'name'])).toBeUndefined();
            expect(listenableData.getValue(['user', 'address', 'city'])).toBeUndefined();
        });
    });

    describe('复杂场景测试', () => {
        it('应该能够处理深层嵌套的对象更新', () => {
            listenableData.setValue(['company', 'departments', 'engineering', 'employees'], [
                { name: 'Alice', role: 'Developer' },
                { name: 'Bob', role: 'Manager' }
            ]);
            
            const result = listenableData.getValue(['company', 'departments', 'engineering']);
            expect(result).toEqual({
                employees: [
                    { name: 'Alice', role: 'Developer' },
                    { name: 'Bob', role: 'Manager' }
                ]
            });
        });

        it('应该能够处理数组值', () => {
            const users = ['Alice', 'Bob', 'Charlie'];
            listenableData.setValue(['users'], users);
            
            expect(listenableData.getValue(['users'])).toEqual(users);
        });

        it('应该能够处理数字和布尔值', () => {
            listenableData.setValue(['config', 'enabled'], true);
            listenableData.setValue(['config', 'maxRetries'], 3);
            
            expect(listenableData.getValue(['config', 'enabled'])).toBe(true);
            expect(listenableData.getValue(['config', 'maxRetries'])).toBe(3);
        });

        it('应该能够处理空字符串', () => {
            listenableData.setValue(['user', 'description'], '');
            
            expect(listenableData.getValue(['user', 'description'])).toBe('');
        });
    });

    describe('监听器触发顺序测试', () => {
        it('应该按照正确的顺序触发监听器', () => {
            const callOrder: string[] = [];
            
            const handler1 = () => callOrder.push('handler1');
            const handler2 = () => callOrder.push('handler2');
            const handler3 = () => callOrder.push('handler3');
            
            listenableData.addListener(['user', 'name'], handler1);
            listenableData.addListener(['user'], handler2);
            listenableData.addListener([], handler3);
            
            listenableData.setValue(['user', 'name'], 'Alice');
            
            // 监听器应该按照从具体到通用的顺序触发
            expect(callOrder).toEqual(['handler1', 'handler2', 'handler3']);
        });
    });

    describe('边界情况测试', () => {
        it('应该能够处理空路径', () => {
            listenableData.setValue([], { root: 'value' });
            expect(listenableData.getValue([])).toEqual({ root: 'value' });
        });

        it('应该能够处理空字符串作为路径的一部分', () => {
            listenableData.setValue(['user', ''], 'empty key');
            expect(listenableData.getValue(['user', ''])).toBe('empty key');
        });

        it('应该能够处理 undefined 值', () => {
            listenableData.setValue(['user', 'name'], undefined);
            expect(listenableData.getValue(['user', 'name'])).toBeUndefined();
        });

        it('应该能够处理 null 值', () => {
            listenableData.setValue(['user', 'name'], null);
            expect(listenableData.getValue(['user', 'name'])).toBeUndefined();
        });
    });

    describe('性能相关测试', () => {
        it('应该能够处理大量数据', () => {
            const largeObject: any = {};
            for (let i = 0; i < 1000; i++) {
                largeObject[`key${i}`] = `value${i}`;
            }
            
            listenableData.setValue(['large'], largeObject);
            const result = listenableData.getValue(['large']);
            
            expect(result).toEqual(largeObject);
            expect(Object.keys(result)).toHaveLength(1000);
        });

        it('应该能够处理深层嵌套路径', () => {
            const deepPath = Array.from({ length: 100 }, (_, i) => `level${i}`);
            listenableData.setValue(deepPath, 'deep value');
            
            expect(listenableData.getValue(deepPath)).toBe('deep value');
        });
    });
}); 