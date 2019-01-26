require('dotenv').config()

var express      = require("express"),

    app          = express(),

    bodyParser   = require("body-parser"),

    mongoose     = require("mongoose"),
    flash        = require("connect-flash"),
    
    passport     = require("passport"),
    LocalStrategy= require("passport-local"),
    methodOverride= require("method-override"),
    
    Campground   = require("./models/campground"),//keep the var here Campground because "Campground" is being used everywhere below
    Comment      = require("./models/comment"),
    User         = require("./models/user"),
    seedDB       = require("./seeds");


// ****REQUIRING ROUTES****
//  You first split up all your route files into  .js of their own. Add var express and var router. Do a module.exports and then require it below. Then add in an app.use() for each of the routes.
var commentRoutes       = require("./routes/comments"),
    campgroundRoutes    = require("./routes/campgrounds"),
    indexRoutes         = require("./routes/index");
    
/*
=============================
 New Code Seperating DBs
=============================
I've set different databases for the locally hosted app and the one on Heroku. This is how its done
for LOCAL(in terminal *** export DATABASEURL=mongodb://localhost:27017/yelp_camp
for mLab go to Heroku =>click on this app => settings =>config variables => KEY--DATABASEURL VALUE--mongodb://yelpcamp:Yelpcamp123@ds123783.mlab.com:23783/yelpcamp     
*/    
    
var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp";
var connectOptions = {useNewUrlParser: true};
mongoose.connect(url, connectOptions);    
// ^THIS^ is just setting up a backup("mongodb://localhost/yelp_camp") so the code doesnt completely break if you havent set up just "process.env.DATABASEURL"
   



/*
=====================================
 Old code seperate DBs Local & Cloud
=====================================
mongoose.connect("mongodb://localhost:27017/yelp_camp", { useNewUrlParser: true }); //***The old line used for LOCAL database connection***
mongoose.connect("mongodb://yelpcamp:Yelpcamp123@ds123783.mlab.com:23783/yelpcamp", { useNewUrlParser: true }); //***The new line. From mLab online database so we have a DB that works with a deployed app***

mongodb://yelpcamp:Yelpcamp123@ds123783.mlab.com:23783/yelpcamp
*/

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.use(express.static(__dirname +"/public")) //this is to connect the stylesheet in the public dir
app.use(methodOverride("_method"));
app.use(flash());

//seedDB(); //seed the database

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Blah Blah Blah",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;//we are doing this instead of adding the currentUser: req.user into all the routes manually
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");// message: req.flash("error") THIS CONNECTS IT TO THE FLASH IN middleware/index.js and now message can be passed into the header.ejs. We also put it here so it's available on every page.
    next();
}); 

app.use("/",indexRoutes);
app.use("/campgrounds", campgroundRoutes); //"/campgrounds" this makes sure that all routes in the campgrounds.js automatically start with /campgrounds so you dont have to repeat it for all routes in the campground file you can just "/"
app.use("/campgrounds/:id/comments", commentRoutes); //the problem with this is :id route parameter is not making it to the comment routes(it cant be found)...INSIDE "comments.js"  you have to pass in an option inside of an object in the var router = express.Router({mergeParams: true}); 


app.listen(process.env.PORT, process.env.IP, function(){
   console.log("SERVER IS ACTIVE!"); 
});