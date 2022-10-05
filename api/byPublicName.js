"use strict";
let express = require('express')
let db = require('./db')

let router = express.Router();

router.get("/:name", (req, res) => {
    let name = req.params.name;

    let $inc = { count: 1 }
    db.findOneAndUpdate({ publicName: name }, { $inc }).then(r => {
        const bookmark = r.value
        if (bookmark) {
            res.redirect(bookmark.link);
        } else {
            res.end("unknown link with public name " + name)
        }
    });
});

module.exports = router;
