# Toastmasters Membership CRM — MVP v1.0 Test Checklist

This checklist is used to verify that the Toastmasters Membership CRM works correctly from initial lead intake through post-meeting follow-up.

Run this checklist before creating or publishing an MVP release.

## Test Environment

Before beginning:

- Enable `Test Mode` in the `Settings` worksheet.
- Confirm `Test Email` contains an email address you can access.
- Use dummy prospect information only.
- Confirm the spreadsheet contains the required worksheets:
  - `Guests`
  - `Contact Log`
  - `Meetings`
  - `Settings`
- Confirm the `Toastmasters CRM` custom menu appears after opening or refreshing the spreadsheet.

Recommended test prospects:

```text
Test Attendee
test.attendee@example.com

Test No Show
test.noshow@example.com

Test Cancelled
test.cancelled@example.com
```

Do not use real prospective-member information for release testing.

---

# 1. Lead Import Test

## Goal

Verify that a new Toastmasters prospective-member notification can be imported into the CRM.

## Setup

Create or forward a test email that matches one of the supported Toastmasters notification formats:

```text
A prospective member scheduled a club visit
```

or:

```text
A prospective member just messaged your club
```

Use the Test Attendee prospect.

## Steps

1. Open the Toastmasters CRM spreadsheet.
2. Select:

```text
Toastmasters CRM
→ Import New Leads
```

3. Wait for the import summary.

## Expected Result

The import should report:

```text
New guests: 1
Errors: 0
```

The new guest should appear in the `Guests` worksheet.

Verify:

- Guest ID was generated.
- First Name is correct.
- Last Name is correct.
- Email is correct.
- Inquiry Type is correct.
- Inquiry Date was recorded.
- Scheduled Meeting was recorded when supplied.
- Status is `New Lead`.
- Attendance is `Unknown`.
- Next Action is `Send Welcome`.
- Joined? is `No`.
- Source is `Toastmasters.org`.
- Original Message ID contains the Gmail message ID.

Also verify an inbound interaction appears in `Contact Log`.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 2. Duplicate Message Test

## Goal

Verify that the same Gmail message cannot be imported twice.

## Steps

Without changing or forwarding another email:

1. Run:

```text
Toastmasters CRM
→ Import New Leads
```

2. Review the import summary.

## Expected Result

The previously processed message should be skipped.

Expected behavior:

```text
New guests: 0
Duplicates skipped: 1
Errors: 0
```

No duplicate guest should appear in the `Guests` worksheet.

No duplicate interaction should be added to `Contact Log`.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 3. Existing Guest Update Test

## Goal

Verify that a new message from an existing guest updates the existing record instead of creating another guest.

## Setup

Send or forward a second supported Toastmasters notification using the same email address as Test Attendee.

## Steps

Run:

```text
Toastmasters CRM
→ Import New Leads
```

## Expected Result

The CRM should report an existing guest update rather than a new guest.

Expected behavior:

```text
New guests: 0
Existing guests updated: 1
Errors: 0
```

Verify:

- No second guest record was created.
- Inquiry information was updated.
- Notes were preserved and appended where appropriate.
- The new Gmail Message ID was stored.
- A new inbound interaction was added to `Contact Log`.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 4. Welcome Email Test

## Goal

Verify that a new guest receives a welcome email through Test Mode.

## Preconditions

The test guest should have:

```text
Status: New Lead
Next Action: Send Welcome
Joined?: No
```

## Steps

Run:

```text
Toastmasters CRM
→ Send Welcome Emails
```

## Expected Result

A welcome email should arrive at the configured Test Email address.

Verify the email contains:

- Test Mode indicator
- guest first name
- club name
- meeting date
- meeting time
- meeting address
- Zoom link
- club website
- contact name
- contact title
- contact email

Verify the guest record changes to:

```text
Status: Welcome Sent
Welcome Sent: timestamp
Last Contact: timestamp
Next Follow-Up: reminder date
Next Action: Send Reminder
```

Verify an outbound `Welcome` interaction appears in `Contact Log`.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 5. Welcome Email Idempotency Test

## Goal

Verify that running the welcome-email process again does not resend the same welcome message.

## Steps

Run:

```text
Toastmasters CRM
→ Send Welcome Emails
```

again without modifying the guest.

## Expected Result

The guest should be skipped.

No second welcome email should be received.

No duplicate welcome interaction should appear in `Contact Log`.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 6. Meeting Reminder Test

## Goal

Verify that a welcome guest receives a meeting reminder when the reminder is due.

## Setup

If necessary, manually change `Next Follow-Up` to a date/time earlier than the current time.

The guest should have:

```text
Status: Welcome Sent
Next Action: Send Reminder
Reminder Sent: blank
```

## Steps

Run:

```text
Toastmasters CRM
→ Send Meeting Reminders
```

## Expected Result

A reminder email should arrive at the Test Email address.

Verify the guest record changes to:

```text
Reminder Sent: timestamp
Last Contact: timestamp
Next Follow-Up: blank
Next Action: Mark Attendance
```

Verify a `Meeting Reminder` interaction appears in `Contact Log`.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 7. Reminder Idempotency Test

## Goal

Verify that a reminder is not sent twice.

## Steps

Run:

```text
Toastmasters CRM
→ Send Meeting Reminders
```

again.

## Expected Result

The guest should be skipped.

No second reminder email should arrive.

No duplicate reminder interaction should be created.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 8. Attended Workflow Test

## Goal

Verify the post-meeting workflow for a guest who attended.

## Setup

For Test Attendee, set:

```text
Attendance: Attended
```

The guest should currently have:

```text
Next Action: Mark Attendance
Joined?: No
```

## Steps

Run:

```text
Toastmasters CRM
→ Process Attendance
```

## Expected Result

The guest record should change to:

```text
Status: Attended
Attendance: Attended
Next Action: Send Thank You
Next Follow-Up: scheduled follow-up date
```

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 9. Attendance Idempotency Test

## Goal

Verify that the same attendance status is not repeatedly reprocessed.

## Steps

Without changing Test Attendee, run:

```text
Toastmasters CRM
→ Process Attendance
```

again.

## Expected Result

The guest should be skipped.

The function should report no new processing for that guest.

The following values should remain unchanged:

```text
Status: Attended
Attendance: Attended
Next Action: Send Thank You
```

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 10. Thank-You Follow-Up Test

## Goal

Verify that an attendee receives the correct post-meeting email.

## Setup

If necessary, manually set `Next Follow-Up` to a time earlier than the current time.

The guest should have:

```text
Status: Attended
Next Action: Send Thank You
Joined?: No
```

## Steps

Run:

```text
Toastmasters CRM
→ Send Attendance Follow-Ups
```

## Expected Result

A thank-you email should arrive at the Test Email address.

Verify the guest record changes to:

```text
Follow-Up Count: increased by 1
Last Contact: timestamp
Next Follow-Up: blank
Next Action: Invite to Join
```

Verify an `Attendance Follow-Up` interaction appears in `Contact Log`.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 11. Thank-You Idempotency Test

## Goal

Verify that the same thank-you email cannot be sent repeatedly.

## Steps

Run:

```text
Toastmasters CRM
→ Send Attendance Follow-Ups
```

again.

## Expected Result

The guest should be skipped because Next Action is no longer `Send Thank You`.

No duplicate thank-you email should arrive.

No duplicate Contact Log entry should be created.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 12. No-Show Workflow Test

## Goal

Verify the workflow for a guest who does not attend.

## Setup

Create or use Test No Show.

Move the guest through the welcome and reminder steps until the record has:

```text
Next Action: Mark Attendance
```

Set:

```text
Attendance: No Show
```

## Steps

Run:

```text
Toastmasters CRM
→ Process Attendance
```

## Expected Result

The guest should become:

```text
Status: No Show
Attendance: No Show
Next Action: Send Missed You
Next Follow-Up: scheduled follow-up date
```

If necessary, manually make `Next Follow-Up` due.

Then run:

```text
Toastmasters CRM
→ Send Attendance Follow-Ups
```

## Expected Result

A missed-you email should arrive at the Test Email address.

Verify:

```text
Follow-Up Count: increased by 1
Last Contact: timestamp
Next Follow-Up: blank
Next Action: No Action
```

Verify an outbound interaction appears in `Contact Log`.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 13. Cancelled Workflow Test

## Goal

Verify that cancelled guests are recorded correctly without triggering an unfinished automated rescheduling workflow.

## Setup

Create or use Test Cancelled.

Set:

```text
Attendance: Cancelled
```

## Steps

Run:

```text
Toastmasters CRM
→ Process Attendance
```

## Expected Result

The guest should become:

```text
Status: Cancelled
Attendance: Cancelled
Next Follow-Up: blank
Next Action: No Action
```

No attendance follow-up email should be sent.

Run `Process Attendance` a second time.

The guest should be skipped.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 14. Joined Guest Protection Test

## Goal

Verify that an existing member is not accidentally restarted in the prospect workflow.

## Setup

Set a test guest to:

```text
Joined?: Yes
```

## Steps

Run:

```text
Toastmasters CRM
→ Process Attendance
```

and:

```text
Toastmasters CRM
→ Send Attendance Follow-Ups
```

## Expected Result

The joined guest should be skipped.

The CRM should not restart welcome, reminder, or guest follow-up actions.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 15. Contact Log Verification

## Goal

Verify that the CRM maintains a usable interaction history.

Review the `Contact Log`.

For Test Attendee, the history should contain records corresponding to the completed workflow, such as:

```text
Inbound Lead
Welcome
Meeting Reminder
Attendance Follow-Up
```

Verify each applicable record includes:

- Contact ID
- Guest ID
- Guest Name
- Contact Date
- Method
- Contact Type
- Subject / Summary
- Outcome
- Next Follow-Up where applicable
- Notes

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 16. Test Mode Safety Check

## Goal

Confirm that release testing cannot accidentally contact real prospects.

## Steps

Verify the `Settings` worksheet contains:

```text
Test Mode: Yes
```

and a valid Test Email.

Run at least one email workflow.

## Expected Result

The message should be sent only to the configured Test Email address.

The test message should identify the intended recipient without sending to that address.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# 17. CRM Menu Verification

## Goal

Confirm all public MVP menu items invoke working features.

After refreshing the spreadsheet, verify the `Toastmasters CRM` menu contains only supported actions.

Expected actions:

```text
Import New Leads
Send Welcome Emails
Send Meeting Reminders
Process Attendance
Send Attendance Follow-Ups
```

Do not include placeholder or unfinished menu actions in the v1 release.

### Result

- [ ] PASS
- [ ] FAIL

Notes:

```text

```

---

# MVP v1.0 Release Criteria

The release is considered ready when:

- [ ] New leads can be imported successfully.
- [ ] Duplicate Gmail messages are skipped.
- [ ] Existing guests can be updated without duplication.
- [ ] Welcome emails send successfully in Test Mode.
- [ ] Welcome emails cannot be sent twice accidentally.
- [ ] Meeting reminders send successfully.
- [ ] Meeting reminders cannot be sent twice accidentally.
- [ ] Attendance can be recorded.
- [ ] Attendance processing is idempotent.
- [ ] Attendees receive thank-you emails.
- [ ] No-shows receive missed-you emails.
- [ ] Cancelled guests are recorded without automated outreach.
- [ ] Joined guests are protected from prospect workflows.
- [ ] Outbound emails are logged.
- [ ] Inbound interactions are logged.
- [ ] Test Mode safely redirects email.
- [ ] No placeholder menu actions remain.
- [ ] No real guest data is included in the public repository.
- [ ] No credentials or secrets are committed.
- [ ] All release-blocking tests pass.

---

# Test Summary

**Version Tested:** `v1.0.0`

**Test Mode:** `ON`

**Date:**

```text

```

**Tester:**

```text

```

**Overall Result:**

- [ ] PASS
- [ ] FAIL

**Known Issues / Deferred Features:**

```text

```

**Release Decision:**

- [ ] Approved for MVP v1.0 release
- [ ] Additional fixes required