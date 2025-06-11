import { describe, it, expect, vi } from 'vitest'
import { createRoot, createEffect } from 'solid-js'
import { createListenableData } from '../listenable_data_solid'

interface UserData {
    user?: {
        name?: string;
    }
}

describe('createListenableData', () => {
    it('应该能够创建可监听的数据', () => {
        const { getValue } = createListenableData<any>()

        // 初始值应该是 undefined
        expect(getValue('test')).toBeUndefined()
    })

    it('应该能够设置和获取值', () => {
        const { getValue, setValue } = createListenableData<UserData>()

        // 设置值
        setValue('user', 'name', 'Alice')

        // 获取值
        expect(getValue('user', 'name')).toBe('Alice')
    })

    it('应该具有响应性 - 当值改变时应该更新', () => {
        const { useSignal, setValue } = createListenableData<UserData>()
        setValue('user', 'name', 'Alice')
        let lastName = undefined as any;
        const dispose = createRoot(dispose => {
            const nameSignal = useSignal('user', 'name')
            createEffect(() => {
                lastName = nameSignal()
            })
            return dispose
        })

        expect(lastName).toBe('Alice')

        setValue('user', 'name', 'Bob')

        expect(lastName).toBe('Bob')

        dispose()

        setValue('user', 'name', 'Charlie')

        expect(lastName).toBe('Bob')
    })

})
