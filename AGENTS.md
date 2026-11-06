# DietAI Project Agent Instructions

## Documentation Policy (Obsidian Vault Integration)
All project documentation, technical guides, sprint blueprints, architectural decision records (ADRs), and research notes MUST be saved as Markdown files inside:
`docs/obsidian/`

Each markdown file in that directory must follow Obsidian conventions:
1. YAML frontmatter containing `title`, `date`, `tags`, `author`, and `status`.
2. Wikilinks (`[[document-name]]`) linking to related documents.
3. Updated in `00-Ana-Giris.md` (Map of Content).

## Git Remote Policy
NEVER run `git push` to remote repositories without explicit, direct user authorization. Keep all changes local until the user explicitly requests a push.
