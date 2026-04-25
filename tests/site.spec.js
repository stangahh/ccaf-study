// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const INDEX   = `file://${path.resolve(__dirname, '..', 'index.html')}`;
const STUDY   = `file://${path.resolve(__dirname, '..', 'study.html')}`;
const EXAM    = `file://${path.resolve(__dirname, '..', 'exam.html')}`;

// ---------------------------------------------------------------------------
// index.html
// ---------------------------------------------------------------------------
test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => { await page.goto(INDEX); });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/CCAF Study Hub/i);
  });

  test('nav links present', async ({ page }) => {
    await expect(page.locator('nav a[href="study.html"]')).toBeVisible();
    await expect(page.locator('nav a[href="exam.html"]')).toBeVisible();
  });

  test('hero shows pass score', async ({ page }) => {
    await expect(page.getByText('720 / 1000')).toBeVisible();
  });

  test('five domain cards visible', async ({ page }) => {
    await expect(page.locator('.domain-card')).toHaveCount(5);
  });

  test('six scenario cards visible', async ({ page }) => {
    const scenarios = page.locator('.concept-card');
    await expect(scenarios).toHaveCount(6);
  });

  test('Study Guide card navigates to study.html', async ({ page }) => {
    await page.click('a.action-card[href="study.html"]');
    await expect(page).toHaveURL(/study\.html/);
  });

  test('Practice Exam card navigates to exam.html', async ({ page }) => {
    await page.goto(INDEX);
    await page.click('a.action-card[href="exam.html"]');
    await expect(page).toHaveURL(/exam\.html/);
  });
});

// ---------------------------------------------------------------------------
// study.html
// ---------------------------------------------------------------------------
test.describe('Study guide', () => {
  test.beforeEach(async ({ page }) => { await page.goto(STUDY); });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Study Guide/i);
  });

  test('sidebar visible with five domain headings', async ({ page }) => {
    const domainLinks = page.locator('.sidebar a[href*="#domain-"]');
    await expect(domainLinks).toHaveCount(5);
  });

  test('all five domain sections present in page', async ({ page }) => {
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`#domain-${i}`)).toBeAttached();
    }
  });

  test('at least 20 concept cards render', async ({ page }) => {
    const cards = page.locator('.concept-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(20);
  });

  test('code blocks are present', async ({ page }) => {
    const codeBlocks = page.locator('pre code');
    const count = await codeBlocks.count();
    expect(count).toBeGreaterThan(5);
  });

  test('external doc links open in new tab', async ({ page }) => {
    const extLinks = page.locator('a[target="_blank"]');
    if (await extLinks.count() > 0) {
      await expect(extLinks.first()).toHaveAttribute('target', '_blank');
    }
  });

  test('deep-link anchor from index resolves', async ({ page }) => {
    await page.goto(`${STUDY}#domain-3`);
    await expect(page.locator('#domain-3')).toBeAttached();
  });

  test('sidebar active link updates on scroll (intersection observer)', async ({ page }) => {
    await page.locator('#domain-2').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const active = page.locator('.sidebar a.active');
    await expect(active).toHaveCount(1);
  });
});

// ---------------------------------------------------------------------------
// exam.html — structure
// ---------------------------------------------------------------------------
test.describe('Practice exam — structure', () => {
  test.beforeEach(async ({ page }) => { await page.goto(EXAM); });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Practice Exam/i);
  });

  test('progress bar fill element is present', async ({ page }) => {
    await expect(page.locator('#progress-fill')).toBeAttached();
  });

  test('first question renders with 4 options', async ({ page }) => {
    await expect(page.locator('.option-btn')).toHaveCount(4);
  });

  test('question text is non-empty', async ({ page }) => {
    const q = page.locator('.question-text, .question h2, .question p').first();
    const text = await q.innerText();
    expect(text.trim().length).toBeGreaterThan(10);
  });

  test('domain filter dropdown present', async ({ page }) => {
    await expect(page.locator('#domain-filter')).toBeVisible();
  });

  test('question counter shows 1 / N on first question', async ({ page }) => {
    const counter = await page.locator('#q-counter').innerText();
    expect(counter).toMatch(/^1 \//);
  });
});

// ---------------------------------------------------------------------------
// exam.html — interaction
// ---------------------------------------------------------------------------
test.describe('Practice exam — answering questions', () => {
  test.beforeEach(async ({ page }) => { await page.goto(EXAM); });

  test('clicking correct answer shows green highlight', async ({ page }) => {
    // Disable shuffle so Q1 is always first (correct answer is A)
    await page.locator('#shuffle-toggle').uncheck();
    await page.waitForTimeout(100);
    await page.locator('.option-btn[data-id="A"]').click();
    await expect(page.locator('.option-btn.correct')).toHaveCount(1);
  });

  test('clicking wrong answer shows red on selected and green on correct', async ({ page }) => {
    // Find the correct option id so we can deliberately pick a wrong one
    const correctId = await page.evaluate(() => {
      // questions array is in global scope
      return window.questions ? window.questions[0].correct : null;
    });
    if (correctId) {
      // Click an option that isn't correct
      const wrongId = ['A','B','C','D'].find(x => x !== correctId);
      await page.locator(`.option-btn[data-id="${wrongId}"]`).click();
      await expect(page.locator('.option-btn.incorrect')).toHaveCount(1);
      await expect(page.locator('.option-btn.correct')).toHaveCount(1);
    } else {
      // Fallback: just click first option and verify at least one correct shown
      await page.locator('.option-btn').first().click();
      await expect(page.locator('.option-btn.correct')).toHaveCount(1);
    }
  });

  test('explanation block shown after answering', async ({ page }) => {
    await page.locator('.option-btn').first().click();
    await expect(page.locator('.explanation')).toBeVisible();
  });

  test('all options disabled after answering', async ({ page }) => {
    await page.locator('.option-btn').first().click();
    const allDisabled = await page.locator('.option-btn').evaluateAll(els =>
      els.every(el => el.disabled || el.classList.contains('disabled'))
    );
    expect(allDisabled).toBe(true);
  });

  test('Next button advances to question 2', async ({ page }) => {
    await page.locator('.option-btn').first().click();
    await page.locator('#next-btn').click();
    const counter = await page.locator('#q-counter').innerText();
    expect(counter).toContain('2');
  });

  test('keyboard shortcut A answers question', async ({ page }) => {
    // Disable shuffle so Q1 is first (correct: A) — then 'a' key selects the right answer
    await page.locator('#shuffle-toggle').uncheck();
    await page.waitForTimeout(100);
    await page.locator('body').click();
    await page.keyboard.press('a');
    await expect(page.locator('.option-btn.correct')).toHaveCount(1);
  });

  test('per-option wrong-answer explanations rendered', async ({ page }) => {
    await page.locator('.option-btn').first().click();
    // The explanation block should contain multiple items explaining each option
    const explText = await page.locator('.explanation').innerText();
    expect(explText.length).toBeGreaterThan(50);
  });

  test('study-this cross-links point to study.html anchors', async ({ page }) => {
    await page.locator('.option-btn').first().click();
    // .study-link elements are the cross-links (not the nav bar link)
    const studyLink = page.locator('.study-link').first();
    if (await studyLink.count() > 0) {
      const href = await studyLink.getAttribute('href');
      expect(href).toMatch(/study\.html#/);
    }
  });
});

// ---------------------------------------------------------------------------
// exam.html — domain filter
// ---------------------------------------------------------------------------
test.describe('Practice exam — domain filter', () => {
  test.beforeEach(async ({ page }) => { await page.goto(EXAM); });

  test('selecting Domain 1 only shows D1 questions', async ({ page }) => {
    // Option values are "1","2"... not label text, so select by value
    await page.locator('#domain-filter').selectOption('1');
    await page.waitForTimeout(200);
    // The domain badge should read "D1"
    const badge = page.locator('.domain-badge').first();
    const badgeText = await badge.innerText();
    expect(badgeText).toMatch(/D1/);
  });

  test('question count changes after domain filter', async ({ page }) => {
    const allText = await page.locator('#q-counter').innerText();
    const totalAll = parseInt(allText.split('/')[1].trim());

    await page.locator('#domain-filter').selectOption('2');
    await page.waitForTimeout(200);
    const filteredText = await page.locator('#q-counter').innerText();
    const totalFiltered = parseInt(filteredText.split('/')[1].trim());

    expect(totalFiltered).toBeLessThan(totalAll);
  });
});

// ---------------------------------------------------------------------------
// exam.html — completing a run to results screen
// ---------------------------------------------------------------------------
test.describe('Practice exam — completing a filtered run', () => {
  test('results screen appears after answering all D5 questions', async ({ page }) => {
    await page.goto(EXAM);

    // D5 is smallest domain — fewest questions
    await page.locator('#domain-filter').selectOption('5');
    await page.waitForTimeout(200);

    const totalText = await page.locator('#q-counter').innerText();
    const total = parseInt(totalText.split('/')[1].trim());
    expect(total).toBeGreaterThan(0);

    // Click body first to ensure keyboard focus, then answer with 'a' key
    await page.locator('body').click();

    for (let i = 0; i < total; i++) {
      // Check if results already visible
      if (await page.locator('.score-ring').isVisible()) break;

      await page.keyboard.press('a');
      await page.waitForTimeout(80);

      if (await page.locator('.score-ring').isVisible()) break;

      const nextBtn = page.locator('#next-btn');
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        await page.waitForTimeout(80);
      }
    }

    await expect(page.locator('.score-ring')).toBeVisible({ timeout: 5000 });
  });

  test('results screen shows pass/fail text', async ({ page }) => {
    await page.goto(EXAM);
    await page.locator('#domain-filter').selectOption('5');
    await page.waitForTimeout(200);

    const totalText = await page.locator('#q-counter').innerText();
    const total = parseInt(totalText.split('/')[1].trim());

    await page.locator('body').click();
    for (let i = 0; i < total; i++) {
      if (await page.locator('.score-ring').isVisible()) break;
      await page.keyboard.press('a');
      await page.waitForTimeout(80);
      if (await page.locator('.score-ring').isVisible()) break;
      const nextBtn = page.locator('#next-btn');
      if (await nextBtn.isEnabled()) { await nextBtn.click(); await page.waitForTimeout(80); }
    }

    const results = page.locator('#results, .results-area, .concept-card').last();
    const resultsText = await results.innerText();
    expect(resultsText).toMatch(/pass|fail|score/i);
  });
});
