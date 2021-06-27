# [Ripple Boosting Website](https://osu-boost.herokuapp.com/ "https://osu-boost.herokuapp.com/")
This website has all the major features of majority of websites, such as email verification using google oAuth2 API, DDOS protection, and payment processing. Due to the common fundamental features, this can be used as a Node.js boilerplate. If you want to run a local instance to check out the admin pannel you need to have node.js and mongodb installed, Also you need to set these enviroment variables in addition to setting up oAuth2 API from google cloud platform. This website has been runing for about 2 years without problem until google prevented emails from being sent, which resulted in me updating the email logic to use google oAuth2. Hopefully no more maintenance is required for another 2 years.

<h2>enviroment variables:</h2>  
process.env.MONGOOSE_URI //mongodb://localhost:27017/userdb <br />
process.env.HOST //localhost:3000  <br />
process.env.GMAIL_USER //example@gmail.com  <br />
process.env.GMAIL_PASS //email is used to send email confirmation.  <br />
process.env.EMAIL_SECRET //can be random characters  <br />
process.env.SESSION_SECRET //can be random characters  <br />
process.env.PORT //3000 by defualt <br />
process.env.CLIENT_ID  //client ID from google api<br />
process.env.CLIENT_SECRET  //client secret from google api<br />
process.env.REFRESH_TOKEN  //refresh token from google api<br />
