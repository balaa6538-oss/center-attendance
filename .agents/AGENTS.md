# Cloud Sync & Data Integrity Rule

Whenever you are asked to add a new feature that involves storing data (e.g., a new table, a new module, a new type of record), you MUST ensure the following three steps are completed to maintain Data Integrity:

1. **Storage Layers:**
   - Define a unique key for the data (e.g., `K_NEW_FEATURE`).
   - Add it to the local IndexedDB saving process (`secureSave` inside `saveAll` and `saveAttendanceOnly`).
   - Add it to the Firebase Upload payload inside `saveAll()` and `saveAttendanceOnly()`.
   - Add it to the Firebase Download/Merge logic inside `loadAll()` and the real-time listener `onValue`.

2. **Cloud Data Monitor Visibility:**
   - You MUST add the new data entity to the `CLOUD_MONITOR_SECTIONS` array at the end of `app.js`.
   - This array powers the "Cloud Data Monitor" dashboard, ensuring the manager can always visually verify that the local data count matches the Firebase data count.

**NEVER skip adding a new data entity to `CLOUD_MONITOR_SECTIONS`. The user relies on this dashboard to verify that you did your job correctly.**
