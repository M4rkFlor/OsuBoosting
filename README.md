# [Ripple Boosting Website](https://osu-boost.herokuapp.com/ "https://osu-boost.herokuapp.com/")
This website has all the major features of majority of websites, such as email verification, DDOS protection, and payment processing. Due to the generic features this can be used as a Node.js boilerplate. If you want to run a local instance to check out the admin pannel you need to have node.js and mongodb installed, Also you need to set these enviroment variables.

<h2>enviroment variables:</h2>  
process.env.MONGOOSE_URI //mongodb://localhost:27017/userdb <br />
process.env.HOST //localhost:3000  <br />
process.env.GMAIL_USER //example@gmail.com  <br />
process.env.GMAIL_PASS //email is used to send email confirmation, also need to set your email account to enable Less secure apps.  <br />
process.env.EMAIL_SECRET //can be random characters  <br />
process.env.SESSION_SECRET //can be random characters  <br />
process.env.PORT //3000 by defualt <br />
