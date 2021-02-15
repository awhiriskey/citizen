const Datastore = require('nedb');
const { v4: uuid } = require('uuid');
const { join } = require('path');
const debug = require('debug')('citizen:server:store:nedb');

const dbDir = process.env.CITIZEN_DB_DIR || 'data';
const moduleDbPath = join(dbDir, 'citizen.db');
const moduleDb = new Datastore({ filename: moduleDbPath, autoload: true });

const type = 'nedb';

const saveModule = (data) => new Promise((resolve, reject) => {
  const m = Object.assign(data, { _id: `${uuid()}`, downloads: 0, published_at: new Date() });

  moduleDb.insert(m, (err, newDoc) => {
    if (err) { return reject(err); }
    debug('saved the module into store: %o', module);
    return resolve(newDoc);
  });
});

const findModules = (options) => new Promise((resolve, reject) => {
  moduleDb.find(options, (err, allDocs) => {
    if (err) {
      return reject(err);
    }

    return resolve(allDocs);
  });
});

const findAllModules = (options, meta, offset, limit) => new Promise((resolve, reject) => {
  debug('search store with %o', options);

  moduleDb.find(options).sort({ published_at: 1, version: 1 }).skip(offset).limit(limit)
    .exec((error, docs) => {
      if (error) { return reject(error); }

      debug('search result from store: %o', docs);
      return resolve({
        meta,
        modules: docs,
      });
    });
});

const getModuleVersions = (options) => new Promise((resolve, reject) => {
  debug('search versions in store with %o', options);
  moduleDb.find(options).sort({ _id: 1 }).exec((err, docs) => {
    if (err) { return reject(err); }

    return resolve(docs);
  });
});

const getModuleLatestVersion = (options) => new Promise((resolve, reject) => {
  moduleDb.find(options).sort({ version: -1 }).limit(1).exec((err, docs) => {
    if (err) { return reject(err); }

    debug('search latest version result from store: %o', docs);
    return resolve(docs.length > 0 ? docs[0] : null);
  });
});

const findOneModule = (options) => new Promise((resolve, reject) => {
  debug('search a module in store with %o', options);
  moduleDb.find(options, (err, docs) => {
    if (err) { return reject(err); }

    debug('search a module result from store: %o', docs);
    return resolve(docs.length > 0 ? docs[0] : null);
  });
});

module.exports = {
  type,
  moduleDb,
  saveModule,
  findModules,
  findAllModules,
  getModuleVersions,
  getModuleLatestVersion,
  findOneModule,
};