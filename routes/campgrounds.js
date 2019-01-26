var express = require("express");
var router = express.Router(); // you include this line then replace app.get, app.post etc with router.get router.post...
var Campground = require("../models/campground");
var middleware = require("../middleware"); //we don't have to type in "../middleware/index.js" because any file labeled index.js in a dir. will automatically be required. ITS A "SPECIAL" NAME
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'crudecloud', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


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



//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add image's public_id to campground object
      req.body.campground.imageId = result.public_id;
     
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      }
      Campground.create(req.body.campground, function(err, campground) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/campgrounds/' + campground.id);
      });
    });
});
    
    //=========================================
    // WHEN YOU INCLUDE THE MAPS ALL THE ABOVE CODE SHOULD BE PUT INSIDE geocoder.geocode() callback.
    // SEE STEP 10 https://github.com/nax3t/image_upload_example
    //=========================================




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


//
// UPDATE CAMPGROUND ROUTE(where the form submits to)
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), function (req, res) {

    //find and update the correct campground
    Campground.findById(req.params.id, async function (err, Campground) { 
        //3 arguments here Campground.findByIdAndUpdate(ID TO FIND BY, DATA TO UPDATE WITH(existing data from views/campgrounds/edit.ejs, CALLBACK TO RUN AFTERWARDS)
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        } else { //redirect to the show page
            if(req.file) {
                try {
                    await cloudinary.v2.uploader.destroy(Campground.imageId);
                    let result = await cloudinary.v2.uploader.upload(req.file.path); 
                    
                      Campground.imageId = result.public_id;
                      Campground.image = result.secure_url;
                    
                } catch(err) {
                    req.flash("error", err.message);
                     return res.redirect("back");
                }
            }
            Campground.name = req.body.campground.name;
            Campground.description = req.body.campground.description;
            Campground.price = req.body.campground.price;
            Campground.save();
            req.flash("success", "Successfully Updated!");
            res.redirect("/campgrounds/" + req.params.id)
        }
    });

});


// DESTROY CAMPGROUND ROUTE
router.delete('/:id', middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, async function(err, Campground) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");  
        }
        try{
            await cloudinary.v2.uploader.destroy(Campground.imageId);
            Campground.remove();
            req.flash('success', 'Campground Deleted Successfully')
            res.redirect('/campgrounds');
        } catch(err){
            if(err) {
                req.flash("error", err.message);
                return res.redirect("back"); 
            }
        }
        
        
    });
});


//MIDDLEWARE (was here but moved to index.js as part of refactor)
// isLoggedIn
// checkCampgroundOwnership

module.exports = router;