# Conventional Commits

## Format

```
<type>: <short description>
```

## Types

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code restructure (no behavior change) |
| `style:` | Formatting, lint fixes |
| `chore:` | Dependencies, config, tooling |
| `docs:` | Documentation only |
| `test:` | Adding or updating tests |

## Examples

- `feat: add settings profile page`
- `fix: correct redirect loop on login`
- `refactor: extract auth guard logic`
- `chore: upgrade Next.js 15 to 16`
- `test: add wallet balance unit tests`

## Rules

- Keep subject line under 72 characters
- Use imperative mood ("add", not "added" or "adds")
- One logical change per commit
- No scope required (keep it simple)
