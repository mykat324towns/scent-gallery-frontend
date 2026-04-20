"""
Checkout diagnostic — scentgallery.shop
Captures: console errors, failed requests, redirects, Cloudflare blocks, JS errors,
          DOM mutations on #payment container, duplicate Stripe mount targets,
          script load order, sg_upsell_products timing vs Stripe init.
Usage: python tools/checkout_diagnostic.py
"""

import asyncio
import json
import os
import time
from datetime import datetime
from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PWTimeout

BASE_URL = "https://scentgallery.shop"
REPORT_PATH = Path("tmp/checkout_diagnostic_report.json")

CUSTOMER = {
    "first": "Test",
    "last": "Customer",
    "email": "test@example.com",
    "phone": "6025550100",
    "address": "123 Test St",
    "city": "Gilbert",
    "state": "AZ",
    "zip": "85234",
    "country": "US",
}

CARD = {
    "number": "4242424242424242",
    "expiry": "12/30",
    "cvc": "123",
}


def ts():
    return datetime.utcnow().isoformat()


async def run():
    report = {
        "steps": [],
        "console_errors": [],
        "network_failures": [],
        "blocked_requests": [],
        "redirects": [],
        "page_messages": [],
        "all_requests": [],
        # New deep-investigation keys
        "js_load_order": [],
        "upsell_ajax_timing": [],
        "stripe_frame_timing": [],
        "dom_mutations": [],
        "upe_duplicate_check": {},
        "payment_container_snapshots": [],
        "stripe_frame_inventory": [],
        "final_url": None,
        "final_page_text": None,
        "failure_stage": None,
        "failure_category": None,
        "timestamp": ts(),
    }

    def log(step, msg="", **kwargs):
        entry = {"step": step, "msg": msg, "ts": ts(), **kwargs}
        report["steps"].append(entry)
        print(f"[{step}] {msg}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=80,
            args=["--disable-blink-features=AutomationControlled"],
        )

        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
            locale="en-US",
        )
        page = await context.new_page()

        # ── Listeners ──────────────────────────────────────────────────────────

        def on_console(msg):
            if msg.type in ("error", "warning"):
                entry = {"type": msg.type, "text": msg.text, "ts": ts()}
                report["console_errors"].append(entry)
                # Highlight Stripe mount warning prominently
                if "mounted to a DOM element that contains child nodes" in msg.text:
                    print(f"  [*** STRIPE DOUBLE-MOUNT WARNING ***] {msg.text}")
                else:
                    print(f"  [CONSOLE {msg.type.upper()}] {msg.text}")

        page.on("console", on_console)

        def on_pageerror(err):
            entry = {"type": "pageerror", "text": str(err), "ts": ts()}
            report["console_errors"].append(entry)
            print(f"  [PAGE ERROR] {err}")

        page.on("pageerror", on_pageerror)

        last_url = [BASE_URL]

        def on_framenavigated(frame):
            if frame == page.main_frame:
                new_url = frame.url
                if new_url != last_url[0]:
                    report["redirects"].append({"from": last_url[0], "to": new_url, "ts": ts()})
                    print(f"  [REDIRECT] {last_url[0]} -> {new_url}")
                    last_url[0] = new_url

        page.on("framenavigated", on_framenavigated)

        # Track Stripe frame attachment timing
        def on_frameattached(frame):
            url = frame.url or ""
            if "stripe" in url.lower() or "stripe" in (frame.name or "").lower():
                entry = {"url": url, "name": frame.name, "ts": ts(), "event": "attached"}
                report["stripe_frame_timing"].append(entry)
                frame_type = (
                    "payment" if "componentName=payment" in url else
                    "expressCheckout" if "expressCheckout" in url else
                    "controller" if "controller" in url else
                    "m-outer" if "m-outer" in url else
                    "loader" if "loader" in url else
                    "other"
                )
                print(f"  [STRIPE FRAME +] type={frame_type} url={url[:100]}")

        page.on("frameattached", on_frameattached)

        async def on_response(resp):
            url = resp.url
            status = resp.status
            relevant_keywords = [
                "woocommerce", "stripe", "woopayments", "wc-ajax",
                "checkout", "payment", "order", "api.stripe", "js.stripe",
                "cloudflare", "__cf", "wp-json", "wc/v3",
            ]
            is_relevant = any(k in url for k in relevant_keywords)

            # Track all scentgallery.shop JS file loads for script ordering
            if "scentgallery.shop" in url and ".js" in url and status < 400:
                report["js_load_order"].append({"url": url, "status": status, "ts": ts()})

            # Track sg_upsell AJAX calls with precise timing
            if "admin-ajax.php" in url or "sg_upsell" in url or "upsell" in url.lower():
                try:
                    body = await resp.text()
                except Exception:
                    body = ""
                report["upsell_ajax_timing"].append({
                    "url": url,
                    "status": status,
                    "body": body[:500],
                    "ts": ts(),
                    "stripe_frames_at_this_point": len(report["stripe_frame_timing"]),
                })
                print(f"  [UPSELL AJAX] {status} {url} (stripe frames so far: {len(report['stripe_frame_timing'])})")

            if status >= 400 or (is_relevant and status >= 300):
                try:
                    body = await resp.text()
                except Exception:
                    body = ""

                entry = {
                    "url": url,
                    "status": status,
                    "body": body[:3000],
                    "ts": ts(),
                }

                if (
                    status in (403, 503)
                    or "cloudflare" in url.lower()
                    or "Cloudflare" in body
                    or "cf-ray" in body.lower()
                    or "Just a moment" in body
                ):
                    entry["tag"] = "CLOUDFLARE_BLOCK"
                    report["blocked_requests"].append(entry)
                    print(f"  [CLOUDFLARE BLOCK] {status} {url}")
                else:
                    report["network_failures"].append(entry)
                    print(f"  [HTTP {status}] {url}")

            if is_relevant:
                try:
                    body = await resp.text()
                except Exception:
                    body = ""
                report["all_requests"].append({
                    "url": url,
                    "status": status,
                    "body": body[:2000],
                    "ts": ts(),
                })

        page.on("response", on_response)

        def on_requestfailed(req):
            entry = {
                "url": req.url,
                "failure": req.failure,
                "tag": "REQUEST_FAILED",
                "ts": ts(),
            }
            report["network_failures"].append(entry)
            print(f"  [REQUEST FAILED] {req.url} — {req.failure}")

        page.on("requestfailed", on_requestfailed)

        # ── Helper: snapshot payment container HTML ─────────────────────────────
        async def snapshot_payment(label):
            try:
                html = await page.evaluate("""
                    () => {
                        const p = document.querySelector('#payment') ||
                                  document.querySelector('.woocommerce-checkout-payment') ||
                                  document.querySelector('[id*="payment"]');
                        return p ? {
                            id: p.id,
                            html: p.innerHTML.substring(0, 4000),
                            childCount: p.children.length,
                            iframeCount: p.querySelectorAll('iframe').length,
                            upeCount: p.querySelectorAll('[id*="wcpay-upe"], [class*="wcpay-upe"], [id*="payment-element"]').length,
                        } : {id: 'NOT_FOUND', html: '', childCount: 0, iframeCount: 0, upeCount: 0};
                    }
                """)
            except Exception as e:
                html = {"error": str(e)}
            entry = {"label": label, "ts": ts(), **html}
            report["payment_container_snapshots"].append(entry)
            print(f"  [PAYMENT SNAPSHOT:{label}] iframes={entry.get('iframeCount')} upe_els={entry.get('upeCount')} children={entry.get('childCount')}")
            return entry

        # ── Step 1: Load shop ───────────────────────────────────────────────────
        try:
            log("STEP_1_LOAD_SHOP", "Loading /shop")
            await page.goto(BASE_URL + "/shop", wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(3)

            content = await page.content()
            if "Checking your browser" in content or "Just a moment" in content:
                log("CLOUDFLARE_CHALLENGE", "Challenge detected -- waiting 12s")
                await asyncio.sleep(12)

            # ── Step 2: Find product ────────────────────────────────────────────
            log("STEP_2_FIND_PRODUCT", "Looking for first available product")
            product_url = None

            selectors = [
                "ul.products li.product a.woocommerce-loop-product__link",
                "ul.products li.product a.woocommerce-LoopProduct-link",
                ".products .product a[href*='scentgallery']",
                ".product a[href]",
            ]

            for sel in selectors:
                try:
                    els = await page.locator(sel).all()
                    for el in els:
                        href = await el.get_attribute("href")
                        if href and "add-to-cart" not in href and "scentgallery" in href:
                            product_url = href
                            break
                except Exception:
                    pass
                if product_url:
                    break

            if not product_url:
                log("ERROR", "No product URL found on /shop")
                report["failure_stage"] = "before_order_submit"
                report["failure_category"] = "navigation_error"
                raise Exception("No product found")

            log("STEP_2_FOUND_PRODUCT", f"Product: {product_url}")
            await page.goto(product_url, wait_until="domcontentloaded", timeout=20000)
            await asyncio.sleep(3)

            # ── Step 3: Add to cart ─────────────────────────────────────────────
            log("STEP_3_ADD_TO_CART", "Adding to cart")

            variation_button_selectors = [
                ".woo-variation-swatches .swatch-label",
                ".tawcvs-swatches .swatch",
                ".variable-item:not(.disabled)",
                ".woo-variation-items-wrapper .woo-variation-item:first-child",
                ".wvs-style-squared span",
                "table.variations td.value ul li:first-child label",
                "table.variations td.value .woo-variation-item:first-child",
            ]

            variation_rows = await page.locator("table.variations tr").all()
            if variation_rows:
                log("STEP_3_VARIATIONS", f"Found {len(variation_rows)} variation rows")
                for row in variation_rows:
                    clicked = False
                    for btn_sel in variation_button_selectors:
                        try:
                            btns = await row.locator(btn_sel).all()
                            visible_btns = [b for b in btns if await b.is_visible()]
                            if visible_btns:
                                await visible_btns[0].click(timeout=3000)
                                await asyncio.sleep(0.5)
                                clicked = True
                                log("STEP_3_VAR_BUTTON_CLICKED", f"Via {btn_sel}")
                                break
                        except Exception:
                            pass

                    if not clicked:
                        try:
                            sel_el = row.locator("select").first
                            options = await sel_el.locator("option[value]:not([value=''])").all()
                            if options:
                                val = await options[0].get_attribute("value")
                                select_id = await sel_el.get_attribute("id") or await sel_el.get_attribute("name")
                                await page.evaluate(
                                    f"""
                                    const sel = document.querySelector('#{select_id}') || document.querySelector('[name="{select_id}"]');
                                    if (sel) {{
                                        sel.value = '{val}';
                                        sel.dispatchEvent(new Event('change', {{bubbles: true}}));
                                    }}
                                    """
                                )
                                await asyncio.sleep(0.6)
                                log("STEP_3_VAR_JS_SELECT", f"Force-set select to {val}")
                        except Exception as e:
                            log("STEP_3_VAR_FAILED", str(e))

            add_btn = page.locator(
                "button.single_add_to_cart_button, .single_add_to_cart_button, "
                "input[name='add-to-cart']"
            ).first
            await add_btn.click(timeout=10000)
            await asyncio.sleep(2)

            # ── Step 4: Checkout ────────────────────────────────────────────────
            log("STEP_4_GOTO_CHECKOUT", "Navigating to /checkout")
            await page.goto(BASE_URL + "/checkout", wait_until="domcontentloaded", timeout=20000)
            await asyncio.sleep(4)

            checkout_content = await page.content()
            if "Your cart is currently empty" in checkout_content:
                log("ERROR", "Cart empty at checkout")
                report["failure_stage"] = "before_order_submit"
                report["failure_category"] = "cart_session_nonce_issue"
                raise Exception("Cart empty at checkout")

            await page.screenshot(path="tmp/screenshot_1_checkout_loaded.png", full_page=True)
            log("STEP_4_CHECKOUT_LOADED", "Checkout loaded with cart items")

            # Snapshot payment container immediately after checkout load
            await snapshot_payment("on_load")

            # ── Inject MutationObserver on #payment container ───────────────────
            log("STEP_4_MUTATION_OBSERVER", "Injecting MutationObserver on #payment")
            await page.evaluate("""
                window._mutations = [];
                window._mutationCount = 0;
                const targetEl = document.querySelector('#payment') ||
                                 document.querySelector('.woocommerce-checkout-payment') ||
                                 document.body;
                window._mutationTarget = targetEl.id || targetEl.className?.substring(0,40) || 'body';

                const obs = new MutationObserver((mutations) => {
                    for (const m of mutations) {
                        window._mutationCount++;
                        // Only log first 100 mutations with detail; rest counted only
                        if (window._mutationCount <= 100) {
                            const addedSummary = Array.from(m.addedNodes)
                                .filter(n => n.nodeType === 1)
                                .map(n => (n.id ? '#' + n.id + ' ' : '') + n.tagName + (n.className ? '.' + String(n.className).replace(/\\s+/g, '.').substring(0,40) : ''))
                                .join(' | ');
                            const removedSummary = Array.from(m.removedNodes)
                                .filter(n => n.nodeType === 1)
                                .map(n => (n.id ? '#' + n.id + ' ' : '') + n.tagName + (n.className ? '.' + String(n.className).replace(/\\s+/g, '.').substring(0,40) : ''))
                                .join(' | ');
                            window._mutations.push({
                                seq: window._mutationCount,
                                ts: Date.now(),
                                type: m.type,
                                target_id: m.target.id || '',
                                target_class: String(m.target.className || '').substring(0,60),
                                target_tag: m.target.tagName || '',
                                added_count: m.addedNodes.length,
                                removed_count: m.removedNodes.length,
                                added_summary: addedSummary.substring(0, 300),
                                removed_summary: removedSummary.substring(0, 300),
                            });
                        }
                    }
                });
                obs.observe(targetEl, {childList: true, subtree: true, attributes: false});
                window._mutationObserver = obs;
                console.log('[DIAG] MutationObserver attached to: ' + window._mutationTarget);
            """)

            # Wait for Stripe to initialize — observe mutation activity during this period
            log("STEP_4_WAITING_STRIPE_INIT", "Waiting 6s for Stripe/WooPayments to initialize")
            await asyncio.sleep(6)

            # Snapshot mutations after initial Stripe init
            mutations_after_init = await page.evaluate("""
                () => ({
                    total: window._mutationCount,
                    target: window._mutationTarget,
                    logged: window._mutations ? window._mutations.slice(0, 100) : [],
                })
            """)
            report["dom_mutations"].append({
                "phase": "after_stripe_init",
                "total_mutations": mutations_after_init.get("total", 0),
                "target": mutations_after_init.get("target"),
                "detail": mutations_after_init.get("logged", []),
            })
            log("STEP_4_MUTATIONS_AFTER_INIT",
                f"Total mutations in first 6s: {mutations_after_init.get('total', 0)}")

            # Snapshot payment container after Stripe init
            await snapshot_payment("after_stripe_init")

            # ── Step 5: Billing ─────────────────────────────────────────────────
            log("STEP_5_FILL_BILLING", "Filling billing details via JS (fields may be CSS-hidden)")

            async def js_fill(field_id, value):
                try:
                    await page.evaluate(f"""
                        const el = document.getElementById('{field_id}');
                        if (el) {{
                            el.value = '{value}';
                            el.dispatchEvent(new Event('input', {{bubbles: true}}));
                            el.dispatchEvent(new Event('change', {{bubbles: true}}));
                            el.dispatchEvent(new Event('blur', {{bubbles: true}}));
                        }}
                    """)
                    print(f"    JS filled #{field_id}")
                except Exception as e:
                    print(f"    JS fill failed #{field_id}: {e}")

            await js_fill("billing_first_name", CUSTOMER["first"])
            await js_fill("billing_last_name", CUSTOMER["last"])
            await js_fill("billing_email", CUSTOMER["email"])
            await js_fill("billing_phone", CUSTOMER["phone"])
            await js_fill("billing_address_1", CUSTOMER["address"])
            await js_fill("billing_city", CUSTOMER["city"])
            await js_fill("billing_postcode", CUSTOMER["zip"])

            try:
                await page.evaluate("""
                    const c = document.getElementById('billing_country');
                    if (c) { c.value = 'US'; c.dispatchEvent(new Event('change', {bubbles: true})); }
                """)
                await asyncio.sleep(0.8)
            except Exception:
                pass
            try:
                await page.evaluate("""
                    const s = document.getElementById('billing_state');
                    if (s) { s.value = 'AZ'; s.dispatchEvent(new Event('change', {bubbles: true})); }
                """)
                await asyncio.sleep(0.5)
            except Exception:
                pass

            await asyncio.sleep(1.5)

            # Capture mutations triggered by billing field interactions
            mutations_after_billing = await page.evaluate("""
                () => ({
                    total: window._mutationCount,
                    new_since_last: window._mutations ? window._mutations.slice(-20) : [],
                })
            """)
            report["dom_mutations"].append({
                "phase": "after_billing_fill",
                "total_mutations": mutations_after_billing.get("total", 0),
                "detail": mutations_after_billing.get("new_since_last", []),
            })
            log("STEP_5_MUTATIONS_AFTER_BILLING",
                f"Cumulative mutations after billing fill: {mutations_after_billing.get('total', 0)}")

            await page.screenshot(path="tmp/screenshot_2_billing_filled.png", full_page=True)

            # ── Step 6: Payment / Stripe ────────────────────────────────────────
            log("STEP_6_FILL_PAYMENT", "Locating Stripe payment iframe")
            await asyncio.sleep(2)

            all_frames = page.frames
            print(f"  Total frames: {len(all_frames)}")

            # Full frame inventory with type classification
            frame_inventory = []
            for f in all_frames:
                url = f.url
                frame_type = (
                    "payment_element" if ("elements-inner-accessory-target" in url and "componentName=payment" in url) else
                    "express_checkout" if "expressCheckout" in url else
                    "controller" if "controller" in url else
                    "m_outer_fraud" if "m-outer" in url else
                    "elements_loader" if "loader" in url else
                    "stripe_other" if "stripe" in url.lower() else
                    "non_stripe"
                )
                frame_inventory.append({"type": frame_type, "url": url[:150], "name": f.name})
                print(f"    [{frame_type}] {url[:120]}")

            report["stripe_frame_inventory"] = frame_inventory

            # Count payment element frames — multiple = double mount
            payment_frames = [f for f in frame_inventory if f["type"] == "payment_element"]
            if len(payment_frames) > 1:
                log("CRITICAL_DOUBLE_MOUNT_CONFIRMED",
                    f"{len(payment_frames)} payment element frames found — double mount confirmed",
                    frames=payment_frames)
                print(f"\n  *** CRITICAL: {len(payment_frames)} payment_element frames = CONFIRMED DOUBLE MOUNT ***")
            else:
                log("STEP_6_PAYMENT_FRAMES", f"{len(payment_frames)} payment_element frame(s)")

            # Check for duplicate WooPayments UPE DOM containers
            upe_check = await page.evaluate("""
                () => {
                    const selectors = {
                        '#wcpay-upe-element': document.querySelectorAll('#wcpay-upe-element').length,
                        '.wcpay-upe-element': document.querySelectorAll('.wcpay-upe-element').length,
                        '[id*="wcpay-upe"]': document.querySelectorAll('[id*="wcpay-upe"]').length,
                        '[id*="payment-element"]': document.querySelectorAll('[id*="payment-element"]').length,
                        '[data-payment-element]': document.querySelectorAll('[data-payment-element]').length,
                        '.wc-block-gateway-container': document.querySelectorAll('.wc-block-gateway-container').length,
                        'iframe[name*="__privateStripe"]': document.querySelectorAll('iframe[name*="__privateStripe"]').length,
                    };
                    const details = {};
                    for (const [sel, count] of Object.entries(selectors)) {
                        if (count > 0) {
                            const els = document.querySelectorAll(sel);
                            details[sel] = {
                                count: count,
                                ids: Array.from(els).map(e => e.id).filter(Boolean),
                                parents: Array.from(els).map(e => e.parentElement ? (e.parentElement.id || e.parentElement.className?.substring(0,50)) : 'none'),
                            };
                        }
                    }
                    return details;
                }
            """)
            report["upe_duplicate_check"] = upe_check
            for sel, data in upe_check.items():
                count = data.get("count", 0)
                flag = " *** DUPLICATE ***" if count > 1 else ""
                log("STEP_6_UPE_DOM_CHECK", f"{sel}: {count}{flag}", data=data)

            # Snapshot payment container at this point
            await snapshot_payment("before_card_fill")

            # Find the correct Stripe card-input frame
            stripe_frame = None
            for f in all_frames:
                url = f.url
                if "elements-inner-accessory-target" in url and "componentName=payment" in url:
                    stripe_frame = f
                    print(f"  Found payment element frame: {url[:120]}")
                    break

            if not stripe_frame:
                for f in all_frames:
                    url = f.url
                    if "elements-inner" in url and "expressCheckout" not in url and "loader" not in url:
                        stripe_frame = f
                        print(f"  Fallback payment frame: {url[:120]}")
                        break

            if not stripe_frame:
                for f in all_frames:
                    url = f.url
                    if "js.stripe.com" in url and "m-outer" not in url and "controller" not in url:
                        stripe_frame = f
                        print(f"  Last-resort stripe frame: {url[:120]}")
                        break

            if stripe_frame:
                log("STEP_6_STRIPE_IFRAME_FOUND", f"Frame URL: {stripe_frame.url}")

                card_selectors = [
                    'input[name="cardnumber"]',
                    'input[placeholder*="1234"]',
                    'input[autocomplete="cc-number"]',
                    'input[data-elements-stable-field-name="cardNumber"]',
                ]
                card_filled = False
                for sel in card_selectors:
                    try:
                        el = stripe_frame.locator(sel).first
                        await el.wait_for(state="visible", timeout=4000)
                        await el.fill(CARD["number"])
                        card_filled = True
                        log("STEP_6_CARD_NUMBER_FILLED", f"Via {sel}")
                        break
                    except Exception:
                        pass

                if not card_filled:
                    log("STEP_6_CARD_NUMBER_FAILED", "Could not locate card number input in stripe frame")

                exp_selectors = [
                    'input[name="exp-date"]',
                    'input[placeholder*="MM / YY"]',
                    'input[placeholder*="MM/YY"]',
                    'input[autocomplete="cc-exp"]',
                ]
                for sel in exp_selectors:
                    try:
                        el = stripe_frame.locator(sel).first
                        await el.wait_for(state="visible", timeout=3000)
                        await el.fill(CARD["expiry"])
                        log("STEP_6_EXP_FILLED", f"Via {sel}")
                        break
                    except Exception:
                        pass

                cvc_selectors = [
                    'input[name="cvc"]',
                    'input[placeholder*="CVC"]',
                    'input[placeholder*="CVV"]',
                    'input[autocomplete="cc-csc"]',
                ]
                for sel in cvc_selectors:
                    try:
                        el = stripe_frame.locator(sel).first
                        await el.wait_for(state="visible", timeout=3000)
                        await el.fill(CARD["cvc"])
                        log("STEP_6_CVC_FILLED", f"Via {sel}")
                        break
                    except Exception:
                        pass

            else:
                log("STEP_6_NO_STRIPE_IFRAME", "No Stripe iframe found -- logging all iframes for debug")
                iframes = await page.locator("iframe").all()
                for i, iframe in enumerate(iframes):
                    src = await iframe.get_attribute("src") or ""
                    name = await iframe.get_attribute("name") or ""
                    title = await iframe.get_attribute("title") or ""
                    print(f"    iframe[{i}] src={src} name={name} title={title}")
                    report["steps"].append({
                        "step": "IFRAME_DEBUG",
                        "index": i,
                        "src": src,
                        "name": name,
                        "title": title,
                    })

            await asyncio.sleep(1.5)
            await page.screenshot(path="tmp/screenshot_3_payment_filled.png", full_page=True)
            await snapshot_payment("after_card_fill")

            # ── Step 7: Submit ──────────────────────────────────────────────────
            log("STEP_7_SUBMIT_ORDER", "Collecting pre-submit mutation state then clicking Place Order")

            # Capture all mutations so far before submit
            pre_submit_mutations = await page.evaluate("""
                () => ({
                    total: window._mutationCount,
                    all_logged: window._mutations || [],
                })
            """)
            report["dom_mutations"].append({
                "phase": "pre_submit_complete",
                "total_mutations": pre_submit_mutations.get("total", 0),
                "detail": pre_submit_mutations.get("all_logged", []),
            })
            log("STEP_7_PRE_SUBMIT_MUTATIONS",
                f"Total DOM mutations before submit: {pre_submit_mutations.get('total', 0)}")

            # Analyze which mutations touched the payment container most
            all_mutations = pre_submit_mutations.get("all_logged", [])
            payment_mutations = [
                m for m in all_mutations
                if "payment" in m.get("target_id", "").lower()
                or "payment" in m.get("target_class", "").lower()
                or "wc-block" in m.get("target_class", "").lower()
                or "wcpay" in m.get("target_id", "").lower()
                or "wcpay" in m.get("added_summary", "").lower()
                or "wcpay" in m.get("removed_summary", "").lower()
            ]
            if payment_mutations:
                log("STEP_7_PAYMENT_CONTAINER_MUTATIONS",
                    f"{len(payment_mutations)} mutations directly touched payment container",
                    mutations=payment_mutations[:10])
                print(f"  [PAYMENT MUTATIONS] {len(payment_mutations)} mutations on payment-related elements:")
                for m in payment_mutations[:10]:
                    print(f"    seq={m.get('seq')} added={m.get('added_summary', '')[:80]} removed={m.get('removed_summary', '')[:80]}")

            wc_ajax_response = []
            stripe_response = []

            async def capture_wc_ajax(resp):
                if "wc-ajax=checkout" in resp.url or "wc-ajax=process_payment" in resp.url:
                    try:
                        body = await resp.text()
                    except Exception:
                        body = ""
                    wc_ajax_response.append({
                        "url": resp.url,
                        "status": resp.status,
                        "body": body,
                        "ts": ts(),
                    })
                    print(f"  [WC AJAX CHECKOUT] {resp.status} -- {resp.url}")
                    print(f"  Body: {body[:1000]}")

            async def capture_stripe(resp):
                if "payment_intents" in resp.url or "/v1/payment" in resp.url:
                    try:
                        body = await resp.text()
                    except Exception:
                        body = ""
                    stripe_response.append({
                        "url": resp.url,
                        "status": resp.status,
                        "body": body,
                        "ts": ts(),
                    })
                    print(f"  [STRIPE INTENT] {resp.status} -- {resp.url}")
                    print(f"  Body: {body[:1000]}")

            page.on("response", capture_wc_ajax)
            page.on("response", capture_stripe)

            await page.evaluate("""
                const btn = document.getElementById('place_order');
                if (btn) {
                    btn.disabled = false;
                    btn.removeAttribute('disabled');
                    btn.style.display = '';
                    btn.style.visibility = '';
                    btn.style.opacity = '1';
                }
            """)
            await asyncio.sleep(0.5)

            place_order = page.locator("#place_order").first
            try:
                await place_order.click(force=True, timeout=5000)
                log("STEP_7_ORDER_CLICKED", "Place Order clicked (force) -- waiting for responses")
            except Exception as e:
                log("STEP_7_CLICK_FAILED", f"Force click failed: {e} -- trying JS click")
                await page.evaluate("document.getElementById('place_order')?.click()")
                log("STEP_7_ORDER_CLICKED_JS", "Place Order clicked via JS")

            await asyncio.sleep(8)
            await page.screenshot(path="tmp/screenshot_4_post_submit.png", full_page=True)
            await snapshot_payment("post_submit")

            # Capture mutations triggered by submit
            post_submit_mutations = await page.evaluate("""
                () => ({
                    total: window._mutationCount,
                    last_20: window._mutations ? window._mutations.slice(-20) : [],
                })
            """)
            report["dom_mutations"].append({
                "phase": "post_submit",
                "total_mutations": post_submit_mutations.get("total", 0),
                "detail": post_submit_mutations.get("last_20", []),
            })
            log("STEP_7_POST_SUBMIT_MUTATIONS",
                f"Total mutations after submit: {post_submit_mutations.get('total', 0)}")

            report["wc_ajax_responses"] = wc_ajax_response
            report["stripe_responses"] = stripe_response

            report["final_url"] = page.url
            page_content = await page.content()
            report["final_page_text"] = page_content[:8000]

            # ── Determine outcome ───────────────────────────────────────────────
            final_url = page.url
            log("STEP_8_FINAL_URL", f"Final URL: {final_url}")

            if "order-received" in final_url or "order-confirmation" in final_url:
                log("OUTCOME_SUCCESS", "Order completed -- reached confirmation page")
                report["failure_stage"] = "none"
                report["failure_category"] = "none"

            elif "Thank you" in page_content or "Your order has been received" in page_content:
                log("OUTCOME_SUCCESS", "Order confirmation text found")
                report["failure_stage"] = "none"
                report["failure_category"] = "none"

            else:
                log("OUTCOME_FAILURE", f"Did not reach confirmation. URL: {final_url}")

                error_texts = await page.locator(
                    ".woocommerce-error li, .woocommerce-notices-wrapper .woocommerce-error, "
                    ".wc-block-components-notice--error, .woocommerce-message"
                ).all_text_contents()
                if error_texts:
                    report["page_messages"].append({
                        "source": "visible_wc_errors",
                        "messages": error_texts,
                        "ts": ts(),
                    })
                    log("VISIBLE_ERRORS", " | ".join(error_texts))

                body_lower = page_content.lower()
                all_errors = " ".join(error_texts).lower()
                blocked = len(report["blocked_requests"]) > 0
                has_cloudflare = "cloudflare" in body_lower or "cf-ray" in body_lower

                wc_bodies = " ".join(r["body"] for r in wc_ajax_response).lower()
                stripe_bodies = " ".join(r["body"] for r in stripe_response).lower()

                if has_cloudflare or blocked:
                    report["failure_stage"] = "during_payment_intent"
                    report["failure_category"] = "cloudflare_security_blocking"
                elif "nonce" in wc_bodies or "session" in wc_bodies or "expired" in wc_bodies:
                    report["failure_stage"] = "before_order_submit"
                    report["failure_category"] = "caching_session_nonce_issue"
                elif "stripe" in wc_bodies or "payment_intent" in wc_bodies or "declined" in all_errors:
                    report["failure_stage"] = "during_payment_intent"
                    report["failure_category"] = "woopayments_gateway_failure"
                elif "woocommerce" in wc_bodies and ("error" in wc_bodies or "fail" in wc_bodies):
                    report["failure_stage"] = "during_payment_intent"
                    report["failure_category"] = "woocommerce_gateway_failure"
                elif len(report["console_errors"]) > 5:
                    report["failure_stage"] = "before_order_submit"
                    report["failure_category"] = "js_plugin_conflict"
                elif not wc_ajax_response:
                    report["failure_stage"] = "before_order_submit"
                    report["failure_category"] = "order_never_submitted_js_or_form_issue"
                else:
                    report["failure_stage"] = "unknown"
                    report["failure_category"] = "unknown"

        except Exception as e:
            log("FATAL_ERROR", str(e))
            report["failure_stage"] = report.get("failure_stage") or "unknown"
            report["failure_category"] = report.get("failure_category") or "unknown"
            try:
                await page.screenshot(path="tmp/screenshot_error.png", full_page=True)
            except Exception:
                pass

        await browser.close()

    # ── Write report ────────────────────────────────────────────────────────
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2))

    # ── Summary ─────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("DIAGNOSTIC SUMMARY")
    print("=" * 60)
    print(f"Failure Stage:     {report['failure_stage']}")
    print(f"Failure Category:  {report['failure_category']}")
    print(f"Console Errors:    {len(report['console_errors'])}")
    print(f"Network Failures:  {len(report['network_failures'])}")
    print(f"Blocked Requests:  {len(report['blocked_requests'])}")
    print(f"Redirects:         {len(report['redirects'])}")
    print(f"WC AJAX Responses: {len(report.get('wc_ajax_responses', []))}")
    print(f"Stripe Responses:  {len(report.get('stripe_responses', []))}")

    # Stripe frame summary
    frame_inv = report.get("stripe_frame_inventory", [])
    payment_frames = [f for f in frame_inv if f["type"] == "payment_element"]
    express_frames = [f for f in frame_inv if f["type"] == "express_checkout"]
    print(f"\nStripe Frame Inventory ({len(frame_inv)} total):")
    for ftype in ["payment_element", "express_checkout", "controller", "m_outer_fraud", "elements_loader"]:
        count = sum(1 for f in frame_inv if f["type"] == ftype)
        if count:
            flag = " *** DOUBLE MOUNT ***" if ftype == "payment_element" and count > 1 else ""
            print(f"  {ftype}: {count}{flag}")

    # UPE duplicate DOM check
    upe = report.get("upe_duplicate_check", {})
    if upe:
        print("\nUPE DOM Container Counts:")
        for sel, data in upe.items():
            count = data.get("count", 0)
            flag = " *** DUPLICATE ***" if count > 1 else ""
            print(f"  {sel}: {count}{flag}")

    # Mutation summary
    total_mutations = 0
    for phase in report.get("dom_mutations", []):
        total_mutations = max(total_mutations, phase.get("total_mutations", 0))
    print(f"\nTotal DOM Mutations on #payment: {total_mutations}")

    # sg_upsell timing
    upsell_calls = report.get("upsell_ajax_timing", [])
    if upsell_calls:
        print(f"\nsg_upsell AJAX calls: {len(upsell_calls)}")
        for c in upsell_calls:
            print(f"  {c['status']} {c['url'][:80]} | stripe_frames_at_call_time={c['stripe_frames_at_this_point']}")

    # Script load order (first 10 + key scripts)
    js_loads = report.get("js_load_order", [])
    key_scripts = [j for j in js_loads if any(k in j["url"] for k in ["sg_upsell", "wcpay", "woocommerce", "checkout", "stripe"])]
    if key_scripts:
        print(f"\nKey JS load order ({len(js_loads)} total scripts):")
        for j in key_scripts[:15]:
            print(f"  {j['ts'][-12:]} {j['url'][-80:]}")

    print(f"\nFull report: {REPORT_PATH.resolve()}")
    print("Screenshots: tmp/screenshot_*.png")

    # ── Final verdict ────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("CONFLICT ANALYSIS")
    print("=" * 60)

    double_mount = len(payment_frames) > 1
    upe_dupes = any(d.get("count", 0) > 1 for d in upe.values())
    upsell_before_stripe = any(
        c["stripe_frames_at_this_point"] == 0 for c in upsell_calls
    )

    if double_mount:
        print("ROOT CAUSE: Confirmed double Stripe Payment Element mount.")
        print(f"  Two payment_element frames loaded simultaneously.")
        print("  This causes Stripe's 'mounted to DOM element that contains child nodes' error.")
        print("  When one instance creates a payment intent, the other may submit a different nonce.")
    if upe_dupes:
        print("CONTRIBUTING: Duplicate #wcpay-upe-element DOM containers found.")
        print("  Something re-renders or clones the payment section after WooPayments mounts.")
    if upsell_before_stripe:
        print("SUSPECT: sg_upsell_products AJAX fires BEFORE any Stripe frames attach.")
        print("  If sg_upsell replaces/re-renders #payment HTML at this point, it destroys")
        print("  the WooPayments mount target, forcing a second mount attempt.")

    stripe_warnings = [
        e for e in report.get("console_errors", [])
        if "mounted to a DOM element that contains child nodes" in e.get("text", "")
    ]
    if stripe_warnings:
        print(f"\nStripe double-mount warning fired {len(stripe_warnings)} time(s).")

    if not double_mount and not upe_dupes and not upsell_before_stripe:
        print("No clear single root cause identified from this run.")
        print("Review full report for mutation sequences and frame timing.")

    print("\nMINIMUM TEST: Deactivate sg_upsell_products on staging and run one checkout.")
    print("If double-mount disappears from Stripe frames -> sg_upsell is the trigger.")


if __name__ == "__main__":
    asyncio.run(run())
