'use strict';
var crypto = require('crypto');
var mongoose = require('mongoose');
var Promise = require('bluebird');
var fs = require('fs');
Promise.promisifyAll(fs);
var path = require('path')

var schema = new mongoose.Schema({
    email: {
        type: String
    },
    password: {
        type: String
    },
    salt: {
        type: String
    },
    twitter: {
        id: String,
        username: String,
        token: String,
        tokenSecret: String
    },
    facebook: {
        id: String
    },
    google: {
        id: String
    },
    instagram: {
        id: String
    }
});

// generateSalt, encryptPassword and the pre 'save' and 'correctPassword' operations
// are all used for local authentication security.
var generateSalt = function () {
    return crypto.randomBytes(16).toString('base64');
};

var encryptPassword = function (plainText, salt) {
    var hash = crypto.createHash('sha1');
    hash.update(plainText);
    hash.update(salt);
    return hash.digest('hex');
};

schema.pre('save', function (next) {

    if (this.isModified('password')) {
        this.salt = this.constructor.generateSalt();
        this.password = this.constructor.encryptPassword(this.password, this.salt);
    }

    next();

});

schema.statics.generateSalt = generateSalt;
schema.statics.encryptPassword = encryptPassword;

schema.method('correctPassword', function (candidatePassword) {
    return encryptPassword(candidatePassword, this.salt) === this.password;
});

schema.post('save',function (user) {
    var pathToUserDir = path.join(__dirname,"..","..","files",user._id.toString());
    var userSubDirs = ['created', 'staging', 'uploaded', 'temp'];
    var makeSubDirs;
    fs.statAsync(pathToUserDir) // will err if the directory doesn't exist
        .then(function (stats) {
            // Don't need to do anything with stats, 
            // but just the fact that we got it back means we're on the success track.
            console.log('user dir already exists');
        }, function (err) {
                // Gulp's linter expects us to "handle" the error, 
                // but we're already doing exactly what we want with it.
                makeSubDirs=true;
                return fs.mkdirAsync(pathToUserDir);
            } // will create the user's directory
        )
        .then(
            function () {
                if (makeSubDirs) return Promise.map(userSubDirs, function (subDir) {
                    fs.mkdirAsync(path.join(pathToUserDir,subDir));
                });
            },
            function (err) {
                console.error(err);
            }
        )
        .then(null, function (err) {
            console.error(err);
        });
});

mongoose.model('User', schema);