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
    <K1 extends KeyOf<W<T>>>(k1: Part<W<T>, K1>): W<T>[K1];
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>): W<W<T>[K1]>[K2];
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>): W<W<W<T>[K1]>[K2]>[K3];
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>, K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>): W<W<W<W<T>[K1]>[K2]>[K3]>[K4];
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>, K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>, K5 extends KeyOf<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>, k5: Part<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>, K5>): W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5];
    <K1 extends KeyOf<W<T>>, K2 extends KeyOf<W<W<T>[K1]>>, K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>, K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>, K5 extends KeyOf<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>>, K6 extends KeyOf<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>>>(k1: Part<W<T>, K1>, k2: Part<W<W<T>[K1]>, K2>, k3: Part<W<W<W<T>[K1]>[K2]>, K3>, k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>, k5: Part<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>, K5>, k6: Part<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>, K6>): W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>[K6];
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

// 定义返回值类型
interface CreateListenableDataReturn<T> {
  setValue: SetValueFunction<T>;
  getValue: GetValueFunction<T>;
  useSignal: UseSignalFunction<T>;
}

interface CreateListenableDataFunction {
    <T>(): CreateListenableDataReturn<T | undefined>;
    <T>(initialValue: T): CreateListenableDataReturn<T>;
}

export const createListenableData: CreateListenableDataFunction = (initialValue?: any) => {
    const data = new ListenableData();
    data.setValue([], initialValue);

    function useSignal(...path: string[]) {
        const [getter, setter] = createSignal<any>()
        
        function handler(value: any) {
            setter(value)
            data.addListener(path, handler)
        }

        const initialValue = data.addListener(path, handler)
        setter(initialValue)

        onCleanup(() => {
            data.removeListener(path, handler)
        })

        return getter
    }

    return {
        setValue(...args: any[]) {
            const path = args.slice(0, -1)
            const value = args[args.length - 1]
            data.setValue(path, value)
        },
        getValue: (...path: string[]) => data.getValue(path),
        useSignal,
    }
}
