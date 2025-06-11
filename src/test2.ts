export const key1 = Symbol('key1')

declare module './test1' {
    interface GlobalData {
        [key1]: number;
    }
}
