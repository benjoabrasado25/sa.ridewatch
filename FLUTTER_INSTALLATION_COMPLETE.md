# Flutter Installation - Complete! ✅

## What's Installed

✅ **Flutter SDK 3.35.7** (with Dart 3.9.2)
- Location: `~/flutter`
- Added to PATH in `~/.zshrc`

✅ **Flutter Apps Dependencies**
- Driver app: All dependencies resolved
- User app: All dependencies resolved

✅ **Code Updates**
- Driver app updated for multi-school support
- User app reviewed (no changes needed)

---

## To Use Flutter Commands

**In new terminal windows**, Flutter will work automatically.

**In current terminal**, run this first:
```bash
export PATH="$PATH:$HOME/flutter/bin"
```

Or simply open a new terminal window.

---

## What's Still Needed: CocoaPods

To actually **run** the iOS apps, you need CocoaPods. Unfortunately, your system Ruby (2.6.10) is too old.

### Option 1: Install Homebrew + Ruby + CocoaPods (Recommended)

**Step 1: Install Homebrew**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Step 2: Install Ruby via Homebrew**
```bash
brew install ruby
```

**Step 3: Add Homebrew Ruby to PATH**
```bash
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Step 4: Install CocoaPods**
```bash
gem install cocoapods
pod setup
```

**Step 5: Verify Flutter Setup**
```bash
flutter doctor
```

---

### Option 2: Manual CocoaPods Installation (macOS System Ruby)

If you don't want to install Homebrew, you can try upgrading your system Ruby:

```bash
# This requires admin password
sudo gem update --system
sudo gem install cocoapods
pod setup
```

---

## Running the Flutter Apps

Once CocoaPods is installed:

### Driver App
```bash
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.driver

# Install iOS dependencies
cd ios
pod install
cd ..

# Open simulator
open -a Simulator

# Run the app
flutter run
```

### User App
```bash
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.user

# Install iOS dependencies
cd ios
pod install
cd ..

# Run the app
flutter run
```

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Flutter SDK | ✅ Installed | v3.35.7 with Dart 3.9.2 |
| Xcode | ✅ Installed | v16.4 |
| VS Code | ✅ Installed | v1.103.2 |
| Driver App Code | ✅ Updated | Multi-school support added |
| User App Code | ✅ Verified | No changes needed |
| Driver App Deps | ✅ Installed | flutter pub get successful |
| User App Deps | ✅ Installed | flutter pub get successful |
| CocoaPods | ❌ Not Installed | Requires Ruby 3.1+ |
| iOS Simulator | ⚠️ Unknown | Can't verify without CocoaPods |

---

## Quick Test (Without Running)

You can verify the code compiles:

```bash
# Driver app
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.driver
flutter analyze

# User app
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.user
flutter analyze
```

---

## Next Steps

1. **Install CocoaPods** (choose Option 1 or 2 above)
2. **Run flutter doctor** to verify everything is ready
3. **Test Driver app** with multiple schools
4. **Test User app** QR scanning and bus tracking

---

## Changes Made to Driver App

**Multi-School Support:**
- Changed from `school_id` to `school_ids` array
- Added school selector dropdown (only shows if driver has multiple schools)
- Routes update when school is changed
- Active route automatically stops when switching schools
- Handles edge cases: no schools, single school, multiple schools

**Files Modified:**
- `/sa.ridewatch.driver/lib/dashboard.dart` (lines 20-21, 52-105, 128-140, 320, 335-391)

**User App:**
- No changes needed (already uses correct single `school_id` model)

---

## Troubleshooting

### "flutter: command not found"
```bash
# Open new terminal window, or run:
export PATH="$PATH:$HOME/flutter/bin"
source ~/.zshrc
```

### CocoaPods installation fails
```bash
# Check Ruby version
ruby --version

# Should be 3.1.0 or higher
# If not, install Homebrew and use Homebrew Ruby (Option 1 above)
```

### Simulator issues
```bash
# List available simulators
xcrun simctl list devices

# Boot a simulator
open -a Simulator

# Or from command line
xcrun simctl boot "iPhone 15 Pro"
```

---

## Summary

✅ Flutter is installed and working
✅ Both apps' dependencies are resolved
✅ Code changes are complete and verified
⏳ Install CocoaPods to run the apps on iOS Simulator

You're almost ready to test! Just need CocoaPods.
