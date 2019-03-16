var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var express = require("express");
var flash = require("connect-flash");
var mongoose = require("mongoose");
var passport = require("passport");
var path = require("path");
var session = require("express-session");
var MemoryStore = require('memorystore')(session);
var RateLimiterMemory = require('rate-limiter-flexible').RateLimiterMemory;
var setUpPassport = require("./setuppassport");
var routes = require("./routes");

var app = express();
//original way mongoose.connect("mongodb://localhost:27017/userdb");
//maybe better await mongoose.connect('mongodb://localhost:27017/test', { useMongoClient: true });
//
async function run() {
    // With `useMongoClient`, `mongoose.connect()` returns a thenable
    console.log("waiting to connect to mongo");
    await mongoose.connect(process.env.MONGOOSE_URI, { //connect to real db // replace URI with "mongodb://localhost:27017/userdb" if on local host
        //useMongoClient: true //depricated
        useNewUrlParser: true,
        retryWrites: true
    });

    console.log("Connected to mongo in async after wait");
}
//
function retryUntillConnect() {
    run().catch(error => {
        console.error(error.stack);
        retryUntillConnect(); //do another attemp
    }); // calls run and cathes errors
}
retryUntillConnect();


setUpPassport();

app.set("port", process.env.PORT || 3000);

app.use('/', express.static('./'));
//first part is virtual dir and second is real path.
//app.use('/js', express.static('./public/js')); uncomment this if errors
//app.use('/components', express.static('./public/js/components'));
//app.use('/css', express.static('./public/css'));

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());

app.use(session({
    store: new MemoryStore({
      checkPeriod: 3600000 // prune expired entries every 1h
    }),
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

// rate limit
const rateLimiterSite = new RateLimiterMemory({
    points: 30, // Number of points
    duration: 1, // Per 1 seconds
  });
  const rateLimiterProtected = new RateLimiterMemory({
    points: 15,
    duration: 1,
  });
  const rateLimiterMiddleware = (req, res, next) => {
    if (req.path.indexOf('/login') === 0 || req.path.indexOf('/signup') === 0 ){
        rateLimiterProtected.consume(req.ip, 5) // Consume 5 points
        .then( () => { next(); })
        .catch( () => { res.status(429).send('Too Many Requests'); }); 
    } else {
        rateLimiterSite.consume(req.ip, req.isAuthenticated() ? 1 : 5) // Consume 2 points if signed else 5 points
        .then( () => { next(); })
        .catch( () => { res.status(429).send('Too Many Requests'); });
    }
     };
app.use(rateLimiterMiddleware);
//
app.use(routes);

// handel 404 pages needs to be last app.use
app.use(function (req, res, next) {
  res.status(404).send("cmonBruh that doesn't exist!");
    //can make custum 404 page
    //let thePath = path.resolve(__dirname,"public/views/login.html");
	//res.status(404).sendFile(thePath);	
})

app.listen(app.get("port"), function () {
    console.log("Server started on port " + app.get("port"));
});
