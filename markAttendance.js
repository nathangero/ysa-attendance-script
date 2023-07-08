function markAttendance() {
  const d = new Date()
  const currDay = d.getDay()
  const today = d.toString()
  const todaySplit = today.split(" ")
  const todayStr = todaySplit[0] + " " + todaySplit[1] + " " + todaySplit[2] + " " + todaySplit[3]
  // const todayStr = "Sun Apr 30 2023"
  // console.info("Today's date:", todayStr)

  /* ** We only want attendance updated on Sunday's ** */
  if (currDay != SUNDAY) {
    console.info("There's no church today:", todayStr)
    return
  }


  let currentYear = d.getFullYear() // Used to get the year that this function runs in to access the proper google sheet

  let attendanceSheetName = ATTENDANCE_SHEET_NAME + " " + currentYear
  // console.info('attendanceSheetName:', attendanceSheetName)

  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const attendanceSheet = SpreadsheetApp.setActiveSheet(ss.getSheetByName(attendanceSheetName))
  let targetSunday = new Date(todayStr)
  console.info('looking for:', targetSunday)

  var range = attendanceSheet.getRange("B1:1"); // Assuming the column headers start from A1
  var headers = range.getValues()[0];
  
  let foundColumns = headers
    .map(function (header, index) {
      return { header: header, column: index + 2 };
    })
    .filter(function (column) {
      return column.header instanceof Date && column.header.toDateString() === targetSunday.toDateString();
    });

  if (foundColumns[0].length <= 0) {
    console.info("Today isn't a Sunday")
    return
  }

  let foundSunday = foundColumns[0].header
  var foundSundayColumn = foundColumns[0].column;
  var sundayColumnLetter = getColumnLetter(foundSundayColumn);
  console.info('foundSunday:', foundSunday)
  console.info('sundayColumnLetter:', sundayColumnLetter)

  
  const responseSheet = SpreadsheetApp.setActiveSheet(ss.getSheetByName(QR_CODE_SHEET_NAME)) // Get a specific sheet
  var attendeesForToday = getAttendeesNames(responseSheet, todayStr) // Get all the names of the attendees for today
  // console.info("attendeesForToday:\n", attendeesForToday)

  // Check if attendance was taken
  if (!attendeesForToday) {
    console.info("Attendance wasn't taken on", todayStr)
    return
  }

  for (var i = 0; i < attendeesForToday.length; i++) {
    var targetName = attendeesForToday[i].join(', ')

    var range = attendanceSheet.getRange("A2:A"); // Search in column A of the attendance sheet
    var values = range.getValues().flat();

    var nameRowIndex = values.findIndex((name) => {
      return name.toLowerCase() === targetName.toLowerCase();
    });

    if (nameRowIndex !== -1) {
      // Name found
      let rowNumber = nameRowIndex + 2; // Add 2 because names start on row 2
      // console.info('targetName:', targetName, "is here at row:", rowNumber)

      var cell = attendanceSheet.getRange(rowNumber, foundSundayColumn);
      cell.setBackgroundRGB(204, 255, 204);
    } else {
      // Name not found, create new row
      let lastRow = attendanceSheet.getLastRow();
      let newRow = lastRow + 1;
      let formattedName = formatName(targetName);

      attendanceSheet.getRange(newRow, 1).setValue(formattedName);
      attendanceSheet.getRange(newRow, foundSundayColumn).setBackgroundRGB(204, 255, 204); // Light green color
    }
  }
  
  // Sort by ascending order from A to Z
  let lastColumn = getColumnLetter(attendanceSheet.getLastColumn())
  let lastRow = attendanceSheet.getLastRow()

  var columnARange = attendanceSheet.getRange(`A2:${lastColumn}` + lastRow);
  columnARange.sort({ column: 1, ascending: true });
}

function getColumnLetter(column) {
  var temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}


function formatName(name) {
  var lowercasedName = name.toLowerCase();
  var nameParts = lowercasedName.split(", ");
  var firstName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
  var lastName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);


  return `${lastName}, ${firstName}`;
}
