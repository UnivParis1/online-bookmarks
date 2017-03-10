function simpleCopy(o) {
    return assign({}, o);
}

function assign(o, o2) {
    simpleEachObject(o2, function (k, v) {
        o[k] = v;
    });
    return o;
}

function simpleEach(a, fn) {
    var len = a.length;
    for(var i = 0; i < len; i++) {
        fn(a[i], i, a);
    }
}

function simpleEachObject(o, fn) {
    for(var k in o) {
        fn(k, o[k], o);
    }
}


function objectSlice(o, fields) {
    var r = {};
    fields.forEach(function (field) {
        r[field] = o[field];
    });
    return r;
}

function flatten(o) {
    var l = [];
    simpleEachObject(o, function (id, v) {
        v.id = id;
        l.push(v);
    });
    return l;
}

function toTitleCase(str) {
    return str.replace(/(?:^|\s)\w/g, function(match) {
        return match.toUpperCase();
    });
}

function parseNetscapeBookmarks(html) {
    var elt = document.createElement("div");
    elt.innerHTML = html; // wow, we have a nice HTML parser :)
    var r = [];
    var current;

    function extractRec(path, elt) {
        var tag = elt.tagName.toLowerCase();
        if (tag === "a") {
            if (elt.href.match(/^http/)) {
                current = { name: elt.innerText, link: elt.href };
		if (path.length) current.description = path.join(" ");
		r.push(current);
            }
	} else if (tag === "dd") {
	    if (current && elt.innerText.match(/\S/)) {
		current.description = elt.innerText.trim() + (current.description ? " " + current.description : '');
	    }
        } else if (tag === "dt") {
	    current = null;
            var first = elt.children[0];
            if (first.tagName.match(/h3/i)) {
                path = path.concat(["#" + toTitleCase(first.innerText).replace(/\s/g, '')]);
            }
        }
        simpleEach(elt.children, function (sub) {
            extractRec(path, sub);
        });
    }
    
    extractRec([], elt);
    return r;
} 

var netscapeBookmarks_header = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '',
].join('\n');

function exportNetscapeBookmarks(bookmarks) {
    var l = bookmarks.map(function (bookmark) {
        return '<DT><A HREF="' + window.encodeURI(bookmark.link) + '">' + bookmark.name + '</A>' +
	    '<DD>' + (bookmark.description || '');
    });
    
    return [ netscapeBookmarks_header, '<DL><p>' ].concat(l).concat('</DL><p>').join("\n");
}

function parseDescription(description) {
    if (!description) return [ { name : "" } ];
    return description.split(/(#[\w\x80-\xff-]+)/).filter(function (s) { return !s.match(/^\s*$/) }).map(function (s) {
	return { name: s, tag: s.match(/^#/) };
    })
}

function parseBookmark(bookmark) {
    bookmark.desc = parseDescription(bookmark.description);
    bookmark.addtext = [];
    bookmark.isPublic = bookmark.showPublicOption = !!bookmark.publicName;
    bookmark.edit = false;
    return bookmark;
}

function computeTags(bookmarks) {
    var l = {};
    bookmarks.forEach(function (bookmark) {
        bookmark.desc.forEach(function (e) {
            if (e.tag) l[e.name] = true;
        });
    });
    return Object.keys(l);
}

function computeHash(bookmark) {
    return [ bookmark.link, bookmark.name, bookmark.description ].join('|');
}
function computeHashes(bookmarks) {
    var h = {};
    bookmarks.forEach(function (bookmark) {
        h[computeHash(bookmark)] = bookmark;
    });
    return h;
}

function normalizeLink(link) {
        return link.match(/^https?:/) ? link : "http://" + link;
}
function toWS(bookmark) {
        var o = objectSlice(bookmark, [ 'link', 'name', 'description' ]);
        if (bookmark.isPublic) o.publicName = bookmark.name;
        return o;
}

function handleErr(f) {
    return function (err, v) {
        if (err) {
            alert(JSON.stringify(err));
        } else {
            f(v);
        }
    };
}

var restdb = restdb_init(restdbConf);

function emptyBookmark() {
    return { link: "", description: "", isPublic: false, addtext: [], edit: false };
}

var methods = {
    addBookmark: function(link) {
        var app = this;
        var bookmark = emptyBookmark();
        bookmark.link = normalizeLink(link);
        restdb.add(restdbPath, toWS(bookmark), {}, handleErr(function(resp) {
            bookmark.id = resp.id;
	    app.bookmarks.unshift(parseBookmark(bookmark));
            // empty the form:
	    app.link_to_add = "";
        }));
    },
    editBookmark: function (bookmark) {
	delete bookmark.backup;
	bookmark.backup = simpleCopy(bookmark);
	bookmark.edit = true;
    },
    cancelBookmark: function (bookmark) {
	assign(bookmark, bookmark.backup);
        delete bookmark.backup;
    },
    saveBookmark: function (bookmark) {
        bookmark.link = normalizeLink(bookmark.link);
	bookmark.desc = parseDescription(bookmark.description);

        restdb.set(restdbPath + "/" + bookmark.id, toWS(bookmark), {}, handleErr(function() {
	    bookmark.edit = false;
        }));
    },
    deleteBookmark: function(bookmark) {
        restdb.set(restdbPath + '/' + bookmark.id, null, {}, handleErr(function() {
	    app.bookmarks = app.bookmarks.filter(function (b) { return b !== bookmark; });
        }));
    },

    exportBookmarks: function (event) {
        event.target.href = "data:text/html;charset=utf-8," + encodeURIComponent(exportNetscapeBookmarks(this.bookmarks));
    },
    
    toImport: function (html) {
       //console.log("importing", html);
        var exists = computeHashes(this.bookmarks);
        parseNetscapeBookmarks(html).filter(function (b) {
            return !exists[computeHash(b)];
        }).forEach(this.addBookmark);
    },

};

app = new Vue({
    name: "Main",
    data: {
        bookmarks: [],
        search: "",
        link_to_add: "",
        
        exported: "",
        loaded: false,
        
        maxBookmarks: 40,
        publicUrlPrefix: publicUrlPrefix,
    },

    mounted: function() {
        var app = this;
        restdb.get(restdbPath, { allowRedirect: true }, handleErr(function(data) {
	        app.bookmarks = flatten(data).map(parseBookmark);
            app.loaded = true;
        }));
    },

    methods: methods,

    computed: {
        filteredBookmarks: function() {
            var l = this.bookmarks;
 	    if (this.search) {
 	        var regex = new RegExp(this.search, "i");
                return l.filter(function (bm) {
	            return regex.test(bm.name) || regex.test(bm.link) || regex.test(bm.description);
	        });
            } else {
                return l;
            }
        },
        bookmarksToDisplay: function() {
            return this.filteredBookmarks.slice(0, this.maxBookmarks);
        },
        allBookmarksDisplayed: function() {
            return this.filteredBookmarks.length <= this.maxBookmarks;
        },
        tags: function() {
            return computeTags(this.bookmarks);
        },
        haveDescriptions: function () {
            return this.bookmarks.filter(function (b) { return b.name || b.description; }).length > 0;
        },
    },

});
