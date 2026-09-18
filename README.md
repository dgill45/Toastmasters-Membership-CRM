# Toastmasters Membership CRM

A lightweight CRM built with Google Apps Script, Google Sheets, and Gmail to help Toastmasters club officers manage prospective members from initial inquiry through post-meeting follow-up.

## Overview

The Toastmasters Membership CRM was created to simplify the guest-management workflow for a Toastmasters club.

Prospective members often enter the process through Toastmasters.org, which sends notification emails to club officers when someone:

* schedules a club visit
* sends a message to the club

Without a central system, these inquiries can be easy to miss, duplicate, or follow up with inconsistently.

This application uses Google Apps Script to turn Gmail and Google Sheets into a simple CRM workflow.

## Current MVP

The MVP supports the complete guest journey from initial inquiry through post-meeting follow-up.

### Lead Import

The CRM searches Gmail for Toastmasters.org prospective-member notifications.

It can:

* identify scheduled-visit notifications
* identify general prospective-member messages
* extract the guest's name and email address
* extract scheduled meeting dates when available
* store guest messages as notes
* create new guest records
* update existing guest records
* prevent duplicate Gmail messages from being processed

### Guest Management

Prospective members are stored in a central `Guests` worksheet.

Guest records include:

* Guest ID
* Name
* Email
* Phone
* Inquiry Type
* Inquiry Date
* Scheduled Meeting
* Status
* Attendance
* Welcome Sent
* Reminder Sent
* Follow-Up Count
* Last Contact
* Next Follow-Up
* Next Action
* Replied?
* Joined?
* Source
* Notes
* Original Gmail Message ID

### Automated Welcome Emails

New prospects can receive a welcome email containing:

* meeting date
* meeting time
* physical meeting location
* Zoom link
* club website
* club contact information

After the welcome email is sent, the CRM updates the guest record and schedules the meeting reminder.

### Meeting Reminders

The CRM can send a reminder before a guest's scheduled meeting.

After the reminder is sent:

* the reminder timestamp is recorded
* the guest's last-contact timestamp is updated
* the next follow-up date is cleared
* the guest's Next Action becomes `Mark Attendance`

### Attendance Processing

Attendance is intentionally entered manually after a meeting.

Supported attendance values include:

* Attended
* No Show
* Cancelled
* Unknown

The CRM then determines the next action.

Examples:

```text
Attended
→ Send Thank You

No Show
→ Send Missed You
```

Attendance processing is designed to be safely rerun without repeatedly processing records that have already been handled.

### Post-Meeting Follow-Up

The CRM can send different follow-up emails based on attendance.

Guests who attended receive a thank-you message.

Guests who did not attend receive a missed-you message and are invited to visit again.

After the follow-up is sent, the CRM:

* increments Follow-Up Count
* records Last Contact
* clears Next Follow-Up
* advances Next Action
* records the outbound communication in Contact Log

### Contact History

The `Contact Log` worksheet provides an audit trail of interactions with prospective members.

It records both inbound and outbound activity, including:

* Contact ID
* Guest ID
* Guest Name
* Contact Date
* Method
* Contact Type
* Subject / Summary
* Outcome
* Next Follow-Up
* Notes

## CRM Workflow

The current workflow is:

```text
Toastmasters.org
       ↓
Gmail Notification
       ↓
Import New Leads
       ↓
Guest Record Created / Updated
       ↓
Send Welcome
       ↓
Send Reminder
       ↓
Mark Attendance
       ↓
   ┌───────────────┐
   │               │
Attended        No Show
   │               │
   ↓               ↓
Send Thank You   Send Missed You
   │               │
   ↓               ↓
Invite to Join    No Action
```

## Google Sheets Structure

The application currently uses several worksheets.

### Guests

The primary CRM table containing prospective-member records and workflow state.

### Contact Log

Stores inbound and outbound interaction history.

### Meetings

Stores upcoming club meeting information.

Meeting data may include:

* Meeting ID
* Date
* Time
* Format
* Address
* Zoom Link
* Theme
* Notes

### Settings

Stores reusable configuration values such as:

* Club Name
* Contact Name
* Contact Title
* Contact Email
* Meeting Time
* Meeting Address
* Zoom Link
* Club Website
* Test Mode
* Test Email

## Custom CRM Menu

When the spreadsheet opens, Apps Script creates a custom menu called:

```text
Toastmasters CRM
```

Current actions include:

```text
Import New Leads
Send Welcome Emails
Send Meeting Reminders
Process Attendance
Send Attendance Follow-Ups
Refresh Dashboard
```

## Test Mode

The application includes a Test Mode to prevent accidental emails from being sent to real prospective members during development.

When Test Mode is enabled:

* emails are sent to the configured test email address
* the intended recipient is included in the test message
* Contact Log records the interaction as a test

This allows the complete workflow to be tested safely.

## Project Structure

The Apps Script project is separated into service-oriented files.

Example structure:

```text
code.gs
GmailService.gs
EmailService.gs
GuestService.gs
```

### `code.gs`

Contains application-level functions such as:

* custom spreadsheet menu
* dashboard refresh entry point

### `GmailService.gs`

Responsible for:

* searching Gmail
* parsing Toastmasters notifications
* deduplicating messages
* creating or updating guests
* recording inbound interactions

### `EmailService.gs`

Responsible for:

* retrieving settings
* finding upcoming meetings
* sending welcome emails
* sending meeting reminders
* sending attendance follow-ups
* logging outbound emails

### `GuestService.gs`

Responsible for guest lifecycle operations such as:

* attendance processing
* determining the next CRM action
* scheduling post-meeting follow-ups

## Technology Stack

* Google Apps Script
* Google Sheets
* Gmail
* JavaScript
* Git
* GitHub
* clasp
* Visual Studio Code

## Development Workflow

The Apps Script project is synchronized locally using `clasp`.

Typical development workflow:

```bash
clasp pull

git status

git diff

git add .

git commit -m "Describe the change"

git push
```

This allows the Apps Script project to be version-controlled through GitHub while still running inside Google's environment.

## Design Approach

This project intentionally uses Google Workspace tools for the MVP because the club's workflow already relies on Gmail and Google Sheets.

The goal of the MVP is to validate the guest-management process before introducing more complex infrastructure.

The application separates several important concerns:

```text
Lead ingestion
CRM state
Email communication
Attendance processing
Interaction history
```

This makes the workflow easier to test and provides a clear path for future expansion.

## Current Status

**MVP v1.0: Functional**

The following workflow has been tested successfully:

```text
Lead Import
→ Welcome Email
→ Meeting Reminder
→ Attendance Processing
→ Attendance-Based Follow-Up
→ Contact Log
```

Test emails have been successfully sent for both attended and no-show scenarios, and the corresponding interactions have been recorded in Contact Log.

## Planned Enhancements

Possible next features include:

* membership invitation workflow
* tracking when a prospect officially joins
* additional follow-up sequences
* repeat-visit handling
* improved dashboard reporting
* scheduled Apps Script triggers
* automated follow-up timing
* improved error handling
* workflow analytics
* conversion metrics
* email template management

## Future Cloud Version

A future version may rebuild or extend the application using AWS services.

Potential architecture could include:

* Amazon API Gateway
* AWS Lambda
* Amazon DynamoDB
* Amazon SES
* Amazon EventBridge
* Amazon S3
* custom web dashboard
* custom domain integration

The current Apps Script MVP serves as a working prototype that defines the business rules and workflow before a more scalable cloud implementation is developed.

## Project Goal

The purpose of this project is not simply to automate email.

The larger goal is to create a repeatable membership-management process that helps a Toastmasters club:

* respond to prospects consistently
* reduce missed follow-ups
* track interactions
* improve guest experience
* support membership growth

---

**Project Status:** MVP v1.0
**Primary Platform:** Google Apps Script / Google Workspace
**Development Status:** Active
