import antfu from '@antfu/eslint-config'

export default antfu()
  .append({
    ignores: ['./test/fixtures/**', './notes/**'],
  })
