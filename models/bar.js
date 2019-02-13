var mongoose = require("mongoose");


//SCHEMA SETUP
var barSchema = new mongoose.Schema({
    name: String,
    price: String,
    image: String,
    imageId: String,
    description: String,
    createdAt: { type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

module.exports = mongoose.model("bar", barSchema); //Here we're exporting it so we can require it in the app.js file.