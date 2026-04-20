import { test, expect } from '@playwright/test';

test('checkout audit — errors, friction, payment', async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const failedRequests: string[] = [];
  const networkLog: { status: number; url: string }[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });

  page.on('requestfailed', req => {
    failedRequests.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText}`);
  });

  page.on('response', res => {
    if (res.status() >= 400) {
      networkLog.push({ status: res.status(), url: res.url() });
    }
  });

  // ── 1. Land on checkout ──────────────────────────────────────────────────
  await page.goto('/checkout');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'tmp/checkout-01-loaded.png', fullPage: true });

  // ── 2. Detect cart state ─────────────────────────────────────────────────
  const emptyCart = await page.locator('.woocommerce-info, .cart-empty').first().isVisible().catch(() => false);
  console.log('Cart empty banner visible:', emptyCart);

  // ── 3. Capture all visible form fields ───────────────────────────────────
  const fields = await page.locator('input:visible, select:visible, textarea:visible').evaluateAll(els =>
    els.map(el => ({
      name: (el as HTMLInputElement).name,
      id: el.id,
      type: (el as HTMLInputElement).type,
      required: (el as HTMLInputElement).required,
      placeholder: (el as HTMLInputElement).placeholder,
      value: (el as HTMLInputElement).value,
    }))
  );
  console.log('Form fields found:', JSON.stringify(fields, null, 2));

  // ── 4. Fill billing form ─────────────────────────────────────────────────
  const fill = async (selector: string, value: string) => {
    const el = page.locator(selector);
    if (await el.isVisible().catch(() => false)) {
      await el.fill(value);
    }
  };

  await fill('input[name="billing_first_name"]', 'Test');
  await fill('input[name="billing_last_name"]', 'User');
  await fill('input[name="billing_address_1"]', '123 Test St');
  await fill('input[name="billing_city"]', 'Phoenix');
  await fill('input[name="billing_postcode"]', '85001');
  await fill('input[name="billing_phone"]', '6025551111');
  await fill('input[name="billing_email"]', 'test@example.com');

  // State dropdown (WooCommerce)
  const stateSelect = page.locator('select[name="billing_state"]');
  if (await stateSelect.isVisible().catch(() => false)) {
    await stateSelect.selectOption('AZ');
  }

  await page.screenshot({ path: 'tmp/checkout-02-filled.png', fullPage: true });

  // ── 5. Capture payment methods available ────────────────────────────────
  const paymentMethods = await page.locator('.wc_payment_method, [class*="payment-method"]').evaluateAll(els =>
    els.map(el => el.textContent?.trim())
  );
  console.log('Payment methods visible:', paymentMethods);

  // ── 6. Check for Stripe / WooPayments iframe or card fields ─────────────
  const stripeIframe = page.frameLocator('iframe[name*="stripe"], iframe[src*="stripe"]').first();
  const cardField = page.locator('input[name*="card"], #card-number, [placeholder*="card"], [placeholder*="Card"]');
  const hasStripeIframe = await stripeIframe.locator('input').first().isVisible().catch(() => false);
  const hasCardField = await cardField.isVisible().catch(() => false);
  console.log('Stripe iframe detected:', hasStripeIframe);
  console.log('Inline card field detected:', hasCardField);

  // ── 7. Screenshot payment section ────────────────────────────────────────
  const paymentSection = page.locator('#payment, .woocommerce-checkout-payment');
  if (await paymentSection.isVisible().catch(() => false)) {
    await paymentSection.screenshot({ path: 'tmp/checkout-03-payment-section.png' });
  }

  // ── 8. Check order summary / totals ──────────────────────────────────────
  const orderTotal = await page.locator('.order-total, .woocommerce-Price-amount').last().textContent().catch(() => 'not found');
  console.log('Order total:', orderTotal);

  // ── 9. Attempt place order and capture result ────────────────────────────
  const placeOrderBtn = page.getByRole('button', { name: /place order|pay now|complete order/i });
  const btnVisible = await placeOrderBtn.isVisible().catch(() => false);
  console.log('Place Order button visible:', btnVisible);

  if (btnVisible) {
    await placeOrderBtn.click();
    await page.waitForTimeout(6000);
    await page.screenshot({ path: 'tmp/checkout-04-after-submit.png', fullPage: true });

    // Capture any inline error messages from WooCommerce
    const wooErrors = await page.locator('.woocommerce-error li, .woocommerce-NoticeGroup li, .is-error').allTextContents();
    console.log('WooCommerce errors after submit:', wooErrors);

    // Check if redirected to thank-you or order-received
    console.log('URL after submit:', page.url());
  }

  // ── 10. Final report ─────────────────────────────────────────────────────
  console.log('\n========== AUDIT REPORT ==========');
  console.log('JS Console errors:', consoleErrors.length ? consoleErrors : 'none');
  console.log('JS Console warnings:', consoleWarnings.length ? consoleWarnings : 'none');
  console.log('Failed network requests:', failedRequests.length ? failedRequests : 'none');
  console.log('HTTP 4xx/5xx responses:', networkLog.length ? networkLog : 'none');
  console.log('===================================\n');

  // Don't hard-fail — this is a diagnostic run
  expect(true).toBe(true);
});
