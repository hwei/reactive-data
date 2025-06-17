import { describe, it, expect } from 'vitest'
import { createRoot } from 'solid-js'
import { createReactiveData } from '../reactive_data_solid'

// 定义测试用的类型
interface User {
  name: string;
  age: number;
  email?: string; // 可选字段
  profile?: {     // 可选对象
    bio?: string; // 嵌套可选字段
    settings: {
      theme: 'light' | 'dark';
      notifications?: boolean; // 可选字段
    };
  };
}

interface AppState {
  user: User;
  counter: number;
  items: string[]; // 数组类型，内部不应该被索引
  metadata?: {     // 可选对象
    version?: string;
    author?: string;
  };
}

describe('createListenableData 强类型测试', () => {
  it('应该支持强类型的路径约束', () => {
    const store = createReactiveData<AppState>();
    
    // 设置完整状态
    store.setValue({ 
      user: { 
        name: 'Alice', 
        age: 25, 
        email: 'alice@example.com',
        profile: { 
          bio: 'Software developer',
          settings: { 
            theme: 'light', 
            notifications: true 
          } 
        } 
      }, 
      counter: 0, 
      items: [],
      metadata: {
        version: '1.0.0',
        author: 'Alice'
      }
    });
    
    // 设置各级路径
    store.setValue('user', { name: 'Alice', age: 25 });
    store.setValue('user', 'name', 'Alice');
    store.setValue('user', 'age', 25);
    store.setValue('user', 'email', 'alice@example.com'); // 可选字段
    store.setValue('counter', 0);
    store.setValue('items', ['item1', 'item2']);
    
    // 测试可选对象
    store.setValue('metadata', { version: '1.0.0' }); // 可选对象
    store.setValue('metadata', 'version', '1.0.1'); // 可选字段
    store.setValue('metadata', 'author', 'Bob'); // 可选字段
    
    // 测试可选的嵌套对象
    store.setValue('user', 'profile', { settings: { theme: 'light' } }); // 可选对象
    store.setValue('user', 'profile', 'bio', 'Software developer'); // 嵌套可选字段
    store.setValue('user', 'profile', 'settings', { theme: 'light', notifications: true });
    
    // 验证获取值的类型
    const user = store.getValue('user'); // 类型应该是 User | undefined
    const userName = store.getValue('user', 'name'); // 类型应该是 string | undefined
    const userAge = store.getValue('user', 'age'); // 类型应该是 number | undefined
    store.getValue('user', 'email'); // 类型应该是 string | undefined (可选)
    store.getValue('metadata'); // 类型应该是 metadata 对象 | undefined (可选)
    store.getValue('metadata', 'version'); // 类型应该是 string | undefined (可选)
    
    expect(typeof user).toBe('object');
    expect(typeof userName).toBe('string');
    expect(typeof userAge).toBe('number');
  });

  it('应该支持 useSignal 的强类型（包括可选字段）', () => {
    const store = createReactiveData<AppState>();
    
    createRoot(() => {
      const userSignal = store.useSignal('user'); // 类型应该是 () => User | undefined
      const nameSignal = store.useSignal('user', 'name'); // 类型应该是 () => string | undefined
      const emailSignal = store.useSignal('user', 'email'); // 类型应该是 () => string | undefined (可选)
      const metadataSignal = store.useSignal('metadata'); // 类型应该是 () => metadata | undefined (可选)
      const versionSignal = store.useSignal('metadata', 'version'); // 类型应该是 () => string | undefined (可选)
      
      // 设置初始值
      store.setValue('user', { 
        name: 'Alice', 
        age: 25,
        email: 'alice@example.com',
        profile: { 
          bio: 'Software developer',
          settings: { 
            theme: 'light', 
            notifications: true 
          } 
        } 
      });
      
      store.setValue('metadata', {
        version: '1.0.0',
        author: 'Alice'
      });
      
      // 验证信号返回的值类型
      const user = userSignal();
      const name = nameSignal();
      const email = emailSignal();
      const metadata = metadataSignal();
      const version = versionSignal();
      
      expect(user).toBeDefined();
      expect(typeof name).toBe('string');
      expect(typeof email).toBe('string');
      expect(typeof metadata).toBe('object');
      expect(typeof version).toBe('string');
      expect(name).toBe('Alice');
      expect(email).toBe('alice@example.com');
      expect(version).toBe('1.0.0');
    });
  });

  it('应该正确处理数组类型（不允许深度索引）', () => {
    const store = createReactiveData<AppState>();
    
    // 可以设置整个数组
    store.setValue('items', ['item1', 'item2', 'item3']);
    
    // 获取数组
    const items = store.getValue('items'); // 类型应该是 string[] | undefined
    expect(Array.isArray(items)).toBe(true);
    expect(items).toEqual(['item1', 'item2', 'item3']);
    
    // 注意：TypeScript 应该阻止对数组元素的直接索引，如 ['items', '0']
    // 这在编译时会被类型检查器捕获
  });

  it('应该支持空路径获取整个状态', () => {
    const store = createReactiveData<AppState>();
    
    const initialState: AppState = {
      user: {
        name: 'Alice',
        age: 25,
        email: 'alice@example.com',
        profile: {
          bio: 'Software developer',
          settings: {
            theme: 'light',
            notifications: true
          }
        }
      },
      counter: 0,
      items: ['item1', 'item2'],
      metadata: {
        version: '1.0.0',
        author: 'Alice'
      }
    };
    
    store.setValue(initialState);
    
    const fullState = store.getValue(); // 类型应该是 AppState | undefined
    expect(fullState).toEqual(initialState);
  });

  it('应该正确处理缺少可选字段的情况', () => {
    const store = createReactiveData<AppState>();
    
    // 设置一个不包含可选字段的用户
    store.setValue('user', { 
      name: 'Bob', 
      age: 30 
      // 没有 email 和 profile
    });
    
    const user = store.getValue('user');
    const email = store.getValue('user', 'email');
    
    expect(user).toBeDefined();
    expect(user?.name).toBe('Bob');
    expect(user?.age).toBe(30);
    expect(email).toBeUndefined();
    
    // 不设置 metadata
    const metadata = store.getValue('metadata');
    const version = store.getValue('metadata', 'version');
    
    expect(metadata).toBeUndefined();
    expect(version).toBeUndefined();
  });
}); 