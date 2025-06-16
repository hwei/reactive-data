import { createSignal, onCleanup, Accessor } from "solid-js"
import { ListenableData } from "./listenable_data"


export type PickMutable<T> = {
    [K in keyof T as (<U>() => U extends {
        [V in K]: T[V];
    } ? 1 : 2) extends <U>() => U extends {
        -readonly [V in K]: T[V];
    } ? 1 : 2 ? K : never]: T[K];
};

// 可以在其它文件中扩展 ListenableDataConfig 的 Unwrappable 类型
export declare namespace ListenableDataConfig {
    interface Unwrappable {
    }
}

export type NotWrappable = string | number | bigint | symbol | boolean | Function | null | undefined | ListenableDataConfig.Unwrappable[keyof ListenableDataConfig.Unwrappable];

export type Part<T, K extends KeyOf<T> = KeyOf<T>> = K;
export type W<T> = Exclude<T, NotWrappable>;

export type KeyOf<T> = 0 extends 1 & T
    ? keyof T
    :[T] extends [never]
        ? never
        : [T] extends [readonly unknown[]]
            ? never
            : keyof T;
type MutableKeyOf<T> = KeyOf<T> & keyof PickMutable<T>;

export interface SetValueFunction<T> {
    (value: T): void;
    <K1 extends MutableKeyOf<W<T>>>(k1: Part<W<T>, K1>, value: W<T>[K1]): void;
    <K1 extends KeyOf<W<T>>, K2 extends MutableKeyOf<W<W<T>[K1]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, value: W<W<T>[K1]>[K2]): void;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends MutableKeyOf<W<W<W<T>[K1]>[K2]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, value: W<W<W<T>[K1]>[K2]>[K3]): void;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>, K4 extends MutableKeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>, value: W<W<W<W<T>[K1]>[K2]>[K3]>[K4]): void;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>, K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>, K5 extends MutableKeyOf<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>, k5: Part<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>, K5>, value: W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]): void;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>, K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>, K5 extends KeyOf<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>>, K6 extends MutableKeyOf<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>, k5: Part<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>, K5>, k6: Part<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>, K6>, value: W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>[K6]): void;
}

export interface GetValueFunction<T> {
    (): T;
    <K1 extends KeyOf<W<T>>>(k1: Part<W<T>, K1>): W<T>[K1] | undefined;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>): W<W<T>[K1]>[K2] | undefined;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>): W<W<W<T>[K1]>[K2]>[K3] | undefined;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>, K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>): W<W<W<W<T>[K1]>[K2]>[K3]>[K4] | undefined;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>, K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>, K5 extends KeyOf<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>, k5: Part<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>, K5>): W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5] | undefined;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>, K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>, K5 extends KeyOf<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>>, K6 extends KeyOf<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>, k5: Part<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>, K5>, k6: Part<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>, K6>): W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>[K6] | undefined;
}

export interface UseSignalFunction<T> {
    (): Accessor<T | undefined>;
    <K1 extends KeyOf<W<T>>>(k1: Part<W<T>, K1>): Accessor<W<T>[K1] | undefined>;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>): Accessor<W<W<T>[K1]>[K2] | undefined>;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>): Accessor<W<W<W<T>[K1]>[K2]>[K3] | undefined>;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>, K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>): Accessor<W<W<W<W<T>[K1]>[K2]>[K3]>[K4] | undefined>;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>, K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>, K5 extends KeyOf<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>>, K6 extends KeyOf<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>, k5: Part<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>, K5>, k6: Part<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>, K6>): Accessor<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>[K6] | undefined>;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>, K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>, K5 extends KeyOf<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>>, K6 extends KeyOf<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>>, K7 extends MutableKeyOf<W<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>[K6]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>, k5: Part<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>, K5>, k6: Part<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>, K6>, k7: Part<W<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>[K6]>, K7>): Accessor<W<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>[K6]>[K7] | undefined>;
}

export interface SubFunction<T> {
    <K1 extends KeyOf<W<T>>>(k1: Part<W<T>, K1>): ListanableDataSolid<W<T>[K1]>;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>): ListanableDataSolid<W<W<T>[K1]>[K2]>;
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>): ListanableDataSolid<W<W<W<T>[K1]>[K2]>[K3]>;
}

// 定义返回值类型
export interface ListanableDataSolid<T> {
    setValue: SetValueFunction<T>;
    getValue: GetValueFunction<T>;
    useSignal: UseSignalFunction<T>;
    sub: SubFunction<T>;
}

interface CreateListenableDataFunction {
    <T>(): ListanableDataSolid<T | undefined>;
    <T>(initialValue: T): ListanableDataSolid<T>;
}

export const createListenableData: CreateListenableDataFunction = (initialValue?: any) => {
    const data = new ListenableData();
    data.setValue([], initialValue);

    return createListenableDataInternal(data);
}

function createListenableDataInternal(data: ListenableData, basePath?: string[]) {
    function useSignal(...path: string[]) {
        const fullPath = basePath ? [...basePath, ...path] : path;

        const [getter, setter] = createSignal<any>()

        // 用 setFunc 来避免 value 为 function 时，setter 无法正常工作
        let setValue: any = undefined;
        function setFunc() {
            return setValue
        }
        
        function onValueChange(value: any) {
            setValue = value
            setter(setFunc)
            setValue = undefined
        }

        const initialValue = data.addListener(fullPath, onValueChange)
        onValueChange(initialValue)

        onCleanup(() => {
            data.removeListener(fullPath, onValueChange)
        })

        return getter
    }

    function setValue(...args: any[]) {
        const fullPath = basePath ? [...basePath, ...args.slice(0, -1)] : args.slice(0, -1);
        const value = args[args.length - 1]
        data.setValue(fullPath, value)
    }

    return {
        setValue,
        getValue: (...path: string[]) => data.getValue(basePath ? [...basePath, ...path] : path),
        useSignal,
        sub: (...path: string[]) => createListenableDataInternal(data, basePath ? [...basePath, ...path] : path),
    }
}
