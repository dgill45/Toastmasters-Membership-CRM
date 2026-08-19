function getSetting_(settingName) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('Settings');

  if (!sheet) {
    throw new Error('Settings sheet not found.');
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 4) {
    throw new Error('No settings were found.');
  }

  const rows = sheet
    .getRange(4, 1, lastRow - 3, 2)
    .getValues();

  for (let i = 0; i < rows.length; i++) {
    const key = String(rows[i][0] || '').trim();

    if (key === settingName) {
      return rows[i][1];
    }
  }

  return '';
}
function getNextMeeting_() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('Meetings');

  if (!sheet) {
    throw new Error('Meetings sheet not found.');
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 4) {
    return null;
  }

  const rows = sheet
    .getRange(4, 1, lastRow - 3, 8)
    .getValues();

  const now = new Date();

  const upcomingMeetings = rows
    .filter(row => row[1] instanceof Date && row[1] >= now)
    .sort((a, b) => a[1] - b[1]);

  if (upcomingMeetings.length === 0) {
    return null;
  }

  const row = upcomingMeetings[0];

  return {
    id: row[0],
    date: row[1],
    time: row[2],
    format: row[3],
    address: row[4],
    zoomLink: row[5],
    theme: row[6],
    notes: row[7]
  };
}
function sendWelcomeEmails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const guestsSheet = ss.getSheetByName('Guests');

  if (!guestsSheet) {
    SpreadsheetApp.getUi().alert('Guests sheet not found.');
    return;
  }

  const testMode =
    String(getSetting_('Test Mode')).trim().toLowerCase() === 'yes';

  const testEmail =
    String(getSetting_('Test Email')).trim();

  const clubName =
    String(getSetting_('Club Name')).trim();

  const contactName =
    String(getSetting_('Contact Name')).trim();

  const contactTitle =
    String(getSetting_('Contact Title')).trim();

  const contactEmail =
    String(getSetting_('Contact Email')).trim();

  const meetingTime =
    String(getSetting_('Meeting Time')).trim();

  const meetingAddress =
    String(getSetting_('Meeting Address')).trim();

  const zoomLink =
    String(getSetting_('Zoom Link')).trim();

  const clubWebsite =
    String(getSetting_('Club Website')).trim();

  const lastRow = guestsSheet.getLastRow();

  if (lastRow < 4) {
    SpreadsheetApp.getUi().alert('No guests found.');
    return;
  }

  const rows = guestsSheet
    .getRange(4, 1, lastRow - 3, 21)
    .getValues();

  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  rows.forEach((row, index) => {
    const sheetRow = index + 4;

    try {
      const guestId = row[0];
      const firstName = row[1];
      const lastName = row[2];
      const email = row[3];
      const scheduledMeeting = row[7];
      const status = row[8];
      const nextAction = row[15];

      const guestName =
        `${firstName} ${lastName}`.trim();

      if (
        status !== 'New Lead' ||
        nextAction !== 'Send Welcome'
      ) {
        skippedCount++;
        return;
      }

      let meetingDate = scheduledMeeting;

      if (!(meetingDate instanceof Date)) {
        const nextMeeting = getNextMeeting_();

        if (!nextMeeting) {
          throw new Error(
            `No upcoming meeting found for ${firstName}.`
          );
        }

        meetingDate = nextMeeting.date;
      }
      const reminderDate =
        new Date(meetingDate);

      reminderDate.setDate(
        reminderDate.getDate() - 1
      );

      const formattedMeetingDate =
        Utilities.formatDate(
          meetingDate,
          Session.getScriptTimeZone(),
          'EEEE, MMMM d, yyyy'
        );

      const recipient =
        testMode ? testEmail : email;

      if (!recipient) {
        throw new Error(
          `No recipient email available for ${firstName}.`
        );
      }

      const subject =
        testMode
          ? `[TEST] We saved you a seat at ${clubName}`
          : `We saved you a seat at ${clubName}`;

      const body =
`Hello ${firstName},

Thank you for reaching out and expressing interest in ${clubName}! We’re excited that you’re considering joining us.

We’d love to welcome you to our meeting on ${formattedMeetingDate} at ${meetingTime}.

You may attend in person at:
${meetingAddress}

You may also join us online:
${zoomLink}

There is no pressure to participate during your first visit. You’re welcome to observe, meet the members, and see whether the club feels like a good fit for you.

You can learn more here:
${clubWebsite}

Please feel free to reply if you have any questions. We look forward to meeting you!

Sincerely,

${contactName}
${contactTitle}
${clubName}
${contactEmail}

${testMode ? `\nTEST MODE: This message would normally have been sent to ${email}` : ''}`;

      GmailApp.sendEmail(
        recipient,
        subject,
        body
      );
        logOutboundEmail_(
          guestId,
          guestName,
          'Welcome',
          subject,
          testMode
            ? 'Test welcome email sent'
            : 'Welcome email sent',
          reminderDate,
          testMode
            ? `TEST MODE — Intended recipient: ${email}`
            : `Sent to: ${email}`
        );
      const now = new Date();

      guestsSheet
        .getRange(sheetRow, 9)
        .setValue('Welcome Sent');
 
      guestsSheet
        .getRange(sheetRow, 11)
        .setValue(now);

      guestsSheet
        .getRange(sheetRow, 14)
        .setValue(now);

      guestsSheet
        .getRange(sheetRow, 15)
        .setValue(reminderDate)
        .setNumberFormat('mmm d, yyyy');

      guestsSheet
        .getRange(sheetRow, 16)
        .setValue('Send Reminder');

      sentCount++;

    } catch (error) {
      console.error(
        `Welcome email error on row ${sheetRow}: ${error.message}`
      );

      errorCount++;
    }
  });

  SpreadsheetApp.getUi().alert(
    'Welcome email process complete.\n\n' +
    `Emails sent: ${sentCount}\n` +
    `Rows skipped: ${skippedCount}\n` +
    `Errors: ${errorCount}\n\n` +
    `Test Mode: ${testMode ? 'ON' : 'OFF'}`
  );
}
/**
 * Logs an outbound email activity in the Contact Log.
 */
function logOutboundEmail_(
  guestId,
  guestName,
  contactType,
  subject,
  outcome,
  nextFollowUp,
  notes
) {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const logSheet =
    ss.getSheetByName('Contact Log');

  if (!logSheet) {
    console.log(
      'Contact Log worksheet not found.'
    );
    return;
  }

  const nextRow =
    Math.max(
      logSheet.getLastRow() + 1,
      4
    );

  const contactId =
    createContactId_(logSheet);

  const row = [
    contactId,          // A Contact ID
    guestId,            // B Guest ID
    guestName,          // C Guest Name
    new Date(),         // D Contact Date
    'Email',            // E Method
    contactType,        // F Contact Type
    subject,            // G Subject / Summary
    outcome,            // H Outcome
    nextFollowUp || '', // I Next Follow-Up
    notes || ''         // J Notes
  ];

  logSheet
    .getRange(
      nextRow,
      1,
      1,
      row.length
    )
    .setValues([row]);

  logSheet
    .getRange(nextRow, 4)
    .setNumberFormat(
      'mmm d, yyyy h:mm AM/PM'
    );

  if (nextFollowUp) {
    logSheet
      .getRange(nextRow, 9)
      .setNumberFormat(
        'mmm d, yyyy h:mm AM/PM'
      );
  }
}
logOutboundEmail_()

function sendMeetingReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const guestsSheet = ss.getSheetByName('Guests');

  if (!guestsSheet) {
    SpreadsheetApp.getUi().alert('Guests sheet not found.');
    return;
  }

  const testMode =
    String(getSetting_('Test Mode')).trim().toLowerCase() === 'yes';

  const testEmail =
    String(getSetting_('Test Email')).trim();

  const clubName =
    String(getSetting_('Club Name')).trim();

  const contactName =
    String(getSetting_('Contact Name')).trim();

  const contactTitle =
    String(getSetting_('Contact Title')).trim();

  const meetingTime =
    String(getSetting_('Meeting Time')).trim();

  const meetingAddress =
    String(getSetting_('Meeting Address')).trim();

  const zoomLink =
    String(getSetting_('Zoom Link')).trim();

  const lastRow = guestsSheet.getLastRow();

  if (lastRow < 4) {
    SpreadsheetApp.getUi().alert('No guests found.');
    return;
  }

  const rows = guestsSheet
    .getRange(4, 1, lastRow - 3, 21)
    .getValues();

  const now = new Date();

  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  rows.forEach((row, index) => {
    const sheetRow = index + 4;

    try {
      const guestId = row[0];
      const firstName = row[1];
      const lastName = row[2];
      const email = row[3];
      const meetingDate = row[7];
      const status = row[8];
      const reminderSent = row[11];
      const nextFollowUp = row[14];
      const nextAction = row[15];

      const guestName =
        `${firstName} ${lastName}`.trim();

      if (
        status !== 'Welcome Sent' ||
        nextAction !== 'Send Reminder' ||
        reminderSent
      ) {
        skippedCount++;
        return;
      }

      if (!(meetingDate instanceof Date)) {
        skippedCount++;
        return;
      }

      if (!(nextFollowUp instanceof Date)) {
        skippedCount++;
        return;
      }

      if (nextFollowUp > now) {
        skippedCount++;
        return;
      }

      const recipient =
        testMode ? testEmail : email;

      if (!recipient) {
        throw new Error(
          `No recipient email available for ${guestName}.`
        );
      }

      const formattedMeetingDate =
        Utilities.formatDate(
          meetingDate,
          Session.getScriptTimeZone(),
          'EEEE, MMMM d, yyyy'
        );

      const subject =
        testMode
          ? `[TEST] Reminder: ${clubName} meeting`
          : `Reminder: ${clubName} meeting`;

      const body =
`Hello ${firstName},

This is a friendly reminder that your visit with ${clubName} is coming up on ${formattedMeetingDate} at ${meetingTime}.

You may attend in person at:
${meetingAddress}

Or join us online:
${zoomLink}

We look forward to welcoming you!

Sincerely,

${contactName}
${contactTitle}
${clubName}

${testMode ? `\nTEST MODE: This message would normally have been sent to ${email}` : ''}`;

      GmailApp.sendEmail(
        recipient,
        subject,
        body
      );

      logOutboundEmail_(
        guestId,
        guestName,
        'Meeting Reminder',
        subject,
        testMode
          ? 'Test reminder email sent'
          : 'Reminder email sent',
        '',
        testMode
          ? `TEST MODE — Intended recipient: ${email}`
          : `Sent to: ${email}`
      );

      const sentTime = new Date();

      guestsSheet
        .getRange(sheetRow, 12)
        .setValue(sentTime);

      guestsSheet
        .getRange(sheetRow, 14)
        .setValue(sentTime);

      guestsSheet
        .getRange(sheetRow, 15)
        .clearContent();

      guestsSheet
        .getRange(sheetRow, 16)
        .setValue('Mark Attendance');

      sentCount++;

    } catch (error) {
      console.error(
        `Reminder error on row ${sheetRow}: ${error.message}`
      );

      errorCount++;
    }
  });

  SpreadsheetApp.getUi().alert(
    'Meeting reminder process complete.\n\n' +
    `Reminders sent: ${sentCount}\n` +
    `Rows skipped: ${skippedCount}\n` +
    `Errors: ${errorCount}\n\n` +
    `Test Mode: ${testMode ? 'ON' : 'OFF'}`
  );
}