
export type ChangeListener = (value: any) => void;

const ChangeListenersKey = Symbol('ChangeListenersKey');

export type NewKeyListener = (key: string, value: any) => ChangeListener | undefined;

const NewKeyListenersKey = Symbol('NewKeyListenersKey');

interface ListenerNode {
    [key: string]: ListenerNode;
    [ChangeListenersKey]?: Set<ChangeListener>;
    [NewKeyListenersKey]?: Set<NewKeyListener>;
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
    addChangeListener(path: string[], handler: ChangeListener) {
        return this.addListener(path, ChangeListenersKey, handler);
    }
    addNewKeyListener(path: string[], handler: NewKeyListener) {
        return this.addListener(path, NewKeyListenersKey, handler);
    }
    private addListener(path: string[], listenerKey: typeof ChangeListenersKey | typeof NewKeyListenersKey, handler: ChangeListener | NewKeyListener): DataNode | undefined {
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

        let listeners = listenerNode[listenerKey];
        if (listeners === undefined) {
            const s = new Set<any>();
            listenerNode[listenerKey] = s;
            listeners = s;
        }
        listeners.add(handler as any);
        return dataNode;
    }

    removeChangeListener(path: string[], handler: ChangeListener) {
        this.removeListener(path, ChangeListenersKey, handler);
    }
    removeNewKeyListener(path: string[], handler: NewKeyListener) {
        this.removeListener(path, NewKeyListenersKey, handler);
    }
    private removeListener(path: string[], listenrKey: typeof ChangeListenersKey | typeof NewKeyListenersKey, handler: ChangeListener | NewKeyListener) {
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
        const handlers = listenerNode[listenrKey];
        if (handlers !== undefined) {
            handlers.delete(handler as any);
            if (handlers.size === 0) {
                delete listenerNode[listenrKey];
            }
        }
        // 从下往上遍历 ListenerNode 节点，清理无用节点
        for (let i = path.length + 1; i > 0; --i) {
            const node = tmpListenerNodeStack[i];
            if (!(ChangeListenersKey in node) && !(NewKeyListenersKey in node) && isEmpty(node)) {
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
        let newDataNodeIndex = 0;
        for (let i = -1; i < path.length - 1; ++i) {
            const key = i < 0 ? 'R' : path[i];
            listenerNode = listenerNode?.[key];
            let c = dataNode[key];
            if (c === undefined) {
                c = {};
                dataNode[key] = c;
                if (newDataNodeIndex === 0) {
                    newDataNodeIndex = i + 2;
                }
            }
            dataNode = c;
            tmpListenerNodeStack[i + 2] = listenerNode;
            tmpDataNodeStack[i + 2] = dataNode;
        }
        // tmpListenerNodeStack, tmpDataNodeStack 的长度都为 path.length + 1

        const key = path.length === 0 ? 'R' : path[path.length - 1];
        if (setValueInternal(dataNode, key, value, listenerNode)) {
            // 从下往上遍历节点，检测是否需要删除，然后触发函数
            for (let i = path.length; i > 0; --i) {
                let dataNode: any = tmpDataNodeStack[i];
                if (isEmpty(dataNode)) {
                    const parentNode = tmpDataNodeStack[i - 1];
                    const key = i === 1 ? 'R' : path[i - 2];
                    delete parentNode[key];
                    dataNode = undefined;
                }

                const listenerNode = tmpListenerNodeStack[i];
                if (listenerNode !== undefined) {
                    invokeChangeListeners(listenerNode, dataNode);
                    // 三个条件的含义：
                    // 1. newDataNodeIndex > 0 表示有新节点
                    // 2. i < path.length 表示不是最后一个节点（setValueInternal 中已经触发过）
                    // 3. i >= newDataNodeIndex 表示是新节点
                    if (newDataNodeIndex > 0 && i < path.length && i >= newDataNodeIndex) {
                        const key = path[i - 1];
                        invokeNewKeyListeners(listenerNode, key, dataNode[key]);
                    }
                }
            }
        }
        tmpListenerNodeStack.length = 0;
        tmpDataNodeStack.length = 0;
    }
}

function setValueInternal(parentDataNode: DataNode, key: string, value: any, parentListenerNode: ListenerNode | undefined): boolean {
    if (value === null) {
        value = undefined;
    }

    const listenerNode = parentListenerNode?.[key];

    let dirty = false;
    const oldValue = parentDataNode[key];
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

        let oldValueNormalized = oldValue;
        if (!oldIsComplex) {
            // 原本是叶子数据或者空，现在被设置成复杂数据，需要创建一个空对象
            oldValueNormalized = {};
            parentDataNode[key] = oldValueNormalized;
            dirty = true;
        }

        // 先处理 oldValueNormalized 中存在，但是 value 中不存在的 key
        for (const key in oldValueNormalized) {
            if (!(key in value)) {
                // 删除旧的 key
                if (setValueInternal(oldValueNormalized, key, undefined, listenerNode)) {
                    dirty = true;
                }
            }
        }

        // 再处理 value 中存在的 key
        for (const key in value) {
            // 这里有可能是添加、更新、删除
            if (setValueInternal(oldValueNormalized, key, value[key], listenerNode)) {
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
    if (dirty) {
        if (listenerNode !== undefined) {
            invokeChangeListeners(listenerNode, value);
        }
        if (oldValue === undefined && value !== undefined && parentListenerNode !== undefined) {
            invokeNewKeyListeners(parentListenerNode, key, value);
        }
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
        invokeChangeListeners(childListenerNode, undefined);
    }
}

function invokeChangeListeners(listenerNode: ListenerNode, value: any) {
    const listeners = listenerNode[ChangeListenersKey];
    if (listeners === undefined) {
        return;
    }

    for (const listener of listeners) {
        try {
            listener(value);
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

function invokeNewKeyListeners(listenerNode: ListenerNode, key: string, value: any) {
    const listeners = listenerNode[NewKeyListenersKey];
    if (listeners === undefined) {
        return;
    }

    let childChangeListenerSet: Set<ChangeListener> | undefined;

    for (const listener of listeners) {
        const changeListener = listener(key, value);
        if (changeListener !== undefined) {
            if (childChangeListenerSet === undefined) {
                let childListenerNode = listenerNode[key];
                if (childListenerNode === undefined) {
                    childListenerNode = {};
                    listenerNode[key] = childListenerNode;
                }
                childChangeListenerSet = childListenerNode[ChangeListenersKey];
                if (childChangeListenerSet === undefined) {
                    childChangeListenerSet = new Set();
                    childListenerNode[ChangeListenersKey] = childChangeListenerSet;
                }
            }
            childChangeListenerSet.add(changeListener);
        }
    }
}
