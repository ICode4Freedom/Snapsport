# SnapsPort — Launch Checklist

## Day 1 — Get it running locally
```bash
cd snapsport
npm install
npx expo start
```
Scan QR with Expo Go to test on your iPhone immediately (no Xcode needed yet).

## Day 1 blocker — real IAP
The unlock flow in `app/processing.tsx` currently shows a fake alert.
Replace with RevenueCat:
1. Create account at revenuecat.com
2. `npm install react-native-purchases`
3. Set up "snapsport_unlock_all" product in App Store Connect ($0.99 non-consumable)
4. Replace the `handleUnlock` function in `app/processing.tsx`

## Day 2 — TestFlight build
```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile preview
```
Share TestFlight link with 5 friends for real-device testing.

## Day 3 — App Store assets needed
- [ ] App icon (1024x1024 PNG, no transparency)
- [ ] 6.7" screenshots (iPhone 15 Pro Max): onboarding, import, progress, complete
- [ ] App description (use urgency: "Snapchat storage fees are here")
- [ ] Keywords: snapchat memories export, save snapchat photos, icloud photos transfer

## Day 4–5 — Submit
Fill in `eas.json` with your Apple ID, team ID, and ASC App ID, then:
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

## Day 5–7 (while in App Store review) — Organic distribution
Post to these communities immediately:
- r/DataHoarder — technical users, they'll validate it works
- r/snapchat — your actual users
- r/LifeHacks — broad reach
- Twitter/X with hashtag #SnapchatMemories

Fork https://github.com/ToTheMax/Snapchat-All-Memories-Downloader and publish
the Python CLI variant as open source (points back to this app in README).

## Architecture notes
- Zero server required. Data path: Snapchat S3 → iPhone → iCloud Photos.
- 5 concurrent downloads, 3 retries per file, auto-creates "SnapsPort" album.
- Pre-signed URLs from Snapchat expire ~7 days after export email — warn users.
- `memories_history.json` format: `{ "Saved Media": [{ "Date", "Media Type", "Download Link" }] }`
- When Michael provides a real export JSON, verify the schema against `src/core/parser.ts`.
