var express = require("express");
var passport = require("passport");
var path = require("path");
var moment = require('moment');

var jwt = require('jsonwebtoken');
let EMAIL_SECRET = process.env.EMAIL_SECRET; //Is consistent with Secret in user.js

var User = require("./models/user");
var router = express.Router();
const { check, validationResult } = require('express-validator/check');

var paypal = require('paypal-rest-sdk');
paypal.configure({//These secret keys have been shown publicly on paypal documentation.
  'mode': 'sandbox', //sandbox or live
  'client_id': 'EBWKjlELKMYqRNQ6sYvFo64FtaRLRR5BdHEESmha49TM',//get real id and secret
  'client_secret': 'EO422dn3gQLgDbuwqTjzrFgFtaRLRR5BdHEESmha49TM'//at Developer portal these are fake
});



//function ensureAuthenticated(req, res, next) {
//  if (req.isAuthenticated()) {
//    next();
//  } else {
//    req.flash("info", "You must be logged in to see this page.");
//    res.redirect("/login");
//  }
//}

router.use(function(req, res, next) {
  res.locals.messages = req.flash();//makes flash messages able to use this cycle and not the next
  res.locals.currentUserjy = req.user;
  res.locals.errors = req.flash("error");
  res.locals.infos = req.flash("info");
  next();
});





////////INTERNAL//ROUTING/////////////
//these should probably be functions and not routes and find a way to accses res.locals .
//maybe its possible to call successroot(req,res); to send res and req .
router.get("/successroot", function(req, res) {
console.log("get successroot");
	res.json({redirect:"/"});	
});

router.get("/failroot", function(req, res) {
console.log("get failroot");
	res.json({redirect:"/login"});	
});

router.get("/successsignup", function(req, res) {
console.log("get successsignup");
	res.json({redirect:"/session"});	
});

router.get("/failsignup", function(req, res) {
console.log("get failsignup");
	res.json({error : res.locals.messages.error, redirect:"/signup"});	
});

router.get("/successlogin", function(req, res) {
console.log("get successsignup");
	res.json({redirect:"/session"});	
});
router.get("/faillogin", function(req, res) {
console.log("get faillogin");
	res.json({error : res.locals.messages.error, redirect : "/login"});

});


//PayPal payment
router.get("/paysuccess", function(req, res) {
    if(req.isAuthenticated()){
    
    
    //Mandatory to use express-validator here
    //make sure user dosesn't already have a boost in progress.
let payerID = req.query.PayerID;
let paymentId = req.query.paymentId;
    
    var execute_payment_json = {
    "payer_id": payerID,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": "1.00"
                    }
            }]
        };
    
paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        //if credientials are fake or inccorect
        console.log(error.response);
        res.redirect(error.response.name);
        //throw error;
    } else {
        //if any error occurs here the user will have payed and not have been saved in DB
        console.log("execute Payment");
        console.log(JSON.stringify(payment));
        //purcaase is legeit if here
        //save payment to "orders" DB
        function findRefundLink() {
            return new Promise((resolve, reject) => {
                //transactions[0].related_resources[0]
                for(let i=0, links=payment.transactions[0].related_resources[0].sale.links; i<links.length;i++){
                    if(links[i].rel ==='refund'){
                        console.log("the refund link is : " + links[i].href + " The saleID is:" + payment.transactions[0].related_resources[0].sale.id);
                        resolve([links[i].href, payment.transactions[0].related_resources[0].sale.id]);
                    }
                    else if(i===links.length-1){
                           reject(null); 
                            }
                }
            });
        }
        async function updateUser() {
        console.log("waiting to find refund link");
        let refundLink = await findRefundLink();
        console.log("found link in async after await");
            if(refundLink!=null)
               {
               User.findByIdAndUpdate(req.user.id, {currentOrderID: payment.id,
                                            saleID: refundLink[1],
                                            HasOrderPending: true,
                                            $inc: { TotalBoostsBought: 1},
                                            status: 'ongoing',
                                            DateOrdered: payment.create_time,
                                            $push: { purchaseDates: moment()},
                                            refundLink: refundLink[0]}, 
                                            function(err, user) {
                                            //callback unmodified user is returned unless changed options
                                            if(err){
                                            console.log("update error 1689425");
                                            console.error(err);
                                            }else{
                                                console.log("succsesfully updated a user");
                                                //res.send("Actually finished paying succsesfully");
                                                let thePath = path.resolve(__dirname,"public/views/paymentSuccsesfull.html");		
	                                            res.sendFile(thePath);
                                            }
                                            });
               }
            else{
                User.findByIdAndUpdate(req.user.id, {currentOrderID: payment.id,
                                            saleID: refundLink[1],
                                            HasOrderPending: true,
                                            $inc: { TotalBoostsBought: 1},
                                            status: 'ongoing',
                                            DateOrdered: payment.create_time,
                                            $push: { purchaseDates: moment()},
                                            refundLink: "something went wrong retriving the refundLink"}, 
                                            function(err, user) {
                                            //callback unmodified user is returned unless changed options
                                            if(err){
                                            console.log("update error 647262");
                                            console.error(err);
                                            }else{
                                                console.log("succsesfully updated a user with a small error");
                                                let thePath = path.resolve(__dirname,"public/views/paymentSuccsesfull.html");		
	                                            res.sendFile(thePath);
                                            }
                                            });
            }
        
        }
        updateUser();
    }
});
}
    else{
        res.send("not logged in");
    }
});


//any user can refund their own purchase.
router.get("/refund", function(req, res) {
if(req.isAuthenticated()&&req.user.saleID)
{
let data = {
  amount: {
    total: '0.01',
    currency: 'USD'
  }
};
console.log("\x1b[33m%s\x1b[0m","Warning change refund amount to nonzero");  
let saleid = req.user.saleID;
    
paypal.sale.refund(saleid, data, function (error, refund){
  if (error){
    console.error(JSON.stringify(error));
    res.send(JSON.stringify(error));
      
  } else {
    console.log("Self Refund Sale Response");
    console.log(JSON.stringify(refund));
      //update user info TotalBoostsCanceled purchaseCompleteDates
      User.findByIdAndUpdate(req.user.id, {
                            $unset: { currentOrderID: "", saleID: "", DateOrdered: "", refundLink: ""},
                            HasOrderPending: false,
                            status: "Refunded",
                            dateLastBoosted: moment(),
                            $inc: { TotalBoostsCanceled: 1},
                            $push: { purchaseCompleteDates: moment()} },//yes no?
                            function(err, user) {
                            if(err){
                            console.log("update error 76324");
                            console.error(err);
                            res.json({error: "could not refund self order: " + err});
                            }else{
                                console.log("succsesfully completed a self refund");	
	                            res.send({success: "refunded"});
                            }
                            });
  }
});
}
    else
        res.send("you don't have accsess");
});
//refund a user in admin CRM by providing a saleID of the user I want to refund
router.post("/refund",function(req,res){
if (req.isAuthenticated()&&req.user.admin&&req.body.saleID&&req.body.order_id) {
         console.log("post refund");
let data = {
  amount: {
    total: '0.01',//previously 0.67 
    currency: 'USD'
  }
};
    
let saleid = req.body.saleID;
    
paypal.sale.refund(saleid, data, function (error, refund){
  if (error){
    console.error(JSON.stringify(error));
    res.send(JSON.stringify(error));
  } else {
    console.log("Refund Sale Response");
    console.log(JSON.stringify(refund));
      User.findByIdAndUpdate(req.body.order_id, {
                            $unset: { currentOrderID: "", saleID: "", DateOrdered: "", refundLink: ""},
                            HasOrderPending: false,
                            status: "Refunded",
                            dateLastBoosted: moment(),
                            $inc: { TotalBoostsCanceled: 1},
                            $push: { purchaseCompleteDates: moment()} },//yes no?
                            function(err, user) {
                            if(err){
                            console.log("update error 76324");
                            console.error(err);
                            res.json({error: "could not refund an order: " + err});
                            }else{
                                console.log("succsesfully completed a refund");
                                res.send("refunded payment succsess");
                            }
                            });
  }
});

	}
	else {
		res.json(null);
	}
});


router.get("/cancelPayment", function(req, res) {
res.send("cancled payment <a href='/'>Home</a>");
});
//
///////////HTM//PAGES//////////////////////////
router.get("/signup", function(req, res) {
	let thePath = path.resolve(__dirname,"public/views/signup.html");		
	res.sendFile(thePath);
});
router.get("/login", function(req, res) {
if (req.isAuthenticated()) {
	res.redirect("/session");
  } else {
  	let thePath = path.resolve(__dirname,"public/views/login.html");		
	  res.sendFile(thePath);
  }
});
router.get("/session", function(req, res) {
  if (req.isAuthenticated()) {
	let thePath = path.resolve(__dirname,"public/views/session.html");		
	res.sendFile(thePath);	
  } else {
  	let thePath = path.resolve(__dirname,"public/views/login.html");		
	res.sendFile(thePath);
    //using a view engine would be great for this specific scenario
  }
});
router.get("/admin", function(req, res) {
  if (req.isAuthenticated()&&req.user.admin) {
	let thePath = path.resolve(__dirname,"public/views/adminCRM.html");		
	res.sendFile(thePath);
  } else {
  	let thePath = path.resolve(__dirname,"public/views/Home.html");		
	res.sendFile(thePath);
  }
});
router.get("/", function(req, res, next) {
	let thePath = path.resolve(__dirname,"public/views/Home.html");		
	res.sendFile(thePath);	
});

router.get("/about", function(req, res, next) {
    let thePath = path.resolve(__dirname,"public/views/About.html");		
    res.sendFile(thePath);	
  });

////////////////////////////////////////////////////////////



//////////USER//ACCOUNT//MANAGEMENT/////////////
router.post("/login", passport.authenticate("login", {
  successRedirect: "/successlogin",
  failureRedirect: "/faillogin",
  failureFlash: true
}));

router.get("/logout", function(req, res) {
  if (req.isAuthenticated()) {
    req.logout();
    res.redirect("/successroot");
  } else {
    res.redirect("/failroot");
  }
});

router.post("/signup", [
  check('username').not().isEmpty().isLength({ min: 2, max:17 }).withMessage('must be between 2 and 17 characters'),
  check('password').not().isEmpty().isLength({  min: 4, max:50 }).withMessage('must be between 4 and 50 characters'),
  check('email').not().isEmpty().isLength({  min: 3, max:100 }).withMessage('must be between 3 and 100 characters').isEmail().withMessage('must be an email'),
  check('osu_username').not().isEmpty().isLength({  min: 2, max:17 }).withMessage('must be between 2 and 17 characters'),
  check('osu_password').not().isEmpty().isLength({  min: 7, max:100 }).withMessage('must be between 7 and 100 characters'),
  check('country').not().isEmpty().isLength({  min: 1, max:20 }).withMessage('must be between 1 and 20 characters').isAlpha().withMessage('must be only letters'),
  check('state').not().isEmpty().isLength({  min: 2, max:2 }).withMessage('must be 2 characters ex."NY"').isAlpha().withMessage('must be only letters'),
  check('city').not().isEmpty().isLength({  min: 1, max:50 }).withMessage('must be between 1 and 50 characters').isAlpha().withMessage('must be only letters'),
  check('zip').not().isEmpty().isLength({  min: 1, max:10 }).withMessage('must be between 1 and 10 characters').toInt().isPostalCode('any').withMessage('must be a postal code'),
],
(req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("error", errors.array()[0]);
    return res.redirect("/failsignup");
  }
  else
  {
    console.log("routes: post signup");

  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  var osu_username = req.body.osu_username;
  var osu_password = req.body.osu_password;
  var country = req.body.country;
  var state = req.body.state;
  var city = req.body.city;
  var zip = req.body.zip;
  //rest of the fields are created when a valid purchase is made
  User.findOne({ username: username }, function(err, user) {

    if (err) { return next(err); }
    if (user) {
        console.log("I flashed here 31234");
      req.flash("error", "User already exists");
      return res.redirect("/failsignup");
    }
    else{
console.log("post signup1");

    var newUser = new User({
      username: username,
      password: password,
      email: email,
      osu_username: osu_username,
      osu_password: osu_password,
      country: country,
      state : state,
      city: city,
      zip: zip,
      admin: false
    });
console.log("post signup2");
    newUser.save(function (err) {
      if (err) return req.flash("error", "DataBase is full or is not connected");
      console.log("post signup done");
      return res.redirect("/successsignup");
    });
console.log("post signup done");
    }
  });
  }
}
/*, passport.authenticate("login", {
  successRedirect: "/successsignup",
  failureRedirect: "/failsignup",
  failureFlash: true
}) //middleware not needed due to not being able to login if email not confirmed
*/);

router.get('/confirmation/:token', (req, res) => {
    //let TokenUsername = await jwt.verify(req.params.token, EMAIL_SECRET);
    jwt.verify(req.params.token, EMAIL_SECRET, function(err, TokenUsername) {
      if (err) { return res.send('Token Invalid'); }
      console.log(TokenUsername.username) //find user by name from name in token
      User.findOneAndUpdate({ username: TokenUsername.username }, { emailConfirmed: true }, function(err, user) { 
        if (err) {
          console.log(err);
          return res.send('Token Invalid code:1'); //database error
        }
        if (!user) {
          return res.send('Token Invalid code:2'); //means token was decoded with username that dosent exist, should never happen excpet from old testing accounts, change secret
        }
        else {
          console.log("update token succses!");
          return res.redirect("/login");
        }
      });
    });
});
///////////////////////////////////////////////


/////////AJAX//CALLS/////////////////////
router.get("/userInfo",function(req,res){
     if (req.isAuthenticated()) {
		res.json({username:req.user.username});
	}
	else {
		res.json(null);
	}
});

router.get("/usernameOsu",function(req,res){
     if (req.isAuthenticated()) {
		res.json({osu_username:req.user.osu_username});
	}
	else {
		res.json(null);
	}
});

router.get("/sessionInfo",function(req,res){
     if (req.isAuthenticated()) {
         //return all relevant data for session page
         User.findById(req.user.id, 'osu_username status DateOrdered dateLastBoosted boostedBMs purchaseDates purchaseCompleteDates TotalBoostsBought TotalBoostsCanceled admin', function (err, userInfo) {
              if(err){
              console.log("get sessionInfo error 32555");
              console.error(err);
              }else{
                  console.log("succsesfully got info");
                  res.json(userInfo);	
              }
         });
	}
	else {
		res.json(null);
	}
});

router.get("/orders",function(req,res){
     if (req.isAuthenticated()&&req.user.admin) {
         /* UserLocation//Site Name//date purchased//Status//Osu!//Refund//Complete//BoostedBMs*/
         //return all users could use GraphQL but realy might not be worth it untill users are to big that it takes a long time
         User.find({}, function (err, docs) { 
         if (err) {
                    console.log("get orders error");
                    console.error(err);
                } else {
                    console.log("get orders sucsess");
                    //console.log(docs);
                    res.json({orders: docs});
                }
         });
		
	}
	else {
		res.json(null);
	}
});

router.post("/complete",function(req,res){
     if (req.isAuthenticated()&&req.user.admin && req.body.BMs.length>15) {
         console.log("complete order route the bm to add is: " + req.body.BMs);
         let now = moment();
         //upload boostedBM and chnage status and other varibles to completed || req.body.order_id || req.body.BMs
		///////////////
        User.findByIdAndUpdate(req.body.order_id, {
                            $unset: { currentOrderID: "", saleID: "", DateOrdered: "", refundLink: ""},
                            HasOrderPending: false,
                            status: "completed",
                            dateLastBoosted: now,
                            $push: { boostedBMs: req.body.BMs, purchaseCompleteDates: now} },
                            function(err, user) {
                            //$push: { scores: { $each: [ 90, 92, 85 ] } }
                            //callback unmodified user is returned unless changed options
                            if(err){
                            console.log("update error 76324");
                            console.error(err);
                            res.json({error: "could not complete order: " + err});
                            }else{
                                console.log("succsesfully completed an order");	
	                            res.json({status: "completed"});
                            }
                            });
	}
	else {
		res.json(null);
	}
});

router.post("/pay", function (req, res) {
    if(req.isAuthenticated()&&(req.user.dateLastBoosted==="never"||moment(parseInt(req.user.dateLastBoosted)).add(2, 'days')<moment())&&req.user.HasOrderPending===false){
      console.log("\x1b[33m%s\x1b[0m","Warning swap date comaprion back");
    //can also load payment info from data base or form
    //it might be usefull for creating promocodes ex:(FFF10)free for first 10 can also use req.query to parse url for code
    let create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://" + process.env.HOST + "/paysuccess", //"http://localhost:3000/paysuccess"
        "cancel_url": "http://" + process.env.HOST + "/cancelPayment"//"http://localhost:3000/cancelPayment"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Top Play",
                "sku": "BSC-BST-1D",
                "price": "1.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "1.00"
        },
        "description": "This is a basic boost for " + req.user.username + ", I will play a song to get you a new score in your top 50."
    }]
};
paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      console.error(JSON.stringify(error));
      res.send(JSON.stringify(error));
    } else {
        console.log("Create Payment Response");
        //console.log(JSON.stringify(payment));
        for(let i=0; i<payment.links.length;i++){
            if(payment.links[i].rel ==='approval_url'){
                console.log(payment.links[i].href);
                //res.redirect(payment.links[i].href); CORS needs to be setup for this to work
                res.json({redirect:payment.links[i].href});
            }
        }
        console.log("not skipped");
       //res.send("an error occured try again"); does this get called or is it skipped
    }
    });
    }
    else {
        if(!req.isAuthenticated())
        res.json({error: "You need to be signed in before purchasing"});
        else if(req.user.HasOrderPending!==false)
            res.json({error: "You already have an order pending"});
        else if(req.user.dateLastBoosted!=="never")
            res.json({error: "You have already been boosted in the last 2 days next boost avalible " + moment(parseInt(req.user.dateLastBoosted)).add(2, 'days').calendar()});
        else
            res.json({error: "something unpredictable went wrong"});
	}
});




module.exports = router;
