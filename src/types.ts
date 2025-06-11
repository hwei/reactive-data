/**
 * 补丁操作类型
 */
export type PatchOperationType = 'set' | 'test'

/**
 * Patch 操作接口
 */
export interface PatchOperation {
  op: PatchOperationType
  path: string[]
  value: any
}

/**
 * 补丁应用结果
 */
export interface PatchResult {
  success: boolean
  error?: string
  result?: any
}
