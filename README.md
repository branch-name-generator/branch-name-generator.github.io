# Git Branch Name Generator

Generate valid Git branch names online based on issue number and task title

👉 Try it now: [branch-name-generator.github.io](https://branch-name-generator.github.io/)

## Features

- Paste the issue number and title from the clipboard (or an issue URL from GitHub, GitLab, Jira, Linear)
- Choose the base branch: `main`, `master` or your own (remembered in the browser)
- Generates the branch name and ready-to-copy commands: update base, create, switch, empty commit, and all of it in one `&&` chain
- Ukrainian and Russian titles are transliterated; optional prefix (`feature/`), separator and length limit
- Recent branches, shareable URL (`?n=1234&t=Fix+bug`), Ctrl+Enter to copy the combined command
- English and Ukrainian interface, light/dark theme
- Google Analytics loads only after you accept it
- Works entirely in your browser

## Development

Plain HTML, CSS and ES modules: no frameworks, no build step. Anything that runs scripts goes through Docker via [just](https://github.com/casey/just):

```sh
just test    # unit tests (node --test)
just check   # syntax + static checks (links, i18n keys, no hard-coded analytics)
just e2e     # browser smoke test (Playwright)
just icons   # regenerate favicons, PWA icons and preview.png from assets/icons/*.svg
just serve   # http://localhost:8080
```

## Inspiration

This project was inspired by [rschneider94's Branch Name Generator](https://rschneider94.github.io/branch_name_generator/)

## License

[MIT](https://github.com/branch-name-generator/branch-name-generator.github.io/blob/main/LICENSE)
