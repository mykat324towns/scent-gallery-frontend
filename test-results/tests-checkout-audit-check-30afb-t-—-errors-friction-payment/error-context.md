# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\checkout-audit.spec.ts >> checkout audit — errors, friction, payment
- Location: tests\checkout-audit.spec.ts:3:5

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - link "Skip to content" [ref=e4] [cursor=pointer]:
        - /url: "#content"
      - generic [ref=e6]:
        - generic [ref=e8]:
          - link "Scent Gallery" [ref=e12] [cursor=pointer]:
            - /url: https://scentgallery.shop/
            - img "Scent Gallery" [ref=e13]
          - generic [ref=e17]:
            - textbox "Search" [ref=e18]:
              - /placeholder: Search for products...
            - button "Search" [ref=e19]
          - generic [ref=e21]:
            - link "account" [ref=e22] [cursor=pointer]:
              - /url: https://scentgallery.shop/cart/
              - generic [ref=e23]: 
            - link [ref=e26] [cursor=pointer]:
              - /url: "#"
              - img [ref=e29]
        - text:  
      - generic [ref=e34]:
        - paragraph [ref=e38]:
          - generic [ref=e43]: All Categories
        - navigation [ref=e45]:
          - text: 
          - menu [ref=e48]:
            - listitem [ref=e49]:
              - link "Home" [ref=e50] [cursor=pointer]:
                - /url: https://scentgallery.shop/
            - listitem [ref=e51]:
              - link "All Fragrance Samples" [ref=e52] [cursor=pointer]:
                - /url: https://scentgallery.shop/fragrance-samples/
            - listitem [ref=e53]:
              - link "Sample Packs" [ref=e54] [cursor=pointer]:
                - /url: https://scentgallery.shop/sample-packs/
    - generic [ref=e60]:
      - generic [ref=e61]:
        - heading "Cart" [level=1] [ref=e62]
        - navigation "Breadcrumbs" [ref=e63]:
          - heading [level=2]
          - list [ref=e64]:
            - listitem [ref=e65]:
              - link "Home" [ref=e66] [cursor=pointer]:
                - /url: https://scentgallery.shop
            - listitem [ref=e67]: / Cart
      - article [ref=e69]:
        - generic [ref=e70]:
          - generic [ref=e71]:
            - status [ref=e73]: Your cart is currently empty.
            - paragraph [ref=e74]:
              - link "Return to shop" [ref=e75] [cursor=pointer]:
                - /url: https://scentgallery.shop/fragrance-samples/
          - paragraph
    - contentinfo
  - link [ref=e76] [cursor=pointer]:
    - /url: "#"
    - img [ref=e79]
  - generic [ref=e83]:
    - generic [ref=e84]:
      - generic [ref=e85]:
        - img [ref=e86]
        - heading "Cart" [level=4] [ref=e89]
      - generic [ref=e90] [cursor=pointer]: 
    - generic [ref=e91]:
      - generic [ref=e93]:
        - text: Spend
        - strong [ref=e94]: $50
        - text: for free shipping
      - paragraph [ref=e96]: Your Cart is Empty
      - link "Back To Shop" [ref=e97] [cursor=pointer]:
        - /url: https://scentgallery.shop/fragrance-samples/
    - paragraph [ref=e99]:
      - text: Powered by
      - link "ThemeHunk" [ref=e100] [cursor=pointer]:
        - /url: https://themehunk.com/th-all-in-one-woo-cart/
        - text: ThemeHunk
        - img [ref=e101]
  - status [ref=e105]
```