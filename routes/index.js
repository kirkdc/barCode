require('dotenv').config()

var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var bar = require("../models/bar");
var methodOverride = require("method-override");



var adminPass = process.env.ADMIN_CODE;

// Root Route
router.get("/", function(req, res){
   res.render("landing");
});

//added this because i added method override for the edit/update user data
router.use(methodOverride("_method"));


//=================
// AUTH ROUTES
//=================

//show register form
router.get("/register", function(req, res){
    res.render("register", {page: 'register'}); 
});

// handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User(
        {
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            avatar: req.body.avatar,
            about: req.body.about,
            
        });
    if(req.body.adminCode === adminPass) { //you can change this code to something relevant
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req,res, function(){
           req.flash("success" , "Welcome to barCode " + user.username);
           res.redirect("/bars") 
        });
    })
});



// show login form
router.get("/login", function(req, res){
    res.render("login", {page: 'login'}); //res.render("login", {message: req.flash("error")});
});


//handle login form ORIGINAL
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/bars",
        failureRedirect: "/login",
    }), function(req, res){
});


// Logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "You have succesfully logged out!")
    res.redirect("/bars");
});

// USER PROFILE
router.get("/users/:id", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if(err) {
      req.flash("error", "Something went wrong.");
      return res.redirect("/");
    }
    bar.find().where('author.id').equals(foundUser._id).exec(function(err, bar) {
      if(err) {
        req.flash("error", "Something went wrong.");
        return res.redirect("/");
      }
      res.render("users/show", {user: foundUser, bar: bar, page: 'user'});
    })
  });
});



                //ENABLING EDITING USER INFO

router.get("/users/:id/edit", function(req, res) {
    
    User.findById(req.user._id, function(err, foundUser) {
        if(err){
            req.flash("error", "Something went wrong.");
            return res.redirect("/");
        }
         res.render("users/edit", {user: foundUser});
    });
   
});




// ^UNCOMMENT AND^ CONTINUE FROM HERE* for middleware prevent editing by anyone + error handling for the user edit feature* UDEMY  Authorization Part 1 9:19
//router.get("/users/:id/edit", function(req, res) {
//    if(req.isAuthenticated()){
//        User.findById(req.params.id, function(err, foundUser){
//            if(err){
//                res.redirect("/bars")
//            } else {
//            //does the user own this id?
////                console.log(foundUser._id);
////                console.log(req.user._id);
//            if(req.params.id.equals(req.user_.id)) {
//                  res.render("users/edit", {user: foundUser})
//            } else {
//               res.send("YOU DO NOT HAVE PERMISSION TO DO THAT") 
//            } 
//            }
//        });
//    } else {
//        console.log("YOU NEED TO BE LOGGED IN TO DO THAT!!!")
//        res.send("YOU NEED TO BE LOGGED IN TO DO THAT!!!");
//    }
//    
////    User.findById(req.user._id, function(err, foundUser) {
////        if(err){
////            req.flash("error", "Something went wrong.");
////            return res.redirect("/");
////        }
////         res.render("users/edit", {user: foundUser});
////    });
//   
//});


// UPDATE USER INFO
router.put("/users/:id", function (req, res) {
    //find and update the correct bar
    User.findByIdAndUpdate(req.user._id, req.body.user, function(err, updatedUser) { //3 arguments here bar.findByIdAndUpdate(ID TO FIND BY, DATA TO UPDATE WITH(existing data from views/bar/edit.ejs, CALLBACK TO RUN AFTERWARDS)
        if (err) {
            res.redirect("/bars");
        } else { 
            res.redirect("/users/" + req.user._id)
        }
    })

});



// this is our custom MIDDLEWARE 'isLoggedIn' to prevent the user getting to the post comments route if they are not logged in. It can then be plugged into the MIDDLE of any of the routes

// Middleware added here again
//function isLoggedIn(req, res, next){
//    if(req.isAuthenticated()){
//        return next();
//    }
//    res.redirect("/login");
//}

module.exports = router;