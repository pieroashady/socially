const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./util/fb-auth');
const UserController = require('./controllers/react_controllers/users');
const ScreamController = require('./controllers/react_controllers/screams');
const FlutterController = require('./controllers/react_controllers/flutter');
const AdminAuthController = require('./controllers/admin_controllers/auth');
const StudentController = require('./controllers/admin_controllers/student');
const RecoController = require('./controllers/reco_controllers/RecoController');
const cors = require('cors');

app.use(cors());

// Face Recognition routes
app.post('/facex', RecoController.recognition);
app.post('/detect', RecoController.detectFace);

// Bootcamp admin routes
app.post('/admin/signup', AdminAuthController.signUp);
app.post('/admin/login', AdminAuthController.login);
app.post('/admin/register-student', StudentController.register);
app.get('/admin/view-student', StudentController.getStudents);
app.post('/admin/view-student/:id', StudentController.getStudentsDetail);

// scream routes
app.get('/screams', ScreamController.getAllScream);
app.post('/scream', FBAuth, ScreamController.postOneScream);

// dika routes
app.post('/dika/registration', FlutterController.postData);
app.post('/dika/upload', FlutterController.testUpload);

// user routes
app.post('/signup', UserController.signUp);
app.post('/login', UserController.login);
app.post('/create-user', UserController.createUser);
app.post('/user/image', FBAuth, UserController.uploadImage);
app.post('/user', FBAuth, UserController.addUserDetails);
app.get('/user', FBAuth, UserController.getUserData);

exports.api = functions.https.onRequest(app);
