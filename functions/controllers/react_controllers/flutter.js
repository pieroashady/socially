const firebaseConfig = require('../../util/config');
const firebase = require('firebase');
const { db, _, admin } = require('../../util/admin');

class FlutterController {
  static postData(req, res) {
    let errors = {};

    const registrationData = {
      selfie: req.body.selfie,
      location: req.body.location,
      nip: req.body.nip,
      registerAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })
    };

    if (_.isEmpty(registrationData.selfie)) errors.selfie = 'Selfie tidak boleh kosong';
    if (_.isEmpty(registrationData.location)) errors.location = 'Lokasi anda tidak terdeteksi. Mohon nyalakan GPS anda';
    if (_.isEmpty(registrationData.nip)) errors.nip = 'NIP kosong. Mohon masukkan NIP anda';

    if (!_.isEmpty(errors)) {
      return res.status(400).json({ errors });
    }

    db
      .collection('dikaRegistration')
      .add(registrationData)
      .then((doc) => {
        res.json({ message: 'Registration success' });
      })
      .catch((error) => {
        res.status(500).json({ error: 'Maaf terjadi kesalahan. Silahkan ulangi kembali 😂' });
      });
  }

  static testUpload(req, res) {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let fileData = {};
    let fileMime = {};
    let files = {};
    let imageToBeUploaded = {};
    let videoToBeUploaded = {};
    let imageFileName;
    let videoFileName;
    let userData = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log('Filename', filename);

      fileData[fieldname] = filename;
      fileMime[fieldname] = mimetype;
      files[fieldname] = file;

      const ktpFile = fileData['ktp_image'];
      const ktpMime = fileMime['ktp_image'];
      const videoFile = fileData['video_file'];
      const videoMime = fileMime['video_file'];

      if (mimetype === ktpMime) {
        let imageExtension = ktpFile.split('.')[ktpFile.split('.').length - 1];
        imageFileName = `dika-ktp${new Date().getTime()}.${imageExtension}`;
        let imagePath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { imagePath, ktpMime };
        file.pipe(fs.createWriteStream(imagePath, { autoClose: true }));
        console.log('KTP Finished....');
      } else if (mimetype === videoMime) {
        let videoExtension = videoFile.split('.')[videoFile.split('.').length - 1];
        videoFileName = `dika-video${new Date().getTime()}.${videoExtension}`;
        let videoPath = path.join(os.tmpdir(), videoFileName);
        videoToBeUploaded = { videoPath, videoMime };
        file.pipe(fs.createWriteStream(videoPath, { autoClose: true }));
        console.log('Video Finished....');
      }

      file.on('data', function(data) {
        console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
      });
      file.on('end', function() {
        console.log('File [' + fieldname + '] Finished');
      });
    });

    busboy.on('field', (fieldname, val) => {
      userData[fieldname] = val;
      console.log('fieldName', userData);
    });

    // let errors = {};

    // if (_.isEmpty(userData.name)) errors.name = 'Nama tidak boleh kosong';
    // if (_.isEmpty(userData.nip)) errors.nip = 'NIP tidak boleh kosong';

    // if (!_.isEmpty(errors)) {
    //   return res.status(400).json({ errors });
    // }

    busboy.on('finish', () => {
      console.log('uploading...');
      admin
        .storage()
        .bucket()
        .upload(imageToBeUploaded.imagePath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageToBeUploaded.ktpMime
            }
          }
        })
        .then(() => {
          admin.storage().bucket().upload(videoToBeUploaded.videoPath, {
            resumable: false,
            metadata: {
              metadata: {
                contentType: videoToBeUploaded.videoMime
              }
            }
          });
        })
        .then(() => {
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
          const videoUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${videoFileName}?alt=media`;
          return db.collection('dikaRegist').add({
            imageUrl,
            videoUrl,
            name: userData.name,
            nip: userData.nip
          });
        })
        .then((doc) => {
          console.log('done!');
          return res.json({ id: `${doc.id}`, message: 'Image upload success' });
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({ error: err.message });
        });
    });
    busboy.end(req.rawBody);
  }
}

module.exports = FlutterController;
