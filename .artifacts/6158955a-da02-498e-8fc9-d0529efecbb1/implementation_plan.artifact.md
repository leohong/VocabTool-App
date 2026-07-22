# Test VocabTool-v1.0.apk on Device

The goal is to install and run the `VocabTool-v1.0.apk` file on the connected Android device/emulator.

## User Review Required

> [!IMPORTANT]
> I will be installing the APK on the connected device `emulator-5554`. If you intended to use a different physical device, please ensure it is connected and recognized by `adb`.

## Proposed Changes

### Execution Steps

1. **Verify APK Location**: The APK is located at `E:\ProjectCode\VocabTool-App\VocabTool-v1.0.apk`.
2. **Install APK**: Use `adb install` to deploy the APK to the device.
3. **Launch Application**: Use `adb shell monkey` or `adb shell am start` to launch the app after installation.

## Verification Plan

### Manual Verification
- Confirm that the installation completes successfully.
- Verify that the application launches on the device screen.
