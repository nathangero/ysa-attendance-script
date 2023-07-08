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
      let firstName = row[INDEX_COL_A].trimEnd()
      let lastName = row[INDEX_COL_B].trimEnd()
      let entry = `${lastName}, ${firstName}`
  
      attendeesForToday.push([entry]) // To update rows in a single column, add a new array into the array.
    })
  
    return attendeesForToday
  }