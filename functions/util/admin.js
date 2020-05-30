const admin = require('firebase-admin');
const _ = require('lodash/lang');

admin.initializeApp();

const db = admin.firestore();

module.exports = { admin, db, _ };
