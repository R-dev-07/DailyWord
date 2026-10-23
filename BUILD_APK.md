# Building the DailyWord APK

The APK is a universal build (arm64, armv7, x86, x86_64), so it installs on any Android phone or tablet.
Release builds are signed with the standard debug key, which is fine for sideloading and sharing.
For Google Play you need your own upload key and an app bundle (`production` profile).

## Option A: GitHub Actions (no Expo account)
1. Create a GitHub repository and push this folder (`node_modules` and `android` are git-ignored).
2. Open the repository's **Actions** tab, choose **Build Android APK**, click **Run workflow**.
3. When it finishes (about 10 to 20 minutes), download the **DailyWord-apk** artifact and unzip it.

## Option B: EAS Build (Expo account)
```
npm install
npx eas-cli login
npm run build:apk
```
EAS prints a download link / QR code for the APK when the build finishes.

## Option C: Your own computer
Needs JDK 17 and the Android SDK.
```
npm install
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```
The APK is at `android/app/build/outputs/apk/release/app-release.apk`.

## Installing
Copy the APK to the phone, open it, and allow "Install unknown apps" for your file manager or browser when asked.

## Notes
- First launch imports the bundled KJV into the local database; this takes a few seconds once.
- Other Bible versions are downloaded on demand and need an internet connection the first time.
- Daily reminders ask for notification permission when first switched on.
- Read aloud uses the phone's own text-to-speech engine. Other languages need a matching voice installed in Android Settings > Text-to-speech.
- Bump `expo.android.versionCode` (and `version`) in `app.json` for each new release.
- Built for Expo SDK 57. If you add packages, use `npx expo install <package>` so versions stay aligned with the SDK.
