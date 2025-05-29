# 🌱 Sprout

Tiny, zero-dependency HTML templating & rendering experiment.

Sprout lets you describe UI with plain `<template>` tags and drive it
with ordinary JavaScript data – **no compile-step, no virtual-DOM, no frameworks**.
It is designed as a playground to explore just how far you can push
native browser APIs and minimal code while still getting respectable performance.

---

## Table of contents

1. [Demo](#demo)
2. [Installation](#installation)
3. [Quick start](#quick-start)
4. [Template syntax](#template-syntax)
5. [Benchmarks](#benchmarks)
6. [Development](#development)
7. [Running tests](#running-tests)
8. [Contributing](#contributing)
9. [License](#license)

---

## Demo

Open `benchmark.html` in your favourite browser.
Sprout will render **5 000** rows, perform several mutations and print the timings:

```
Dataset size: 5000
Initial render: 48.10 ms
Deep value change: 2.30 ms
Remove last item: 9.40 ms
Add new item: 10.10 ms
No-op update (same JSON): 0.10 ms
Toggle admin flag: 4.80 ms
Re-order (rotate): 6.00 ms
Bulk update 5 %: 11.90 ms
Heap used: 6.50 MB
```

Pass a different amount via a query-param, e.g. `benchmark.html?items=20000`.

---

## Installation

Sprout lives entirely in the browser – there is **nothing to install at runtime**.
All tooling below is only required if you want to hack on Sprout itself.

```sh
# Clone the repo
$ git clone https://github.com/your-user/sprout.git && cd sprout

# Install dev-deps (Jest, etc.)
$ npm install
```

---

## Quick start

Include `src/index.js` as an ES-module and add a `<template is="🌱">` in your markup.
The template will auto-hydrate after `DOMContentLoaded` fires.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Sprout Hello</title>
  <script type="module" src="./src/index.js"></script>
</head>
<body>

<template is="🌱" id="users" data-json='[{"name":"Leia"},{"name":"Luke"}]'>
  <template data-for="{user in _}">
    <p>Hello, {user.name}!  <small data-if="{user.isAdmin}">(admin)</small></p>
  </template>
</template>

</body>
</html>
```

Later, update the data by just mutating/serialising the attribute:

```js
const tpl = document.getElementById('users');
const users = JSON.parse(tpl.getAttribute('data-json'));
users.push({ name: 'Han' });
tpl.setAttribute('data-json', JSON.stringify(users));
```

---

## Template syntax

* **Expressions** – `{foo.bar}` prints `ctx.foo.bar`.  `{_}` refers to the current loop item.
* **Loops** – `<template data-for="{user in _}"> … </template>`
  *Optional*: add `data-key="{user.id}"` for keyed diffing.
* **Conditionals**
  * `data-if="{expr}"` – render if truthy
  * `data-unless="{expr}"` – render if falsy
* **Plain elements & attributes** work as usual; values wrapped in `{}` are evaluated, others are copied verbatim.

---

## Benchmarks

`benchmark.html` drives a series of mutations against a large dataset so you
can profile and compare browsers. Edit the file or its inline script to add
more scenarios.

If you optimise the core, load the page, watch the numbers drop and feel good. 🏎️

---

## Development

Sprout's core is ~250 lines (see `src/index.js`). Entry points:

* **Utility functions** – `dataGet`, `evaluate`, etc.
* **init → render → hydrate** – pipeline from template element to DOM nodes.
* **Keyed diffing** – fast path inside `hydrateForLoop()`.

Hack at will, run tests, open the benchmark.

---

## Running tests

```sh
# Run all Jest suites in watch mode
$ npm test -- --watch
```

Tests live in `tests/`;  they verify initial rendering, mutation handling and
keyed-loop behaviour.

---

## Contributing

Issues and PRs are welcome! Feel free to file a bug, propose an idea or submit
an optimisation. Please accompany behavioural changes with unit tests and, if
possible, benchmark results.

---

## License

MIT © 2024 Sprout contributors