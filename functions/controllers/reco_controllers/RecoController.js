class RecoController {
  static recognition(req, res) {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    require('@tensorflow/tfjs-node');
    require('@tensorflow/tfjs-core');
    const faceapi = require('face-api.js');
    const canvas = require('canvas');
    const { Canvas, Image, ImageData } = canvas;

    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      console.log(
        'File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype
      );

      const imageExtension = filename.split('.')[filename.split('.').length - 1];
      imageFileName = `${new Date().getTime()}.${imageExtension}`;
      const filePath = path.join(os.tmpdir(), imageFileName);
      const newPath = path.join(__dirname, './out');
      console.log(newPath);
      imageToBeUploaded = { filePath, mimetype };
      file.pipe(fs.createWriteStream(filePath));
      console.log(imageToBeUploaded.filePath);
      runRecognition(imageToBeUploaded.filePath);

      file.on('data', function(data) {
        console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
      });
      file.on('end', function() {
        console.log('File [' + fieldname + '] Finished');
      });
    });

    busboy.on('finish', function() {
      console.log('Done parsing form!');
    });
    busboy.end(req.rawBody);

    function directoryNames() {
      const { lstatSync, readdirSync } = require('fs');
      const { join } = require('path');

      const isDirectory = lstatSync('./dataset/Aldi').isDirectory();
      const getDirectories = readdirSync('./dataset').map((name) => join(name));

      return getDirectories;
    }

    function countTotalFiles(subFile) {
      const { lstatSync, readdirSync } = require('fs');
      const { join } = require('path');

      const isDirectory = lstatSync('./dataset/Aldi').isDirectory();
      const getDirectories = readdirSync(`./dataset/${subFile}`).map((name) => join(name));

      return getDirectories;
    }

    function runRecognition(file) {
      faceapi.env.monkeyPatch({
        Canvas,
        Image,
        ImageData
      });

      const REFERENCE_IMAGE = './dataset/Aldi/1.jpg';
      const QUERY_IMAGE = './dataset/Aldi/jon.jpg';

      const baseDir = path.resolve(__dirname, './out');
      function saveFile(fileName, buf) {
        if (!fs.existsSync(baseDir)) {
          fs.mkdirSync(baseDir);
        }
        fs.writeFileSync(path.resolve(baseDir, fileName), buf);
      }

      async function run() {
        await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
        await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
        await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');

        const labeledFaceDescriptors = await loadLabeledImages();
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
        const queryImage = await canvas.loadImage(file);

        faceapi.SsdMobilenetv1();

        const resultsQuery = await faceapi
          .detectAllFaces(queryImage, faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (!resultsQuery) {
          return res.json({ error: 'No face detected' });
        }

        let bestMatch = {};

        const queryDrawBoxes = resultsQuery.map((res) => {
          bestMatch = faceMatcher.findBestMatch(res.descriptor);
          console.log(bestMatch);
          return new faceapi.draw.DrawBox(res.detection.box, { label: bestMatch.toString() });
        });

        const outQuery = faceapi.createCanvasFromMedia(queryImage);
        queryDrawBoxes.forEach((drawBox) => drawBox.draw(outQuery));
        const filename = `recognition-${new Date().getTime()}.jpg`;
        saveFile(filename, outQuery.toBuffer('image/jpeg'));
        console.log('sukses');
        console.log('done, saved results to out/queryImage.jpg');
        let distance = bestMatch._distance;
        let distancePercentage = (100 - Number(distance) * 33).toFixed(2);
        let x;
        let resultName = bestMatch._label;
        if (distancePercentage < 80) {
          x = 'Unrecognized';
          return res.json({ result: x, descriptor: 'Muka ga dikenal.' });
        } else {
          x = 'Recognized';
          return res.json({
            name: resultName,
            distance: `${distancePercentage}%`,
            result: x,
            descriptor: `Muka kamu ${distancePercentage}% mirip ${resultName}`
          });
        }
      }

      run();

      async function loadLabeledImages() {
        const labelAldi = directoryNames();

        // try {
        return Promise.all(
          labelAldi.map(async (label) => {
            let totalFile = countTotalFiles(label);
            console.log(totalFile.length);
            let faceDescriptors = [];

            for (let i = 1; i <= totalFile.length; i++) {
              const refImages = await canvas.loadImage(`./dataset/${label}/${i}.jpg`);
              const fullFaceDescription = await faceapi
                .detectSingleFace(refImages)
                .withFaceLandmarks()
                .withFaceDescriptor();

              if (!fullFaceDescription) {
                console.log(`no face for ${label}`);
                return res.json({ error: 'No face detected' });
              }
              faceDescriptors.push(fullFaceDescription.descriptor);
            }

            return new faceapi.LabeledFaceDescriptors(label, faceDescriptors);
          })
        );
      }
    }
  }

  static detectFace(req, res) {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    require('@tensorflow/tfjs-node');
    require('@tensorflow/tfjs-core');
    const fetch = require('node-fetch');
    const faceapi = require('face-api.js');
    const canvas = require('canvas');
    const { Canvas, Image, ImageData } = canvas;

    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      console.log(
        'File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype
      );

      const imageExtension = filename.split('.')[filename.split('.').length - 1];
      imageFileName = `${new Date().getTime()}.${imageExtension}`;
      const filePath = path.join(os.tmpdir(), imageFileName);
      imageToBeUploaded = { filePath, mimetype };
      file.pipe(fs.createWriteStream(filePath));
      console.log(imageToBeUploaded.filePath);
      detect(imageToBeUploaded.filePath);

      file.on('data', function(data) {
        console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
      });
      file.on('end', function() {
        console.log('File [' + fieldname + '] Finished');
      });
    });
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      console.log('Field [' + fieldname + ']: value: ' + inspect(val));
    });
    busboy.on('finish', function() {
      console.log('finish ' + imageToBeUploaded.filePath);
      console.log('Done parsing form!');
    });
    req.pipe(busboy);

    async function detect(file) {
      faceapi.env.monkeyPatch({
        Canvas,
        Image,
        ImageData
      });

      await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
      await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
      await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');

      faceapi.SsdMobilenetv1();

      const queryImage = await canvas.loadImage(file);
      const resultsQuery = await faceapi.detectSingleFace(queryImage).withFaceLandmarks().withFaceDescriptor();

      if (!resultsQuery) {
        return res.json({ error: 'No face detected' });
      }
      return res.json({ message: 'Sukses' });
    }
  }
}

module.exports = RecoController;
