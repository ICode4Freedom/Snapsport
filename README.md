# SnapsPort

Export Snapchat memories directly to iCloud Photos. Zero server — data flows Snapchat ZIP → iPhone → iCloud Photos.

## Why it exists

Snapchat introduced a 5 GB free storage cap in September 2025, charging monthly beyond that. SnapsPort lets users request their data export, hand SnapsPort the ZIP, and get all memories saved to their photo library in minutes.

---

## Architecture

```
Snapchat dashboard
       ↓  (user requests export)
Snapchat email → ZIP(s) with jpg/mp4 files + embedded EXIF metadata
       ↓  (user opens ZIP in SnapsPort via Share / Files / picker)
SnapsPort
  - Extracts ZIP(s) (react-native-zip-archive)
  - Scans extracted dirs for jpg/jpeg/heic/png/mp4/mov files
  - Saves each file directly to Camera Roll or SnapsPort album (expo-media-library)
  - Cleans up extracted files after saving
       ↓
iCloud Photos (syncs automatically)
```

No backend, no account, no data ever leaves the device to our servers. No network requests — everything is local file I/O.

---

## Monetisation

- **Free tier:** first 50 memories export for free
- **Unlock:** $0.99 one-time via RevenueCat (StoreKit 2)
- The paywall appears on the processing screen before saving starts, and again on the complete screen if the user chose the free tier

---

## Local dev setup

### Prerequisites

- macOS (Xcode required for iOS builds)
- Node 18+ (tested on 25.x)
- CocoaPods (`sudo gem install cocoapods`)
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`) — only needed for TestFlight/App Store builds

### First-time setup

```bash
git clone https://github.com/ICode4Freedom/Snapsport.git
cd Snapsport
npm install
npx expo prebuild --platform ios   # generates ios/ directory + Podfile
cd ios && pod install && cd ..
```

### Run on device

```bash
npx expo run:ios --device
```

> **Note:** Expo Go does not work — the app uses native modules (`react-native-purchases`, `react-native-zip-archive`, `expo-media-library`) that require a full native build.

### Debug mode

In a dev build, a **⚙️ Debug shortcuts** panel appears at the bottom of the onboarding screen with four shortcuts:

| Button | What it does |
|--------|-------------|
| Processing | Loads 75 mock memories → processing screen (tests paywall + download) |
| Complete — all done | Jumps to 🎉 complete screen |
| Complete — with failures | Jumps to ⚠️ complete screen with 7 simulated failures |
| Import error alert | Shows the import failure Alert copy |

On the complete screen in debug mode, a toggle panel lets you switch between all-done / failures / unlock-card states live.

---

## Project structure

```
app/
  _layout.tsx        Entry point: RevenueCat init, incoming file URI handler
  index.tsx          Onboarding screen (3-step instructions)
  import.tsx         ZIP picker + extraction + media scan
  processing.tsx     Confirmation, paywall, destination picker, save progress
  complete.tsx       Success screen, unlock-remaining upsell, review/share

src/
  core/
    parser.ts        Scans extracted dirs for media files → MemoryItem[]
    downloader.ts    Concurrent save queue (5 parallel, copies to photo library)
    debugQueue.ts    Mock download queue for dev builds (~5s animated progress)
    revenuecat.ts    RevenueCat wrapper: init, purchase, restore, status check
  store/
    useStore.ts      Zustand store — all app state
  components/
    ProgressBar.tsx  Animated progress bar
    StepCard.tsx     Onboarding step card
  data/
    mockMemories.ts  75 mock MemoryItem objects for debug mode

app.json             iOS config: bundle ID, permissions, ZIP handler, URL schemes
eas.json             EAS build profiles (preview → TestFlight, production → App Store)
```

---

## Key files to know before contributing

### `src/core/parser.ts`

Scans extracted ZIP directories recursively for media files (`.jpg`, `.jpeg`, `.heic`, `.png`, `.mp4`, `.mov`). Parses dates from Snapchat export filenames (`2024-01-15 12-34-56 UTC.jpg`) or falls back to `new Date()`. EXIF metadata (date, location) is preserved by `expo-media-library` when files are saved to the photo library.

### `src/store/useStore.ts`

Single Zustand store. Key state:
- `isPurchased` — set from RevenueCat on startup and on purchase; intentionally NOT reset when user taps Done
- `debugMode` — true when launched via debug shortcut; resets on Done
- `exportDestination` — `'album'` | `'camera-roll'`, persists through a session
- `FREE_TIER_LIMIT` — exported constant, currently `50`

### `src/core/revenuecat.ts`

Replace `RC_API_KEY_IOS` with your actual key before shipping. Entitlement ID is `'unlock'` — must match what you create in the RevenueCat dashboard.

---

## Adding a new screen

1. Create `app/your-screen.tsx` with a default export React component
2. Navigate with `router.push('/your-screen')` or `router.replace('/your-screen')`
3. Expo Router picks it up automatically — no route registration needed

## Adding state

Add fields and actions to `src/store/useStore.ts`. If state should survive a "Done → restart" cycle, exclude it from the `reset()` action (like `isPurchased`).

---

## Environment / secrets

| Item | Where | Notes |
|------|-------|-------|
| RevenueCat iOS key | `src/core/revenuecat.ts` → `RC_API_KEY_IOS` | Get from app.revenuecat.com |
| App Store ID | `app/complete.tsx` → `APP_STORE_URL` | Available after first App Store submission |
| Apple Team ID | `eas.json` | Found in developer.apple.com |

None of these are committed — replace the `REPLACE_WITH_*` placeholders before building for production.

---

## Running a production build

```bash
# TestFlight (share with testers)
eas build --platform ios --profile preview

# App Store submission
eas build --platform ios --profile production
eas submit --platform ios
```
