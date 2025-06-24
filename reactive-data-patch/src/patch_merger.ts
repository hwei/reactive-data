import { DataPatch } from './types';

/**
 * 将多个数据补丁合并成一个根节点数据对象
 * @param patches 数据补丁数组
 * @returns 合并后的根节点数据对象
 */
export function mergePatches(patches: DataPatch[]): any {
    if (patches.length === 0) {
        throw new Error('patches is empty');
    }

    // 直接使用嵌套对象来存储合并后的数据
    const result: any = {};

    for (const patch of patches) {
        applyPatch(result, patch.path, patch.value);
    }

    return result;
}

/**
 * 在嵌套对象中应用单个补丁（保留 null 作为删除标记）
 */
function applyPatch(obj: any, path: string[], value: any): void {
    if (path.length === 0) return;
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
            current[key] = {};
        }
        current = current[key];
    }
    const lastKey = path[path.length - 1];
    current[lastKey] = value;
}
