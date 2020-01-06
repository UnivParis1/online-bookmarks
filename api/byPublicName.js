"use strict";
let express = require('express')
let db = require('./db')

let router = express.Router();

router.get("/:name", (req, res) => {
    let name = req.params.name;
    db.findOne({ publicName: name }).then(bookmark => {
        if (bookmark) {
            res.redirect(bookmark.link);
        } else {
            res.end("unknown link with public name " + name)
        }
    });
});

module.exports = router;
