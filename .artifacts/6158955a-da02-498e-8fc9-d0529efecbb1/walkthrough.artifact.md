# Walkthrough: APK Testing on Device

I have successfully installed and launched the `VocabTool-v1.0.apk` on the connected emulator.

## Changes Made
- Installed `VocabTool-v1.0.apk` using `adb install`.
- Launched the application using `adb shell monkey`.

## Verification Results

### Automated Tests
- `adb install` returned `Success`.
- `adb shell monkey` successfully injected the launch event.

### Manual Verification
- Verified that `com.vocabtool.app` is the active package and `MainActivity` is in focus.
- Visually confirmed the app is running on the device.

> [!NOTE]
> The app is currently showing the initial splash/logo screen.
