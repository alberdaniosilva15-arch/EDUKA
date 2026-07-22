# Design System — Documentação

> CSS variables, temas, padrões visuais.

## Arquivo Principal

`app/globals.css` (~46KB) — todas as variáveis CSS, temas, e estilos globais.

## Temas

### Dark Mode (default)
```css
:root {
  /* Variáveis de cor */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --text-primary: #ffffff;
  --text-secondary: #a0a0b0;
  /* ... mais variáveis */
}
```

### Light Mode
```css
[data-theme='light'] {
  /* Apenas 5 variáveis overrideadas */
  /* INCOMPLETO — dezenas de valores hardcoded não adaptam */
}
```

**Problema**: `[data-theme='light']` só override 5 variáveis. Dezenas de valores `rgba()` hardcoded em todo o globals.css não se adaptam.

## Glassmorphism Premium

O design "liquid glass" usa:
- `backdrop-filter: blur()`
- Bordas semi-transparentes
- Sombras sutis
- Gradientes com opacidade

## Variáveis CSS Importantes

```css
/* Cores */
--bg-primary, --bg-secondary, --bg-tertiary
--text-primary, --text-secondary
--accent-primary, --accent-secondary
--border-color

/* Tipografia */
--font-family-primary
--font-size-xs, --font-size-sm, --font-size-base, --font-size-lg, --font-size-xl

/* Espaçamento */
--space-xs, --space-sm, --space-md, --space-lg, --space-xl

/* Bordas */
--border-radius-sm, --border-radius-md, --border-radius-lg

/* Sombras */
--shadow-sm, --shadow-md, --shadow-lg
```

## Chat Page — Exceção

`app/chat/page.js` usa ~100 cores hardcoded com zero variáveis CSS. É um isolamento de tema.

## CSS Morto Identificado

- `.footer-grid`
- `.footer-brand`
- `.footer-col`
- `.footer-angola`

## Padrões de Componentes

### Botões
```css
.btn-primary { /* ... */ }
.btn-secondary { /* ... */ }
.btn-ghost { /* ... */ }
```

### Cards
```css
.card { /* glassmorphism base */ }
.card-hover { /* efeito hover */ }
```

### Inputs
```css
.input { /* ... */ }
.input-focus { /* ... */ }
```

## Responsividade

 breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Next.js Theme Provider

Usa `next-themes` com `ThemeProvider`:
```jsx
<ThemeProvider attribute="data-theme" defaultTheme="dark">
  {children}
</ThemeProvider>
```

## Animações

GSAP para animações complexas:
- Scroll-triggered animations
- Page transitions
- Micro-interações

Lenis para smooth scroll.

## 3D

Spline para elementos 3D interativos.

## Problemas Conhecidos

1. **Light mode incompleto**: Apenas 5 variáveis overrideadas
2. **Chat page isolada**: ~100 cores hardcoded
3. **CSS morto**: 4 classes não utilizadas
4. **Arquivo grande**: ~46KB em um único arquivo
