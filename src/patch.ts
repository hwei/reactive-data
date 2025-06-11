import { PatchOperation, PatchResult } from './types'

/**
 * 应用 JSON Patch 到对象
 * @param target 目标对象
 * @param patches 补丁操作数组
 * @returns 补丁应用结果
 */
export function applyPatch(target: any, patches: PatchOperation[]): PatchResult {
  try {
    let result = target
    
    for (const patch of patches) {
      result = applySinglePatch(result, patch)
    }
    
    return {
      success: true,
      result
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 应用单个补丁操作
 * @param target 目标对象
 * @param patch 补丁操作
 * @returns 操作结果
 */
function applySinglePatch(target: any, patch: PatchOperation): any {
  const { op, path, value } = patch
  
  switch (op) {
    case 'set':
      return setOperation(target, path, value)
    case 'test':
      return testOperation(target, path, value)
    default:
      throw new Error(`Unsupported operation: ${op}`)
  }
}

/**
 * 设置操作
 * 如果 value 为 null，则删除该属性
 */
function setOperation(target: any, path: string[], value: any) {
  if (path.length === 0) {
    // 根路径设置
    const result = value === null ? undefined : value
    return result
  }

  // 如果 value 不为 null，则自动创建父对象
  const parent = getParent(target, path, value !== null)
  const key = path[path.length - 1]
  
  if (value === null) {
    // 设置 null 等价于删除
    if (!(key in parent)) {
      throw new Error('Path does not exist')
    }
    delete parent[key]
  } else {
    parent[key] = value
  }
  
  return target
}


/**
 * 测试操作
 */
function testOperation(target: any, path: string[], value: any) {
  const currentValue = getValue(target, path)
  if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
    throw new Error('Test operation failed')
  }
  return currentValue
}

/**
 * 获取父对象
 */
function getParent(target: any, pathParts: string[], autoCreate: boolean): any {
  if (pathParts.length === 0) return target

  if (Array.isArray(target)) {
    throw new Error('Array indexing is not allowed')
  }
  
  let current = target
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i]
    
    if (current[part] === undefined) {
      if (autoCreate) {
        current[part] = {}
      } else {
        throw new Error('Path does not exist')
      }
    }
    current = current[part]

    if (Array.isArray(current)) {
      throw new Error('Array indexing is not allowed')
    }
  }
  
  return current
}

/**
 * 获取值
 */
function getValue(target: any, path: string[]): any {
  if (path.length === 0) return target
  
  let current = target
  
  for (const part of path) {
    // 检查是否为数组索引
    if (!isNaN(Number(part)) && Number.isInteger(Number(part))) {
      throw new Error('Array indexing is not allowed')
    }
    
    if (current[part] === undefined) {
      return undefined
    }
    current = current[part]
  }
  
  return current
} 