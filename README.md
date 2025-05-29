# 🌱 Sprout

A zero-dependency library for turning JSON into reactive DOM.

## Features

- **Zero Dependencies**: Pure vanilla JavaScript with no external libraries
- **Declarative Syntax**: Use familiar HTML template elements with data attributes
- **Reactive Rendering**: Automatically re-renders when data changes
- **Lightweight**: Small footprint perfect for simple to medium complexity applications
- **Template-First**: Works directly with native HTML `<template>` elements

## Quick Start

### Installation

```bash
npm install @sprout-js/sprout
```

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Sprout App</title>
</head>
<body>
    <!-- Define your template with the 🌱 identifier -->
    <template is="🌱" data-json='{"message": "Hello, World!", "count": 42}'>
        <h1>{message}</h1>
        <p>Count: {count}</p>
    </template>

    <script type="module">
        import '@sprout-js/sprout';
    </script>
</body>
</html>
```

## Core Concepts

### Templates

Sprout uses standard HTML `<template>` elements marked with `is="🌱"`. Data is provided via the `data-json` attribute:

```html
<template is="🌱" data-json='{"users": [...], "title": "User List"}'>
    <!-- template content -->
</template>
```

### Data Binding

Use curly braces `{}` for simple interpolation:

```html
<h1>{title}</h1>
<p class="{cssClass}">{user.name}</p>
<span>{user.age}</span>
```

### Loops

Iterate over arrays using `data-for`:

```html
<template data-for="{user in users}">
    <div class="user-card">
        <h3>{user.name}</h3>
        <p>Age: {user.age}</p>
    </div>
</template>
```

The `_` variable refers to the root data context:

```html
<template is="🌱" data-json='[{"name": "Alice"}, {"name": "Bob"}]'>
    <template data-for="{person in _}">
        <p>{person.name}</p>
    </template>
</template>
```

### Conditionals

Show or hide content based on data conditions:

```html
<!-- Show content if condition is truthy -->
<template data-if="{user.isAdmin}">
    <div class="admin-panel">Admin Controls</div>
</template>

<!-- Show content if condition is falsy -->
<template data-unless="{user.isLoggedIn}">
    <div class="login-prompt">Please log in</div>
</template>
```

## Complete Example

```html
<!DOCTYPE html>
<html>
<body>
    <template is="🌱" data-json='[
        {"name": "John", "age": 30, "isAdmin": true},
        {"name": "Jane", "age": 25, "isAdmin": false}
    ]'>
        <div class="user-list">
            <template data-for="{user in _}">
                <div class="user-card">
                    <template data-if="{user.isAdmin}">
                        <h2>👑 Admin: {user.name}</h2>
                        <p class="admin-age">Age: {user.age}</p>
                    </template>

                    <template data-unless="{user.isAdmin}">
                        <h2>{user.name}</h2>
                        <p class="user-age">Age: {user.age}</p>
                    </template>
                </div>
            </template>
        </div>
    </template>

    <script type="module">
        import '@sprout-js/sprout';
    </script>
</body>
</html>
```

## API Reference

### Template Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `is="🌱"` | Marks a template as a Sprout component | `<template is="🌱">` |
| `data-json` | Provides data context as JSON string | `data-json='{"key": "value"}'` |
| `data-for` | Creates a loop over an iterable | `data-for="{item in items}"` |
| `data-if` | Conditional rendering (truthy) | `data-if="{user.isActive}"` |
| `data-unless` | Conditional rendering (falsy) | `data-unless="{user.isGuest}"` |
| `data-key` | Provides unique keys for loop items | `data-key="{user.id}"` |

### Data Context

- `_` - References the root data object
- Dot notation for nested properties: `{user.profile.name}`
- Array access and object properties work seamlessly

### Reactivity

Sprout automatically watches for changes to the `data-json` attribute and re-renders the template when the data updates. This makes it easy to build dynamic interfaces:

```javascript
// Update the template data
const template = document.querySelector('template[is="🌱"]');
const newData = {users: [...], timestamp: Date.now()};
template.setAttribute('data-json', JSON.stringify(newData));
// Template automatically re-renders!
```

## Browser Support

- Modern browsers with ES6+ support
- Uses native `<template>` elements and MutationObserver
- No IE support (modern web standards only)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test
```

## Philosophy

Sprout embraces the principle that **templates should look like the output they generate**. By leveraging native HTML template elements and minimal JavaScript enhancement, Sprout provides a gentle introduction to reactive templating without the complexity of larger frameworks.

Perfect for:
- Small to medium interactive websites
- Progressive enhancement of existing HTML
- Learning reactive concepts
- Situations where bundle size matters

## License

MIT
