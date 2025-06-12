
export type ChangeListener = (value: any) => void;

const ListenersKey = Symbol('ListenersKey');

interface ListenerNode {
    [key: string]: ListenerNode;
    [ListenersKey]?: Set<ChangeListener>;
}

interface DataNode {
    [key: string]: DataNode | Exclude<any, DataNode | undefined | null>;
}

export class ListenableData {
    private listenerRootParent: ListenerNode = {};
    private dataRootParent: DataNode = {};

    private tmpListenerNodeStack = new Array<ListenerNode>();
    private tmpDataNodeStack = new Array<DataNode>();

    /**
     * 添加监听器。
     * @param path 路径
     * @param handler 处理函数
     * @returns 当前路径的值
     */
    addListener(path: string[], handler: ChangeListener) {
        let listenerNode = this.listenerRootParent;
        let dataNode: DataNode | undefined = this.dataRootParent;
        for (let i = -1; i < path.length; ++i) {
            const key = i < 0 ? 'R' : path[i];
            let c = listenerNode[key];
            if (c === undefined) {
                c = {};
                listenerNode[key] = c;
            }
            listenerNode = c;
            dataNode = dataNode?.[key];
        }
        let listeners = listenerNode[ListenersKey];
        if (listeners === undefined) {
            listeners = new Set();
            listenerNode[ListenersKey] = listeners;
        }
        listeners.add(handler);
        return dataNode;
    }

    removeListener(path: string[], handler: ChangeListener) {
        const tmpListenerNodeStack = this.tmpListenerNodeStack;
        let listenerNode = this.listenerRootParent;
        tmpListenerNodeStack[0] = listenerNode;
        for (let i = -1; i < path.length; ++i) {
            const key = i < 0 ? 'R' : path[i];
            let c = listenerNode[key];
            if (c === undefined) {
                c = {};
                listenerNode[key] = c;
            }
            listenerNode = c;
            tmpListenerNodeStack[i + 2] = listenerNode;
        }
        // tmpListenerNodeStack 的长度为 path.length + 2
        const handlers = listenerNode[ListenersKey];
        if (handlers !== undefined) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                delete listenerNode[ListenersKey];
            }
        }
        // 从下往上遍历 ListenerNode 节点，清理无用节点
        for (let i = path.length + 1; i > 0; --i) {
            const node = tmpListenerNodeStack[i];
            if (!(ListenersKey in node) && isEmpty(node)) {
                const parentNode = tmpListenerNodeStack[i - 1];
                const key = i === 1 ? 'R' : path[i - 2];
                delete parentNode[key];
            }
        }
    }

    getValue(path: string[]): any {
        let node = this.dataRootParent;
        for (let i = -1; i < path.length; ++i) {
            const key = i < 0 ? 'R' : path[i];
            let c = node[key];
            if (c === undefined) {
                return undefined;
            }
            node = c;
        }
        return node;
    }

    setValue(path: string[], value: any) {
        const tmpListenerNodeStack = this.tmpListenerNodeStack;
        const tmpDataNodeStack = this.tmpDataNodeStack;
        let listenerNode : ListenerNode | undefined = this.listenerRootParent;
        let dataNode = this.dataRootParent;
        tmpListenerNodeStack[0] = listenerNode;
        tmpDataNodeStack[0] = dataNode;
        for (let i = -1; i < path.length - 1; ++i) {
            const key = i < 0 ? 'R' : path[i];
            listenerNode = listenerNode?.[key];
            let c = dataNode[key];
            if (c === undefined) {
                c = {};
                dataNode[key] = c;
            }
            dataNode = c;
            tmpListenerNodeStack[i + 2] = listenerNode;
            tmpDataNodeStack[i + 2] = dataNode;
        }
        // tmpListenerNodeStack, tmpDataNodeStack 的长度都为 path.length + 1

        const key = path.length === 0 ? 'R' : path[path.length - 1];
        if (setValueInternal(dataNode, key, value, listenerNode?.[key])) {
            // 从下往上遍历节点，检测是否需要删除，然后触发函数
            for (let i = path.length; i > 0; --i) {
                const listenerNode = tmpListenerNodeStack[i];

                let dataNode: any = tmpDataNodeStack[i];
                if (isEmpty(dataNode)) {
                    const parentNode = tmpDataNodeStack[i - 1];
                    const key = i === 1 ? 'R' : path[i - 2];
                    delete parentNode[key];
                    dataNode = undefined;
                }
                if (listenerNode !== undefined) {
                    invokeHandlers(listenerNode, dataNode);
                }
            }
        }
        tmpListenerNodeStack.length = 0;
        tmpDataNodeStack.length = 0;
    }
}

function setValueInternal(parentDataNode: DataNode, key: string, value: any, listenerNode: ListenerNode | undefined): boolean {
    if (value === null) {
        value = undefined;
    }

    let dirty = false;
    let oldValue = parentDataNode[key];
    const oldIsComplex = isComplexData(oldValue);
    const newIsComplex = isComplexData(value);

    // 旧变成新所有情况表：
    // | 旧\新    | 叶子数据 | 空      | 复杂数据 |
    // | ---      | ---      | ---     | ---     |
    // | 叶子数据 | 当前通知  | 当前通知 | 复杂通知 |
    // | 空      | 当前通知   |         | 复杂通知 |
    // | 复杂数据 | 复杂通知  | 复杂通知 | 复杂通知 |

    if (newIsComplex) {
        // 匹配旧变成新最右边一列的情况
        // 需要递归设置数据，顺便通知整个 listenerNode 子树

        if (!oldIsComplex) {
            // 原本是叶子数据或者空，现在被设置成复杂数据，需要创建一个空对象
            oldValue = {};
            parentDataNode[key] = oldValue;
            dirty = true;
        }

        // 先处理 oldValue 中存在，但是 value 中不存在的 key
        for (const key in oldValue) {
            if (!(key in value)) {
                // 删除旧的 key
                if (setValueInternal(oldValue, key, undefined, listenerNode?.[key])) {
                    dirty = true;
                }
            }
        }

        // 再处理 value 中存在的 key
        for (const key in value) {
            // 这里有可能是添加、更新、删除
            if (setValueInternal(oldValue, key, value[key], listenerNode?.[key])) {
                dirty = true;
            }
        }

    } else if (oldIsComplex) {
        // 匹配旧变成新最下面一行的前两列的情况
        // 直接修改当前节点数据，然后通知整个 listenerNode 子树数据变空
        
        if (value === undefined) {
            delete parentDataNode[key];
        } else {
            parentDataNode[key] = value;
        }
        dirty = true;

        if (listenerNode !== undefined) {
            invokeChildrenEmpty(listenerNode);
        }
    } else {
        // 匹配旧变成新左上角2x2 格子的情况
        if (value === undefined) {
            delete parentDataNode[key];
        } else {
            parentDataNode[key] = value;
        }

        dirty = oldValue !== value;
    }

    // 如果 dirty 为 true，则触发当前节点的监听函数
    if (dirty && listenerNode !== undefined) {
        invokeHandlers(listenerNode, value);
    }

    return dirty;
}

function isComplexData(value: Exclude<any, null>) {
    return typeof value === 'object' && !Array.isArray(value);
}

function isEmpty(obj: object) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

function invokeChildrenEmpty(listenerNode: ListenerNode) {
    for (const key in listenerNode) {
        const childListenerNode = listenerNode[key];
        invokeChildrenEmpty(childListenerNode);
        invokeHandlers(childListenerNode, undefined);
    }
}

function invokeHandlers(listenerNode: ListenerNode, value: any) {
    const listeners = listenerNode[ListenersKey];
    if (listeners === undefined) {
        return;
    }

    for (const handler of listeners) {
        try {
            handler(value);
        } catch (error) {
            if (error instanceof Error) {
                console.error('Handler error:', error.message);
                console.error('Stack trace:', error.stack);
            } else {
                console.error('Unknown error:', error);
            }
        }
    }
}
