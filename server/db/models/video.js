var mongoose = require('mongoose');
var path = require('path');

var schema = new mongoose.Schema({
    title: {
        type: String
    },
    ext: {
        type: String,
        required: true
    },
    editor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    instructionsId: {
      type: String
    }
});

mongoose.model('Video', schema);
