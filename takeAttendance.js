const TEST_ATTENDANCE_SHEET_NAME = 'TEST_MARK_ATTENDANCE'

function getAttendanceForDate() {
  const d = new Date()
  const currDay = d.getDay()
  const today = d.toString()
  const todaySplit = today.split(" ")
  const todayStr = todaySplit[0] + " " + todaySplit[1] + " " + todaySplit[2] + " " + todaySplit[3]
  // const todayStr = "Sun June 25 2023"
  // console.info("Today's date:", todayStr)

  /* ** We only want attendance updated on Sunday's ** */
  if (currDay != SUNDAY) {
    console.info("There's no church today:", todayStr)
    return
  }


  let monthIndex = d.getMonth() // Used to get the correct month from the MONTHS array to access the proper google sheet
  let currentYear = d.getFullYear() // Used to get the year that this function runs in to access the proper google sheet

  let monthSheetName = MONTHS[monthIndex] + " " + currentYear
  // console.info('monthSheetName:', monthSheetName)

  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const attendanceSheet = SpreadsheetApp.setActiveSheet(ss.getSheetByName(monthSheetName)) // Get the month sheet
  const FIRST_SUNDAY = COLUMN_LETTER[0] // Get the first letter that will have the first sunday date
  const LAST_SUNDAY = COLUMN_LETTER[COLUMN_LETTER.length - 1] // Get the last letter that will have the last sunday date
  let attendanceRange = attendanceSheet.getRange(monthSheetName + "!" + FIRST_SUNDAY + "1:" + LAST_SUNDAY + "1") // Get only the range of sundays listed in the sheet

  let columnIndex = 0 // We use this to find the column letter to use when updating the cells.
  let rangeValues = attendanceRange.getValues()[0]
  let rangeOfSundays = rangeValues.filter((date) => { // O(n)
    // Skip any empty dates
    if (date === '' || date === undefined) {
      return false
    }
    
    let dateToFilter = new Date(todayStr)

    if (date.getTime() === dateToFilter.getTime()) {
      return true
    } else {
      columnIndex += 1
    }
  })

  let sundayDate = rangeOfSundays[0] // There'll only be one result
  // console.info('sundayDate:', sundayDate)

  /* ** End if today's date wasn't found in the sheet ** */
  if (sundayDate === '' || sundayDate === undefined) {
    console.info("Date wasn't found")
    return
  }

  // console.info("this is running on sunday")

  const responseSheet = SpreadsheetApp.setActiveSheet(ss.getSheetByName(QR_CODE_SHEET_NAME)) // Get a specific sheet
  var attendeesForToday = getAttendeesFromFormSubmission(responseSheet, todayStr) // Get all the names of the attendees for today

  // console.info('how many attended:', attendeesForToday.length)
  // console.info('who attended', todayStr, '?\n', attendeesForToday)

  // Put all the attendees into the corresponding month sheet
  let columnLetter = COLUMN_LETTER[columnIndex]
  let namesEndRange = TOP_NAMES_ROW + (attendeesForToday.length - 1) // Row 3 plus how many attendees today
  let rangeToSet = columnLetter + TOP_NAMES_ROW + ":" + columnLetter + namesEndRange
  // console.info('range to update:', rangeToSet)

  attendanceRange = attendanceSheet.getRange(rangeToSet) // set range to update under the corresponding sunday
  attendanceRange.setValues(attendeesForToday) // Update the new values
  attendanceRange.setFontFamily(FONT_FAMILY).setFontSize(FONT_SIZE).sort({column: LETTER_TO_COLUMN_NUM[columnLetter], ascending: true}) // Sort alphabetically the new values
}

// Return a list of all the attendees for the current date.
function getAttendeesFromFormSubmission(responseSheet, todayStr) {
  let index = 2 // Since names start at row 2
  let responseIndexForName = [] // Store all the indecies where there's a value that matches the date
  let responseDate = responseSheet.getRange(QR_CODE_SHEET_NAME + "!A2:A") // All Sunday dates are in column A

  responseDate.getValues().filter((fullDate) => {
    // We don't want the time
    let dateComponents = String(fullDate).split(" ")
    let day = dateComponents[0]
    let month = dateComponents[1]
    let date = dateComponents[2]
    let year = dateComponents[3]
    let dateString = `${day} ${month} ${date} ${year}`

    let dateToFilter = new Date(todayStr)
    let valueDate = new Date(dateString)

    if (isNaN(valueDate.getTime())) {
      return false
    } 

    // console.info('date:', dateString, valueDate.getTime())
    // console.info('todayStr:', todayStr, dateToFilter.getTime())
    // console.info()

    if (valueDate.getTime() === dateToFilter.getTime()) {
      responseIndexForName.push(index)
    }

    index += 1
  })
  
  // console.info('which indexes contain', todayStr, '?', responseIndexForName)

  
  // Get the start and end ranges that we want to scan through
  let startRange = responseIndexForName[0]
  let endRange = responseIndexForName[responseIndexForName.length - 1]

  /* Make a check against non existant dates */
  if (startRange == undefined && endRange == undefined) { 
    console.log('today was not found in attendance sheet')
    console.log('todays date:', todayStr)
    return
  }

  let attendeesForToday = []
  let rangeString = `${SUNDAY1_START}${startRange}${SUNDAY4_END}${endRange}`
  let repsonseInfo = responseSheet.getRange(QR_CODE_SHEET_NAME + rangeString)

  repsonseInfo.getValues().forEach((row, index) => {
    let firstName = row[INDEX_COL_A]
    let lastName = row[INDEX_COL_B]
    let visitor = row[INDEX_COL_C]
    let organization = row[INDEX_COL_D]

    let entry = `${lastName}, ${firstName}`
    if (organization === EQ) {
      entry += " (E)"
    } else if (organization === RS) {
      entry += " (R)"
    }

    // If attendee is visiting, put a V
    if (visitor == "Yes") {
      entry += " (V)"
    }

    attendeesForToday.push([entry]) // To update rows in a single column, add a new array into the array.
  })

  return attendeesForToday
}















