# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: eduka.spec.js >> Homepage >> link para /ferramentas existe
- Location: tests\eduka.spec.js:19:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
Call log:
  - navigating to "http://localhost:3001/", waiting until "load"

```

# Test source

```ts
  1   | // @ts-check
  2   | const { test, expect } = require('@playwright/test');
  3   | 
  4   | const BASE = process.env.BASE_URL || 'http://localhost:3000';
  5   | 
  6   | // ============================================================
  7   | // 1. HOMEPAGE
  8   | // ============================================================
  9   | test.describe('Homepage', () => {
  10  |   test('carrega e mostra hero', async ({ page }) => {
  11  |     await page.goto(BASE);
  12  |     await expect(page).toHaveTitle(/Eduka/i);
  13  |     // Hero text
  14  |     await expect(page.locator('text=Estuda melhor')).toBeVisible({ timeout: 15000 });
  15  |     await expect(page.locator('text=Produz mais')).toBeVisible();
  16  |     await expect(page.locator('text=Vai mais longe')).toBeVisible();
  17  |   });
  18  | 
  19  |   test('link para /ferramentas existe', async ({ page }) => {
> 20  |     await page.goto(BASE);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
  21  |     const link = page.locator('a[href="/ferramentas"]').first();
  22  |     await expect(link).toBeVisible({ timeout: 10000 });
  23  |   });
  24  | });
  25  | 
  26  | // ============================================================
  27  | // 2. LOGIN
  28  | // ============================================================
  29  | test.describe('Login', () => {
  30  |   test('página de login carrega', async ({ page }) => {
  31  |     await page.goto(`${BASE}/login`);
  32  |     await expect(page.locator('text=Palavra-passe')).toBeVisible({ timeout: 10000 });
  33  |     await expect(page.locator('input[type="password"]')).toBeVisible();
  34  |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  35  |   });
  36  | 
  37  |   test('mostra erro com credenciais erradas', async ({ page }) => {
  38  |     await page.goto(`${BASE}/login`);
  39  |     await page.fill('input[type="email"]', 'teste@invalido.com');
  40  |     await page.fill('input[type="password"]', 'WrongPass1!');
  41  |     await page.click('button[type="submit"]');
  42  |     // Espera mensagem de erro ou permanência na página
  43  |     await page.waitForTimeout(3000);
  44  |     const url = page.url();
  45  |     // Deve continuar no login (não redirecionar)
  46  |     expect(url).toContain('/login');
  47  |   });
  48  | });
  49  | 
  50  | // ============================================================
  51  | // 3. REGISTAR
  52  | // ============================================================
  53  | test.describe('Registar', () => {
  54  |   test('página de registo carrega', async ({ page }) => {
  55  |     await page.goto(`${BASE}/registar`);
  56  |     await expect(page.locator('text=Palavra-passe')).toBeVisible({ timeout: 10000 });
  57  |     await expect(page.locator('input[type="password"]')).toBeVisible();
  58  |   });
  59  | 
  60  |   test('validação de password forte aparece', async ({ page }) => {
  61  |     await page.goto(`${BASE}/registar`);
  62  |     const pwInput = page.locator('#register-password');
  63  |     await pwInput.fill('fraca');
  64  |     // Deve mostrar aviso de password fraca
  65  |     await page.waitForTimeout(500);
  66  |     const hint = page.locator('text=Mínimo 8 caracteres');
  67  |     await expect(hint).toBeVisible();
  68  |   });
  69  | });
  70  | 
  71  | // ============================================================
  72  | // 4. FERRAMENTAS (Dashboard)
  73  | // ============================================================
  74  | test.describe('Ferramentas', () => {
  75  |   test('página de ferramentas carrega', async ({ page }) => {
  76  |     await page.goto(`${BASE}/ferramentas`);
  77  |     await page.waitForTimeout(3000);
  78  |     // Verifica que a página não deu erro 500
  79  |     const body = await page.textContent('body');
  80  |     expect(body).not.toContain('Internal Server Error');
  81  |     expect(body).not.toContain('500');
  82  |   });
  83  | });
  84  | 
  85  | // ============================================================
  86  | // 5. FERRAMENTAS - EXPLICAR
  87  | // ============================================================
  88  | test.describe('Explicar', () => {
  89  |   test('página carrega com formulário', async ({ page }) => {
  90  |     await page.goto(`${BASE}/ferramentas/explicar`);
  91  |     await page.waitForTimeout(3000);
  92  |     const body = await page.textContent('body');
  93  |     expect(body).not.toContain('Internal Server Error');
  94  |   });
  95  | });
  96  | 
  97  | // ============================================================
  98  | // 6. FERRAMENTAS - SLIDES
  99  | // ============================================================
  100 | test.describe('Slides', () => {
  101 |   test('página carrega com formulário', async ({ page }) => {
  102 |     await page.goto(`${BASE}/ferramentas/slides`);
  103 |     await page.waitForTimeout(3000);
  104 |     const body = await page.textContent('body');
  105 |     expect(body).not.toContain('Internal Server Error');
  106 |   });
  107 | });
  108 | 
  109 | // ============================================================
  110 | // 7. FERRAMENTAS - TRABALHO
  111 | // ============================================================
  112 | test.describe('Trabalho', () => {
  113 |   test('página carrega com formulário', async ({ page }) => {
  114 |     await page.goto(`${BASE}/ferramentas/trabalho`);
  115 |     await page.waitForTimeout(3000);
  116 |     const body = await page.textContent('body');
  117 |     expect(body).not.toContain('Internal Server Error');
  118 |   });
  119 | });
  120 | 
```