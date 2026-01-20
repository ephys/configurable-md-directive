# remark-directive

**[remark][github-remark]** plugin to support
the [generic directives proposal][commonmark-directive-proposal]:

* Text directives (`:abbr[HTML]{title="HyperText Markup Language"}`),
* Leaf directives (`::hr{.red}`),
* Container directives (`:::main{#readme} ... :::`).

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
  * [Notes](#notes)
  * [`Options`](#options)
* [Examples](#examples)
  * [Example: YouTube](#example-youtube)
  * [Example: Styled blocks](#example-styled-blocks)
* [Syntax](#syntax)
* [Syntax tree](#syntax-tree)

## What is this?

This package is a [unified][github-unified] ([remark][github-remark])
plugin to add support for directives:
a syntax for arbitrary extensions in Markdown.

## When should I use this?

Directives are one of the four ways to extend Markdown:
an arbitrary extension syntax
(see [Extending markdown][github-micromark-extending-markdown]
in micromark’s docs for the alternatives and more info).
This mechanism works well when you control the content:
who authors it,
what tools handle it,
and where it’s displayed.
When authors can read a guide on how to embed a tweet but are not expected to
know the ins and outs of HTML or JavaScript.
Directives don’t work well if you don’t know who authors content,
what tools handle it,
and where it ends up.
Example use cases are a docs website for a project or product,
or blogging tools and static site generators.

If you *just* want to turn markdown into HTML (with maybe a few extensions such
as this one),
we recommend [`micromark`][github-micromark] with
[`micromark-extension-directive`][github-micromark-extension-directive] instead.
If you don’t use plugins and want to access the syntax tree,
you can use
[`mdast-util-from-markdown`][github-mdast-util-from-markdown] with
[`mdast-util-directive`][github-mdast-util-directive].

## Install

This package is [ESM only][github-gist-esm].
In Node.js (version 16+),
install with [npm][npmjs-install]:

```sh
npm install remark-directive
```

## Use

Say our document `example.md` contains:

```markdown
:::main{#readme}

Lorem:br
ipsum.

::hr{.red}

A :i[lovely] language know as :abbr[HTML]{title="HyperText Markup Language"}.

:::
```

…and our module `example.js` contains:

```js
import {h} from 'hastscript'
import rehypeFormat from 'rehype-format'
import rehypeStringify from 'rehype-stringify'
import {remarkDirective} from '@ephys/remark-directive'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {read} from 'to-vfile'
import {unified} from 'unified'
import {visit} from 'unist-util-visit'

const file = await unified()
  .use(remarkParse)
  .use(remarkDirective())
  .use(myRemarkPlugin)
  .use(remarkRehype)
  .use(rehypeFormat)
  .use(rehypeStringify)
  .process(await read('example.md'))

console.log(String(file))

// This plugin is an example to let users write HTML with directives.
// It’s informative but rather useless.
// See below for others examples.
function myRemarkPlugin() {
  /**
   * @param {Root} tree
   *   Tree.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree) {
    visit(tree, function (node) {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        const data = node.data || (node.data = {})
        const hast = h(node.name, node.attributes || {})

        data.hName = hast.tagName
        data.hProperties = hast.properties
      }
    })
  }
}
```

…then running `node example.js` yields:

```html
<main id="readme">
  <p>Lorem<br>ipsum.</p>
  <hr class="red">
  <p>A <i>lovely</i> language know as <abbr title="HyperText Markup Language">HTML</abbr>.</p>
</main>
```

### Notes

This plugin only parses the directives syntax.
You need to [create your own plugin][unifiedjs-create-remark-plugin]
to handle the resulting nodes in the syntax tree (see *Use* and *Examples*).

### `Options`

You can pass the following options to `remarkDirective`:

* `directiveTypes`
  (Array of `'text' | 'leaf' | 'container'`, default: `['text', 'leaf', 'container']`)
  — types of directives to support

## Examples

### Example: YouTube

This example shows how directives can be used for YouTube embeds.
It’s based on the example in Use above.
If `myRemarkPlugin` was replaced with this function:

```js
/**
 * @import {} from 'mdast-util-directive'
 * @import {} from 'mdast-util-to-hast'
 * @import {Root} from 'mdast'
 * @import {VFile} from 'vfile'
 */

import {visit} from 'unist-util-visit'

// This plugin is an example to turn `::youtube` into iframes.
function myRemarkPlugin() {
  /**
   * @param {Root} tree
   *   Tree.
   * @param {VFile} file
   *   File.
   * @returns {undefined}
   *   Nothing.
   */
  return (tree, file) => {
    visit(tree, function (node) {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        if (node.name !== 'youtube') return

        const data = node.data || (node.data = {})
        const attributes = node.attributes || {}
        const id = attributes.id

        if (node.type === 'textDirective') {
          file.fail(
            'Unexpected `:youtube` text directive, use two colons for a leaf directive',
            node
          )
        }

        if (!id) {
          file.fail('Unexpected missing `id` on `youtube` directive', node)
        }

        data.hName = 'iframe'
        data.hProperties = {
          src: 'https://www.youtube.com/embed/' + id,
          width: 200,
          height: 200,
          frameBorder: 0,
          allow: 'picture-in-picture',
          allowFullScreen: true
        }
      }
    })
  }
}
```

…and `example.md` contains:

```markdown
# Cat videos

::youtube[Video of a cat in a box]{#01ab2cd3efg}
```

…then running `node example.js` yields:

```html
<h1>Cat videos</h1>
<iframe src="https://www.youtube.com/embed/01ab2cd3efg" width="200" height="200" frameborder="0" allow="picture-in-picture" allowfullscreen>Video of a cat in a box</iframe>
```

### Example: Styled blocks

> 👉 **Note**:
> this is sometimes called admonitions, callouts, etc.

This example shows how directives can be used to style blocks.
It’s based on the example in Use above.
If `myRemarkPlugin` was replaced with this function:

```js
/**
 * @import {} from 'mdast-util-directive'
 * @import {} from 'mdast-util-to-hast'
 * @import {Root} from 'mdast'
 */

import {h} from 'hastscript'
import {visit} from 'unist-util-visit'

// This plugin is an example to turn `::note` into divs,
// passing arbitrary attributes.
function myRemarkPlugin() {
  /**
   * @param {Root} tree
   *   Tree.
   * @returns {undefined}
   *   Nothing.
   */
  return (tree) => {
    visit(tree, (node) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        if (node.name !== 'note') return

        const data = node.data || (node.data = {})
        const tagName = node.type === 'textDirective' ? 'span' : 'div'

        data.hName = tagName
        data.hProperties = h(tagName, node.attributes || {}).properties
      }
    })
  }
}
```

…and `example.md` contains:

```markdown
# How to use xxx

You can use xxx.

:::note{.warning}
if you chose xxx, you should also use yyy somewhere…
:::
```

…then running `node example` yields:

```html
<h1>How to use xxx</h1>
<p>You can use xxx.</p>
<div class="warning">
  <p>if you chose xxx, you should also use yyy somewhere…</p>
</div>
```

## Syntax

See [*Syntax* in
`micromark-extension-directive`](../micromark-extension-directive).

## Syntax tree

See [*Syntax tree* in
`mdast-util-directive`](https://github.com/syntax-tree/mdast-util-directive#syntax-tree).

<!-- Definitions -->

[commonmark-directive-proposal]: https://talk.commonmark.org/t/generic-directives-plugins-syntax/444

[github-gist-esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[github-mdast-util-directive]: https://github.com/syntax-tree/mdast-util-directive

[github-mdast-util-from-markdown]: https://github.com/syntax-tree/mdast-util-from-markdown

[github-micromark]: https://github.com/micromark/micromark

[github-micromark-extending-markdown]: https://github.com/micromark/micromark#extending-markdown

[github-micromark-extension-directive]: https://github.com/micromark/micromark-extension-directive

[github-remark]: https://github.com/remarkjs/remark

[github-unified]: https://github.com/unifiedjs/unified

[npmjs-install]: https://docs.npmjs.com/cli/install

[unifiedjs-create-remark-plugin]: https://unifiedjs.com/learn/guide/create-a-remark-plugin/
