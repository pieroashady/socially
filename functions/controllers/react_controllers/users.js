const firebaseConfig = require('../../util/config');
const firebase = require('firebase');
const { db, _, admin } = require('../../util/admin');
const validator = require('../../util/validator');

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

class UserControllers {
  static signUp(req, res) {
    const noImg = 'no-image.png';
    const newUser = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      handle: req.body.handle
    };

    const { isValid, errors } = validator.validateSignup(newUser);

    if (!isValid) return res.status(400).json(errors);

    let token, userId;
    db
      .doc(`/users/${newUser.handle}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return res.status(400).json({ handle: 'this handle already taken' });
        }
        return auth.createUserWithEmailAndPassword(newUser.email, newUser.password);
      })
      .then((data) => {
        userId = data.user.uid;
        return data.user.getIdToken();
      })
      .then((idToken) => {
        token = idToken;
        const userCredentials = {
          handle: newUser.handle,
          email: newUser.email,
          createdAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }),
          imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${noImg}?alt=media`,
          userId
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
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
    const user = {
      email: req.body.email,
      password: req.body.password
    };

    const { errors, isValid } = validator.validateLogin(user);

    if (!isValid) return res.status(400).json(errors);

    auth
      .signInWithEmailAndPassword(user.email, user.password)
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

  static createUser(req, res) {
    const user = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      createdAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })
    };

    let message = {};

    if (_.isEmpty(user.firstName)) message.firstName = 'first name cannot be empty';
    if (user.firstName.length < 2) message.firstName2 = 'karakter nama tidak boleh kurang dari 2 karakter';
    if (_.isEmpty(user.lastName)) message.lastName = 'last name cannot be empty';
    if (user.lastName.length < 2) message.lastName2 = 'tidak boleh kurang dari 2 karakter';

    if (!_.isEmpty(message)) {
      return res.status(400).json({ errors: message });
    } else {
      return db.collection('users').add(user).then((doc) => {
        res.json({
          status: 1,
          message: `User with id ${doc.id} was successfully created`
        });
      });
    }
  }

  static uploadImage(req, res) {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};
    let userData = {
      name: 'Aldi Piero',
      selfie: 'Selfie'
    };

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log(fieldname);
      console.log(filename);
      console.log(mimetype);

      const imageExtension = filename.split('.')[filename.split('.').length - 1];
      imageFileName = `${new Date().getTime()}.${imageExtension}`;
      const filePath = path.join(os.tmpdir(), imageFileName);
      imageToBeUploaded = { filePath, mimetype };
      file.pipe(fs.createWriteStream(filePath));
    });
    busboy.on('finish', () => {
      admin
        .storage()
        .bucket()
        .upload(imageToBeUploaded.filePath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageToBeUploaded.mimetype
            }
          }
        })
        .then(() => {
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
          return db.doc(`/users/${req.user.handle}`).update({ imageUrl, userData });
        })
        .then(() => {
          return res.json({ message: 'Image upload success' });
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({ error: err.message });
        });
    });
    busboy.end(req.rawBody);
  }

  static addUserDetails(req, res) {
    let userDetails = validator.reduceUserDetails(req.body);

    db
      .doc(`/users/${req.user.handle}`)
      .update(userDetails)
      .then(() => {
        return res.json({
          message: 'Details added'
        });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  }

  static getUserData(req, res) {
    let userData = {};

    db
      .doc(`/users/${req.user.handle}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          userData.credentials = doc.data();
          return db.collection('likes').where('userHandle', '==', req.user.handle).get();
        }
      })
      .then((data) => {
        userData.likes = [];
        data.forEach((doc) => {
          userData.likes.push(doc.data());
        });

        return res.json(userData);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: err.code });
      });
  }
}

module.exports = UserControllers;
