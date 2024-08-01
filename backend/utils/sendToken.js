const sendToken = (user, statusCode, res) => {
  const tokens = user.getJwtToken()
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 100
    ),
    httpOnly: true,
  }
  res.status(statusCode).cookie('token', tokens, options).json({
    success: true,
    tokens,
    user,
  })
}
module.exports = sendToken
