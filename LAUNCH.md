# SnapsPort — Launch Checklist

Track progress here. Items are ordered by dependency — don't skip ahead.

**Status as of 2026-07-01:** App is functionally complete and builds clean (`tsc` passes).
The remaining launch gates are **real In-App Purchase setup** and **App Store Connect
submission assets** — see the two blockers in §1 and §4–6. Everything code-level is done.

---

## 1. RevenueCat + IAP setup (blocker for paywall)

- [x] Create account at https://app.revenuecat.com
- [x] Add iOS app with bundle ID `com.snapsport.app`
- [x] Entitlement named exactly `unlock` created in RevenueCat
- [x] Test Store product `unlock_all_test` created + attached to `unlock` (dev testing works)
- [ ] **BLOCKER** — In App Store Connect: create a **Non-Consumable** IAP product, price $0.99
      Suggested product ID: `snapsport_unlock`
- [ ] **BLOCKER** — In RevenueCat: add the **App Store** product, attach it to the `unlock`
      entitlement, and point the `default` offering's package at it (currently the offering
      only has the Test Store product)
- [ ] **BLOCKER** — Get your production **`appl_...`** iOS key from RevenueCat and set it as
      the `EXPO_PUBLIC_REVENUECAT_API_KEY` env var. NOTE: the code reads this from the
      environment (see `src/core/revenuecat.ts`), and `.env` is gitignored — so you must set
      it as an **EAS secret** for production builds, not just in local `.env`. Right now it
      holds a `test_...` Test Store key, which silently disables real purchases.
- [x] Native project generated + `pod install` run (`ios/` is committed)
- [x] Paywall verified for >50 memories (tested via Test Store)

## 2. Test the real user flow

- [x] Snapchat data export downloaded (real 2016-era export tested)
- [x] Open the ZIP in SnapsPort via Share → SnapsPort from Mail
- [x] Memory count parsed correctly
- [x] Full download to Camera Roll — photos appear in Photos app
- [x] Full download to SnapsPort Album — album appears
- [ ] **Re-test purchase with the REAL `appl_` key + a sandbox Apple ID** before submitting.
      Every purchase so far has gone through the Test Store — the real StoreKit path
      (paywall → buy → resume remaining download) has never been exercised end-to-end.

## 3. App icon

- [x] 1024×1024 icon present in the native project
      (`ios/SnapsPort/Images.xcassets/AppIcon.appiconset`) — used by the build as-is
- [ ] Optional: add it to `assets/` and reference under `expo.icon` in `app.json`.
      Only needed if you ever run `npx expo prebuild --clean` (which regenerates `ios/`).

## 4. Privacy policy (blocker for submission)

- [ ] Publish a privacy policy page (a GitHub Gist or Notion page is fine).
      IMPORTANT: it must be accurate — your media never leaves the device, BUT the app
      uses **RevenueCat** for purchases, which collects purchase history + a device
      identifier. Do NOT claim "we collect nothing." State: memories/photos stay on-device;
      purchase data is processed by Apple and RevenueCat.
- [ ] Add the URL to App Store Connect under App Privacy
- [ ] Fill out the **App Privacy nutrition labels** to declare RevenueCat's data collection
      (Purchases, Identifiers) — reviewers cross-check this against in-app copy.

## 5. App Store screenshots

- [ ] 6.7" size (iPhone 16 Pro Max): minimum 3, recommended 5–6
      Suggested shots: onboarding, processing/paywall, download in progress, complete
- [ ] Upload in App Store Connect under the iOS app listing

## 6. App Store listing copy

- [ ] App name: `SnapsPort`
- [ ] Subtitle (30 chars): `Save Snapchat memories forever`
- [ ] Description: lead with the urgency (Snapchat storage fees), then the 3-step flow
- [ ] Keywords: `snapchat memories export save icloud photos transfer backup`
- [ ] Support URL: your GitHub repo or a contact page
- [x] App Store URL placeholder in `app/complete.tsx` replaced with real ID (`id6772678208`)
- [ ] IAP review screenshot + metadata (Apple reviews the $0.99 purchase separately —
      a missing review screenshot is a common rejection cause)

## 7. EAS build config

- [x] `eas.json` submit profile wired to `$APPLE_ID` / `$ASC_APP_ID` / `$APPLE_TEAM_ID`
- [ ] Set `EXPO_PUBLIC_REVENUECAT_API_KEY` as an EAS secret (see §1)
- [ ] Run `eas build --platform ios --profile preview` → distribute via TestFlight
- [ ] Test the TestFlight build on at least 2 devices before submitting to App Store

## 8. App Store submission

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

Typical App Store review time: 24–48 hours.

## 9. Post-launch distribution

- [ ] r/DataHoarder — technical users who'll validate it works
- [ ] r/snapchat — core audience
- [ ] r/LifeHacks — broad reach
- [ ] Twitter/X: #SnapchatMemories #SnapchatStorage

---

## Known limitations / follow-ups (not launch blockers)

- **Undated photos keep today's date in Photos.** Snapchat exports sometimes contain media
  with no recoverable timestamp (no parseable filename date, and the JSON entry has empty
  `Download Link`/`Media Download Url`). The app groups these just before the earliest dated
  memory *for in-app ordering*, but iOS Photos still stamps them with the extraction date,
  because there is currently no way to set a file's EXIF `DateTimeOriginal` or modification
  time via `expo-media-library` / `expo-file-system`. A real fix needs an EXIF-writing
  library or a small native module. Documented; acceptable for v1.

---

## Already done (code)

- [x] Local ZIP → iPhone → iCloud Photos pipeline (replaced the old S3 download design)
- [x] ZIP handler: "Open In → SnapsPort" works from Mail and Files app
- [x] Memory parser supporting the real Snapchat export schema
- [x] Concurrent save queue (5 parallel via `expo-media-library`)
- [x] Export destination: SnapsPort Album or Camera Roll picker
- [x] Free tier (50 memories) + RevenueCat paywall
- [x] Post-free-tier unlock path on complete screen (buy remaining without re-importing)
- [x] Multi-ZIP import with per-ZIP failure isolation (one bad ZIP no longer discards the rest)
- [x] Undated-photo grouping fallback (in-app ordering)
- [x] Cumulative save stats preserved across the free → paid resume
- [x] Cancel no longer bounces the user to the complete screen mid-flight
- [x] Purchase silent-failure now surfaces an alert instead of doing nothing
- [x] Migrated to `expo-media-library/legacy` (the bare API now throws at runtime in SDK 56)
- [x] Foreground notification handler updated to the SDK 56 API
- [x] Email app picker (ActionSheet of installed apps, Safari fallback)
- [x] Snapchat deep link with snapchat.com fallback
- [x] App review prompt (expo-store-review)
- [x] Debug mode with shortcuts for all screens and states (gated behind `__DEV__`)
- [x] EAS build config
