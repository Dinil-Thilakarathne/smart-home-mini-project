# Smart Home Monitoring and Control System

**Course:** SCS 3311: Mobile Application Design and Development  
**Project:** Smart Home Monitoring and Control System Mini-Project  
**Date:** 14 August 2026

## 1. Project Overview

This project is a smart-home monitoring and control system with three connected parts:

- An Expo mobile application for monitoring floors, controlling devices, configuring automation, viewing cameras, reviewing activity, and exporting device logs.
- A Next.js hardware simulator that represents the home devices and can make external device changes.
- Firebase Firestore and Cloud Functions for shared real-time data, trusted safety automation, schedules, alerts, usage records, and device audit logs.

The system demonstrates multiple floors, outlets, lights, irons, multi-switch units, and cameras. Device status values are `ON`, `OFF`, `ERROR`, and `DISCONNECTED`.

## 2. Architecture

```text
Expo Mobile App <---- real-time listeners and validated writes ----> Firestore <---- real-time listeners and validated writes ----> Next.js Hardware Simulator
                                      ^
                                      |
                         Firebase Cloud Functions
             safety cutoff, scheduling, usage, alerts, audit logs
                                      ^
                                      |
                   Local automation worker during development
```

Firestore is the real-time source of truth. The mobile app and simulator both subscribe to the same household data. Cloud Functions own backend safety and schedule outcomes, ensuring that automated actions are not controlled only by the mobile client.

## 3. Firestore Data Model

| Collection | Purpose | Important fields |
| --- | --- | --- |
| `households/{id}/floors` | Floor definitions | `name`, `order`, `gridColumns`, `gridRows` |
| `households/{id}/devices` | Device state, health, position, capabilities | `type`, `status`, `health`, `position`, `capabilities`, `lastChangedSource` |
| `devices/{id}/switches` | Individual gang-box switches | `name`, `index`, `status`, `updatedAt` |
| `households/{id}/schedules` | User-defined scheduled automations | `name`, `deviceId`, optional `switchId`, `days`, `startTime`, `endTime`, `action`, `timezone`, `enabled` |
| `households/{id}/alerts` | Persistent notifications | `severity`, `message`, `source`, `read`, `createdAt` |
| `households/{id}/usage` | Device usage reporting | `eventType`, `startTime`, `endTime`, `cutoffReason` |
| `households/{id}/logs` | Device audit trail | `deviceId`, `source`, `changes`, `createdAt` |

The Firestore rules restrict client access to an authenticated demo household. They permit only narrowly defined writes, such as changing valid device state, device health, schedule configuration, switch state, layout position, and alert acknowledgement.

## 4. Synchronization Flow

1. A user changes a device from the mobile app, or an external change is made from the simulator.
2. The client writes the update to Firestore.
3. Firestore security rules validate the authenticated user, household, and allowed fields.
4. Firestore listeners update both mobile and simulator views without a manual refresh.
5. Cloud Functions record a device audit log and create or close a usage session when appropriate.
6. Schedule and safety actions write their own source labels, alerts, and usage information.

This provides bidirectional synchronization:

- Mobile to simulator: a mobile toggle appears on the simulator.
- Simulator to mobile: a simulator state or health change appears on the phone.

## 5. Floor-Grid Representation

The demo house has Ground floor and Upper floor plans. Each floor uses an abstract 6 x 4 grid. A device stores its top-left location and rectangle size:

```text
position: { column, row, width, height }
```

The floor-plan editor allows the user to adjust a device position and size. Validation prevents devices from exceeding the grid boundary or overlapping another device rectangle.

## 6. Device Profiles and Simulator

- **Electrical outlet:** A single-node ON or OFF power device.
- **Light:** ON or OFF control with a configurable time-range schedule.
- **Iron:** ON or OFF control with a maximum safe active duration.
- **Multi-switch unit:** One gang-box device with five individually addressable switches in the main demo. The shared fixture layer also covers two- and three-switch units using the same child-switch contract.
- **Security cameras:** Front door and Garden monitoring cards using static or bundled mock snapshots.

The hardware simulator can change a device state and health to Connected, Error, or Disconnected. It also controls every switch independently and reflects all mobile-originated updates.

## 7. Safety and Scheduling

### Iron safety cutoff

The Kitchen iron has a configurable maximum active duration. If the iron remains ON longer than this limit, the backend:

1. Changes the iron status to `OFF`.
2. Sets the source to `SAFETY`.
3. Creates a critical alert.
4. Creates a `SAFETY_CUTOFF` usage record.
5. Adds a device audit log entry.

### Scheduled automations

The mobile app supports multiple scheduled automations. Each automation targets a device or individual switch, chooses an ON or OFF action, and uses a start and end time in the `Asia/Colombo` timezone. When the schedule state changes, the backend:

1. Changes the light state with source `SCHEDULE`.
2. Creates an Info alert.
3. Creates a schedule event and device audit log.

For local development, `pnpm dev:automation` calls the backend evaluator every 60 seconds. In a deployed Firebase environment, Cloud Scheduler can invoke the scheduled function every minute.

## 8. Logs, Notifications, and Reporting

The Activity screen provides a per-device audit trail. It records meaningful device changes, including:

- Mobile user actions
- Simulator actions
- Schedule actions
- Safety cutoffs
- Health changes
- Floor-plan position or size changes
- Iron configuration changes
- Individual switch changes

Users can filter the activity timeline by device and export the selected visible log as a PDF using the mobile device share sheet.

Safety and schedule notifications are persistent Firestore alerts. A user can dismiss an alert by swiping it left or pressing the close button. The alert is marked as read and does not reappear after reload.

## 9. Local Run Instructions

Run the following commands in separate terminals:

```bash
pnpm dev:firebase
pnpm seed:demo
pnpm dev:automation
pnpm dev:simulator
pnpm dev:mobile
```

Suggested demonstration order:

1. Show the mobile dashboard and both floor plans.
2. Toggle a light from mobile and show the simulator update.
3. Toggle a device or change health from the simulator and show the mobile update.
4. Change one switch in the multi-switch unit.
5. Set the iron duration, turn it on, and show the automated safety cutoff.
6. Set a light schedule and show the schedule notification and activity record.
7. Open the camera monitoring cards.
8. Filter device logs, dismiss an alert, and export a PDF report.

## 10. Team Contributions

Replace these placeholders before submission.

| Member | Primary contribution | Demonstration evidence |
| --- | --- | --- |
| Member 1: `[Name]` | `[Mobile application, floor plans, cameras, UI feedback]` | Show mobile control, floor-grid editor, camera screen, alerts, and activity flow. |
| Member 2: `[Name]` | `[Firebase, Cloud Functions, security rules, schedules, safety]` | Explain Firestore model, automation worker, safety cutoff, and notifications. |
| Member 3: `[Name]` | `[Hardware simulator, synchronization, testing, reporting]` | Demonstrate simulator-originated changes and bidirectional synchronization. |

## 11. Known Limitations

- Camera media uses mock or locally bundled snapshots. Live camera streaming is not part of this mini-project version.
- Cloud Scheduler is not emulated locally, so the local automation worker is used during development.
- The project uses anonymous authentication and one seeded demo household.
- Production push notifications are not included. The app uses real-time in-app Firestore alerts instead.

## 12. Conclusion

The project demonstrates an end-to-end smart-home system with mobile control, web-based hardware simulation, real-time synchronization, multi-floor layout planning, specialized device profiles, server-side safety automation, scheduled lighting, camera monitoring, usage reporting, audit logs, notifications, and PDF log export.
