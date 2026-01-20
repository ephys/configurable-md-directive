/**
 * @typedef {import('mdast').Root} Root
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import process from 'node:process'
import test from 'node:test'
import {isHidden} from 'is-hidden'
import {remark} from 'remark'
import {remarkDirective} from '@ephys/remark-directive'

test('remarkDirective', async (t) => {
  await t.test('should expose the public api', async () => {
    assert.deepEqual(
      Object.keys(await import('@ephys/remark-directive')).sort(),
      ['remarkDirective'].sort()
    )
  })

  await t.test('should not throw if not passed options', async () => {
    assert.doesNotThrow(() => {
      remark().use(remarkDirective()).freeze()
    })
  })

  await t.test(
    'should support enabling only some directive types',
    async (t) => {
      /**
       * Count directive nodes of each kind.
       *
       * @param {unknown} tree
       */
      function countDirectives(tree) {
        /** @type {{container: number, leaf: number, text: number}} */
        const counts = {container: 0, leaf: 0, text: 0}

        /** @param {unknown} node */
        function visit(node) {
          if (!node || typeof node !== 'object') return

          // @ts-expect-error: runtime guards above.
          const type = node.type

          if (type === 'containerDirective') counts.container++
          if (type === 'leafDirective') counts.leaf++
          if (type === 'textDirective') counts.text++

          // @ts-expect-error: runtime guards above.
          const children = node.children
          if (Array.isArray(children)) {
            for (const child of children) visit(child)
          }
        }

        visit(tree)
        return counts
      }

      /**
       * Collect all mdast text node values.
       *
       * @param {unknown} tree
       */
      function collectTextValues(tree) {
        /** @type {string[]} */
        const values = []

        /** @param {unknown} node */
        function visit(node) {
          if (!node || typeof node !== 'object') return
          // @ts-expect-error: runtime guards above.
          if (node.type === 'text' && typeof node.value === 'string')
            values.push(node.value)

          // @ts-expect-error: runtime guards above.
          const children = node.children
          if (Array.isArray(children)) {
            for (const child of children) visit(child)
          }
        }

        visit(tree)
        return values
      }

      const input = [
        ':::onlyContainer',
        'container',
        ':::',
        '',
        '::onlyLeaf',
        '',
        'Inline :onlyText[txt].'
      ].join('\n')

      await t.test('container-only', () => {
        const processor = remark().use(
          remarkDirective({directiveTypes: ['container']})
        )
        const tree = processor.parse(input)
        const counts = countDirectives(tree)

        assert.deepEqual(counts, {container: 1, leaf: 0, text: 0})

        const textValues = collectTextValues(tree).join('')
        assert.ok(textValues.includes('::onlyLeaf'))
        assert.ok(textValues.includes(':onlyText[txt]'))
      })

      await t.test('leaf-only', () => {
        const processor = remark().use(
          remarkDirective({directiveTypes: ['leaf']})
        )
        const tree = processor.parse(input)
        const counts = countDirectives(tree)

        assert.deepEqual(counts, {container: 0, leaf: 1, text: 0})

        const textValues = collectTextValues(tree).join('')
        assert.ok(textValues.includes(':::onlyContainer'))
        assert.ok(textValues.includes(':onlyText[txt]'))
      })

      await t.test('text-only', () => {
        const processor = remark().use(
          remarkDirective({directiveTypes: ['text']})
        )
        const tree = processor.parse(input)
        const counts = countDirectives(tree)

        assert.deepEqual(counts, {container: 0, leaf: 0, text: 1})

        const textValues = collectTextValues(tree).join('')
        assert.ok(textValues.includes(':::onlyContainer'))
        assert.ok(textValues.includes('::onlyLeaf'))
      })
    }
  )
})

test('fixtures', async (t) => {
  const base = new URL('./fixtures/', import.meta.url)
  const folders = await fs.readdir(base)

  let index = -1

  while (++index < folders.length) {
    const folder = folders[index]

    if (isHidden(folder)) {
      continue
    }

    await t.test(folder, async () => {
      const folderUrl = new URL(`${folder}/`, base)
      const inputUrl = new URL('./input.md', folderUrl)
      const outputUrl = new URL('./output.md', folderUrl)
      const treeUrl = new URL('./tree.json', folderUrl)

      const input = String(await fs.readFile(inputUrl))

      /** @type {Root} */
      let expected
      /** @type {string} */
      let output

      const processor = remark().use(remarkDirective())
      const actual = processor.parse(input)

      try {
        output = String(await fs.readFile(outputUrl))
      } catch {
        output = input
      }

      try {
        if ('UPDATE' in process.env) {
          throw new Error('Updating…')
        }

        expected = JSON.parse(String(await fs.readFile(treeUrl)))
      } catch {
        expected = actual

        // New fixture.
        await fs.writeFile(treeUrl, `${JSON.stringify(actual, undefined, 2)}\n`)
      }

      assert.deepEqual(actual, expected)

      assert.equal(String(await processor.process(input)), String(output))
    })
  }
})
