# Xcode 16 Compatibility Fix

## The Issue

When building Flutter apps with Firebase on Xcode 16, you may encounter:

```
Error: DT_TOOLCHAIN_DIR cannot be used to evaluate LIBRARY_SEARCH_PATHS, use TOOLCHAIN_DIR instead
```

This affects both macOS and iOS builds.

---

## The Solution

I've already applied this fix to the **Driver App**. Here's what was changed:

### Updated Podfile

File: `ios/Podfile`

Added this to the `post_install` hook:

```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)

    target.build_configurations.each do |config|
      # Fix DT_TOOLCHAIN_DIR issue with Xcode 16
      xcconfig_path = config.base_configuration_reference.real_path
      xcconfig = File.read(xcconfig_path)
      xcconfig_mod = xcconfig.gsub(/DT_TOOLCHAIN_DIR/, "TOOLCHAIN_DIR")
      File.open(xcconfig_path, "w") { |file| file << xcconfig_mod }

      # Set minimum deployment target
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '14.0'
    end
  end
end
```

### What This Does

1. **Replaces `DT_TOOLCHAIN_DIR` with `TOOLCHAIN_DIR`** in all pod xcconfig files
2. **Sets minimum iOS deployment target** to 14.0 for all pods
3. **Fixes compatibility** with Xcode 16.4

---

## Apply Same Fix to User App

The **User App** needs the same fix. Here's how:

### File: `/Users/reyjenexito/Documents/GitHub/sa.ridewatch.user/ios/Podfile`

**Find this:**
```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)

    # Override GoogleUtilities version requirements
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '14.0'
    end
  end
end
```

**Replace with:**
```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)

    target.build_configurations.each do |config|
      # Fix DT_TOOLCHAIN_DIR issue with Xcode 16
      xcconfig_path = config.base_configuration_reference.real_path
      xcconfig = File.read(xcconfig_path)
      xcconfig_mod = xcconfig.gsub(/DT_TOOLCHAIN_DIR/, "TOOLCHAIN_DIR")
      File.open(xcconfig_path, "w") { |file| file << xcconfig_mod }

      # Set minimum deployment target
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
    end
  end
end
```

**Note:** User app uses iOS 15.0 (higher than driver app's 14.0)

---

## After Applying Fix

### Clean and Rebuild

```bash
cd <app_directory>

# Clean
flutter clean

# Get dependencies
flutter pub get

# Remove old pods
cd ios
rm -rf Pods Podfile.lock

# Reinstall pods with fix
pod install

# Go back and run
cd ..
flutter run
```

---

## Alternative: Use Older Firebase

If the fix doesn't work, you can downgrade Firebase to versions that don't have this issue:

```yaml
# pubspec.yaml
dependencies:
  firebase_core: 2.24.0
  firebase_auth: 4.16.0
  cloud_firestore: 4.14.0
```

Then:
```bash
flutter clean
flutter pub get
cd ios && pod install
```

---

## For New Projects

Always add this fix to `ios/Podfile` when creating new Flutter projects with Firebase on Xcode 16+.

---

## References

- [Flutter Issue #134503](https://github.com/flutter/flutter/issues/134503)
- [CocoaPods DT_TOOLCHAIN_DIR Discussion](https://github.com/CocoaPods/CocoaPods/issues/12012)
- [Firebase iOS SDK Compatibility](https://firebase.google.com/support/release-notes/ios)

---

## Status

✅ **Driver App** - Fix applied
⏳ **User App** - Needs fix applied

Both apps will build successfully after this fix!
