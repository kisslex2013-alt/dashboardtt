# System Patterns

## Architecture
- **Framework**: React 18+ (Functional Components, Hooks).
- **Build Tool**: Vite (Fast HMR, optimized building).
- **Language**: TypeScript (Strict typing preferred).
- **State Management**: React Context + Providers (migrating to consolidated providers).

## Core Patterns
- **Component Composition**: Use of `children` prop and specialized containers (e.g., `ChartContainer`).
- **Custom Hooks**: Encapsulation of logic (e.g., `useAnimation`, `useModal`).
- **Barrel Files**: `index.ts` exports for clean path imports (e.g., `import { Button } from '@/ui'`).
- **Lazy Loading**: `React.lazy` and `Suspense` for route-based and heavy component splitting.

## Styling
- **CSS Strategy**: Vanilla CSS with CSS Variables (Tokens).
- **Animation**: CSS Transitions + Framer Motion (for complex gestures).
- **Responsive**: Mobile-first media queries defined in global tokens.

## Code Standards
- **Naming**: PascalCase for components, camelCase for functions/vars.
- **File Structure**: Feature-based co-location where possible, or generic `ui/` folder for atoms.
- **Error Handling**: Error Boundaries for UI crash prevention.
