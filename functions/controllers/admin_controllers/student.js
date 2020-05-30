const firebase = require('firebase');
const { db, _, admin } = require('../../util/admin');
const validator = require('../../util/validator');
const generator = require('generate-password');

const auth = firebase.auth();

class StudentController {
  static register(req, res) {
    const student = {
      fullname: req.body.fullname,
      gender: req.body.gender,
      batch: req.body.batch,
      email: req.body.email,
      password: generator.generate({ length: 8, numbers: true })
    };

    const { isValid, errors } = validator.validateStudentRegister(student);

    if (!isValid) return res.status(400).json(errors);

    let token, studentId, studentCredentials;
    auth
      .createUserWithEmailAndPassword(student.email, student.password)
      .then((data) => {
        studentId = data.user.uid;
        return data.user.getIdToken();
      })
      .then((idToken) => {
        token = idToken;
        studentCredentials = {
          studentName: student.fullname,
          gender: student.gender,
          email: student.email,
          batch: student.batch,
          password: student.password,
          createdAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }),
          studentId
        };
        return db.collection('student').add(studentCredentials);
      })
      .then(() => {
        return res.status(201).json({
          token,
          data: {
            email: student.email,
            password: student.password
          }
        });
      })
      .catch((error) => {
        console.error(error);
        return res.status(500).json({ error });
      });
  }

  static getStudents(req, res) {
    db
      .collection('students')
      .orderBy('studentName', 'asc')
      .get()
      .then((data) => {
        let students = [];
        data.forEach((doc) => {
          students.push({
            id: doc.id,
            studentName: doc.studentName,
            gender: doc.gender,
            batch: doc.batch,
            email: doc.email
          });
        });
        return res.json(students);
      })
      .catch((error) => {
        res.status(500).json({ error: error.code });
      });
  }

  static getStudentsDetail(req, res) {
    const studentId = req.params.id;
    db
      .collection('student')
      .doc(studentId)
      .get()
      .then((doc) => {
        return res.json({ data: doc.data() });
      })
      .catch((err) => {
        return console.log(err);
      });
  }
}

module.exports = StudentController;
