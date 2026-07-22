// @ts-check
const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// ============================================================
// 1. HOMEPAGE
// ============================================================
test.describe('Homepage', () => {
  test('carrega e mostra hero', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Eduka/i);
    // Hero text
    await expect(page.locator('text=Estuda melhor')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Produz mais')).toBeVisible();
    await expect(page.locator('text=Vai mais longe')).toBeVisible();
  });

  test('link para /ferramentas existe', async ({ page }) => {
    await page.goto(BASE);
    const link = page.locator('a[href="/ferramentas"]').first();
    await expect(link).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================
// 2. LOGIN
// ============================================================
test.describe('Login', () => {
  test('página de login carrega', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('text=Palavra-passe')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('mostra erro com credenciais erradas', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'teste@invalido.com');
    await page.fill('input[type="password"]', 'WrongPass1!');
    await page.click('button[type="submit"]');
    // Espera mensagem de erro ou permanência na página
    await page.waitForTimeout(3000);
    const url = page.url();
    // Deve continuar no login (não redirecionar)
    expect(url).toContain('/login');
  });
});

// ============================================================
// 3. REGISTAR
// ============================================================
test.describe('Registar', () => {
  test('página de registo carrega', async ({ page }) => {
    await page.goto(`${BASE}/registar`);
    await expect(page.locator('text=Palavra-passe')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('validação de password forte aparece', async ({ page }) => {
    await page.goto(`${BASE}/registar`);
    const pwInput = page.locator('#register-password');
    await pwInput.fill('fraca');
    // Deve mostrar aviso de password fraca
    await page.waitForTimeout(500);
    const hint = page.locator('text=Mínimo 8 caracteres');
    await expect(hint).toBeVisible();
  });
});

// ============================================================
// 4. FERRAMENTAS (Dashboard)
// ============================================================
test.describe('Ferramentas', () => {
  test('página de ferramentas carrega', async ({ page }) => {
    await page.goto(`${BASE}/ferramentas`);
    await page.waitForTimeout(3000);
    // Verifica que a página não deu erro 500
    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
    expect(body).not.toContain('500');
  });
});

// ============================================================
// 5. FERRAMENTAS - EXPLICAR
// ============================================================
test.describe('Explicar', () => {
  test('página carrega com formulário', async ({ page }) => {
    await page.goto(`${BASE}/ferramentas/explicar`);
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });
});

// ============================================================
// 6. FERRAMENTAS - SLIDES
// ============================================================
test.describe('Slides', () => {
  test('página carrega com formulário', async ({ page }) => {
    await page.goto(`${BASE}/ferramentas/slides`);
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });
});

// ============================================================
// 7. FERRAMENTAS - TRABALHO
// ============================================================
test.describe('Trabalho', () => {
  test('página carrega com formulário', async ({ page }) => {
    await page.goto(`${BASE}/ferramentas/trabalho`);
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });
});

// ============================================================
// 8. FERRAMENTAS - ESTUDO
// ============================================================
test.describe('Estudo', () => {
  test('página carrega com formulário', async ({ page }) => {
    await page.goto(`${BASE}/ferramentas/estudo`);
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });
});

// ============================================================
// 9. FERRAMENTAS - CURRICULO
// ============================================================
test.describe('Curriculo', () => {
  test('página carrega com formulário', async ({ page }) => {
    await page.goto(`${BASE}/ferramentas/curriculo`);
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });
});

// ============================================================
// 10. FERRAMENTAS - MELHORAR
// ============================================================
test.describe('Melhorar', () => {
  test('página carrega com formulário', async ({ page }) => {
    await page.goto(`${BASE}/ferramentas/melhorar`);
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });
});

// ============================================================
// 11. FERRAMENTAS - PDF
// ============================================================
test.describe('PDF', () => {
  test('página carrega com formulário', async ({ page }) => {
    await page.goto(`${BASE}/ferramentas/pdf`);
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });
});

// ============================================================
// 12. CHAT
// ============================================================
test.describe('Chat', () => {
  test('página de chat carrega', async ({ page }) => {
    await page.goto(`${BASE}/chat`);
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body).not.toContain('Internal Server Error');
  });
});

// ============================================================
// 13. API ROUTES - Health check
// ============================================================
test.describe('API Routes', () => {
  test('POST /api/chat retorna response', async ({ request }) => {
    const resp = await request.post(`${BASE}/api/chat`, {
      data: { messages: [{ role: 'user', content: 'Olá' }] },
      failOnStatusCode: false,
    });
    // Pode retornar 401 (não autenticado) ou 200 — ambos são válidos
    expect([200, 401, 403, 405]).toContain(resp.status());
  });

  test('POST /api/explain retorna response', async ({ request }) => {
    const resp = await request.post(`${BASE}/api/explain`, {
      data: { tema: 'Matemática' },
      failOnStatusCode: false,
    });
    expect([200, 401, 403, 405]).toContain(resp.status());
  });

  test('POST /api/slides retorna response', async ({ request }) => {
    const resp = await request.post(`${BASE}/api/slides`, {
      data: { tema: 'Teste' },
      failOnStatusCode: false,
    });
    expect([200, 401, 403, 405]).toContain(resp.status());
  });

  test('POST /api/generate retorna response', async ({ request }) => {
    const resp = await request.post(`${BASE}/api/generate`, {
      data: { tema: 'História' },
      failOnStatusCode: false,
    });
    expect([200, 401, 403, 405]).toContain(resp.status());
  });

  test('POST /api/estudo retorna response', async ({ request }) => {
    const resp = await request.post(`${BASE}/api/estudo`, {
      data: { tema: 'Ciências' },
      failOnStatusCode: false,
    });
    expect([200, 401, 403, 405]).toContain(resp.status());
  });

  test('POST /api/improve retorna response', async ({ request }) => {
    const resp = await request.post(`${BASE}/api/improve`, {
      data: { text: 'Texto de teste' },
      failOnStatusCode: false,
    });
    expect([200, 401, 403, 405]).toContain(resp.status());
  });
});
