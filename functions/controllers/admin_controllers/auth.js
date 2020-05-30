const firebase = require('firebase');
const { db, _, admin } = require('../../util/admin');
const validator = require('../../util/validator');

const auth = firebase.auth();

class AdminAuthController {
  static signUp(req, res) {
    const newAdmin = {
      fullname: req.body.fullname,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      role: req.body.role,
      createdAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })
    };

    const { isValid, errors } = validator.validateSignup(newAdmin);

    if (!isValid) return res.status(400).json(errors);

    let token, adminId;
    db
      .doc(`/admin/${newAdmin.username}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return res.status(400).json({ username: 'username sudah terpakai' });
        }
        return auth.createUserWithEmailAndPassword(newAdmin.email, newAdmin.password);
      })
      .then((data) => {
        adminId = data.user.uid;
        return data.user.getIdToken();
      })
      .then((idToken) => {
        token = idToken;
        const adminCredentials = {
          fullname: newAdmin.fullname,
          username: newAdmin.username,
          email: newAdmin.email,
          role: newAdmin.role,
          createdAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }),
          adminId
        };
        return db.doc(`/admin/${newUser.username}`).set(adminCredentials);
      })
      .then(() => {
        return res.status(201).json({ token });
      })
      .catch((error) => {
        console.error(error);
        return res.status(500).json({ error });
      });
  }

  static login(req, res) {
    const adminCredentials = {
      email: req.body.email,
      password: req.body.password
    };

    const { errors, isValid } = validator.validateLogin(adminCredentials);

    if (!isValid) return res.status(400).json(errors);

    auth
      .signInWithEmailAndPassword(adminCredentials.email, adminCredentials.password)
      .then((data) => {
        return data.user.getIdToken();
      })
      .then((token) => {
        return res.json({ token });
      })
      .catch((err) => {
        console.log(err);
        return res.json({ error: err.code });
      });
  }
}

module.exports = AdminAuthController;
