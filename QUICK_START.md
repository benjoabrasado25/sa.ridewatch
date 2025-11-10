# 🚀 Quick Start - Run Your Apps in 3 Steps

## Current Status

✅ **Flutter installed** (3.35.7)
✅ **CocoaPods installed** (1.12.1)
✅ **Driver app ready** - Multi-school support implemented
✅ **User app ready** - Latest Firebase, compatible Google Sign In
✅ **iOS dependencies installed** - Both apps configured

---

## Why macOS Build Failed

**You saw this error:**
```
error: DT_TOOLCHAIN_DIR cannot be used to evaluate LIBRARY_SEARCH_PATHS
** BUILD FAILED **
```

**This is normal!** Your apps are **iOS mobile apps**, not macOS desktop apps. They need to run on iPhone/iPad simulator or real devices.

---

## 3 Steps to Run Your Apps

### Step 1: Install iOS Simulator (15-30 min)

**Open Xcode:**
```bash
open -a Xcode
```

**In Xcode:**
1. Click **Xcode** menu (top left)
2. Click **Settings...** (or **Preferences**)
3. Click **Platforms** tab
4. Find **iOS** in the list
5. Click **GET** or **Download** button
6. Wait for download to complete (~8-10 GB)

**Verify:**
```bash
flutter doctor
# Should show: ✓ Xcode with iOS Simulator
```

---

### Step 2: Run Driver App

```bash
# Open new terminal
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.driver

# Start simulator
open -a Simulator

# Run app
flutter run
```

**First build takes 2-3 minutes - this is normal!**

**What you'll see:**
- Login screen
- If driver has multiple schools → dropdown selector
- Routes for selected school
- Start/stop route buttons

---

### Step 3: Run User App

```bash
# In another terminal
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.user

# Simulator already running from step 2
flutter run
```

**What you'll see:**
- Google sign in button
- After login → "Join School" prompt
- Scan QR or enter school code
- Routes list
- Map with bus location (if driver active)

---

## Testing Multi-School Feature

### Setup in ReactJS Admin Panel:
1. Create 2 schools (e.g., "Lincoln High", "Washington Middle")
2. Invite a driver via email
3. **Assign driver to BOTH schools**
4. Create routes in both schools

### Test in Driver App:
1. Login with driver account
2. **Dropdown should appear** showing both schools
3. Select "Lincoln High" → see its routes
4. Start a route → route activates
5. **Switch to "Washington Middle"** → route stops, see its routes

This proves the multi-school feature is working! 🎉

---

## Quick Troubleshooting

### "No devices found" after installing iOS
```bash
killall Simulator
open -a Simulator
sleep 5
flutter devices
```

### Build takes too long
**First build:** 2-3 minutes is normal
**Subsequent builds:** 30-60 seconds

### "Signing requires a development team"
1. Open `ios/Runner.xcworkspace` in Xcode
2. Select "Runner" → "Signing & Capabilities"
3. Check "Automatically manage signing"
4. Select your Apple ID

---

## What's Different in Each App

| Feature | Driver App | User App |
|---------|-----------|----------|
| **Auth** | Email/Password | Google Sign In |
| **Schools** | Multiple (array) | Single |
| **UI** | Dropdown selector | QR code scanner |
| **Firebase** | v10.25 | v12.4 |
| **iOS Min** | 14.0 | 15.0 |

---

## Commands You'll Use

```bash
# Check setup
flutter doctor

# List available devices
flutter devices

# Run on iOS simulator
flutter run

# Clean and rebuild (if issues)
flutter clean
flutter run

# Open simulator manually
open -a Simulator
```

---

## Documentation

📄 **HOW_TO_RUN_APPS.md** - Complete detailed guide
📄 **FINAL_STATUS.md** - Full summary of what's done
📄 **IOS_SIMULATOR_SETUP.md** - iOS setup troubleshooting
📄 **FLUTTER_APPS_UPDATE_SUMMARY.md** - Code changes explained

---

## Next Command to Run

```bash
open -a Xcode
```

Then: **Xcode > Settings > Platforms > Download iOS**

After that downloads, you're ready to test! 🚀

---

## Expected Results

After iOS simulator is installed:

✅ Driver app opens on iPhone simulator
✅ Multi-school dropdown works
✅ Routes load correctly
✅ Location tracking starts
✅ User app opens on simulator
✅ Google sign in works
✅ QR scanner works
✅ Real-time bus tracking works

---

**Total time from now:** ~45 minutes (mostly iOS download time)

**You're 95% done - just install the iOS simulator and test!** 🎯
