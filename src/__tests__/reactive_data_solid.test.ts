import { describe, it, expect } from 'vitest'
import { createRoot, createEffect } from 'solid-js'
import { createReactiveData } from '../reactive_data_solid'

interface UserData {
    user?: {
        name?: string;
        profile?: {
            age?: number;
            email?: string;
        }
    }
    settings?: {
        theme?: string;
        language?: string;
    }
}

describe('createListenableData', () => {
    it('应该能够创建可监听的数据', () => {
        const { getValue } = createReactiveData<any>()

        // 初始值应该是 undefined
        expect(getValue('test')).toBeUndefined()
    })

    it('应该能够设置和获取值', () => {
        const { getValue, setValue } = createReactiveData<UserData>()

        // 设置值
        setValue('user', 'name', 'Alice')

        // 获取值
        expect(getValue('user', 'name')).toBe('Alice')
    })

    it('应该具有响应性 - 当值改变时应该更新', () => {
        const { useSignal, setValue } = createReactiveData<UserData>()
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

    describe('sub 函数', () => {
        it('应该能够创建子级可监听数据对象', () => {
            const { sub, setValue } = createReactiveData<UserData>()
            
            // 设置初始数据
            setValue('user', 'name', 'Alice')
            setValue('user', 'profile', 'age', 25)
            
            // 创建 user 子对象
            const userSub = sub('user')
            
            // 子对象应该能够获取到父对象的值
            expect(userSub.getValue('name')).toBe('Alice')
            expect(userSub.getValue('profile', 'age')).toBe(25)
        })

        it('子对象应该能够独立设置和获取值', () => {
            const { sub, getValue } = createReactiveData<UserData>()
            
            // 创建 user 子对象
            const userSub = sub('user')
            
            // 通过子对象设置值
            userSub.setValue('name', 'Bob')
            userSub.setValue('profile', 'email', 'bob@example.com')
            
            // 子对象应该能够获取到设置的值
            expect(userSub.getValue('name')).toBe('Bob')
            expect(userSub.getValue('profile', 'email')).toBe('bob@example.com')
            
            // 父对象也应该能够获取到这些值
            expect(getValue('user', 'name')).toBe('Bob')
            expect(getValue('user', 'profile', 'email')).toBe('bob@example.com')
        })

        it('子对象应该具有响应性', () => {
            const { sub, setValue } = createReactiveData<UserData>()
            
            const userSub = sub('user')
            setValue('user', 'name', 'Alice')
            
            let lastName = undefined as any;
            const dispose = createRoot(dispose => {
                const nameSignal = userSub.useSignal('name')
                createEffect(() => {
                    lastName = nameSignal()
                })
                return dispose
            })

            expect(lastName).toBe('Alice')

            // 通过父对象改变值
            setValue('user', 'name', 'Bob')
            expect(lastName).toBe('Bob')

            // 通过子对象改变值
            userSub.setValue('name', 'Charlie')
            expect(lastName).toBe('Charlie')

            dispose()
        })

        it('应该支持多层嵌套的子对象', () => {
            const { sub, setValue, getValue } = createReactiveData<UserData>()
            
            // 设置初始数据
            setValue('user', 'profile', 'age', 25)
            setValue('user', 'profile', 'email', 'alice@example.com')
            
            // 创建 user 子对象
            const userSub = sub('user')
            // 创建 profile 子对象
            const profileSub = userSub.sub('profile')
            
            // profile 子对象应该能够获取到值
            expect(profileSub.getValue('age')).toBe(25)
            expect(profileSub.getValue('email')).toBe('alice@example.com')
            
            // 通过 profile 子对象设置值
            profileSub.setValue('age', 30)
            profileSub.setValue('email', 'alice30@example.com')
            
            // 验证所有层级都能获取到更新后的值
            expect(profileSub.getValue('age')).toBe(30)
            expect(userSub.getValue('profile', 'age')).toBe(30)
            expect(getValue('user', 'profile', 'age')).toBe(30)
        })

        it('子对象的响应性应该与父对象同步', () => {
            const { sub, setValue } = createReactiveData<UserData>()
            
            const userSub = sub('user')
            const profileSub = userSub.sub('profile')
            
            setValue('user', 'profile', 'age', 25)
            
            let lastAge = undefined as any;
            const dispose = createRoot(dispose => {
                const ageSignal = profileSub.useSignal('age')
                createEffect(() => {
                    lastAge = ageSignal()
                })
                return dispose
            })

            expect(lastAge).toBe(25)

            // 通过不同层级改变值，都应该触发响应
            setValue('user', 'profile', 'age', 30)
            expect(lastAge).toBe(30)

            userSub.setValue('profile', 'age', 35)
            expect(lastAge).toBe(35)

            profileSub.setValue('age', 40)
            expect(lastAge).toBe(40)

            dispose()
        })

        it('子对象应该能够处理不存在的路径', () => {
            const { sub } = createReactiveData<UserData>()
            
            const userSub = sub('user')
            const profileSub = userSub.sub('profile')
            
            // 获取不存在的值应该返回 undefined
            expect(userSub.getValue('nonexistent' as any)).toBeUndefined()
            expect(profileSub.getValue('nonexistent' as any)).toBeUndefined()
            
            // 设置不存在的路径应该正常工作
            userSub.setValue('newField' as any, 'newValue')
            expect(userSub.getValue('newField' as any)).toBe('newValue')
        })

        it('子对象应该能够处理复杂的数据结构', () => {
            const { sub, setValue } = createReactiveData<UserData>()
            
            // 设置复杂数据结构
            setValue('user', 'profile', 'age', 25)
            setValue('settings', 'theme', 'dark')
            setValue('settings', 'language', 'zh-CN')
            
            const userSub = sub('user')
            const settingsSub = sub('settings')
            
            // 验证子对象能够正确访问各自的数据
            expect(userSub.getValue('profile', 'age')).toBe(25)
            expect(settingsSub.getValue('theme')).toBe('dark')
            expect(settingsSub.getValue('language')).toBe('zh-CN')
            
            // 验证子对象之间的数据隔离
            expect(userSub.getValue('theme' as any)).toBeUndefined()
            expect(settingsSub.getValue('profile' as any)).toBeUndefined()
        })
    })

})
