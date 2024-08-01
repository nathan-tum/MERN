const User = require('../models/user')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors')
const sendToken = require('../utils/sendToken')
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')
const cloudinary = require('cloudinary')
const { findById } = require('../models/product')
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: 'avatar',
    width: 150,
    crop: 'scale',
  })
  const { name, email, password } = req.body
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: result.public_id,
      url: result.secure_url,
    },
  })

  sendToken(user, 200, res)
})

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) {
    return next(new ErrorHandler('Please enter email and password', 400))
  }
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    return next(new ErrorHandler('Invalid email or password', 401))
  }
  const isPasswordMatched = await user.comparePassword(password)
  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid email or password', 401))
  }
  sendToken(user, 200, res)
})
//forgot password  =>  /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await user.findOne({ email: req.body.email })
  if (!user) {
    return next(new ErrorHandler('User not found', 404))
  }
  const resetToken = user.getResetPasswordToken()
  await user.save({ validateBeforeSave: false })

  //create reset password url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/password/reset/${resetToken}`
  //message to be sent
  const message = `Your password reset token is as follows:\n\n${resetUrl}\n\nIf you have not requested for this email, then ignore it.`
  //send mail to the user
  try {
    await sendEmail({
      email: user.email,
      subject: 'Ecommerce Password Recovery.',
      message,
    })
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email}`,
    })
  } catch (error) {
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save({ validateBeforeSave: false })
    return next(new ErrorHandler(error.message, 500))
  }
})

//reset password    =>   /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  //hash url token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  })
  if (!user) {
    return next(
      new ErrorHandler('Password reset token is invalid or has expired.', 400)
    )
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler('Passwords do not match.'))
  }
  //setup new password
  user.password = req.body.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined

  await user.save()
  sendToken(user, 200, res)
})

//get currently logged in user details    => /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id)
  res.status(200).json({
    success: true,
    user,
  })
})

//update|change password   =>  /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await findById(req.user.id).select('+password')
  //check prev password
  const isMatched = await user.comparePassword(req.body.oldPassword)
  if (!isMatched) {
    return next(new ErrorHandler('Old password is incorrect.', 404))
  }
  user.password = req.body.password
  await user.save()
  sendToken(user, 200, res)
})

//update profile    =>   /me/update
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  }
  //update avatar
  if (req.body.avatar !== '') {
    const user = await User.findById(req.user.id)
    const image_id = user.avatar.public_id
    const res = await cloudinary.v2.uploader.destroy(image_id)
  }
  const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: 'avatar',
    width: 150,
    crop: 'scale',
  })
  newUserData.avatar = {
    public_id: result.public_id,
    url: result.secure_url,
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })
  res.status(200).json({ success: true })
})

//logout user   => /api/v1/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookies('token', null, { expire: new Date.now(), httpOnly: true })
  res.status(200).json({
    success: true,
    message: 'logged out.',
  })
})

//admin routes
//get all users   =>   /api/v1/admin/users
exports.allUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find()
  res.status(200).json({
    success: true,
    users,
  })
})

//get single user details    =>  /api/v1/user/:id
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return next(
      new ErrorHandler(`User with ID:${req.params.id} not found`, 503)
    )
  }
  res.status(200).json({
    success: true,
    user,
  })
})

//update user profile    =>   /api/v1/admin/user/:id
exports.updateUserProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  }
  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    userFindAndModify: false,
  })
  res.status(200).json({
    success: true,
  })
})

//delete user    =>    /api/v1/admin/user/:id
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return next(
      new ErrorHandler(`User with id:${req.params.id} not found.`, 503)
    )
  }
  await user.remove()
  res.status(200).json({
    success: true,
  })
})
