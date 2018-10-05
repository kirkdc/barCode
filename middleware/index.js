var Campground = require("../models/campground");
var Comment = require("../models/comment");


// All the  middleware goes here

var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next){
      if(req.isAuthenticated()) {
        Campground.findById(req.params.id, function (err, foundCampground) { 
            if(err || !foundCampground) {
                req.flash("error" , "Campground not found");
                res.redirect("back");
            } else {
                // has the user created a campground?
                if(foundCampground.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error" , "You don't have permission to do that!");
                    res.redirect("back");
                } 
            }
        });
    } else {
        req.flash("error" , "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkCommentOwnership = function(req, res, next){
      if(req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function (err, foundComment) { 
            if(err || !foundComment) {
                req.flash("error", "Comment not found");
                res.redirect("back");
            } else {
                // has the user created their own comment?
                if(foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error" , "You don't have permission to do that");
                    res.redirect("back");
                } 
            }
        });
    } else {
        req.flash("error" , "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error" , "You need to be logged in to do that"); // this line is for the flash message. "error" - is the KEY for the color of the message RED or GREEN and to connect it to the route file(routes/index.js)=> to test it. 
    
    //OR (Where it is now) app.js...res.locals.message = req.flash("error"); You can assign the color by creating different variables in app.js 1)res.locals.error = req.flash("error"); 2)res.locals.success = req.flash("success");
    //Now these can be accessed through the error and success variables. BUT you still have to assign the color using bootstrap (or manually) in the .ejs file
    
    //We are putting it here because we're redirecting it to the login form below. "Please Login First!" - is the message that is displayed. NOTE: adding this whole line won't display a anything. We have to connect it to the /login(show login form) route OR in app.js app.use and then add it to the show.ejs to display. Keep in mind the flash has to be inserted **BEFORE** we redirect and it will display on the place it's redirected to. 
    
    //Now all you have to do is add req.flash("KEY", "MESSAGE"); wherever you want it to display
    res.redirect("/login");
}



module.exports = middlewareObj;