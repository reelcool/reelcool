var ffmpeg = require('fluent-ffmpeg');
var User = require('mongoose').model('User');
var Video = require('mongoose').model('Video');
var spawn = require('child_process').spawn;

var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');

var express = require('express');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var storage = multer.diskStorage({
    destination: function (req,file,cb){
      cb(null, path.join(__dirname, "..","..","..","temp"));
    },
    filename: function (req,file,cb){
      var parsedFile = path.parse(file.originalname);
      var video = {title: parsedFile.name, ext: parsedFile.ext};
      if (req.user) video.editor = req.user._id; // if user is not logged in, we won't remember who uploaded the video. sorry.
      Video.create(video)
        .then(function (created) {
          cb(null, created._id+parsedFile.ext);
        });
    }
});

var upload = multer({ storage: storage });
router.use(bodyParser.raw());

//var command = ffmpeg(fs.createReadStream(path.join(__dirname, 'IMG_2608.MOV')));

//app.use(express.static(__dirname + '/flowplayer'));


var filters = {
  grayscale: 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3',
  sepia: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
  blur: 'boxblur=luma_radius=5:luma_power=3'
};

// instructions= [
//   {
//     vid_id: 
//     startTime:
//     endTime:
//     filters: []
//   }
// ]


router.post('/download', function(req, res){
  // var outPath = path.join(__dirname,"../../../files/");
  // var finalFilePath = path.join(__dirname,"../../../files/final.avi");
  var ffmpeg = spawn('ffmpeg', ['-i', 'server/files/snowgroomer.webm','-strict', 'experimental', '-preset', 'ultrafast', '-vcodec', 'libx264', 'server/temp/converted.mp4', '-y']);
    ffmpeg.on('exit',function(code,signal){
      console.log('hey!!!, done!');
      req.resume();
      res.end();
    });
    // req.connection.pipe(ffmpeg.stdin);
  // var instructions = req.body.data;
  // instructions.forEach(function(instruction, ind){
  //   instruction.path = path.join(outPath,ind.toString()+'.avi');
  // });
  // console.log(instructions);
  // var numClips = instructions.length;
  // var clipsAdded = 0;
  // var clips = [];
  // var proc = ffmpeg()
  //     .on('end', function() {
  //      console.log('file has been converted succesfully');
  //     });
     //  .on('error', function(err) {
     //   console.log('an error happened: ' + err.message);
     // });

  // instructions.forEach(function(step, index){
  //   var duration = step.endTime-step.startTime;
  //   var clip = ffmpeg().input(step.path)
  //   .output(outPath+index.toString()+'.ogv')
  //   .on('end', function(){
  //     clips[index]=(outPath+index.toString()+'.ogv');
  //     clipsAdded++;
  //     if(clipsAdded===numClips){

  // //         clips.forEach(function(clipPath){
  //   instructions.forEach(function(clip){
  //           proc.input(clip.path);
  //   });
    // proc.input(path.join(__dirname,"../../../temp","1.mp4"));
    // proc.input(path.join(__dirname,"../../../temp","2.mp4"));
    // proc.input(path.join(__dirname,"../../../files","c.avi"));
    // proc.mergeToFile(finalFilePath);
});


// router.post('/upload', upload.single('uploadedFile'),function(req,res,next){
//     var outName = req.file.originalname.split('.')[0]+".mp4";
//     var outPath = path.join(__dirname,"../../../files");
//     var proc = ffmpeg(req.file.path)
//       .on('end', function() {
//         console.log('file has been converted succesfully, creating video in Mongo...');
//         Video.create({
//           fileName: outName,
//           path: outPath,
//           editor: req.user._id
//         }).then(function(vid){
//           if (!req.session.videoPaths) req.session.videoPaths = [vid.path+vid.fileName];
//           else req.session.videoPaths.push(vid.path+vid.fileName);
//           console.log(req.session.videoPaths);
//           res.status(201).json(vid._id);
//         }, function(err){
//           console.log(err);
//           res.json(err);
//         });
//         // if(req.file.originalname.split('.')[0]!==".webm"){           <---- for sending a file back if it wasn't webm

//         // }
//       })
//       .on('error', function(err) {
//         console.log('an error happened: ' + err.message);
//       })
//       .inputOptions(['-strict experimental','-preset ultrafast','-vcodec libx264'])
//       .output(path.join(outPath,outName))
//       .run();

// });

router.post('/upload', upload.single('uploadedFile'), function(req, res) {
  res.send(path.parse(req.file.filename).name);
});

module.exports = router;
