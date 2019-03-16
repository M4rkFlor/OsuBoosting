Ripple Boosting Website
==============

I open sourced the code to my website, if you want to run a local instance to check out the admin pannel you need to have node.js and mongodb installed, Also you need to set these enviroment varibles.
process.env.MONGOOSE_URI //mongodb://localhost:27017/userdb
process.env.HOST //localhost:3000
process.env.GMAIL_USER //example@gmail.com
process.env.GMAIL_PASS //email is used to send email confirmation, also need to set your email account to enable Less secure apps.
process.env.EMAIL_SECRET //can be random characters
process.env.SESSION_SECRET //can be random characters
process.env.PORT //3000 by defualt