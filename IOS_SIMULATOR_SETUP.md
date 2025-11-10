# iOS Simulator Setup Guide

## Issue

Flutter can't find iOS simulators because the simulator runtimes aren't installed in Xcode yet.

```
✗ Unable to get list of installed Simulator runtimes.
```

## Solution: Install iOS Simulator Runtimes

### Option 1: Via Xcode GUI (Easiest)

1. **Open Xcode**
   ```bash
   open -a Xcode
   ```

2. **Go to Settings**
   - Click **Xcode** in the menu bar
   - Select **Settings...** (or **Preferences** on older versions)

3. **Navigate to Platforms**
   - Click the **Platforms** tab at the top

4. **Download iOS Simulator**
   - Find **iOS** in the list
   - Click the **GET** or **Download** button next to it
   - This will download the latest iOS simulator runtime (~8-10 GB)
   - Wait for download to complete

5. **Verify Installation**
   ```bash
   flutter doctor
   ```

   You should now see iOS simulators available!

---

### Option 2: Via Command Line

**List available simulators:**
```bash
xcodebuild -downloadPlatform iOS
```

**Or install specific iOS version:**
```bash
# For iOS 18 (latest)
xcrun simctl runtime add "iOS"
```

---

## After Installation

### Start a Simulator

**Option A: Via Flutter**
```bash
flutter emulators
# Shows list of available emulators

flutter emulators --launch <emulator_id>
# Launches specific emulator
```

**Option B: Via Command Line**
```bash
# List all simulators
xcrun simctl list devices

# Boot a specific one (e.g., iPhone 15 Pro)
open -a Simulator
```

**Option C: Via Xcode**
```bash
open -a Xcode
# Then: Window > Devices and Simulators > Simulators
# Right-click a device and select "Open Simulator"
```

---

## Running Your Flutter Apps

### Driver App

Once simulators are installed:

```bash
# Terminal 1: Start simulator
open -a Simulator

# Terminal 2: Run app
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.driver
flutter run
```

Flutter will automatically detect the running simulator and deploy the app!

### User App

```bash
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.user
flutter run
```

---

## Expected Simulator List

After installation, you should see something like this:

```bash
$ flutter devices

Found 3 connected devices:
  iPhone 15 Pro (mobile)  • <UUID> • ios • iOS 18.0 (simulator)
  macOS (desktop)         • macos  • darwin-x64 • macOS 15.5
  Chrome (web)            • chrome • web-javascript • Chrome
```

---

## Troubleshooting

### "Simulator is not available"

1. **Check Xcode version**
   ```bash
   xcodebuild -version
   # Should show Xcode 16.4
   ```

2. **Reset Xcode command line tools**
   ```bash
   sudo xcode-select --reset
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   ```

3. **Verify Xcode license**
   ```bash
   sudo xcodebuild -license accept
   ```

### "Unable to boot simulator"

1. **Kill existing simulators**
   ```bash
   killall Simulator
   xcrun simctl shutdown all
   ```

2. **Erase and reset**
   ```bash
   xcrun simctl erase all
   ```

3. **Try again**
   ```bash
   open -a Simulator
   ```

### Download is stuck

1. **Check storage space**
   - iOS simulator needs ~10 GB
   - Check: **Apple menu > About This Mac > Storage**

2. **Restart Xcode**
   - Quit Xcode completely
   - Reopen and try downloading again

3. **Clear Xcode cache**
   ```bash
   rm -rf ~/Library/Developer/Xcode/iOS\ DeviceSupport/*
   rm -rf ~/Library/Caches/com.apple.dt.Xcode/*
   ```

---

## Quick Start Commands

```bash
# 1. Install iOS Simulator via Xcode GUI (see steps above)

# 2. Verify installation
flutter doctor

# 3. List simulators
flutter devices

# 4. Run driver app
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.driver
open -a Simulator
flutter run

# 5. Run user app
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.user
flutter run
```

---

## Alternative: Test on Real iPhone/iPad

If you have a physical iOS device:

1. **Connect via USB**
2. **Trust the computer** on your device
3. **Run:**
   ```bash
   flutter devices
   # Your device should appear

   flutter run -d <your_device_id>
   ```

---

## Current Status

| Component | Status |
|-----------|--------|
| Xcode | ✅ 16.4 Installed |
| iOS Simulator Runtimes | ❌ Not Installed |
| Flutter SDK | ✅ 3.35.7 |
| CocoaPods | ✅ 1.12.1 |
| Driver App Code | ✅ Ready |
| User App Code | ✅ Fixed |

**Next Step:** Install iOS Simulator via Xcode Settings > Platforms

---

Once iOS simulator is installed, both apps are ready to run! 🚀
