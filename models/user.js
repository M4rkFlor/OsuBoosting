var bcrypt = require("bcrypt-nodejs");
var SALT_FACTOR = 10;
var mongoose = require("mongoose");
var jwt = require('jsonwebtoken');//npm install jsonwebtoken
let EMAIL_SECRET = process.env.EMAIL_SECRET;
const nodemailer = require("nodemailer");//Use OAUTH2 or Enable less secure apps
//const google = require("googleapis");
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET; 
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
//const REDIRECT_URI = process.env.REDIRECT_URI 
//const oauth2Client = new google.auth.Oauth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
//oauth2Client.setCredentials({refresh_token: REFRESH_TOKEN});
//const accToken = await oauth2Client.getAccessToken();
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.GMAIL_USER, // replace these with email and email password
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    refreshToken: REFRESH_TOKEN
    //accessToken shoudl be automatically generated on failed attempt, claims the documentations
    //pass: process.env.GMAIL_PASS  // Also need to dissable less secure apps https://stackoverflow.com/questions/19877246/nodemailer-with-gmail-and-nodejs
  },
});
var userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  emailConfirmed: {type: Boolean, required: true, default: false },
    //Username as shown on the osu! website.
  osu_username: { type: String, required: true, unique: true  },
  osu_password: { type: String, required: true },
    //Location user plays osu for VPN
  country: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  zip: { type: String, required: true },
  //order info
  currentOrderID: { type: String, required: false },
  saleID: { type: String, required: false },
  //Never or Date
  dateLastBoosted: { type: String, required: true, default: 'never' },
  HasOrderPending: { type: Boolean, required: true, default: false },
  TotalBoostsBought: { type: Number, required: true, min: 0, default: 0},
  TotalBoostsCanceled: { type: Number, required: true, min: 0, default: 0},
  status: { type: String, required: true , default: 'never'},
  DateOrdered: { type: String, required: false },//can remove this after wipping db and implimenting start and end order date arrays
  refundLink: { type: String, required: false },
  boostedBMs: [{ type: String, required: false }],
  purchaseDates: [{ type: String, required: false }],
  purchaseCompleteDates: [{ type: String, required: false }],
  admin: {type: Boolean, required: true, default: false }
});


var noop = function() {};

userSchema.pre("save", function(done) {
  console.log("userSchema.pre save");
  var user = this;

  if (!user.isModified("password")) {
   console.log("userSchema.pre save not modified");
   return done();
  }
  console.log("userSchema.pre bcrypt");

//send mail either here or in bcrypt after finish 0x17825
console.log(user.username + " 667766");//667766
jwt.sign(
  {
    username: user.username//_.pick(user, 'username'),//userid? 667766
  },
  EMAIL_SECRET,//secret key
  {
    //expiresIn: '1d', never expire
  },
  (err, emailToken) => {
    const url = `http://${process.env.HOST}/confirmation/${emailToken}`;//localhost:3000
    const giturl = `https://github.com/M4rkFlor/Pay-Pal-Form-Filler`;
    transporter.sendMail({
      to: user.email,
      subject: 'Confirm Email',
      html: `Warning: this service is FRE<a href="${url}" style="color:#222; text-decoration: none;">E</a> as in 0.00$ , do NOT provide a real credit/debit card number at checkout, use FakeNameGenerator or any other tool. Click the link hidden in the last 'E' of FREE, then you can login, Also by creating an account you agree to the terms of service. 
      Tip: Filling the paypal form takes a long time, so I made a chrome extension on <a href="${giturl}" style="color:#222; text-decoration: none;">github</a>. You should dissable the extension when your done using it, or else it will probably annoy you.`,
    });//should be in try catch, but if this fails then it wont work anyway.
  },
);

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) { return done(err); }

    bcrypt.hash(user.password, salt, noop, function(err, hashedPassword) {
      if (err) { return done(err); }
  console.log("userSchema.pre set password to hashedPassword");
      user.password = hashedPassword;
      //0x17825
      done();
    });


  });
});

userSchema.methods.checkPassword = function(guess, done) {
    console.log("userSchema.methods.checkPassword");
  bcrypt.compare(guess, this.password, function(err, isMatch) {
    done(err, isMatch);
  });
};

userSchema.methods.name = function() {
  return this.displayName || this.username;
};

var User = mongoose.model("User", userSchema);

module.exports = User;