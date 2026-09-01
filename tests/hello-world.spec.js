const { test, expect } = require('@playwright/test');

test('hello world test', async ({ page }) => {
    await page.goto('http://localhost:3000'); // Adjust the URL as needed
    const text = await page.textContent('h1'); // Adjust the selector as needed
    expect(text).toBe('Hello World'); // Adjust the expected text as needed
});