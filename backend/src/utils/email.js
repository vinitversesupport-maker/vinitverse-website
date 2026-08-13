const nodemailer = require('nodemailer');
require('dotenv').config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@vinitverse.local';

let transporter = null;
if (SMTP_HOST && SMTP_USER){
  transporter = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT || 587, auth: { user: SMTP_USER, pass: SMTP_PASS } });
}

module.exports = async function sendEmail({ to, subject, text, html }){
  if (!transporter){
    console.log('Email:', { to, subject, text });
    return;
  }
  await transporter.sendMail({ from: EMAIL_FROM, to, subject, text, html });
};
