/**
 * Searches Gmail for Toastmasters prospective-member notifications
 * and adds new guests to the Guests worksheet.
 */
function importNewLeads() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('Guests');

  if (!sheet) {
    SpreadsheetApp.getUi().alert(
      'The Guests worksheet could not be found.'
    );
    return;
  }

  const searchQuery =
    
    '{subject:"A prospective member scheduled a club visit" ' +
    'subject:"A prospective member just messaged your club"}';

  const threads = GmailApp.search(searchQuery, 0, 50);

  let newGuestCount = 0;
  let updatedGuestCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      try {
        const result = parseToastmastersLead_(message);

if (!result) {
  return;
}

if (messageAlreadyProcessed_(message.getId())) {
  duplicateCount++;
  return;
}

const existingGuestRow =
  findGuestRowByEmail_(sheet, result.email);

if (existingGuestRow) {
  updateExistingGuest_(
    sheet,
    existingGuestRow,
    result,
    message
  );

  logInboundActivity_(
    sheet,
    existingGuestRow,
    result,
    message,
    'Existing guest updated'
  );

  updatedGuestCount++;
  return;
}

const newGuestRow =
  addGuestToSheet_(sheet, result, message);

logInboundActivity_(
  sheet,
  newGuestRow,
  result,
  message,
  'New guest created'
);

newGuestCount++;
      } catch (error) {
        console.error(
          `Could not process message ${message.getId()}: ${error.message}`
        );

        errorCount++;
      }
    });
  });

  SpreadsheetApp.getUi().alert(
    'Toastmasters lead import complete.\n\n' +
    `New guests: ${newGuestCount}\n` +
    `Existing guests updated: ${updatedGuestCount}\n` +
    `Duplicates skipped: ${duplicateCount}\n` +
    `Errors: ${errorCount}`
  );
}


/**
 * Determines which Toastmasters notification type was received
 * and sends it to the appropriate parser.
 */
function parseToastmastersLead_(message) {
  const subject = message
    .getSubject()
    .trim()
    .toLowerCase();

  const body = message.getPlainBody();

  if (subject.includes('scheduled a club visit')) {
    return parseScheduledVisit_(message, body);
  }

  if (subject.includes('messaged your club')) {
    return parseClubMessage_(message, body);
  }

  console.log(
    `Unsupported Toastmasters notification: ${message.getSubject()}`
  );

  return null;
}

/**
 * Checks whether this exact Gmail message
 * has already been processed.
 */
function messageAlreadyProcessed_(messageId) {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const guestsSheet =
    ss.getSheetByName('Guests');

  const contactLogSheet =
    ss.getSheetByName('Contact Log');

  // First check the Guests sheet.
  if (
    guestsSheet &&
    guestsSheet.getLastRow() >= 4
  ) {
    const messageIds = guestsSheet
      .getRange(
        4,
        21,
        guestsSheet.getLastRow() - 3,
        1
      )
      .getValues()
      .flat()
      .map(value => String(value).trim());

    if (messageIds.includes(messageId)) {
  console.log(
    `DUPLICATE SOURCE: Guests sheet contains Message ID ${messageId}`
  );
  return true;
}
  }

  // Then check Contact Log.
  if (
    contactLogSheet &&
    contactLogSheet.getLastRow() >= 4
  ) {
    const notes = contactLogSheet
      .getRange(
        4,
        10,
        contactLogSheet.getLastRow() - 3,
        1
      )
      .getValues()
      .flat()
      .map(value => String(value));

    const marker =
      `Gmail Message ID: ${messageId}`;

    if (
  notes.some(note =>
    note.includes(marker)
  )
) {
  return true;
}
  }

  return false;
}
/**
 * Finds an existing guest using email address.
 *
 * Returns the sheet row number,
 * or null if the guest does not exist.
 */
function findGuestRowByEmail_(sheet, email) {
  const lastRow =
    sheet.getLastRow();

  if (lastRow < 4) {
    return null;
  }

  const emails = sheet
    .getRange(
      4,
      4,
      lastRow - 3,
      1
    )
    .getValues();

  const normalizedEmail =
    String(email)
      .trim()
      .toLowerCase();

  for (
    let i = 0;
    i < emails.length;
    i++
  ) {
    const existingEmail =
      String(emails[i][0] || '')
        .trim()
        .toLowerCase();

    if (
      existingEmail ===
      normalizedEmail
    ) {
      return i + 4;
    }
  }

  return null;
}

/**
 * Parses a Toastmasters scheduled-visit notification.
 */
/**
 * Parses a Toastmasters scheduled-visit notification.
 */
function parseScheduledVisit_(message, body) {
  /*
   * Normalize common email formatting differences
   * while preserving line breaks.
   */
  const normalizedBody = String(body || '')
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

  /*
   * Find the guest name and email specifically
   * from the scheduled-visit sentence.
   *
   * This prevents forwarded-message addresses
   * such as clubleads@toastmasters.org from
   * being mistaken for the guest's email.
   */
    const guestMatch = normalizedBody.match(
      /Good news!\s*([\s\S]*?)\s+at\s+([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\s+just scheduled to visit your club\s+meeting on/i
    );

  /*
   * Find the scheduled meeting date.
   *
   * Allows spaces or line breaks between
   * "club" and "meeting".
   */
      const meetingMatch = normalizedBody.match(
        /just scheduled to visit your club\s+meeting on\s+([A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2})/i
      );

      if (
        !guestMatch ||
        !meetingMatch
      ) {
        console.log(
          `Scheduled-visit parse failed for message ${message.getId()}`
        );

        console.log(
          `Guest found: ${guestMatch ? guestMatch[1] : 'NO'}`
        );

        console.log(
          `Email found: ${guestMatch ? guestMatch[2] : 'NO'}`
        );

        console.log(
          `Meeting date found: ${meetingMatch ? meetingMatch[1] : 'NO'}`
        );

        console.log(
          `Body preview:\n${normalizedBody.substring(0, 800)}`
        );

        return null;
      }

      const name =
        splitGuestName_(
          guestMatch[1]
            .trim()
            .replace(/\s+/g, ' ')
        );

      const email =
        guestMatch[2]
          .trim()
          .toLowerCase();

      const meetingDateText =
        meetingMatch[1].trim();

      const inquiryDate =
        message.getDate();

      const meetingYear =
        determineMeetingYear_(
          meetingDateText,
          inquiryDate
        );

      const meetingDate =
        new Date(
          `${meetingDateText}, ${meetingYear}`
        );

      return {
        firstName: name.firstName,
        lastName: name.lastName,
        email: email,
        inquiryType: 'Scheduled Visit',
        inquiryDate: inquiryDate,
        meetingDate: meetingDate,
        notes: ''
      };
    }
/**
 * Parses a Toastmasters prospective-member message notification.
 */
function parseClubMessage_(message, body) {
  const namePattern =
    /Dear Club Officer,\s*([^\r\n]+?)\s+just sent\b/i;

  const emailPattern =
    /Please send them an email at:\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;

  const guestMessagePattern =
    /said:\s*([\s\S]*?)\s*You cannot respond to the prospective member/i;

  const nameMatch = body.match(namePattern);
  const emailMatch = body.match(emailPattern);
  const guestMessageMatch = body.match(
    guestMessagePattern
  );

  if (!nameMatch || !emailMatch) {
    console.log(
      `Club-message pattern was not found in message ${message.getId()}`
    );

    return null;
  }

  const name = splitGuestName_(nameMatch[1]);

  const guestMessage = guestMessageMatch
    ? guestMessageMatch[1]
        .trim()
        .replace(/\s+/g, ' ')
    : '';

  return {
    firstName: name.firstName,
    lastName: name.lastName,

    email: emailMatch[1]
      .trim()
      .toLowerCase(),

    inquiryType: 'Club Message',
    inquiryDate: message.getDate(),

    // A general message does not necessarily specify
    // which meeting the guest plans to attend.
    meetingDate: '',

    notes: guestMessage
      ? `Guest message: ${guestMessage}`
      : ''
  };
}


/**
 * Separates a person's full name into first and last names.
 */
function splitGuestName_(fullName) {
  const cleanedName = String(fullName)
    .trim()
    .replace(/\s+/g, ' ');

  const nameParts = cleanedName.split(' ');

  const firstName =
    nameParts.shift() || '';

  const lastName =
    nameParts.join(' ');

  return {
    firstName: firstName,
    lastName: lastName
  };
}


/**
 * Determines the correct year for a meeting date.
 *
 * Toastmasters notifications may say:
 * "Thursday, July 09"
 * without including the year.
 */
function determineMeetingYear_(
  meetingDateText,
  emailDate
) {
  const currentYear =
    emailDate.getFullYear();

  const tentativeDate = new Date(
    `${meetingDateText}, ${currentYear}`
  );

  const difference =
    tentativeDate.getTime() -
    emailDate.getTime();

  const sixMonthsInMilliseconds =
    183 * 24 * 60 * 60 * 1000;

  if (
    difference <
    -sixMonthsInMilliseconds
  ) {
    return currentYear + 1;
  }

  return currentYear;
}

/**
 * Updates a guest when a new Toastmasters
 * interaction arrives for an existing person.
 */
function updateExistingGuest_(
  sheet,
  rowNumber,
  guest,
  message
) {
  // Inquiry Type
  sheet
    .getRange(rowNumber, 6)
    .setValue(guest.inquiryType);

  // Most recent inquiry date
  sheet
    .getRange(rowNumber, 7)
    .setValue(guest.inquiryDate);

  // If a meeting was scheduled,
  // update the scheduled meeting.
  if (guest.meetingDate) {
    sheet
      .getRange(rowNumber, 8)
      .setValue(guest.meetingDate);

    sheet
      .getRange(rowNumber, 10)
      .setValue('Unknown');
  }

  const joined =
    String(
      sheet
        .getRange(rowNumber, 18)
        .getValue()
    )
      .trim()
      .toLowerCase();

  // Do not restart outreach for someone
  // who has already joined.
  if (joined !== 'yes') {
    sheet
      .getRange(rowNumber, 9)
      .setValue('New Lead');

    sheet
      .getRange(rowNumber, 16)
      .setValue('Send Welcome');
  }

  // Add the new prospect message to Notes
  // without destroying existing notes.
  if (guest.notes) {
    const notesCell =
      sheet.getRange(
        rowNumber,
        20
      );

    const existingNotes =
      String(
        notesCell.getValue() || ''
      ).trim();

    const newNotes =
      existingNotes
        ? `${existingNotes}\n\n${guest.notes}`
        : guest.notes;

    notesCell.setValue(newNotes);
  }

  // Store the latest Gmail message ID.
  sheet
    .getRange(rowNumber, 21)
    .setValue(message.getId());

  sheet
    .getRange(rowNumber, 7)
    .setNumberFormat(
      'mmm d, yyyy h:mm AM/PM'
    );

  if (guest.meetingDate) {
    sheet
      .getRange(rowNumber, 8)
      .setNumberFormat(
        'mmm d, yyyy'
      );
  }
}

/**
 * Adds a prospective member to the Guests worksheet.
 */
function addGuestToSheet_(
  sheet,
  guest,
  message
) {
  const nextRow =
    Math.max(
      sheet.getLastRow() + 1,
      4
    );

  const guestId =
    createGuestId_(sheet);

  const row = [
    guestId,                 // A Guest ID
    guest.firstName,         // B First Name
    guest.lastName,          // C Last Name
    guest.email,             // D Email
    '',                      // E Phone
    guest.inquiryType,       // F Inquiry Type
    guest.inquiryDate,       // G Inquiry Date
    guest.meetingDate,       // H Scheduled Meeting
    'New Lead',              // I Status
    'Unknown',               // J Attendance
    '',                      // K Welcome Sent
    '',                      // L Reminder Sent
    0,                       // M Follow-Up Count
    '',                      // N Last Contact
    '',                      // O Next Follow-Up
    'Send Welcome',          // P Next Action
    'No',                    // Q Replied?
    'No',                    // R Joined?
    'Toastmasters.org',      // S Source
    guest.notes || '',       // T Notes
    message.getId()          // U Original Message ID
  ];

  sheet
    .getRange(
      nextRow,
      1,
      1,
      row.length
    )
    .setValues([row]);

  // Inquiry Date and Scheduled Meeting
  sheet
    .getRange(nextRow, 7, 1, 2)
    .setNumberFormat(
      'mmm d, yyyy'
    );

  // Welcome Sent and Reminder Sent
  sheet
    .getRange(nextRow, 11, 1, 2)
    .setNumberFormat(
      'mmm d, yyyy h:mm AM/PM'
    );

  // Last Contact and Next Follow-Up
  sheet
    .getRange(nextRow, 14, 1, 2)
    .setNumberFormat(
      'mmm d, yyyy h:mm AM/PM'
    );

  return nextRow;
}

/**
 * Creates an audit record for a Toastmasters
 * inbound prospective-member activity.
 */
function logInboundActivity_(
  guestsSheet,
  guestRow,
  guest,
  message,
  outcome
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

  const guestId =
    guestsSheet
      .getRange(guestRow, 1)
      .getValue();

  const guestName =
    `${guest.firstName} ${guest.lastName}`
      .trim();

  const nextRow =
    Math.max(
      logSheet.getLastRow() + 1,
      4
    );

  const contactId =
    createContactId_(logSheet);

  const summary =
    guest.inquiryType ===
    'Scheduled Visit'
      ? 'Prospective member scheduled a club visit'
      : 'Prospective member messaged the club';

  const notes = [
    `Gmail Message ID: ${message.getId()}`,
    guest.notes || ''
  ]
    .filter(Boolean)
    .join('\n');

  const row = [
    contactId,          // A Contact ID
    guestId,            // B Guest ID
    guestName,          // C Guest Name
    message.getDate(),  // D Contact Date
    'Email',            // E Method
    'Inbound Lead',     // F Contact Type
    summary,            // G Subject / Summary
    outcome,            // H Outcome
    '',                 // I Next Follow-Up
    notes               // J Notes
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
}

/**
 * Creates the next sequential Guest ID.
 *
 * Example:
 * G-0001
 * G-0002
 * G-0003
 */
function createGuestId_(sheet) {
  const lastRow =
    sheet.getLastRow();

  if (lastRow < 4) {
    return 'G-0001';
  }

  const guestIds = sheet
    .getRange(
      4,
      1,
      lastRow - 3,
      1
    )
    .getValues()
    .flat();

  let highestNumber = 0;

  guestIds.forEach(id => {
    const match =
      String(id).match(
        /^G-(\d+)$/
      );

    if (match) {
      highestNumber =
        Math.max(
          highestNumber,
          Number(match[1])
        );
    }
  });

  return (
    `G-${String(
      highestNumber + 1
    ).padStart(4, '0')}`
  );
}
/**
 * Creates sequential Contact Log IDs.
 *
 * Example:
 * C-0001
 * C-0002
 */
function createContactId_(sheet) {
  const lastRow =
    sheet.getLastRow();

  if (lastRow < 4) {
    return 'C-0001';
  }

  const ids = sheet
    .getRange(
      4,
      1,
      lastRow - 3,
      1
    )
    .getValues()
    .flat();

  let highestNumber = 0;

  ids.forEach(id => {
    const match =
      String(id).match(
        /^C-(\d+)$/
      );

    if (match) {
      highestNumber =
        Math.max(
          highestNumber,
          Number(match[1])
        );
    }
  });

  return (
    `C-${String(
      highestNumber + 1
    ).padStart(4, '0')}`
  );
}