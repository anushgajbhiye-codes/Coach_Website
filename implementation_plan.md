# Implementation Plan - Sonu Ambre Site Migration & Section Cleanup (Revised V2)

This plan details the steps to modify the fitness coaching website and admin panel for the coach **Sonu Ambre** (replacing Marcus Vane), hide the public-facing Free Resources section, remove the Referral Program section, rearrange the navbar links, and implement robust error logs and safeguards to prevent the pricing plans grid from silently failing.

## User Review Required

> [!IMPORTANT]
> **Admin Account Security & Integrity**:
> * To prevent duplication of the Admin record, we will use **exactly one consolidated mechanism**: a modified seed script (`prisma/seed.js`).
> * The seed script will locate the existing Admin record in the database using a non-destructive `findFirst()` query and update its email, first name, and last name in place by **primary key ID only** (`where: { id: admin.id }`). It will never match by email.
> * If the database is completely empty (e.g. brand new initialization), the seed script will create the Sonu Ambre Admin record.
> * The password hash remains unchanged.
> * **No other update script will be run during boot.**

## Root Cause of the Recurring Pricing Blank Bug

The pricing plans grid has historically rendered blank due to two underlying root causes:
1. **Silent Empty Array State (Unseeded Table)**: When the database is reset or not seeded, GET `/api/pricing` successfully returns an empty array `[]`. The client-side template loops over this empty array without throwing any JavaScript errors, silently leaving the section blank in the viewport.
2. **Cascading Promise.all Fetch Failures**: Previously, all dynamic assets (pricing, transformations, resources, settings, blog posts) were aggregated inside a single `Promise.all` block. If any single endpoint failed, was removed, or returned non-JSON data (e.g. an HTML 404/500 page from Express), the entire `Promise.all` rejected. This caught-exception halted execution, preventing `renderPricing()` from ever being called even if the pricing database was fully populated.

**The Fixes**:
* We will ensure the database is seeded with the pricing plans.
* We will refactor `fetchAndPopulate` in `public/index.html` to fetch each asset individually within its own `try-catch` block.
* We will add a clear warning log to the console if the API returns an empty array or fails, so any empty state is immediately noticeable in browser DevTools.

---

## Proposed Changes

### [Database & Schema]

#### [MODIFY] [schema.prisma](file:///E:/Coach%20Website/prisma/schema.prisma)
* Update `Admin` model default values:
  - `firstName` default to `"Sonu"`
  - `lastName` default to `"Ambre"`
  - `aboutTextEn` default to `"Sonu Ambre is a certified trainer..."`
* Remove `referralText` and `referralAmount` from `Admin` model.
* Keep the `Resource` model completely intact and unmodified.

#### [MODIFY] [seed.js](file:///E:/Coach%20Website/prisma/seed.js)
* **Non-destructive ID-based Seeding**: Rewrite the Admin seeding step. First, query `prisma.admin.findFirst()`. If an admin record exists, update its `email` (`sonu@apexcoaching.in`), `firstName` (`Sonu`), and `lastName` (`Ambre`) using its primary key `id` (`where: { id: existingAdmin.id }`).
* If no admin record exists, create a new one with these Sonu Ambre defaults.
* Keep default resources seeding intact.
* Remove `referralText` and `referralAmount` from settings.

---

### [Backend Server & Routes]

#### [MODIFY] [server.js](file:///E:/Coach%20Website/src/server.js)
* Keep `app.use('/api/resources', resourcesRouter)` active and unmodified.
* Update GET `/api/settings` response payload: remove `referralText` and `referralAmount`.

#### [MODIFY] [auth.js](file:///E:/Coach%20Website/src/routes/auth.js)
* In PUT `/settings`, remove `referralText` and `referralAmount` from request parsing and database updates.

#### [MODIFY] [payments.js](file:///E:/Coach%20Website/src/routes/payments.js)
* Update default coach name to `Sonu Ambre` and default email to `sonu@apexcoaching.in`.

---

### [Public Website]

#### [MODIFY] [index.html](file:///E:/Coach%20Website/public/index.html)
* **Navbar & Mobile Menu**:
  - Remove `#resources` navigation anchors from header nav and mobile sidebar menu.
  - Reorder navigation links to match exact top-to-bottom section sequence on the page:
    * Desktop: `About` -> `Results` -> `Programs` -> `Pricing` -> `Blog` -> `Contact` -> `Book Now`
    * Mobile: `Home` -> `About` -> `Results` -> `Programs` -> `Pricing` -> `Blog` -> `Book Now` -> `Contact`
* **Hiding Resources Section**:
  - Remove the public `<section id="resources" class="resources">` element and all child elements from the HTML.
* **Referral Rewards**:
  - Remove the `#referralPromoCard` element from the markup.
* **Javascript Updates**:
  - Refactor `fetchAndPopulate()` to fetch each endpoint individually (handling try-catch blocks separately).
  - Remove `fetch(API_BASE + '/api/resources')` and `renderResources(resources)` from `fetchAndPopulate()`.
  - Add a **pricing grid safeguard**: if `GET /api/pricing` fails or returns an empty array, trigger a prominent `console.error` warning indicating the database is empty or the API is failing.
  - Remove settings logic applying referral rewards text.
* **Text Replacements**:
  - Replace every case-insensitive occurrence of "Marcus Vane" with "Sonu Ambre".
  - Replace every case-insensitive occurrence of "Marcus" with "Sonu".
  - Replace every case-insensitive occurrence of "marcus@apexcoaching.in" with "sonu@apexcoaching.in".
  - Update social media links like `@marcusvane_apex` to `@sonuambre_apex` and `@ApexFitnessByMarcus` to `@ApexFitnessBySonu`.

---

### [Admin Dashboard]

#### [MODIFY] [admin.html](file:///E:/Coach%20Website/public/admin.html)
* Keep the "Resources / PDFs" tab and page completely intact and functional.
* In the Settings page layout, remove the "Referral Program Text" and "Referral Discount (₹)" input fields.
* In settings load/save scripts, remove references to `settingsReferralText` and `settingsReferralAmount`.
* Replace login placeholder text, sidebar user labels, default firstName/lastName form fields, and email variables from "Marcus Vane" / `marcus@apexcoaching.in` to "Sonu Ambre" / `sonu@apexcoaching.in`.

---

### [Other Project Files]

#### [MODIFY] [test-api.js](file:///E:/Coach%20Website/test-api.js) and [README.md](file:///E:/Coach%20Website/README.md)
* Replace coach credentials and names to match "Sonu Ambre" and `sonu@apexcoaching.in`.

---

## Verification Plan

### Automated Boot & Integrity
1. Run `npm install`.
2. Run `npx prisma generate` followed by `npx prisma db push` to push schema changes.
3. Run `npm run seed` to apply seed/update logic (approach a).
4. Start the local server (`npm run dev`) and watch for console initialization errors.

### Manual Verification
1. Open the public page and authenticate via the Login/Signup gate.
2. Confirm the **Pricing Section** loads and displays 3 pricing cards, and check the browser DevTools Console to confirm no warnings are printed.
3. Confirm the **Free Resources** section is completely removed and there are no layout shifts or broken gaps.
4. Check the **Referral Reward** promo card is completely hidden.
5. In the **Admin Dashboard**:
   - Log in using `sonu@apexcoaching.in` and `Sonu@1234`.
   - Confirm that the "Resources / PDFs" manager tab is still fully present, functional, and lists uploaded items.
   - Verify that the Settings section doesn't display any referral inputs.
   - Save settings and check that it successfully persists changes to the public website.
6. Verify navbar link alignment (scrolling to correct sections in top-to-bottom order).
