var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");


// Root Route
router.get("/", function(req, res){
   res.render("landing");
});




//=================
// AUTH ROUTES
//=================

//show register form
router.get("/register", function(req, res){
    res.render("register"); 
});

// handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req,res, function(){
           req.flash("success" , "Welcom to YelpCamp " + user.username);
           res.redirect("/campgrounds") 
        });
    })
});

// show login form
router.get("/login", function(req, res){
    res.render("login"); //res.render("login", {message: req.flash("error")});
});

//handle login logic
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
    }), function(req, res){
});

// Logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged You Out!")
    res.redirect("/campgrounds");
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