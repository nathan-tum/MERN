const app = require('./app')
const dotenv = require('dotenv')
const cloudinary = require('cloudinary')
const connectDatabase = require('./config/database')
dotenv.config({ path: 'backend/config/config.env' })

process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`)
  console.log('Shutting down due to uncaught exceptions.')
  process.exit(1)
})

connectDatabase()

//setting up cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server started on port: ${process.env.PORT} on ${process.env.NODE_ENV} mode`
  )
})

//handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`ERROR: ${err.stack}`)
  console.log('Shutting down the server due to unhandled promise rejection.')
  server.close(() => {
    process.exit()
  })
})
