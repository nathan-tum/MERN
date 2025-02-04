const ErrorHandler = require('../utils/errorHandler')
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal server error.'
  if (process.env.NODE_ENV == 'DEVELOPMENT') {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      errorMessage: err.message,
      stack: err.stack,
    })
  }

  if (process.env.NODE_ENV == 'PRODUCTION') {
    let error = { ...err }
    error.message = err.message
    if (err.name === 'CastError') {
      const message = `Resource not found. Invalid ${err.path}`
      error = new ErrorHandler(message, 400)
    }
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map((value) => value.message)
      error = new ErrorHandler(message, 400)
    }
    //handling mongoose duplicate keys errors
    if (err.code === 11000) {
      const message = `Duplicate ${Object.keys(err.keyValue)} entered.`
      error = new ErrorHandler(message, 400)
    }
    //handling wrong JWT errors
    if (err.name === 'JsonWebTokenError') {
      const message = 'JSON Web Token is invalid. Try again!!'
      error = new ErrorHandler(message, 400)
    }
    if (err.name === 'TokenExpiredError') {
      const message = 'JSON Web Token is expired. Try again!!'
      error = new ErrorHandler(message, 400)
    }
    res.status(error.statusCode).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}
