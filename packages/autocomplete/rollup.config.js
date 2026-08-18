import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { obfuscator } from 'rollup-obfuscator';
import { dts } from 'rollup-plugin-dts';
import pkg from "./package.json" with { type: 'json' };


export default [
    {
        watch: false,
        input: 'lib/Index.d.ts',
        output: { file: 'dist/types.d.ts', format: 'es' },
        plugins: [dts()]
    },
    {
        watch: false,
        input: "lib/Index.js",
        output: {
            file: "dist/searchstack-autocomplete.js",
            format: "es"
        },
        plugins: [nodeResolve(), obfuscator()]
    },
    {
        watch: false,
        input: "lib/Index.js",
        output: {
            file: "dist/searchstack-autocomplete." + pkg.version + ".js",
            format: "es"
        },
        plugins: [nodeResolve(), obfuscator()]
    },
    {
        watch: false,
        input: "lib/Index.js",
        output: {
            file: "dist/searchstack-autocomplete.cjs",
            format: "cjs"
        },
        plugins: [nodeResolve(), obfuscator()]
    },
    {
        input: "src/Index.ts",
        output: {
            file: "test/searchstack-autocomplete.mjs",
            format: "es",
            sourcemap: "inline"
        },
        plugins: [nodeResolve(), typescript({ "outDir": null, "declaration": false })]
    }
]
