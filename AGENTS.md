# AGENTS.md

This file contains guidelines for agentic coding agents working in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Linting & Type Checking
- Run `npm run lint` before committing
- There is no test framework configured - add tests if needed for new features

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.x (strict mode enabled)
- **Styling**: Tailwind CSS v4 with @theme inline syntax
- **Linting**: ESLint 9 with next/typescript and next/core-web-vitals configs

## Code Style Guidelines

### Imports
- Use `import type` for type-only imports: `import type { Metadata } from "next"`
- Default imports for components/modules: `import Image from "next/image"`
- Named imports for utilities/types: `import { Geist, Geist_Mono } from "next/font/google"`
- Relative imports for local files: `import "./globals.css"`
- Path aliases: Use `@/*` mapping defined in tsconfig.json

### TypeScript
- Strict mode is enabled - ensure proper type annotations
- Use `Readonly<>` for immutable props: `Readonly<{ children: React.ReactNode }>`
- Always type component props explicitly
- Use Next.js type imports where applicable (e.g., `import type { NextConfig }`)

### Component Structure
- Server components by default (no "use client" directive)
- Use function declarations with export: `export default function Home() { }`
- Named exports for reusable components: `export const Component = () => {}`
- Component names in PascalCase
- Props destructured in function parameters

### Styling
- Utility-first with Tailwind CSS v4
- Use `className` prop for styling
- Support dark mode with `dark:` prefix
- Use CSS variables via `@theme inline` for dynamic values
- Font variables: `--font-geist-sans`, `--font-geist-mono`
- Color variables: `--background`, `--foreground`

### Naming Conventions
- Components: PascalCase (Home, RootLayout)
- Variables: camelCase (geistSans, geistMono)
- Constants: camelCase (nextConfig)
- Files: kebab-case for utilities, PascalCase for components (page.tsx, layout.tsx)

### File Organization
- App Router structure in `app/` directory
- `layout.tsx` - Root layout wrapper
- `page.tsx` - Route pages
- `globals.css` - Global styles and theme variables
- Public assets in `public/` directory

### Next.js Specifics
- Use `metadata` export for SEO meta tags
- Use `next/image` for optimized images with explicit width/height
- Use `next/font/google` for optimized fonts
- App Router uses file-based routing
- Server components are default - add "use client" only when needed

### Error Handling
- No specific patterns observed - follow Next.js error boundaries documentation
- Use TypeScript for compile-time type safety

### Configuration Files
- `next.config.ts` - Next.js configuration (TypeScript)
- `tsconfig.json` - TypeScript configuration with path aliases
- `eslint.config.mjs` - ESLint with Next.js presets
- `postcss.config.mjs` - PostCSS with Tailwind v4 plugin

## When Working on This Codebase

1. Always run `npm run lint` after changes
2. Follow existing patterns from `app/page.tsx` and `app/layout.tsx`
3. Use Tailwind utility classes for all styling
4. Maintain type safety with TypeScript strict mode
5. Keep components as server components unless interactivity is required
6. Use the `@/*` path alias for clean imports
7. Test both light and dark modes when adding UI components
