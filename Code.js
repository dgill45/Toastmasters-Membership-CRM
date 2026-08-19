/**
 * Runs automatically whenever the spreadsheet is opened.
 * Creates a custom menu for the Toastmasters Membership Manager.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('Toastmasters CRM')
    .addItem('Import New Leads', 'importNewLeads')
    .addSeparator()
    .addItem('Send Welcome Emails', 'sendWelcomeEmails')
    .addItem('Send Meeting Reminders', 'sendMeetingReminders')
    .addSeparator()
    .addItem('Refresh Dashboard', 'refreshDashboard')
    .addToUi();
}


/**
 * Temporary placeholder functions.
 * We will replace these as we build each feature.
 */




function sendWelcomeEmails() {
  SpreadsheetApp.getUi().alert(
    'Send Welcome Emails is connected. Email sending will be added later.'
  );
}


function sendMeetingReminders() {
  SpreadsheetApp.getUi().alert(
    'Send Meeting Reminders is connected. Reminder automation will be added later.'
  );
}


function refreshDashboard() {
  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    'The dashboard has been refreshed.'
  );
}