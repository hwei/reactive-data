/**
 * 数据补丁类型定义
 */

export interface DataPatch {
  /** 数据路径 */
  path: string[];
  /** 数据值，null 表示删除 */
  value: any;
} 