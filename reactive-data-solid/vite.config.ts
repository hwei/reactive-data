import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [
    solid({
      ssr: false,
    }),
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ReactiveDataSolid',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['solid-js', 'reactive-data'],
      output: {
        globals: {
          'solid-js': 'SolidJS',
          'reactive-data': 'ReactiveData',
        },
      },
    },
  },
}) 