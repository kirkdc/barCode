var express = require("express");
var router = express.Router(); // you include this line then replace app.get, app.post etc with router.get router.post...
var bar = require("../models/bar");
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


//INDEX - show all bars
router.get("/", function (req, res) {
    //console.log(req.user); THIS WILL TELL ME THE NAME OF THE USER THAT'S LOGGED IN. you can connect it to your template using currentUser: req.user

    //GET ALL BARS FROM THE DB AND THEN RENDER THE FILE
    bar.find({}, function (err, allBars) {
        if (err) {
            console.log(err);
        } else {
            res.render("bars/index", {
                bar: allBars,
                currentUser: req.user,
                page: 'bars'
            }); //one instance where i put the currentUser: req.user in manually(this is so that LOGOUT on the nav only appears if a user is logged and same with login)
        }
    });
});



//CREATE - add new bar to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the bar object under image property
      req.body.bar.image = result.secure_url;
      // add image's public_id to bar object
      req.body.bar.imageId = result.public_id;
     
      // add author to bar
      req.body.bar.author = {
        id: req.user._id,
        username: req.user.username
      }
      bar.create(req.body.bar, function(err, bar) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/bars/' + bar.id);
      });
    });
});
    
    //=========================================
    // WHEN YOU INCLUDE THE MAPS ALL THE ABOVE CODE SHOULD BE PUT INSIDE geocoder.geocode() callback.
    // SEE STEP 10 https://github.com/nax3t/image_upload_example
    //=========================================




// NEW - show form to create new bar (because we need 2 routes to send a POST REQUEST. We need one to show the form and we need that form to sumbit somewhere...which is the CREATE route )
router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("bars/new");
});



//SHOW - shows more info about one bar
router.get("/:id", function (req, res) {
    //find the bar with a provided ID
    bar.findById(req.params.id).populate("comments").exec(function (err, foundBar) {
        if(err || !foundBar) {
            req.flash("error", "Bar not found");
            res.redirect("back");
        } else {
//            console.log(foundBar)
            //render the show template with that bar
            res.render("bars/show", {
                bar: foundBar
            });
        }
    });
});


// EDIT BAR ROUTE(where the form is)
router.get("/:id/edit", middleware.checkBarOwnership, function(req, res) {
    bar.findById(req.params.id, function (err, foundBar){
        res.render("bars/edit", {bar: foundBar});
    });
});


//
// UPDATE BAR ROUTE(where the form submits to)
router.put("/:id", middleware.checkBarOwnership, upload.single('image'), function (req, res) {

    //find and update the correct bar
    bar.findById(req.params.id, async function (err, bar) { 
        //3 arguments here bar.findByIdAndUpdate(ID TO FIND BY, DATA TO UPDATE WITH(existing data from views/bar/edit.ejs, CALLBACK TO RUN AFTERWARDS)
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        } else { //redirect to the show page
            if(req.file) {
                try {
                    await cloudinary.v2.uploader.destroy(bar.imageId);
                    let result = await cloudinary.v2.uploader.upload(req.file.path); 
                    
                      bar.imageId = result.public_id;
                      bar.image = result.secure_url; 
                } catch(err) {
                    req.flash("error", err.message);
                     return res.redirect("back");
                }
            }
            bar.name = req.body.bar.name;
            bar.description = req.body.bar.description;
            bar.price = req.body.bar.price;
            bar.save();
            req.flash("success", "Successfully Updated!");
            res.redirect("/bars/" + req.params.id)
        }
    });

});


// DESTROY BAR ROUTE
router.delete('/:id', middleware.checkBarOwnership, function(req, res){
    bar.findById(req.params.id, async function(err, bar) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");  
        }
        try{
            await cloudinary.v2.uploader.destroy(bar.imageId);
            bar.remove();
            req.flash('success', 'Bar Deleted Successfully')
            res.redirect('/bars');
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
// checkbarOwnership

module.exports = router;