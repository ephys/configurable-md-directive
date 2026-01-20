import {basePreset} from '@ephys/eslint-config-typescript'

export default [
  {
    ignores: ['lib/**', 'coverage/**', 'test/**']
  },
  ...basePreset(`${import.meta.dirname}/tsconfig.json`),
  {
    rules: {
      'no-invalid-this': 'off',
      'func-names': ['error', 'as-needed']
    }
  }
]
