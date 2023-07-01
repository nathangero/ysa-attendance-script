function markAttendance() {
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

  /*
    TODO:
    - Get all the attendee names for today
    - In the big Attendance sheet, need to find the row of the name,
      - if name doesn't exist, add a new row for them
      - else, mark under the date they attended
    - sort column A from A->Z
  */
}


// Return a list of all the attendees for the current date.
function getAttendeesNames(responseSheet, todayStr) {
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
let rangeString = `${SUNDAY1_START}${startRange}${SUNDAY2_END}${endRange}` // Only gets first and last names
let repsonseInfo = responseSheet.getRange(QR_CODE_SHEET_NAME + rangeString)

repsonseInfo.getValues().forEach((row, index) => {
  let firstName = row[INDEX_COL_A]
  let lastName = row[INDEX_COL_B]
  let entry = `${lastName}, ${firstName}`

  attendeesForToday.push([entry]) // To update rows in a single column, add a new array into the array.
})

return attendeesForToday
}