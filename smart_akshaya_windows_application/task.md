# Smart Akshaya QA & Feature Testing Checklist

This checklist is designed to help verify that all features in the application are working correctly.

## 1. Authentication & App Start
- `[ ]` App launches successfully without crashing.
- `[ ]` **Login Screen:** User can log in with valid credentials.
- `[ ]` **Login Screen:** User sees appropriate error messages for invalid credentials.
- `[ ]` **Login Screen:** User is correctly navigated to the main dashboard upon successful login.

## 2. Main Navigation & Dashboard
- `[ ]` **Main Navigation:** Side drawer/bottom navigation bar items map to the correct screens.
- `[ ]` **Dashboard Screen:** Data summary, charts, or recent activities load correctly.
- `[ ]` **Dashboard Screen:** Pull-to-refresh or data reloading works if applicable.

## 3. New Entry (`new_entry_screen.dart`)
- `[ ]` Form elements load correctly (Dropdowns, text fields).
- `[ ]` Selecting a service auto-populates the correct charge/fee (if applicable).
- `[ ]` Date picker functions correctly and allows selecting past/current dates.
- `[ ]` Form validation works correctly (prevents submission if required fields are missing).
- `[ ]` Submitting a new entry successfully saves the data locally and synchronizes to Google Sheets.
- `[ ]` Offline sync: Entries created offline are saved as `Pending Sync` and sync when online.
- `[ ]` After submission, form resets or navigates appropriately.

## 4. Master Services (`master_services_screen.dart`)
- `[ ]` List of existing services loads correctly.
- `[ ]` **Add Service:** User can create a new service with all required fields (name, cost, etc.).
- `[ ]` **Edit Service:** User can edit details of an existing service and save changes.
- `[ ]` **Delete Service:** User can delete a service and see it removed from the list.
- `[ ]` Changes made here reflect correctly in the 'New Entry' dropdowns.
- `[ ]` Service sync logic functions according to the offline-first Google Sheets strategy.

## 5. Staff Management (`staff_management_screen.dart`)
- `[ ]` List of existing staff members loads correctly.
- `[ ]` **Add Staff:** User can add a new staff member.
- `[ ]` **Edit Staff:** User can update staff details.
- `[ ]` **Delete/Deactivate Staff:** User can remove or deactivate a staff member.

## 6. Expenses (`expenses_screen.dart`)
- `[ ]` Expenses list loads correctly.
- `[ ]` **Add Expense:** User can record a new expense with amount, category, and date.
- `[ ]` Validation ensures amount is valid and required fields are filled.
- `[ ]` Saved expenses are correctly displayed in the expenses list.

## 7. Service Reports (`service_reports_screen.dart`)
- `[ ]` Report generation UI loads correctly.
- `[ ]` Date range filters work properly (Start Date to End Date).
- `[ ]` Reports accurately reflect the entries added via the 'New Entry' feature.
- `[ ]` Export or print functionality (if any) works correctly.

## 8. Saved Bills (`saved_bills_screen.dart`)
- `[ ]` List of generated/saved bills loads correctly.
- `[ ]` Tapping a bill successfully opens or previews the bill document (PDF or Image).
- `[ ]` Searching or filtering saved bills works as expected.

## 9. Application Forms (`application_forms_screen.dart`)
- `[ ]` List of forms or form categories loads correctly.
- `[ ]` Forms open and display correctly.
- `[ ]` Any associated download or print actions function as intended.

## 10. Utilities (Photo & Resizer)
- `[ ]` **Passport Photo:** User can select an image or take a photo.
- `[ ]` **Passport Photo:** Cropping/Formatting functions correctly.
- `[ ]` **Photo Resizer:** User can select an image and resize it to desired dimensions/file size.
- `[ ]` Processed/Resized photos save correctly to the device.

## 11. General & Architecture Rules (ruler.md)
- `[ ]` **Offline Operations:** All CRUD operations immediately work offline using local cache.
- `[ ]` **Network Recovery:** Background sync reliably pushes all `Pending Sync` records to Google Sheets when internet is restored.
- `[ ]` State management correctly updates UI across different screens.
