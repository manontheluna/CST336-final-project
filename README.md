# CST336 - Final Project

## Requirements

- Node.js 20+

## Development

1. Clone the repository:
```bash
git clone <repo>
```
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```

## Development Notes

### ESLint

This project uses ESLint to enforce code quality and maintain consistent formatting throughout the project.

ESLint is included as a project dependency. Running:

```bash
npm install
```

will install all required linting tools.

To check for linting errors:

```bash
npm run lint
```

To automatically fix linting errors where possible:

```bash
npm run lint:fix
```

Please run `npm run lint` before submitting changes to ensure the project follows the configured ESLint rules.


### EJS Layout Convention

This project uses a custom EJS layout wrapper to avoid duplicating common HTML structure across pages.

The layout handles shared elements such as:

- HTML document structure
- Head metadata
- Navigation
- Footer

Individual page files should only contain the content specific to that page.

Example structure:

```text
views/
│
├── layout.ejs
│
├── partials/
│   ├── header.ejs
│   └── footer.ejs
│
├── index.ejs
├── login.ejs
```

Do **not** copy and paste the header, navigation, or footer into individual pages. These elements are already included through `layout.ejs`.

Example page file:

`index.ejs`

```html
<div class="home-page">
    <h1>
        Welcome
    </h1>

    <p>
        This is the home page.
    </p>
</div>
```


### Rendering Pages

Routes should render the shared layout and pass the page content that should be displayed.

Example:

```javascript
app.get('/', (req, res) => {
    res.render('layout', {
        content: 'index'
    })
})
```

The `content` property tells the layout which page should be loaded inside the wrapper.

Example:

```javascript
app.get('/login', (req, res) => {
    res.render('layout', {
        content: 'login'
    })
})
```

This will render:

```text
layout.ejs
    |
    └── login.ejs
```

The layout remains consistent across the application while individual pages only contain their own content.