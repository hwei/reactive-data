import { describe, it, expect } from 'vitest'
import { applyPatch } from '../patch'
import { PatchOperation } from '../types'

describe('applyPatch', () => {
  it('should add a property', () => {
    const target = { name: 'John' }
    const patches: PatchOperation[] = [
      { op: 'set', path: ['age'], value: 30 }
    ]
    
    const result = applyPatch(target, patches)
    
    expect(result.success).toBe(true)
    expect(result.result).toEqual({ name: 'John', age: 30 })
  })

  it('should remove a property', () => {
    const target = { name: 'John', age: 30 }
    const patches: PatchOperation[] = [
      { op: 'set', path: ['age'], value: null }
    ]
    
    const result = applyPatch(target, patches)
    
    expect(result.success).toBe(true)
    expect(result.result).toEqual({ name: 'John' })
  })

  it('should replace a property', () => {
    const target = { name: 'John', age: 30 }
    const patches: PatchOperation[] = [
      { op: 'set', path: ['age'], value: 31 }
    ]
    
    const result = applyPatch(target, patches)
    
    expect(result.success).toBe(true)
    expect(result.result).toEqual({ name: 'John', age: 31 })
  })

  it('should test a property', () => {
    const target = { name: 'John', age: 30 }
    const patches: PatchOperation[] = [
      { op: 'test', path: ['age'], value: 30 }
    ]
    
    const result = applyPatch(target, patches)
    
    expect(result.success).toBe(true)
  })

  it('should handle nested objects', () => {
    const target = { user: { name: 'John' } }
    const patches: PatchOperation[] = [
      { op: 'set', path: ['user', 'age'], value: 30 }
    ]
    
    const result = applyPatch(target, patches)
    
    expect(result.success).toBe(true)
    expect(result.result).toEqual({ user: { name: 'John', age: 30 } })
  })

  it('should handle multiple operations', () => {
    const target = { name: 'John', age: 30 }
    const patches: PatchOperation[] = [
      { op: 'set', path: ['age'], value: 31 },
      { op: 'set', path: ['city'], value: 'New York' }
    ]
    
    const result = applyPatch(target, patches)
    
    expect(result.success).toBe(true)
    expect(result.result).toEqual({ name: 'John', age: 31, city: 'New York' })
  })

  it('should handle invalid operations', () => {
    const target = { name: 'John' }
    const patches: PatchOperation[] = [
      { op: 'set', path: ['nonexistent'], value: null }
    ]
    
    const result = applyPatch(target, patches)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Path does not exist')
  })

  it('should handle setting root object', () => {
    const target = { name: 'John' }
    const patches: PatchOperation[] = [
      { op: 'set', path: [], value: { name: 'Jane', age: 25 } }
    ]
    
    const result = applyPatch(target, patches)
    
    expect(result.success).toBe(true)
    expect(result.result).toEqual({ name: 'Jane', age: 25 })
  })

  it('should handle setting null to root', () => {
    const target = { name: 'John' }
    const patches: PatchOperation[] = [
      { op: 'set', path: [], value: null }
    ]
    
    const result = applyPatch(target, patches)
    
    expect(result.success).toBe(true)
    expect(result.result).toBeUndefined()
  })

  it('should handle test operation failure', () => {
    const target = { name: 'John', age: 30 }
    const patches: PatchOperation[] = [
      { op: 'test', path: ['age'], value: 31 }
    ]
    
    const result = applyPatch(target, patches)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Test operation failed')
  })

  it('should handle test operation on non-existent path', () => {
    const target = { name: 'John' }
    const patches: PatchOperation[] = [
      { op: 'test', path: ['age'], value: 30 }
    ]
    
    const result = applyPatch(target, patches)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Test operation failed')
  })

  it('should handle unsupported operation', () => {
    const target = { name: 'John' }
    const patches: any[] = [
      { op: 'add', path: ['age'], value: 30 }
    ]
    
    const result = applyPatch(target, patches)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unsupported operation: add')
  })

  // 数组相关测试
  describe('array handling', () => {
    it('should allow setting arrays and primitive values to root path', () => {
      // 测试数组
      const target1 = { name: 'John' }
      const arrayPatches: PatchOperation[] = [
        { op: 'set', path: [], value: [1, 2, 3] }
      ]
      const arrayResult = applyPatch(target1, arrayPatches)
      expect(arrayResult.success).toBe(true)
      expect(arrayResult.result).toEqual([1, 2, 3])
      
      // 测试字符串
      const target2 = { name: 'John' }
      const stringPatches: PatchOperation[] = [
        { op: 'set', path: [], value: 'string value' }
      ]
      const stringResult = applyPatch(target2, stringPatches)
      expect(stringResult.success).toBe(true)
      expect(stringResult.result).toBe('string value')
      
      // 测试数字
      const target3 = { name: 'John' }
      const numberPatches: PatchOperation[] = [
        { op: 'set', path: [], value: 123 }
      ]
      const numberResult = applyPatch(target3, numberPatches)
      expect(numberResult.success).toBe(true)
      expect(numberResult.result).toBe(123)
      
      // 测试布尔值
      const target4 = { name: 'John' }
      const booleanPatches: PatchOperation[] = [
        { op: 'set', path: [], value: true }
      ]
      const booleanResult = applyPatch(target4, booleanPatches)
      expect(booleanResult.success).toBe(true)
      expect(booleanResult.result).toBe(true)
    })

    it('should allow setting arrays to property paths', () => {
      const target = { name: 'John' }
      const patches: PatchOperation[] = [
        { op: 'set', path: ['items'], value: [1, 2, 3] }
      ]
      
      const result = applyPatch(target, patches)
      
      expect(result.success).toBe(true)
      expect(result.result).toEqual({ name: 'John', items: [1, 2, 3] })
    })

    it('should allow setting empty array to property path', () => {
      const target = { name: 'John' }
      const patches: PatchOperation[] = [
        { op: 'set', path: ['items'], value: [] }
      ]
      
      const result = applyPatch(target, patches)
      
      expect(result.success).toBe(true)
      expect(result.result).toEqual({ name: 'John', items: [] })
    })

    it('should allow setting array to nested property path', () => {
      const target = { user: { name: 'John' } }
      const patches: PatchOperation[] = [
        { op: 'set', path: ['user', 'items'], value: [1, 2, 3] }
      ]
      
      const result = applyPatch(target, patches)
      
      expect(result.success).toBe(true)
      expect(result.result).toEqual({ user: { name: 'John', items: [1, 2, 3] } })
    })

    it('should reject array indexing in all operations', () => {
      // 测试 set 操作
      const target1 = { items: [1, 2, 3] }
      const setPatches: PatchOperation[] = [
        { op: 'set', path: ['items', '0'], value: 10 }
      ]
      const setResult = applyPatch(target1, setPatches)
      expect(setResult.success).toBe(false)
      expect(setResult.error).toBe('Array indexing is not allowed')
      
      // 测试 test 操作
      const target2 = { items: [1, 2, 3] }
      const testPatches: PatchOperation[] = [
        { op: 'test', path: ['items', '0'], value: 1 }
      ]
      const testResult = applyPatch(target2, testPatches)
      expect(testResult.success).toBe(false)
      expect(testResult.error).toBe('Array indexing is not allowed')
      
      // 测试嵌套路径
      const target3 = { user: { items: [1, 2, 3] } }
      const nestedPatches: PatchOperation[] = [
        { op: 'set', path: ['user', 'items', '1'], value: 20 }
      ]
      const nestedResult = applyPatch(target3, nestedPatches)
      expect(nestedResult.success).toBe(false)
      expect(nestedResult.error).toBe('Array indexing is not allowed')
    })

    it('should handle test operation on array values', () => {
      // 测试成功的情况
      const target1 = { items: [1, 2, 3] }
      const successPatches: PatchOperation[] = [
        { op: 'test', path: ['items'], value: [1, 2, 3] }
      ]
      const successResult = applyPatch(target1, successPatches)
      expect(successResult.success).toBe(true)
      
      // 测试失败的情况（顺序不同）
      const target2 = { items: [1, 2, 3] }
      const failPatches: PatchOperation[] = [
        { op: 'test', path: ['items'], value: [1, 3, 2] }
      ]
      const failResult = applyPatch(target2, failPatches)
      expect(failResult.success).toBe(false)
      expect(failResult.error).toBe('Test operation failed')
    })
  })

  // 嵌套对象测试
  describe('nested object handling', () => {
    it('should create nested objects automatically', () => {
      // 测试两层嵌套
      const target1 = { name: 'John' }
      const twoLevelPatches: PatchOperation[] = [
        { op: 'set', path: ['address', 'city'], value: 'New York' }
      ]
      const twoLevelResult = applyPatch(target1, twoLevelPatches)
      expect(twoLevelResult.success).toBe(true)
      expect(twoLevelResult.result).toEqual({
        name: 'John',
        address: { city: 'New York' }
      })
      
      // 测试三层嵌套
      const target2 = { name: 'John' }
      const threeLevelPatches: PatchOperation[] = [
        { op: 'set', path: ['address', 'country', 'name'], value: 'USA' }
      ]
      const threeLevelResult = applyPatch(target2, threeLevelPatches)
      expect(threeLevelResult.success).toBe(true)
      expect(threeLevelResult.result).toEqual({
        name: 'John',
        address: { country: { name: 'USA' } }
      })
    })

    it('should handle nested object operations', () => {
      // 测试删除嵌套属性
      const target1 = { user: { name: 'John', age: 30 } }
      const removePatches: PatchOperation[] = [
        { op: 'set', path: ['user', 'age'], value: null }
      ]
      const removeResult = applyPatch(target1, removePatches)
      expect(removeResult.success).toBe(true)
      expect(removeResult.result).toEqual({ user: { name: 'John' } })
      
      // 测试嵌套属性的 test 操作
      const target2 = { user: { name: 'John', age: 30 } }
      const testPatches: PatchOperation[] = [
        { op: 'test', path: ['user', 'age'], value: 30 }
      ]
      const testResult = applyPatch(target2, testPatches)
      expect(testResult.success).toBe(true)
    })
  })
}) 