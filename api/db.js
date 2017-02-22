'use strict';

let mongodb = require('mongodb');
let conf = require('./conf');

let real_collection;

const collection = () => {
  if (!real_collection) throw "db.init not done";
  return real_collection;
};

exports.findOne = (criteria) => (
    collection().findOne(criteria)
);

exports.init = () => {
    return mongodb.MongoClient.connect(conf.mongodb.url).then(client => {
        real_collection = client.collection('bookmarks');
    }).then(() => {
        return collection().createIndex({ publicName: 1 }, { unique: true, sparse: true });
    }).catch((error) => {
        console.error(error);
        process.exit(1);
    });
};
