const QR_CODE_SHEET_NAME = 'qr_code_response'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const COLUMN_LETTER = ['B', 'C', 'D', 'E', 'F'] // These are the columns in the sheet that the dates will be under
const LETTER_TO_COLUMN_NUM = {'B':2, 'C':3, 'D':4, 'E':5, 'F':6} // Used for when sorting the column
const TOP_NAMES_ROW = 7 // The first row where the names will be inputed in the selected column
const FONT_SIZE = 11
const FONT_FAMILY = "Arial"
const SUNDAY = 0 // We only want Sunday which is 0 in Date.getDay()
const EQ = "Elder's Quorum"
const RS = "Relief Society"
const SUNDAY1_START = "!B"
const SUNDAY1_END = ":B"
const SUNDAY2_START = "!C"
const SUNDAY2_END = ":C"
const SUNDAY3_START = "!D"
const SUNDAY3_END = ":D"
const SUNDAY4_START = "!E"
const SUNDAY4_END = ":E"
const SUNDAY5_START = "!F"
const SUNDAY5_END = ":F"

function getAttendanceForDate() {
  const d = new Date()
  const currDay = d.getDay()
  const today = d.toString()
  const todaySplit = today.split(" ")
  const todayStr = todaySplit[0] + " " + todaySplit[1] + " " + todaySplit[2] + " " + todaySplit[3]
  // const todayStr = "Sun Mar 19 2023"
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
  let isToday = false
  attendanceRange.getValues()[0].every(v => { // Use .every() so we can break out when needed
    let vStr = String(v)
    // console.info('is today?', vStr)
    if (vStr.includes(todayStr)) {
      isToday = true
      // console.info('found today')
      // console.info('columnIndex:', columnIndex)
      return false // Break out of the loop
    }
    
    columnIndex += 1
    return true // Keep the loop going
  })

  /* ** End if today's date wasn't found in the sheet ** */
  if (!isToday) {
    console.info('no cooresponding date was found')
    return
  }

  const responseSheet = SpreadsheetApp.setActiveSheet(ss.getSheetByName(QR_CODE_SHEET_NAME)) // Get a specific sheet
  var attendeesForToday = getAttendeesFromFormSubmission(responseSheet, todayStr) // Get all the names of the attendees for today

  console.info('how many attended:', attendeesForToday.length)
  // console.info('who attended', todayStr, '?\n', attendeesForToday)

  // Put all the attendees into the corresponding month sheet
  let columnLetter = COLUMN_LETTER[columnIndex]
  let namesEndRange = TOP_NAMES_ROW + (attendeesForToday.length - 1) // Row 3 plus how many attendees today
  let rangeToSet = columnLetter + TOP_NAMES_ROW + ":" + columnLetter + namesEndRange
  console.info('range to update:', rangeToSet)

  attendanceRange = attendanceSheet.getRange(rangeToSet) // set range to update under the corresponding sunday
  attendanceRange.setValues(attendeesForToday) // Update the new values
  attendanceRange.setFontFamily(FONT_FAMILY).setFontSize(FONT_SIZE).sort({column: LETTER_TO_COLUMN_NUM[columnLetter], ascending: true}) // Sort alphabetically the new values
}

// Return a list of all the attendees for the current date.
function getAttendeesFromFormSubmission(responseSheet, todayStr) {
  let responseIndexForName = [] // Store all the indecies where there's a value that matches the date
  let responseDate = responseSheet.getRange(QR_CODE_SHEET_NAME + '!A1:A')
  
  responseDate.getValues().forEach((v, index) => {
    let vStr = String(v) // convert the object to a string

    if (vStr.includes(todayStr)) { // check if the string contains the date being looked at
      responseIndexForName.push(index += 1) // Add 1 to coorespond with the sheet row index
    }
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
  let responseFirstNames = responseSheet.getRange(QR_CODE_SHEET_NAME + SUNDAY1_START + startRange + SUNDAY1_END + endRange)
  let responseLastNames = responseSheet.getRange(QR_CODE_SHEET_NAME + SUNDAY2_START + startRange + SUNDAY2_END + endRange)
  let responseIsVisiting = responseSheet.getRange(QR_CODE_SHEET_NAME + SUNDAY3_START + startRange + SUNDAY3_END + endRange)
  let responseAttendanceType = responseSheet.getRange(QR_CODE_SHEET_NAME + SUNDAY4_START + startRange + SUNDAY4_END + endRange)
  let responseOrganization = responseSheet.getRange(QR_CODE_SHEET_NAME + SUNDAY5_START + startRange + SUNDAY5_END + endRange)


  // Get the first and last names of the attendees, along if they're in EQ, RS, a visitor, and/or on zoom
  responseFirstNames.getValues().forEach((v, index) => {
    let firstName = String(v) // convert the object to a string
    let lastName = String(responseLastNames.getValues()[index]) // convert the object to a string
    let fullName = lastName + ', ' + firstName

    // Find out which organization the attendee belongs to
    let organization = responseOrganization.getValues()[index]
    if (organization == EQ) {
      fullName += " (E)"
    }
    
    if (organization == RS) {
      fullName += " (R)"
    }

    // If attendee is visiting, put a V
    let isVisiting = responseIsVisiting.getValues()[index]
    if (isVisiting == "Yes") {
      fullName += " (V)"
    }

    // If attendee is on zoom, put a Z
    let attendanceType = responseAttendanceType.getValues()[index]
    if (attendanceType == "Zoom") {
      fullName += " (Z)"
    }

    attendeesForToday.push([fullName]) // To update rows in a single column, add a new array into the array.
  })

  return attendeesForToday
}





























