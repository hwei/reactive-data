import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReactiveData, ChangeListener } from '../reactive_data';

describe('ReactiveData', () => {
    let reactiveData: ReactiveData;
    let mockHandler: ChangeListener;

    beforeEach(() => {
        reactiveData = new ReactiveData();
        mockHandler = vi.fn();
    });

    describe('基本功能测试', () => {
        it('应该能够设置和获取简单的值', () => {
            reactiveData.setValue(['user', 'name'], 'Alice');
            expect(reactiveData.getValue(['user', 'name'])).toBe('Alice');
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
            reactiveData.setValue(['user'], userData);
            expect(reactiveData.getValue(['user'])).toEqual(userData);
        });

        it('应该能够获取部分路径的值', () => {
            reactiveData.setValue(['user', 'profile', 'name'], 'Alice');
            reactiveData.setValue(['user', 'profile', 'age'], 25);
            
            const userProfile = reactiveData.getValue(['user', 'profile']);
            expect(userProfile).toEqual({
                name: 'Alice',
                age: 25
            });
        });

        it('应该返回 undefined 对于不存在的路径', () => {
            expect(reactiveData.getValue(['nonexistent'])).toBeUndefined();
            expect(reactiveData.getValue(['user', 'nonexistent'])).toBeUndefined();
        });
    });

    describe('监听器测试', () => {
        it('应该能够添加监听器并触发回调', () => {
            reactiveData.addChangeListener(['user', 'name'], mockHandler);
            reactiveData.setValue(['user', 'name'], 'Alice');
            
            expect(mockHandler).toHaveBeenCalledWith('Alice');
            expect(mockHandler).toHaveBeenCalledTimes(1);
        });

        it('应该能够添加多个监听器', () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            
            reactiveData.addChangeListener(['user', 'name'], handler1);
            reactiveData.addChangeListener(['user', 'name'], handler2);
            reactiveData.setValue(['user', 'name'], 'Alice');
            
            expect(handler1).toHaveBeenCalledWith('Alice');
            expect(handler2).toHaveBeenCalledWith('Alice');
        });

        it('应该能够监听父级路径', () => {
            reactiveData.addChangeListener(['user'], mockHandler);
            reactiveData.setValue(['user', 'name'], 'Alice');
            
            expect(mockHandler).toHaveBeenCalledWith({
                name: 'Alice'
            });
        });

        it('应该能够监听根路径', () => {
            reactiveData.addChangeListener([], mockHandler);
            reactiveData.setValue(['user', 'name'], 'Alice');
            
            expect(mockHandler).toHaveBeenCalledWith({
                user: {
                    name: 'Alice'
                }
            });
        });

        it('addChangeListener 应该返回当前值', () => {
            reactiveData.setValue(['user', 'name'], 'Alice');
            const result = reactiveData.addChangeListener(['user', 'name'], mockHandler);
            expect(result).toBe('Alice');
        });

        it('监听器触发后还能再次触发', () => {
            reactiveData.addChangeListener(['user', 'name'], mockHandler);
            reactiveData.setValue(['user', 'name'], 'Alice');
            
            // 第一次触发
            expect(mockHandler).toHaveBeenCalledWith('Alice');
            expect(mockHandler).toHaveBeenCalledTimes(1);
            
            // 再次设置值
            reactiveData.setValue(['user', 'name'], 'Bob');
            expect(mockHandler).toHaveBeenCalledWith('Bob');
            expect(mockHandler).toHaveBeenCalledTimes(2);
        });
    });

    describe('removeChangeListener 接口测试', () => {
        it('应该能够手动移除监听器', () => {
            reactiveData.addChangeListener(['user', 'name'], mockHandler);
            
            // 移除监听器
            reactiveData.removeChangeListener(['user', 'name'], mockHandler);
            
            // 设置值，监听器不应该被触发
            reactiveData.setValue(['user', 'name'], 'Alice');
            expect(mockHandler).not.toHaveBeenCalled();
        });

        it('移除监听器后，其他监听器应该正常工作', () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            
            reactiveData.addChangeListener(['user', 'name'], handler1);
            reactiveData.addChangeListener(['user', 'name'], handler2);
            
            // 移除其中一个监听器
            reactiveData.removeChangeListener(['user', 'name'], handler1);
            
            // 设置值，只有handler2应该被触发
            reactiveData.setValue(['user', 'name'], 'Alice');
            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).toHaveBeenCalledWith('Alice');
        });

        it('移除不存在的监听器应该不会报错', () => {
            const nonExistentHandler = vi.fn();
            
            // 移除不存在的监听器不应该抛出错误
            expect(() => {
                reactiveData.removeChangeListener(['user', 'name'], nonExistentHandler);
            }).not.toThrow();
        });

        it('移除监听器后，再次添加相同监听器应该正常工作', () => {
            reactiveData.addChangeListener(['user', 'name'], mockHandler);
            reactiveData.removeChangeListener(['user', 'name'], mockHandler);
            
            // 再次添加相同的监听器
            reactiveData.addChangeListener(['user', 'name'], mockHandler);
            reactiveData.setValue(['user', 'name'], 'Alice');
            
            expect(mockHandler).toHaveBeenCalledWith('Alice');
            expect(mockHandler).toHaveBeenCalledTimes(1);
        });

        it('移除监听器后，节点清理应该正常工作', () => {
            reactiveData.addChangeListener(['user', 'profile', 'name'], mockHandler);
            reactiveData.removeChangeListener(['user', 'profile', 'name'], mockHandler);
            
            // 设置一个值，然后删除
            reactiveData.setValue(['user', 'profile', 'name'], 'Alice');
            reactiveData.setValue(['user', 'profile', 'name'], null);
            
            // 验证节点已被清理
            expect(reactiveData.getValue(['user', 'profile', 'name'])).toBeUndefined();
            expect(reactiveData.getValue(['user', 'profile'])).toBeUndefined();
        });

        it('移除父级路径的监听器应该正常工作', () => {
            reactiveData.addChangeListener(['user'], mockHandler);
            reactiveData.removeChangeListener(['user'], mockHandler);
            
            // 设置值，监听器不应该被触发
            reactiveData.setValue(['user', 'name'], 'Alice');
            expect(mockHandler).not.toHaveBeenCalled();
        });

        it('移除根路径的监听器应该正常工作', () => {
            reactiveData.addChangeListener([], mockHandler);
            reactiveData.removeChangeListener([], mockHandler);
            
            // 设置值，监听器不应该被触发
            reactiveData.setValue(['user', 'name'], 'Alice');
            expect(mockHandler).not.toHaveBeenCalled();
        });

        it('移除监听器后，仍然能添加监听器', () => {
            reactiveData.addChangeListener(['user', 'name'], mockHandler);
            reactiveData.removeChangeListener(['user', 'name'], mockHandler);
            
            // 重新添加监听器
            reactiveData.addChangeListener(['user', 'name'], mockHandler);
            reactiveData.setValue(['user', 'name'], 'Alice');
            
            // 第一次触发
            expect(mockHandler).toHaveBeenCalledWith('Alice');
            expect(mockHandler).toHaveBeenCalledTimes(1);
        });
    });
}); 