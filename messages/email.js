const nodemailer = require('nodemailer')
const { emailservice, emailport, emailuser, emailpass } = require('../config/environment')

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: emailservice,
  port: Number(emailport),
  auth: {
    user: emailuser,
    pass: emailpass
  },
  tls: {
    rejectUnauthorized: false
  }
})


module.exports.sendEmail = async ( email ) => {
  const info = await transporter.sendMail({
    from: email.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html
  })
  return info
}


