const { _ } = require('./admin');

class Validator {
  static isEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  static validateSignup(data) {
    let errors = {};

    if (_.isEmpty(data.email.split(' ').join(''))) {
      errors.email = 'Email must not be empty';
    } else if (!Validator.isEmail(data.email)) {
      errors.email = 'Please input a valid email address';
    }

    if (_.isEmpty(data.password)) {
      errors.password = 'Password must not be empty';
    } else if (data.password.length < 8) {
      errors.password = 'Password must be more than 8 characters';
    }

    if (data.password !== data.confirmPassword) {
      errors.password = "Password doesn't match";
    }

    return {
      errors,
      isValid: _.isEmpty(errors) ? true : false
    };
  }

  static validateLogin(data) {
    let errors = {};

    if (_.isEmpty(data.email)) errors.email = 'Email cannot be empty';
    if (_.isEmpty(data.password)) errors.password = 'Password cannot be empty';

    return {
      errors,
      isValid: _.isEmpty(errors) ? true : false
    };
  }

  static reduceUserDetails(data) {
    let userDetails = {};

    if (!_.isEmpty(data.bio.split(' ').join(''))) userDetails.bio = data.bio;
    if (!_.isEmpty(data.website.split(' ').join(''))) {
      if (data.website.split(' ').join('').substring(0, 4) !== 'http') {
        userDetails.website = `http://${data.website.split(' ').join('')}`;
      } else {
        userDetails.website = data.website;
      }
    }
    if (!_.isEmpty(data.location.split(' ').join(''))) userDetails.location = data.location;

    return userDetails;
  }

  static validateStudentRegister(data) {
    let errors = {};

    if (_.isEmpty(data.email.split(' ').join(''))) {
      errors.email = 'Email tidak boleh kosong';
    } else if (!Validator.isEmail(data.email)) {
      errors.email = 'Masukkan email yang valid';
    }

    if (_.isEmpty(data.fullname)) errors.name = 'Nama harus diisi';
    if (data.fullname.length < 3) errors.name = 'Nama tidak boleh kurang dari 3 karakter';
    if (_.isEmpty(data.gender)) errors.gender = 'Jenis kelamin harus diisi';
    if (_.isEmpty(data.batch)) errors.batch = 'Batch harus diisi';

    return { errors, isValid: _.isEmpty(errors) ? true : false };
  }
}

module.exports = Validator;
