# Smart Home Monitoring and Control System

## Initial implementation plan

The decisions in [ADR-001](ADR-001-v1-domain-and-synchronization.md) and the terms in [GLOSSARY.md](GLOSSARY.md) are authoritative for V1.

### 1. Project outcome

Build a demonstrable smart-home system with three connected parts:

- An Expo mobile app for monitoring floors, controlling devices, viewing cameras, and reviewing usage.
- A Next.js hardware simulator that represents physical devices and can trigger external state changes.
- Firebase services for shared state, real-time synchronization, safety cutoffs, alerts, and usage records.

The first release should prioritize a reliable end-to-end demonstration over a large feature surface.

### 2. Current foundation

- `apps/mobile` is an Expo Router starter app with Home and Explore tabs.
- `apps/simulator` is a Next.js starter page.
- `apps/functions` contains a Firebase HTTPS health function only.
- `packages/shared` contains initial device types and status values.
- Firestore rules currently deny all client access until authentication and the data model are implemented.
- Local Firebase emulator configuration and development documentation already exist.

### 3. Recommended V1 scope

#### Must have

- One demo house with at least two floors.
- Floor dashboard with a simple floor-plan grid and positioned devices.
- Device statuses: `ON`, `OFF`, `ERROR`, and `DISCONNECTED`.
- Device controls for outlets, lights, switch units, and irons.
- A switch unit with individually addressable switches.
- Iron safety duration and automatic shutoff.
- Light scheduling with an active time range.
- Mock camera snapshot or stream card.
- Real-time mobile to Firestore and Firestore to simulator synchronization.
- Simulator controls for changing device state externally.
- Mobile alerts for safety shutoffs and important device changes.
- Basic usage history for irons and lights.

#### Defer until the core flow works

- User accounts and household invitations.
- Multiple independently owned houses.
- Real camera streaming.
- Advanced analytics and charts.
- Offline conflict resolution beyond a clear pending/error state.
- Complex floor-plan editing.
- Push notifications through a production notification provider.

### 4. Architecture and responsibilities

#### Shared package

Expand `packages/shared` into the source of truth for:

- Device, floor, switch, schedule, alert, and usage-record types.
- Device type and status constants.
- Firestore collection names.
- Validation-safe command and event shapes.
- Helpers for status labels and safety-critical device detection.

Keep shared types platform-neutral so both the mobile app and simulator can use them.

#### Mobile app

Replace the Expo starter experience with these product areas:

1. Home dashboard: house summary, active alerts, and floor/device overview.
2. Floor detail: floor-plan grid, device markers, and quick controls.
3. Device detail: status, controls, capabilities, schedule, and recent activity.
4. Cameras: mock snapshots or streams grouped by floor.
5. Activity: usage records, safety shutoffs, and synchronization events.
6. Settings: demo-house selection and development connection status.

The final navigation structure and density should be decided after a low-fidelity flow review. Build the first pass with reusable cards, rows, markers, and control components rather than styling each screen independently.

#### Hardware simulator

Create a simulator dashboard with:

- Floor and device inventory.
- Current device state and connection status.
- Controls for external state changes.
- Switch-unit controls for each switch.
- Camera preview placeholders.
- Event log showing changes received from mobile and changes emitted by the simulator.

The simulator should use the same Firestore data and shared contracts as the mobile app.

#### Firebase

Use Firestore as the real-time source of truth. Use Cloud Functions for trusted operations:

- Safety cutoff worker or listener for irons and other safety-critical devices.
- Alert creation when a cutoff occurs.
- Usage-record creation for important state transitions.
- Optional command validation endpoint if direct client writes become too permissive.

Client writes should be narrowly scoped and validated through the eventual authentication model. Do not open the current deny-all rules broadly.

### 5. Initial data model

Start with one demo household and these collections:

```text
households/{householdId}
households/{householdId}/floors/{floorId}
households/{householdId}/devices/{deviceId}
households/{householdId}/devices/{deviceId}/switches/{switchId}
households/{householdId}/schedules/{scheduleId}
households/{householdId}/alerts/{alertId}
households/{householdId}/usage/{usageId}
```

Core fields should include:

- Floors: name, order, plan asset, grid dimensions.
- Devices: name, type, floor ID, grid position, status, online state, capabilities, updated timestamp.
- Switches: name, index, status, updated timestamp.
- Schedules: target device or switch, days, start time, end time, enabled state.
- Safety settings: maximum active duration, cutoff reason, last safety evaluation.
- Alerts: severity, message, source, read state, created timestamp.
- Usage: target device, event type, start time, end time, duration, source.

Use server timestamps where possible. Store all timestamps in a consistent UTC format and format them only at the UI boundary.

### 6. Delivery phases

#### Phase 0: Confirm scope and interaction direction

- Review the required demonstration story and team responsibilities.
- Agree on the first mobile navigation and floor-plan interaction.
- Decide whether the first visual direction is compact dashboard, spacious monitoring, or another approved direction.
- Define the minimum demo dataset: floors, devices, schedules, and camera placeholders.

Exit criteria: an agreed screen flow, data inventory, and acceptance checklist.

#### Phase 1: Establish shared contracts and local data

- Replace starter-only shared types with the V1 domain model.
- Add Firestore path helpers and serialization boundaries.
- Create deterministic seed data for the emulator.
- Add emulator connection configuration for mobile and simulator.
- Add initial Firestore indexes only when real queries require them.

Exit criteria: both clients can read the same seeded house from the local emulator.

#### Phase 2: Implement the real-time device foundation

- Add mobile Firestore listeners for floors, devices, alerts, and usage.
- Add simulator listeners for device and switch state.
- Implement optimistic control state with pending, success, and error handling.
- Add external simulator writes and verify they appear in the mobile app without refresh.
- Define behavior for `ERROR` and `DISCONNECTED` so controls do not imply a successful action.

Exit criteria: a device can be toggled from either client and both views converge reliably.

#### Phase 3: Build the mobile V1 experience

- Remove Expo tutorial content.
- Implement the approved navigation and dashboard structure.
- Build the floor-plan grid and device markers.
- Add device detail views based on device capabilities.
- Add switch-unit controls, camera placeholders, alert presentation, and activity history.
- Add loading, empty, error, and disconnected states.
- Add reduced-motion and accessible-label support for controls and status indicators.

Exit criteria: the mobile app can demonstrate the complete monitoring and control journey using emulator data.

#### Phase 4: Build the simulator experience

- Replace the Next.js starter page with the simulator shell.
- Add filters by floor, device type, and connection state.
- Add device and switch controls.
- Add event history and synchronization indicators.
- Add a simple way to simulate disconnected and error states.

Exit criteria: the simulator clearly demonstrates physical-device behavior and external state changes.

#### Phase 5: Add safety automation and schedules

- Implement iron maximum active duration configuration.
- Add a trusted backend safety evaluator.
- Automatically switch an over-duration iron to `OFF`.
- Create an alert and usage record for every safety cutoff.
- Implement light schedule evaluation and document timezone behavior.
- Add visible countdown or next-action information where it improves user understanding.

Exit criteria: an automated test or emulator scenario proves the cutoff, alert, usage record, and synchronized UI update.

#### Phase 6: Security, resilience, and polish

- Define the authentication assumption for the submission demo.
- Replace deny-all rules with least-privilege rules appropriate to that assumption.
- Validate writes and reject invalid status transitions or unauthorized household access.
- Add retry and failure feedback for writes.
- Verify emulator and production configuration are separated.
- Refine visual hierarchy, spacing, motion, and responsive simulator behavior after the interaction flow is stable.

Exit criteria: security rules, failure states, and configuration boundaries are documented and tested.

#### Phase 7: Submission preparation

- Add a concise technical report covering synchronization, floor representation, simulator operation, and safety automation.
- Prepare a seeded demonstration script.
- Record the demo with each member introducing their contribution.
- Build and test the Android package or required final APK flow.
- Run lint, typecheck, build, and relevant integration checks.
- Confirm the repository contains no credentials, emulator data, or unrelated starter content.

Exit criteria: a fresh teammate can start the system and reproduce the recorded demonstration.

### 7. Verification strategy

Run checks at three levels:

1. Static: lint, TypeScript checks, formatting, and shared contract compilation.
2. Behavioral: Firestore emulator tests for reads, writes, listeners, safety cutoffs, schedules, and permissions.
3. Rendered: mobile device or Expo web checks and simulator browser checks for layout, touch targets, loading states, and real-time feedback.

Important scenarios:

- Mobile turns a light on and the simulator updates.
- Simulator turns an outlet off and the mobile app updates without refresh.
- A switch unit controls one switch without changing its neighbors.
- An iron exceeding its duration turns off and creates an alert.
- A disconnected device cannot report a false successful action.
- A scheduled light changes state at the configured boundary.
- A user can distinguish current state, pending state, error state, and stale data.

### 8. Risks and decisions to resolve early

- Authentication scope affects Firestore rules and every client query.
- Direct client writes versus callable or HTTPS commands affects validation and conflict handling.
- Floor-plan assets and marker placement affect the dashboard data model.
- Real-time listeners need cleanup and clear loading behavior to avoid duplicate subscriptions.
- Safety automation must use server-side time and idempotent updates to avoid repeated alerts.
- Camera streams should remain mock content unless a reliable stream source is explicitly available.
- The team should agree on the submission APK target and test device before the final phase.

### 9. Suggested first implementation slice

Implement one vertical slice before building every screen:

1. Seed one floor with one light and one iron.
2. Read the devices in the mobile app.
3. Toggle the light from mobile.
4. Reflect the change in the simulator.
5. Toggle the light from the simulator.
6. Add the iron duration field and safety cutoff.
7. Show the cutoff alert in mobile.

Once this slice is reliable, expand the domain to multiple floors, switch units, cameras, schedules, and reporting.

### 10. Confirmed V1 decisions

- Resident-first, dashboard-led mobile experience for one demo household.
- Grid-based floor views with positioned markers.
- Direct validated Firestore writes from both clients with optimistic confirmation and rollback.
- Separate power and health state, with last-known state retained during errors or disconnection.
- Seeded authenticated development user and least-privilege household rules.
- Backend-owned iron cutoffs and schedule evaluation.
- Household timezone set to `Asia/Colombo` for the demo.
- Usage sessions span valid `ON` to `OFF` transitions.
- Static or bundled camera snapshots only.
- Server timestamps and last validated write wins for V1 concurrency.

### 11. Submission completion plan

The current implementation is a working V1 prototype. The following work must be completed before treating the project as submission-ready.

#### Phase 8: Close functional gaps

1. Add at least one seeded outlet device to the demo household.
2. Confirm the outlet uses the same single-node control contract as lights.
3. Expand the switch-unit seed data and UI test fixture to cover two, three, and five switches, while keeping one manageable demo unit in the main presentation.
4. Add normal usage-session tracking for important devices:
   - Open a session on a valid `ON` transition.
   - Close it on the next valid `OFF` transition.
   - Close it with a cutoff reason when safety automation turns the device off.
   - Prevent duplicate sessions when listeners retry.
5. Test light schedules at the exact start boundary, inside the active window, exact end boundary, and outside the active window using `Asia/Colombo`.
6. Decide and document the floor-plan interpretation for assessment:
   - Preferred V1: seeded, multiple abstract grid floor plans with fixed device positions.
   - Optional extension: development-only floor and marker editing.

Exit criteria: the seeded household demonstrates an outlet, light, iron, multi-switch unit, camera placeholder, two floors, normal usage records, safety cutoff records, and tested schedule boundaries.

#### Phase 9: Verification and release hardening

1. Add emulator tests for:
   - Authenticated demo-household reads.
   - Unauthorized household access rejection.
   - Mobile-to-simulator device synchronization.
   - Simulator-to-mobile device synchronization.
   - Independent switch updates.
   - Disconnected-device control rejection.
   - Iron cutoff idempotency.
   - Usage-session open and close behavior.
   - Schedule start and end behavior.
2. Run static and production checks:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm build
pnpm test
git diff --check
```

3. Run a clean-machine demonstration from the setup guide.
4. Verify no credentials, `.env` files, emulator exports, generated secrets, or unrelated starter content are committed.

Exit criteria: the checks pass or documented environment limitations are recorded, and a teammate can reproduce the demonstration from a fresh checkout.

#### Phase 10: Technical report

Create a concise report covering:

- Problem and user journey.
- Mobile navigation and floor-grid representation.
- Shared domain contracts.
- Firestore collections and security boundary.
- Mobile and simulator real-time listeners.
- Optimistic control and failure states.
- Iron safety cutoff flow.
- Light schedule flow and timezone behavior.
- Usage reporting.
- Simulator operation.
- Individual team contributions.
- Known limitations, including mock cameras and local emulator assumptions.

Exit criteria: the report includes one architecture diagram, one data-model diagram or table, one synchronization sequence, and exact run instructions.

#### Phase 11: APK and demonstration video

1. Confirm the required Android package identifier and build profile.
2. Build the final APK using the agreed Expo or EAS workflow.
3. Install the APK on the presentation device and repeat the complete flow.
4. Record a video no longer than 25 minutes.
5. Ensure all three members introduce themselves and explain their own contribution.
6. Demonstrate:
   - Mobile dashboard and multiple floors.
   - Outlet, light, iron, and switch-unit controls.
   - Simulator external state change.
   - Bidirectional live update.
   - Error and disconnected states.
   - Iron safety cutoff and alert.
   - Schedule behavior.
   - Usage report.
   - Camera mock preview.
7. Share the repository URL, APK link, report, and video link together.

Exit criteria: the APK, source repository, technical report, and video are accessible to the evaluator, and the recorded flow matches the submitted build.

#### Final acceptance checklist

- [ ] Outlet is seeded and demonstrated.
- [ ] Multiple floors and abstract grid positions are visible.
- [ ] Switch-unit controls update one switch without changing neighbors.
- [ ] Iron automatically turns off after its configured maximum duration.
- [ ] Safety alert and usage record appear once per cutoff.
- [ ] Normal ON/OFF usage sessions appear in activity.
- [ ] Light schedule passes start, active, end, and outside-window tests.
- [ ] Camera mock card is visible with timestamp and limitation text.
- [ ] Mobile and simulator synchronize without refresh.
- [ ] Error and disconnected states are understandable and safe.
- [ ] Firestore access is restricted to the demo household.
- [ ] Typecheck, lint, build, and tests are complete or limitations documented.
- [ ] Technical report is complete.
- [ ] Final APK is installed and verified.
- [ ] Demonstration video includes all three members and stays under 25 minutes.
- [ ] Repository, APK, report, and video links are ready to submit.
