# Android apps

Each game is packaged as its own Android app with [Capacitor](https://capacitorjs.com/).
The game's web files are bundled into the app, so it runs fully offline.

```
apps/
  build-www.mjs          copies a game + utilities/ into <app>/www
  keystore.properties    upload-key passwords (NOT in git; see below)
  2048/                  io.github.selvalogesh.game2048
  snake/                 io.github.selvalogesh.snake
    capacitor.config.json
    android/             native project (committed)
    assets/              icon & splash sources for @capacitor/assets
    store/               Play listing text, graphics, screenshots
```

## Prerequisites

- Node 22+
- Android SDK (Android Studio, or cmdline-tools in `%LOCALAPPDATA%\Android\Sdk`)
- JDK 21 (e.g. Temurin 21) as `JAVA_HOME`. Android Studio's bundled JBR is Java 25,
  which Gradle 8.14 can't run on.

## Build a release bundle

```sh
cd apps/2048            # or apps/snake
npm install
npm run bundle          # -> android/app/build/outputs/bundle/release/app-release.aab
```

`npm run apk` builds an installable APK instead (`android/app/build/outputs/apk/release/`),
handy for testing on a phone with `adb install`.

For a new release, bump `versionCode` (must increase) and `versionName` in
`android/app/build.gradle`.

## Signing

Release builds are signed with the upload key referenced by `apps/keystore.properties`:

```properties
storeFile=C:/Users/<you>/.android-keys/arcade-games-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

The same upload key is used for every game. Google Play re-signs apps with its own
app-signing key. **Back up the `.jks` file and its password.** If it's lost, you can
request an upload key reset in Play Console, but that takes time.

## Adding the next game

1. Copy `apps/2048` to `apps/<game>` (skip `node_modules`, `www`, `android`).
2. Update `appId`/`appName` in `capacitor.config.json` and the game folder in `package.json`'s `build` script.
3. `npm install && npm run build && npx cap add android`, then repeat the `android/` tweaks
   (signing block in `app/build.gradle`, no INTERNET permission, splash colour in `styles.xml`).
   The generated files only differ from `apps/2048/android` by those tweaks and the app ID, so
   copying `app/build.gradle` (with the ID changed), `AndroidManifest.xml` and `styles.xml` works.
4. Regenerate icons: `node store/render-assets.mjs && npm run icons`.
5. Add the game's name to `privacy-policy.html` at the repo root.
