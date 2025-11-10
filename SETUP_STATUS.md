# Flutter Setup Status

## ✅ READY TO RUN

### Driver App (`sa.ridewatch.driver`)
**Status:** Fully configured and ready!

**What's Done:**
- ✅ Flutter dependencies installed
- ✅ CocoaPods dependencies installed
- ✅ Multi-school support implemented
- ✅ School selector dropdown added
- ✅ Code compiles successfully

**To Run:**
```bash
# Open Terminal and run:
export PATH="$HOME/.gem/ruby/2.6.0/bin:$HOME/flutter/bin:$PATH"
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.driver

# Open iOS Simulator
open -a Simulator

# Run the app
flutter run
```

**Features:**
- Drivers with multiple schools see a dropdown to switch schools
- Routes update based on selected school
- Active route stops automatically when switching schools
- Works with email/password authentication

---

## ⚠️ NEEDS FIXING

### User App (`sa.ridewatch.user`)
**Status:** Has iOS dependency conflicts

**Issue:** Google Sign In SDK (version 8.0) requires GoogleUtilities 8.0, but Firebase SDK (version 10.25) requires GoogleUtilities 7.x. These are incompatible.

**Why This Happens:**
- User app uses Google Sign In for parent authentication
- Driver app doesn't use Google Sign In (uses email/password instead)
- iOS SDKs have strict version requirements

---

## 🔧 Solution Options

### Option 1: Run Driver App Only (Quickest)
Since the driver app is fully working, you can test all the multi-school features there:
```bash
flutter run
# Select your driver test account
# Test switching between schools
# Test starting/stopping routes
```

### Option 2: Fix User App Dependencies (Recommended)

**Step A: Update to Latest Firebase**

Edit `/Users/reyjenexito/Documents/GitHub/sa.ridewatch.user/pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^4.0.0      # Latest
  firebase_auth: ^6.0.0       # Latest
  google_sign_in: ^7.0.0      # Latest
  cloud_firestore: ^6.0.0     # Latest
  google_maps_flutter: ^2.5.0
  geolocator: ^10.1.0
  mobile_scanner: ^7.0.0      # Latest
  cupertino_icons: ^1.0.8
```

**Step B: Clean and Reinstall**
```bash
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.user

# Clean everything
flutter clean
rm -rf ios/Pods ios/Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Get latest dependencies
flutter pub get
cd ios
pod install
cd ..

# Run
flutter run
```

**Step C: If Still Failing**
```bash
# Upgrade CocoaPods
gem install --user-install cocoapods

# Try again
cd ios
pod repo update
pod install
```

### Option 3: Remove Google Sign In (Alternative)

If you can't resolve the dependency conflict, you could temporarily remove Google Sign In and use email/password authentication instead (like the driver app):

1. Remove `google_sign_in` from pubspec.yaml
2. Update `lib/main.dart` to use `FirebaseAuth.instance.signInWithEmailAndPassword()`
3. This makes both apps consistent

---

## Current System Status

| Component | Status |
|-----------|--------|
| Flutter SDK | ✅ 3.35.7 installed |
| Dart | ✅ 3.9.2 |
| CocoaPods | ✅ 1.12.1 installed |
| Xcode | ✅ 16.4 |
| iOS Simulator | ✅ Available |
| **Driver App** | ✅ **READY TO RUN** |
| **User App** | ⚠️ Needs dependency fix |

---

## Testing the Driver App

Once you run the driver app:

1. **Login** with a driver account
2. **Multiple Schools**: If the driver has multiple schools assigned, you'll see a dropdown at the top
3. **Select School**: Choose a school from the dropdown
4. **Routes**: Routes for that school will appear below
5. **Start Route**: Select a route and tap "Start Route"
6. **Switch Schools**: Try switching to another school - the active route will stop automatically
7. **Single School**: If the driver only has one school, no dropdown shows (auto-selected)

---

## ReactJS Admin Panel Integration

The driver app reads data from Firestore in this structure:
```
users/{driverUid}:
  {
    school_ids: ["school1", "school2"],  // Array of school IDs
    account_type: "driver"
  }

schools/{schoolId}/routes/{routeId}:
  {
    name: "Route A",
    from: "North Campus",
    to: "Main Building"
  }
```

Make sure you:
1. Invite drivers from ReactJS admin panel
2. Assign them to multiple schools
3. The driver app will automatically load those schools

---

## Quick Commands Reference

```bash
# Set PATH for current terminal
export PATH="$HOME/.gem/ruby/2.6.0/bin:$HOME/flutter/bin:$PATH"

# OR reload shell config (applies to all new terminals)
source ~/.zshrc

# Check Flutter status
flutter doctor

# Run driver app
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.driver
flutter run

# Run user app (after fixing dependencies)
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.user
flutter run

# View connected devices
flutter devices

# Clean project
flutter clean
```

---

## Next Steps

1. **Test Driver App First** - It's ready to go!
2. **Fix User App** - Try Option 2 above
3. **Deploy to Real Device** - Once working in simulator, deploy to actual iPhone/iPad
4. **Test Full Flow** - Driver starts route → Parent app shows bus location

---

Need help? Check these files:
- `FLUTTER_INSTALLATION_COMPLETE.md` - Full installation details
- `FLUTTER_APPS_UPDATE_SUMMARY.md` - Code changes explained
- `firestore.rules` - Make sure rules are deployed to Firebase

Good luck testing! 🚀
