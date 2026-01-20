# micromark-extension-directive

[micromark][] extensions to support [directives][prop] (`:cite[smith04]` and
such).

## Contents

* [What is this?](#what-is-this)
* [When to use this](#when-to-use-this)
* [Install](#install)
* [Use](#use)
* [Syntax](#syntax)
* [Related](#related)

## What is this?

This package contains two extensions that add support for directive syntax in
markdown to [`micromark`][micromark]:

* Container directives (blocks with content):

  ```markdown
  :::spoiler
  He dies.
  :::
  ```
* Leaf directives (blocks without content):

  ```markdown
  ::youtube[Video of a cat in a box]{vid=01ab2cd3
  ```
* Text directives (inlines):

  ```markdown
  He got cited:cite[smith04]
  ```

## When to use this

This project is useful when you want to solve the need for an infinite number
of potential extensions to markdown in a single markdown-esque way.

You can use these extensions when you are working with [`micromark`][micromark]
already.

When you need a syntax tree,
you can combine this package with
[`mdast-util-directive`][mdast-util-directive].

All these packages are used [`remark-directive`][remark-directive],
which focuses on making it easier to transform content by abstracting these
internals away.

## Install

This package is [ESM only][esm].

[npm][]:

```sh
npm install micromark-extension-directive
```

All available exports:

```js
import {
  directiveContainer,
  directiveLeaf,
  directiveText,
  directiveContainerHtml,
  directiveLeafHtml,
  directiveTextHtml
} from '@ephys/micromark-extension-directive'
```

## Use

Say our document `example.md` contains:

```markdown
A lovely language know as :abbr[HTML]{title="HyperText Markup Language"}.
```

…and our module `example.js` looks as follows:

```js
/**
 * @import {Handle} from '@ephys/micromark-extension-directive'
 * @import {CompileContext} from 'micromark-util-types'
 */

import fs from 'node:fs/promises'
import {micromark} from 'micromark'
import {
  directiveText,
  directiveTextHtml
} from '@ephys/micromark-extension-directive'

const output = micromark(await fs.readFile('example.md'), {
  extensions: [directiveText()],
  htmlExtensions: [directiveTextHtml({abbr})]
})

console.log(output)

/**
 * @this {CompileContext}
 * @type {Handle}
 * @returns {false | undefined}
 */
function abbr(d) {
  if (d.type !== 'textDirective') return false

  this.tag('<abbr')

  if (d.attributes && 'title' in d.attributes) {
    this.tag(' title="' + this.encode(d.attributes.title) + '"')
  }

  this.tag('>')
  this.raw(d.label || '')
  this.tag('</abbr>')
}
```

To support all directive types, combine the extensions:

```js
import {micromark} from 'micromark'
import {
  directiveContainer,
  directiveLeaf,
  directiveText,
  directiveContainerHtml,
  directiveLeafHtml,
  directiveTextHtml
} from '@ephys/micromark-extension-directive'

const output = micromark(document, {
  extensions: [directiveText(), directiveLeaf(), directiveContainer()],
  htmlExtensions: [
    directiveTextHtml({abbr}),
    directiveLeafHtml({}),
    directiveContainerHtml({})
  ]
})
```

…now running `node example.js` yields:

```html
<p>A lovely language know as <abbr title="HyperText Markup Language">HTML</abbr>.</p>
```

## Syntax

The syntax looks like this:

```markdown
Directives in text can form with a single colon,
such as :cite[smith04].
Their syntax is `:name[label]{attributes}`.

Leafs (block without content) can form by using two colons:

::youtube[Video of a cat in a box]{vid=01ab2cd3efg}

Their syntax is `::name[label]{attributes}` on its own line.

Containers (blocks with content) can form by using three colons:

:::spoiler
He dies.
:::

The `name` part is required.
The characters can be alphanumerical, `-`, and `_`.
`-` or `_` cannot end a name.

The `[label]` part is optional (`:x` and `:x[]` are equivalent)†.
When used,
it can include text constructs such as emphasis and so on: `x[a *b* c]`.

The `{attributes}` part is optional (`:x` and `:x{}` are equivalent)†.
When used,
it is handled like HTML attributes, such as that `{a}`, `{a=""}`, and `{a=''}`
but also `{a=b}`, `{a="b"}`, and `{a='b'}` are equivalent.
Shortcuts are available for `id=` (`{#readme}` for `{id=readme}`) and
`class` (`{.big}` for `{class=big}`).
When multiple ids are found,
the last is used; when multiple classes are found,
they are combined:
`{.red class=green .blue}` is equivalent to
`{.red .green .blue}` and `{class="red green blue"}`.

† there is one case where a name must be followed by an empty label or empty
attributes:
a *text* directive that only has a name,
cannot be followed by a colon.
So,
`:red:` doesn’t work.
Use either `:red[]` or `:red{}` instead.
The reason for this is to allow GitHub emoji (gemoji) and directives to coexist.

Containers can be nested by using more colons outside:

::::spoiler
He dies.

:::spoiler
She is born.
:::
::::

The closing fence must include the same or more colons as the opening.
If no closing is found,
the container runs to the end of its parent container
(block quote, list item, document, or other container).

::::spoiler
These three are not enough to close
:::
So this line is also part of the container.
```

Note that while other implementations are sometimes loose in what they allow,
this implementation mimics CommonMark as closely as possible:

* whitespace is not allowed between colons and name (~~`: a`~~),
  name and label (~~`:a []`~~),
  name and attributes (~~`:a {}`~~),
  or label and attributes (~~`:a[] {}`~~)
  — because it’s not allowed in links either
  (~~`[] ()`~~)
* no trailing colons allowed on the opening fence of a container
  (~~`:::a:::`~~)
  — because it’s not allowed in fenced code either
* the label and attributes in a leaf or container cannot include line endings
  (~~`::a[b\nc]`~~)
  — because it’s not allowed in fenced code either

## Related

* [`@ephys/remark-directive`][remark-directive]
  — remark plugin to support directives
* [`mdast-util-directive`][mdast-util-directive]
  — mdast utility to support directives

<!-- Definitions -->

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[mdast-util-directive]: https://github.com/syntax-tree/mdast-util-directive

[micromark]: https://github.com/micromark/micromark

[npm]: https://docs.npmjs.com/cli/install

[prop]: https://talk.commonmark.org/t/generic-directives-plugins-syntax/444

[remark-directive]: https://github.com/ephys/configurable-md-directive/tree/main/packages/remark-directive
