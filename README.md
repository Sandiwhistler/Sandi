# SANDI — wearesandi.com

Website for SANDI, a Whistler-owned lifestyle fashion brand.

Plain HTML/CSS, no build step. It runs on any GoDaddy Web Hosting (cPanel) plan.

## What's in here

| File | What it is |
| --- | --- |
| `index.html` | Splash page: logo + **Enter** button |
| `shop.html` | Clothing page: products, about, Instagram, footer |
| `assets/css/styles.css` | All styling. Brand colours are at the top. |
| `assets/img/` | Logo (red + white, transparent), favicon |
| `assets/img/products/` | Put product photos here |

## Editing products

Open `shop.html` and look for the `PRODUCTS` comment. Each item is one
`<article class="product">` block: copy, paste, and change the name, colours,
sizes and price.

**Adding a photo:** drop it in `assets/img/products/` (portrait, roughly 4:5,
around 1200px tall), then change

```html
<div class="product__media product__media--placeholder">
```

to

```html
<div class="product__media"><img src="assets/img/products/logo-tee.jpg" alt="Pink Sandi logo tee">
```

**Buy buttons:** for now each one opens an email to sandi@wearesandi.com
with the item name filled in. To take card payments, create a
[Stripe Payment Link](https://stripe.com/payments/payment-links) (or a Shopify
Buy Button) for each product and paste that link into the button's `href`.

## Uploading to GoDaddy

1. Log in to GoDaddy → **My Products** → **Web Hosting** → **Manage** → **cPanel Admin**.
2. Open **File Manager** → go into `public_html`.
   (If wearesandi.com is an add-on domain, open its own folder instead.)
3. Delete any GoDaddy placeholder files there, such as `index.php` or `default.html`.
4. Click **Upload** and upload `index.html`, `shop.html` and the whole `assets`
   folder. The easiest way: upload a `.zip` of the site, then right-click it → **Extract**.
   Make sure `index.html` ends up directly inside `public_html`, not in a subfolder.
5. Visit https://wearesandi.com. You may need a hard refresh.

**SSL (the padlock):** in cPanel, open **SSL/TLS Status** and run AutoSSL for
wearesandi.com, or use the SSL certificate from your GoDaddy plan.

**Domain not showing the site?** In GoDaddy → **Domains** → wearesandi.com → **DNS**,
the `A` record for `@` should point to your hosting's IP address (shown on the cPanel home screen).
