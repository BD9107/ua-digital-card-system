// Logger that only shows messages during development
const logger = {
  log: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      //console.log(...args)
    }
  },
  error: (...args) => {
    if (process.env.NODE_ENV === 'development') {
     // console.error(...args)
    }
    // In production, you could send errors to a tracking service
  },
  warn: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args)
    }
  },
}

export default logger