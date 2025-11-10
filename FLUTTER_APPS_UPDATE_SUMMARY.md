# Flutter Apps Update Summary

## Overview
Both Flutter apps (Driver and User) have been reviewed and updated for the new multi-school data structure.

---

## Changes Made

### 1. Driver App (`sa.ridewatch.driver/lib/dashboard.dart`)

#### Data Model Changes
**OLD Structure:**
```dart
String? _schoolId;  // Single school ID
```

**NEW Structure:**
```dart
List<String> _schoolIds = [];      // Array of school IDs
String? _selectedSchoolId;          // Currently selected school
```

#### Key Updates

**a) Updated `_loadSchoolIdFromUserDoc()` (lines 52-105)**
- Now reads `school_ids` array from Firestore user document
- Auto-selects first school if multiple schools are assigned
- Shows appropriate error messages if no schools are assigned

```dart
final schoolIdsRaw = data?['school_ids'];
List<String> schoolList = [];
if (schoolIdsRaw is List) {
  schoolList = schoolIdsRaw.map((e) => e.toString()).toList();
}
setState(() {
  _schoolIds = schoolList;
  _selectedSchoolId = schoolList.isNotEmpty ? schoolList.first : null;
});
```

**b) Updated `_driverDocRef()` (lines 128-140)**
- Uses `_selectedSchoolId` instead of `_schoolId`
- Builds Firestore path: `schools/{schoolId}/routes/{routeId}/active_drivers/{uid}`

**c) Updated StreamBuilder (line 320)**
- Changed from `.doc(_schoolId)` to `.doc(_selectedSchoolId)`
- Ensures routes are fetched for the currently selected school

**d) Added School Selector UI (lines 335-391)**
- **Only shows if driver has multiple schools** (`_schoolIds.length > 1`)
- Dropdown displays school names from Firestore
- When school is changed:
  - Updates `_selectedSchoolId`
  - Clears selected route
  - **Stops active route** (safety feature to prevent confusion)

```dart
if (_schoolIds.length > 1) ...[
  // School selector dropdown
  DropdownButtonFormField<String>(
    value: _selectedSchoolId,
    items: schools.map((doc) {
      final data = doc.data() as Map<String, dynamic>;
      final name = data['name']?.toString() ?? 'School';
      return DropdownMenuItem<String>(
        value: doc.id,
        child: Text(name),
      );
    }).toList(),
    onChanged: (newSchoolId) {
      setState(() {
        _selectedSchoolId = newSchoolId;
        _selectedRouteId = null;
        if (_routeActive) _stopRoute();
      });
    },
  )
]
```

---

### 2. User App (`sa.ridewatch.user/lib/dashboard.dart`)

#### Status: **NO CHANGES NEEDED** ✅

The User app already uses the correct data model for parents/students:

**Why it's correct:**
- Parents/students typically belong to **one school** only
- Uses singular `school_id` field (not an array)
- Joins schools via QR code or school code
- Data structure: `users/{uid}` → `{ school_id: "xyz", account_type: "user" }`

**Data Model Comparison:**

| App Type | Field Name | Type | Use Case |
|----------|-----------|------|----------|
| Driver App | `school_ids` | `List<String>` | Drivers work at multiple schools |
| User App | `school_id` | `String` | Parents/students belong to one school |

---

## Firestore Data Structure

### Driver Document (in `users` collection)
```json
{
  "uid": "driver_uid",
  "email": "driver@example.com",
  "account_type": "driver",
  "school_ids": ["school1_id", "school2_id"],  // Array of schools
  "status": "active"
}
```

### User Document (in `users` collection)
```json
{
  "uid": "user_uid",
  "email": "parent@example.com",
  "account_type": "user",
  "school_id": "school1_id",  // Single school
  "displayName": "John Doe"
}
```

### Active Driver Location (in Firestore)
```
schools/{schoolId}/routes/{routeId}/active_drivers/{driverUid}
```

---

## Next Steps: Testing the Apps

### Prerequisites
You need to set up Flutter development environment first. Follow the guide:
**📄 See: `FLUTTER_SETUP_GUIDE.md`**

### Quick Setup Checklist
1. ✅ Install Flutter SDK
2. ✅ Install Xcode (from App Store)
3. ✅ Install Xcode Command Line Tools
4. ✅ Install CocoaPods
5. ✅ Open iOS Simulator

### Testing Driver App

**Step 1: Navigate to driver app**
```bash
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.driver
```

**Step 2: Install dependencies**
```bash
flutter pub get
```

**Step 3: Run on iOS Simulator**
```bash
# Make sure simulator is running
open -a Simulator

# Run the app
flutter run
```

**Step 4: Test Multi-School Feature**
1. Login with a driver account that has multiple schools assigned
2. Verify the school dropdown appears at the top
3. Select different schools and verify routes update
4. Start a route on one school
5. Try switching schools - verify route stops automatically
6. Test with single-school driver - verify no dropdown shows

**Step 5: Test Single-School Driver**
1. Login with a driver that has only one school
2. Verify NO school dropdown appears
3. Verify routes load correctly
4. Test starting/stopping routes

### Testing User App

**Step 1: Navigate to user app**
```bash
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch.user
```

**Step 2: Install dependencies**
```bash
flutter pub get
```

**Step 3: Run on iOS Simulator**
```bash
flutter run
```

**Step 4: Test User Flow**
1. Login with Google account
2. If no school joined, verify "Join School" prompt appears
3. Test both join methods:
   - Enter school code manually
   - Scan QR code (you can use school QR from ReactJS admin panel)
4. Verify routes appear after joining
5. Select a route and verify it shows on map
6. When a driver starts a route, verify bus location updates in real-time

---

## Firebase Console Reminders

### Firestore Indexes
You may need to create composite indexes for multi-school queries:

**Index 1: Users by school_ids array**
```
Collection: users
Fields: school_ids (ARRAY), account_type (ASC)
```

**Index 2: Active drivers**
```
Collection: schools/{schoolId}/routes/{routeId}/active_drivers
Fields: isActive (ASC), lastUpdated (DESC)
```

If you get index errors when running the apps, Firebase will provide a direct link to create the required index.

---

## Expected App Behavior

### Driver App Scenarios

**Scenario 1: Driver with Multiple Schools**
```
1. App opens → Loads school_ids from Firestore
2. UI shows: [School Dropdown] → Select School
3. Driver selects "Lincoln High School"
4. Routes for Lincoln High appear below
5. Driver can switch to "Washington Middle School" anytime
```

**Scenario 2: Driver with One School**
```
1. App opens → Loads school_ids from Firestore
2. UI shows: No dropdown (auto-selects the only school)
3. Routes for that school appear immediately
```

**Scenario 3: Driver with No Schools**
```
1. App opens → Loads empty school_ids array
2. UI shows: "No schools assigned to your profile. Please contact admin."
```

### User App Scenarios

**Scenario 1: New Parent (No School Joined)**
```
1. App opens → Checks for school_id in user doc
2. UI shows: "Join Your School" modal
3. Parent scans QR or enters school code
4. school_id saved to Firestore
5. Routes for that school appear
```

**Scenario 2: Existing Parent (School Already Joined)**
```
1. App opens → Loads school_id from Firestore
2. Routes appear immediately
3. Parent selects a route
4. If driver is active on that route → bus marker appears on map
```

---

## Troubleshooting

### Issue: "Missing or insufficient permissions"
**Solution:** Make sure Firestore rules are deployed from ReactJS project
```bash
cd /Users/reyjenexito/Documents/GitHub/sa.ridewatch
firebase deploy --only firestore:rules
```

### Issue: "school_ids field not found"
**Solution:** Update driver user document in Firestore
```javascript
// In Firebase Console or via ReactJS admin:
users/{driverUid}:
{
  school_ids: ["school1_id", "school2_id"]  // Change from school_id to school_ids
}
```

### Issue: CocoaPods errors
```bash
cd ios
pod install
cd ..
flutter clean
flutter pub get
flutter run
```

### Issue: Flutter commands not found
```bash
# Add to ~/.zshrc
export PATH="$PATH:/usr/local/flutter/bin"

# Reload shell
source ~/.zshrc
```

---

## Summary of Changes

✅ **Driver App Updated**
- Multi-school support with dropdown selector
- Changed from `school_id` to `school_ids` array
- Auto-stops route when switching schools
- Handles single-school and no-school cases

✅ **User App Reviewed**
- No changes needed
- Already uses correct single `school_id` model
- Compatible with new architecture

✅ **Data Structure Aligned**
- Drivers: `school_ids` (array)
- Users: `school_id` (singular)
- Consistent with ReactJS admin panel

---

## Files Modified

1. `/sa.ridewatch.driver/lib/dashboard.dart` - Updated for multi-school support
2. `/sa.ridewatch.user/lib/dashboard.dart` - No changes (already correct)

---

## Questions?

If you encounter any issues:
1. Check Flutter installation: `flutter doctor`
2. Check Firebase rules are deployed
3. Verify user documents have correct fields (`school_ids` vs `school_id`)
4. Check Firestore indexes are created
5. Review console logs in Xcode or Flutter for specific errors

Happy testing! 🚀
