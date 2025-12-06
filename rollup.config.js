import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/hello-world/hello-world.js',
      format: 'umd',
      name: 'WebComponentLibrary',
      sourcemap: true
    },
    {
      file: 'dist/hello-world/hello-world.esm.js',
      format: 'es',
      sourcemap: true
    },
    {
      file: 'dist/hello-world/hello-world.min.js',
      format: 'umd',
      name: 'WebComponentLibrary',
      plugins: [terser()],
      sourcemap: true
    }
  ],
  plugins: [
    resolve(),
    typescript({
      declaration: true,
      declarationDir: 'dist',
      rootDir: 'src'
    })
  ]
};
