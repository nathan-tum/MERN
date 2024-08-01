const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
app.use(express.json())
app.use(cookieParser)

const errorMiddleware = require('./middlewares/errors')

const bodyparser = require('body-parser')
const cloudinary = require('cloudinary')
const fileupload = require('express-fileupload')
//importing routes
const products = require('./routes/products')
const auth = require('./routes/auth')
const order = require('./routes/order')

app.use(errorMiddleware)

app.use('/api/v1', products)
app.use('/api/v1', auth)
app.use('/api/v1', order)
app.use(fileupload())
module.exports = app
