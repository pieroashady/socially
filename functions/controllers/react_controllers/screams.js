const { db, _ } = require('../../util/admin');

class ScreamControllers {
  static getAllScream(req, res) {
    db
      .collection('screams')
      .orderBy('createdAt', 'desc')
      .get()
      .then((data) => {
        let screams = [];
        data.forEach((doc) => {
          screams.push({
            screamId: doc.id,
            body: doc.data().body,
            userHandle: doc.data().userHandle,
            createdAt: doc.data().createdAt,
            commentCount: doc.data().commentCount,
            likeCount: doc.data().likeCount
          });
        });
        return res.json(screams);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: err.code });
      });
  }

  static postOneScream(req, res) {
    if (_.isEmpty(req.body.body)) {
      return res.status(400).json({ body: 'Body cannot be empty' });
    }

    const newScream = {
      body: req.body.body,
      userHandle: req.user.handle,
      createdAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })
    };

    db
      .collection('screams')
      .add(newScream)
      .then((doc) => {
        res.json({ message: `document ${doc.id} created successfully` });
      })
      .catch((error) => {
        res.status(500).json({ error });
      });
  }

  static uploadFile(req, res) {
    if (!req.file) {
      return res.status(401).send('no image provided');
    } else {
      return res.send(req.file);
    }
  }
}

module.exports = ScreamControllers;
