var express = require("express");
var router = express.Router({
    mergeParams: true
}); // you include this line then replace app.get, app.post etc with router.get router.post...
var bar = require("../models/bar");
var Comment = require("../models/comment");
var middleware = require("../middleware"); //we don't have to type in "../middleware/index.js" because any file labeled index.js in a dir. will automatically be required. ITS A "SPECIAL" NAME


// Comments New
router.get("/new", middleware.isLoggedIn, function (req, res) {
    //find bar by id
    bar.findById(req.params.id, function (err, bar) {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", {
                bar: bar
            });
        }
    })

});

// Comments Create
router.post("/", middleware.isLoggedIn, function (req, res) {
    //lookup bar using ID
    bar.findById(req.params.id, function (err, bar) {
        if (err) {
            console.log(err);
            res.redirect("/bars")
        } else {
            Comment.create(req.body.comment, function (err, comment) {
                if (err) {
                    req.flash("error", "Something went wrong!");
                    console.log(err);
                } else {
                    //ADDING USERNAME TO THE COMMENT
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //SAVE THE COMMENT
                    comment.save();
                    bar.comments.push(comment);
                    bar.save();
//                    console.log(comment);
                    req.flash("success", "Successfully created comment");
                    res.redirect("/bars/" + bar._id);

                }
            });
        }
    });
});

// COMMENTS EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function (req, res) {
    bar.findById(req.params.id, function (err, foundBar) {
        if (err || !foundBar) {
            req.flash("error", "No bar found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function (err, foundComment) {
            if (err) {
                res.redirect("back");
            } else {
                res.render("comments/edit", {bar_id: req.params.id, comment: foundComment});
            }
        });
    });

});

//COMMENTS UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function (req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (err, updatedComment) {
        if (err) {
            res.redirect("back");
        } else {
            res.redirect("/bars/" + req.params.id);
        }
    });

});

//COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function (req, res) {
    //findByIdAndRemove
    Comment.findByIdAndRemove(req.params.comment_id, function (err) {
        if (err) {
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted");
            res.redirect("/bars/" + req.params.id);
        }
    })
});

//MIDDLEWARE (was here but moved to index.js as part of refactor)
// isLoggedIn
// checkCommentOwnership



module.exports = router;