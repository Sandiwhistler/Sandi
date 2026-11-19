# SANDI app (iPhone, iPad and Android)

The SANDI shopping app, built with [Capacitor](https://capacitorjs.com). Everything below can be done **from an iPad in Safari**. You never need a Mac: [Codemagic](https://codemagic.io) builds the app in the cloud.

**What's in the app:** a welcome screen, the shop, product pages with size picker, card checkout through Stripe, a Saved tab for favourites, sharing, and About (Instagram, email, website, privacy).

**Products update without an app update.** The app reads `products.json` from wearesandi.com every time it opens. Change that file, upload it to GoDaddy, and the app shows the change straight away. No new App Store version is needed.

---

## The plan, in order

| Step | Where | Time | Cost |
|---|---|---|---|
| 1. Card checkout | stripe.com | 30 min | Stripe fee per sale only |
| 2. Upload the website files | GoDaddy | 10 min | — |
| 3. Apple Developer account | Apple Developer app on iPad | 15 min + 1–2 days approval | $99 USD / year |
| 4. Connect Codemagic | codemagic.io | 20 min | Free tier is usually enough |
| 5. First build → TestFlight | codemagic.io | 20 min wait | — |
| 6. Submit to the App Store | App Store Connect | 30 min + 1–3 days review | — |
| 7. Android (optional) | Google Play Console | 1 hr | $25 USD once |

---

## 1. Card checkout with Stripe

1. Sign up at **stripe.com**. Under **Settings → Business**, add your business details and bank account so you get paid.
2. Go to **Product catalogue → + Add product**. Add each item with its name, price in **CAD**, and a photo.
3. Go to **Payment Links → + New**:
   - Choose the product.
   - Under **Options**, turn on **Collect customers' addresses → Shipping address** and pick the countries you ship to.
   - Optional: add a shipping rate and turn on **Allow promotion codes**.
   - Click **Create link** and copy it. It looks like `https://buy.stripe.com/abc123`.
4. Paste each link into `products.json` as that product's `"checkout"` (see "Changing products" below).

**Which size did they pick?** The app adds the size to the order. In Stripe, open the payment → **Checkout session** and look at **Client reference ID**, for example `classic-tee_M`. If you'd rather see the size more prominently, edit the Payment Link → **Add custom field → Dropdown → "Size"**. The customer then confirms their size on the Stripe page too.

Turn on **Settings → Notifications → Successful payments** to get an email for every order.

## 2. Upload the website files

Upload these to `public_html` on GoDaddy, the same way you uploaded the site:

- `products.json`: the product list the app reads
- `privacy.html`: Apple and Google require a privacy policy link

Check that https://wearesandi.com/products.json and https://wearesandi.com/privacy.html both open.

## 3. Apple Developer account

1. Install the **Apple Developer** app from the App Store on your iPad, sign in with your Apple ID, and tap **Account → Enroll now**. You pay the $99 inside the app.
   - **As an individual:** fastest. The store shows your personal name as the seller.
   - **As an organization:** the store shows "SANDI". You need a free D-U-N-S number for your business first, which takes a few days.
2. Once approved, go to **developer.apple.com/account** in Safari → **Certificates, IDs & Profiles → Identifiers → +**:
   - App IDs → App → Description `SANDI`, Bundle ID (Explicit) `com.wearesandi.app` → Continue → Register.
3. Go to **appstoreconnect.apple.com → Apps → + → New App**:
   - Platform iOS, Name `SANDI` (if it's taken, try `SANDI Whistler`), language English (Canada), Bundle ID `com.wearesandi.app`, SKU `sandi-app`.
4. Go to **App Store Connect → Users and Access → Integrations → App Store Connect API → Team Keys → +**:
   - Name `Codemagic`, Access **App Manager** → Generate.
   - **Download the .p8 file.** You can only download it once, and it saves to the Files app. Also note the **Issuer ID** and **Key ID**.

## 4. Connect Codemagic

1. Go to **codemagic.io**, sign up with GitHub, and add the application → choose the **sandi** repository → **codemagic.yaml** setup.
2. Go to **Team settings → Team integrations → Developer Portal → Connect**:
   - Key name: `SANDI App Store key` (exactly this, because the build file looks for it)
   - Paste the Issuer ID and Key ID, and upload the .p8 file.
3. Go to **Team settings → Code signing identities → iOS certificates → Generate certificate**:
   - Type **Apple Distribution**, using the key above. Download the certificate it makes and keep it and its password somewhere safe.
4. Back at **developer.apple.com → Profiles → +**:
   - **App Store Connect** (under Distribution) → App ID `com.wearesandi.app` → pick the certificate Codemagic just made → name `SANDI App Store` → Generate.
5. In Codemagic, go to **Code signing identities → iOS provisioning profiles → Fetch profiles**, tick `SANDI App Store`, and save.

## 5. First build → TestFlight

1. In Codemagic, open the app → **Start new build** → branch with the app code → workflow **SANDI · iPhone (App Store)**.
2. Wait about 15–20 minutes. Codemagic sends the finished app to App Store Connect.
3. Install **TestFlight** from the App Store on your iPad. Once Apple finishes processing (about 10–30 minutes), add yourself as a tester under App Store Connect → your app → **TestFlight → Internal Testing**, then open the app from TestFlight.

Try everything: open products, save, share, and do one real purchase with a small test product. Refund it afterwards in Stripe.

## 6. Submit to the App Store

In App Store Connect → your app:

- **Screenshots:** use the files in `app/store-screenshots/`. The iPhone ones fit the 6.9" slot and the iPad ones fit the 13" slot. Once you've added real product photos, ask Claude to make new screenshots.
- **Description, keywords, support URL** (`https://wearesandi.com`), **privacy policy URL** (`https://wearesandi.com/privacy.html`).
- **App Privacy:** answer *Yes, we collect data*:
  - Contact Info (name, email, address) and Purchases (purchase history)
  - Used for **App Functionality**, linked to the user, **not** used for tracking
  - This covers the details Stripe collects at checkout. The app itself collects nothing else.
- **Age rating:** answer No to everything (rated 4+).
- **Category:** Shopping.
- **Price:** Free.
- **Notes for the reviewer:**
  > SANDI sells physical clothing. Checkout uses Stripe Payment Links (guideline 3.1.3(e), physical goods). No account is needed to browse or buy.
- Pick the TestFlight build → **Add for Review → Submit**.

## 7. Android (optional)

1. Sign up at **play.google.com/console** ($25 USD once) and create an app called SANDI.
2. Ask Claude to make your Android **upload keystore**. It's a small file with a password. Then upload it in Codemagic → **Code signing identities → Android keystores**, with reference name `sandi_upload_key`.
3. Run the **SANDI · Android (Google Play)** workflow and download the `.aab` file it produces.
4. In Play Console, go to **Testing → Internal testing → Create release**, upload the `.aab`, fill in the store listing (the same screenshots and description work), then promote it to Production.

---

## Changing products

Edit **`products.json`**, which lives in the website folder, not inside `app/`. Each product looks like this:

```json
{
  "id": "classic-tee",
  "name": "The Classic Tee",
  "price": 45,
  "colour": "Shell Pink",
  "sizes": ["XS", "S", "M", "L", "XL"],
  "details": "Our everyday tee in soft, heavyweight cotton.",
  "image": "assets/img/products/classic-tee.jpg",
  "tag": "New",
  "checkout": "https://buy.stripe.com/abc123"
}
```

- `sizes`: use `[]` for one-size items.
- `image`: upload the photo to `assets/img/products/` on GoDaddy. Use portrait, about 4:5. Use `""` to show the pink logo instead.
- `tag`: `"New"`, `"Sold out"` (this disables the buy button), or `""`.
- `checkout`: `""` shows "Coming soon".
- Keep the commas between products, and quotes around text.

Then upload `products.json` to GoDaddy again. The app picks it up the next time someone opens it.

**From an iPad:** you can edit the file on github.com (open it → pencil icon), or just tell Claude what to change.

## When do you need a new app version?

Only for changes to how the app looks or works, such as new screens, the icon, or the text on the About tab. Run the Codemagic build again and submit the new build in App Store Connect. Products, prices, photos and Stripe links never need a new version.

## Files

| Path | What it is |
|---|---|
| `www/` | The app itself (HTML, CSS, JS, fonts, logo) |
| `www/config.js` | Email, Instagram, website and privacy links |
| `ios/`, `android/` | Native projects, generated by Capacitor |
| `assets/` | Source images for the icon and launch screen (`npm run icons` rebuilds them) |
| `store-screenshots/` | Ready-made App Store screenshots |
| `../codemagic.yaml` | Cloud build instructions |
| `../products.json` | The live product list |

**Trying the app in a browser:** `cd app && npm install && npm run preview`, then open http://localhost:8080.
