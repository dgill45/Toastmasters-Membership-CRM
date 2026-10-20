        /**
         * Processes manual attendance selections and
         * updates the guest's CRM status and next action.
         */
        function processAttendance() {
          const ss =
            SpreadsheetApp.getActiveSpreadsheet();

          const sheet =
            ss.getSheetByName('Guests');

          if (!sheet) {
            throw new Error(
              'Guests sheet not found.'
            );
          }

          /*
          * Row 3 contains the column headers.
          * Guest records begin on row 4.
          */
          const headerRow = 3;
          const firstDataRow = 4;

          const lastRow =
            sheet.getLastRow();

          if (lastRow < firstDataRow) {
            SpreadsheetApp
              .getUi()
              .alert(
                'There are no guests to process.'
              );

            return;
          }

          const lastColumn =
            sheet.getLastColumn();

          const headers =
            sheet
              .getRange(
                headerRow,
                1,
                1,
                lastColumn
              )
              .getValues()[0];

          const data =
            sheet
              .getRange(
                firstDataRow,
                1,
                lastRow - firstDataRow + 1,
                lastColumn
              )
              .getValues();

          const col = {
            attendance:
              headers.indexOf('Attendance'),

            status:
              headers.indexOf('Status'),

            nextAction:
              headers.indexOf('Next Action'),

            nextFollowUp:
              headers.indexOf('Next Follow-Up'),

            scheduledMeeting:
              headers.indexOf('Scheduled Meeting'),

            joined:
              headers.indexOf('Joined?')
          };

          /*
          * Make sure all necessary CRM columns exist.
          */
          const requiredColumns = [
            'attendance',
            'status',
            'nextAction',
            'nextFollowUp',
            'scheduledMeeting'
          ];

          requiredColumns.forEach(key => {
            if (col[key] === -1) {
              throw new Error(
                `Required column missing: ${key}`
              );
            }
          });

          let processed = 0;
          let skipped = 0;

          data.forEach(
            (row, index) => {

              const sheetRow =
                firstDataRow + index;

              /*
              * Don't restart the guest workflow
              * for someone who has already joined.
              */
              if (
                col.joined !== -1 &&
                String(row[col.joined])
                  .trim()
                  .toLowerCase() === 'yes'
              ) {
                skipped++;
                return;
              }

              const attendance =
                String(
                  row[col.attendance] || ''
                )
                  .trim()
                  .toLowerCase();

              let newStatus = '';
              let nextAction = '';

              switch (attendance) {

                case 'attended':
                  newStatus =
                    'Attended';

                  nextAction =
                    'Send Thank You';

                  break;

                case 'no show':
                case 'no-show':
                case 'noshow':
                  newStatus =
                    'No Show';

                  nextAction =
                    'Send Missed You';

                  break;

                case 'cancelled':
                case 'canceled':
                  newStatus =
                    'Cancelled';

                  nextAction =
                    'No Action';

                  break;

                default:
                  /*
                  * Includes Unknown or blank attendance.
                  */
                  skipped++;
                  return;
              }

              const currentStatus = String(row[col.status] || '')
                .trim()
                .toLowerCase();
  

                if (
                  currentStatus ===
                  newStatus.toLowerCase()
                ) {
                  skipped++;
                  return;
                }

              const meetingDate =
                row[col.scheduledMeeting];

              let followUpDate = "";
                if (
                  attendance!== 'cancelled' &&
                  attendance!== 'canceled'
                ){
                  followUpDate = 
                    getAttendanceFollowUpDate_(
                      meetingDate
                );
                }

              sheet
                .getRange(
                  sheetRow,
                  col.status + 1
                )
                .setValue(newStatus);

              sheet
                .getRange(
                  sheetRow,
                  col.nextAction + 1
                )
                .setValue(nextAction);

              sheet
                .getRange(
                  sheetRow,
                  col.nextFollowUp + 1
                )
                .setValue(followUpDate)
                .setNumberFormat(
                  'mmm d, yyyy h:mm AM/PM'
                );

              processed++;
            }
          );

          SpreadsheetApp
            .getUi()
            .alert(
              'Attendance processing complete.\n\n' +
              `Processed: ${processed}\n` +
              `Skipped: ${skipped}`
            );
        }


        /**
         * Determines when the post-meeting
         * follow-up should occur.
         */
        function getAttendanceFollowUpDate_(
          meetingDate
        ) {
          const followUp =
            meetingDate instanceof Date
              ? new Date(meetingDate)
              : new Date();

          /*
          * Follow up at 9:00 AM
          * the day after the meeting.
          */
          followUp.setDate(
            followUp.getDate() + 1
          );

          followUp.setHours(
            9,
            0,
            0,
            0
          );

          return followUp;
        }