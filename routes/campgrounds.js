var express = require("express");
var router = express.Router(); // you include this line then replace app.get, app.post etc with router.get router.post...
var Campground = require("../models/campground");
var middleware = require("../middleware"); //we don't have to type in "../middleware/index.js" because any file labeled index.js in a dir. will automatically be required. ITS A "SPECIAL" NAME



//INDEX - show all campgrounds
router.get("/", function (req, res) {
    //console.log(req.user); THIS WILL TELL ME THE NAME OF THE USER THAT'S LOGGED IN. you can connect it to your template using currentUser: req.user

    //GET ALL CAMPGROUNDS FROM THE DB AND THEN RENDER THE FILE
    Campground.find({}, function (err, allCampgrounds) {
        if (err) {
            console.log(err);
        } else {
            res.render("campgrounds/index", {
                campgrounds: allCampgrounds,
                currentUser: req.user
            }); //one instance where i put the currentUser: req.user in manually(this is so that LOGOUT on the nav only appears if a user is logged and same with login)
        }
    });
});


// CREATE - add a new campground to the database
router.post("/", middleware.isLoggedIn, function (req, res) {
    //get the data from the form and add to the campgrounds array
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id, // was req.user_id,
        username: req.user.username
    }

    var newCampground = {
        name: name,
        price: price,
        image: image,
        description: desc,
        author: author
    }
    //Create a new campground and save to the DB
    Campground.create(newCampground, function (err, newlyCreated) {
        if (err) {
            console.log(err);
        } else {
            //redirect back to the campgrounds  page
            console.log(newlyCreated);
            res.redirect("/campgrounds")
        }
    });
});


// NEW - show form to create new campground (because we need 2 routes to send a POST REQUEST. We need one to show the form and we need that form to sumbit somewhere...which is the CREATE route )
router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new");
});



//SHOW - shows more info about one campground
router.get("/:id", function (req, res) {
    //find the campground with a provided ID
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if(err || !foundCampground) {
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else {
            console.log(foundCampground)
            //render the show template with that campground
            res.render("campgrounds/show", {
                campgrounds: foundCampground
            });
        }
    });
});


// EDIT CAMPGROUND ROUTE(where the form is)
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function (err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});



// UPDATE CAMPGROUND ROUTE(where the form submits to)
router.put("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    //find and update the correct campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function (err, updatedCampground) { //3 arguments here Campground.findByIdAndUpdate(ID TO FIND BY, DATA TO UPDATE WITH(existing data from views/campgrounds/edit.ejs, CALLBACK TO RUN AFTERWARDS)
        if (err) {
            res.redirect("/campgrounds");
        } else { //redirect to the show page
            res.redirect("/campgrounds/" + req.params.id)
        }
    })

});


// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        }
    });
});


//MIDDLEWARE (was here but moved to index.js as part of refactor)
// isLoggedIn
// checkCampgroundOwnership

module.exports = router;