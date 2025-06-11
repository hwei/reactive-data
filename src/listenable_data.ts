
export type ChangeHandler = (value: any) => void;

interface ListenableDataNode {
    leafValue?: any;
    handlers?: Set<ChangeHandler>;
    children?: Map<string, ListenableDataNode>;
}

export class ListenableData {
    private rootParentNode: ListenableDataNode = {};
    private tmpNodeStack = new Array<ListenableDataNode>();

    /**
     * 添加监听器。
     * 注意：监听器一旦被触发，就会自动被移除。
     * @param path 路径
     * @param handler 处理函数
     * @returns 当前路径的值
     */
    addListener(path: string[], handler: ChangeHandler) {
        let node = this.rootParentNode;
        for (let i = -1; i < path.length; ++i) {
            const key = i < 0 ? 'R' : path[i];
            let children = node.children;
            if (!children) {
                children = new Map();
                node.children = children;
            }
            let c = children.get(key);
            if (c === undefined) {
                c = {};
                children.set(key, c);
            }
            node = c;
        }
        let handlers = node.handlers;
        if (handlers === undefined) {
            handlers = new Set();
            node.handlers = handlers;
        }
        handlers.add(handler);
        return getValueByNode(node);
    }

    removeListener(path: string[], handler: ChangeHandler) {
        const tmpNodeStack = this.tmpNodeStack;
        let node = this.rootParentNode;
        for (let i = -1; i < path.length; ++i) {
            const key = i < 0 ? 'R' : path[i];
            let children = node.children;
            if (!children) {
                children = new Map();
                node.children = children;
            }
            let c = children.get(key);
            if (c === undefined) {
                c = {};
                children.set(key, c);
            }
            node = c;
            tmpNodeStack[i + 1] = node;
        }
        const handlers = node.handlers;
        if (handlers !== undefined) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                delete node.handlers;
            }
        }
        // 从下往上遍历节点，清理无用节点
        for (let i = path.length; i > 0; --i) {
            const node = tmpNodeStack[i];
            if (node.handlers === undefined && node.children === undefined && node.leafValue === undefined) {
                const parentNode = tmpNodeStack[i - 1];
                const key = path[i - 1];
                const parentChildren = parentNode.children!;
                parentChildren.delete(key);
                if (parentChildren.size === 0) {
                    delete parentNode.children;
                }
            }
        }
    }

    getValue(path: string[]): any {
        let node = this.rootParentNode;
        for (let i = -1; i < path.length; ++i) {
            const key = i < 0 ? 'R' : path[i];
            let children = node.children;
            if (!children) {
                return undefined;
            }
            let c = children.get(key);
            if (c === undefined) {
                return undefined;
            }
            node = c;
        }
        return getValueByNode(node);
    }

    setValue(path: string[], value: any) {
        const tmpNodeStack = this.tmpNodeStack;
        let node = this.rootParentNode;
        for (let i = -1; i < path.length - 1; ++i) {
            const key = i < 0 ? 'R' : path[i];
            let children = node.children;
            if (!children) {
                children = new Map();
                node.children = children;
            }
            let c = children.get(key);
            if (c === undefined) {
                c = {};
                children.set(key, c);
            }
            node = c;
            tmpNodeStack[i + 1] = node;
            delete node.leafValue;
        }

        const key = path.length === 0 ? 'R' : path[path.length - 1];
        if (setValueInternal(node, key, value)) {
            // 从下往上遍历节点，触发处理函数，以及清理无用节点
            for (let i = path.length - 1; i >= 0; --i) {
                const node = tmpNodeStack[i];
                const handlers = node.handlers;
                if (handlers !== undefined) {
                    for (const handler of handlers) {
                        const v = getValueByNode(node);
                        handler(v);
                    }
                    delete node.handlers;
                }
                if (i > 0) {
                    if (node.handlers === undefined && node.children === undefined && node.leafValue === undefined) {
                        const parentNode = tmpNodeStack[i - 1];
                        const key = path[i - 1];
                        const parentChildren = parentNode.children!;
                        parentChildren.delete(key);
                        if (parentChildren.size === 0) {
                            delete parentNode.children;
                        }
                    }
                }
            }
            tmpNodeStack.length = 0;
        }
    }
}

function getValueByNode(node: ListenableDataNode): any {
    if (node.leafValue !== undefined) {
        return node.leafValue;
    }
    const children = node.children;
    if (children === undefined) {
        return undefined;
    }
    let result: any = undefined;
    for (const [key, child] of children.entries()) {
        const value = getValueByNode(child);
        if (value !== undefined) {
            if (result === undefined) {
                result = {} as any;
            }
            result[key] = value;
        }
    }
    return result;
}

function removeNode(parentNode: ListenableDataNode, key: string): boolean {
    const parentChildren = parentNode.children;
    if (parentChildren === undefined) {
        return false;
    }
    const node = parentChildren.get(key);
    if (node === undefined) {
        return false;
    }
    let dirty = false;
    const handlers = node.handlers;
    if (handlers !== undefined) {
        for (const handler of handlers) {
            handler(undefined);
        }
        delete node.handlers;
        dirty = true;
    }
    const children = node.children;
    if (children !== undefined) {
        for (const key1 of children.keys()) {
            if (removeNode(node, key1)) {
                dirty = true;
            }
        }
        delete node.children;
    }
    if (node.leafValue !== undefined) {
        node.leafValue = undefined;
        dirty = true;
    }
    parentChildren.delete(key);
    if (parentChildren.size === 0) {
        delete parentNode.children;
    }
    return dirty;
}

function setValueInternal(parentNode: ListenableDataNode, key: string, value: any): boolean {
    if (value === null || value === undefined) {
        // 对于空 value，直接删除节点
        return removeNode(parentNode, key);
    }

    let parentChildren = parentNode.children;
    if (parentChildren === undefined) {
        parentChildren = new Map();
        parentNode.children = parentChildren;
    }
    let node = parentChildren.get(key);
    if (node === undefined) {
        node = {};
        parentChildren.set(key, node);
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
        // 对于非对象和数组，直接设置为叶子节点
        let dirty = false;
        const children = node.children;
        if (children !== undefined) {
            for (const key1 of children.keys()) {
                if (removeNode(node, key1)) {
                    dirty = true;
                }
            }
            node.children = undefined;
        }
        if (node.leafValue !== value) {
            node.leafValue = value;
            dirty = true;
            const handlers = node.handlers;
            if (handlers !== undefined) {
                for (const handler of handlers) {
                    handler(value);
                }
                delete node.handlers;
            }
        }
        return dirty;
    }

    // 对于对象，需要遍历新旧 key，并设置子节点
    let dirty = false;
    if (node.leafValue !== undefined) {
        node.leafValue = undefined;
        dirty = true;
    }

    const newKeys = Object.keys(value);
    let children = node.children;
    if (children !== undefined) {
        for (const key of children.keys()) {
            {
                // 如果 key 在 newKeys 中，则将 key 删除。使用交换法删除。
                const i = newKeys.indexOf(key);
                if (i >= 0) {
                    const lastKey = newKeys.pop();
                    if (lastKey !== undefined && newKeys.length > 0) {
                        newKeys[i] = lastKey;
                    }
                }
            } 
            const v = value[key];
            if (setValueInternal(node, key, v)) {
                dirty = true;
            }
        }
    }
    if (newKeys.length > 0) {
        if (children === undefined) {
            children = new Map();
            node.children = children;
        }
        // 新的 key 需要设置子节点
        for (const key of newKeys) {
            const v = value[key];
            if (setValueInternal(node, key, v)) {
                dirty = true;
            }
        }
    }

    if (dirty) {
        const handlers = node.handlers;
        if (handlers !== undefined) {
            for (const handler of handlers) {
                handler(value);
            }
            delete node.handlers;
        }
    }

    return dirty;
}
