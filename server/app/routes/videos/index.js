// utilities
var spawn = require('child_process').spawn;
var Promise = require('bluebird');
var mongoose = require('mongoose');
mongoose.Promise = Promise;
var fs = require('fs');
Promise.promisifyAll(fs);
var path = require('path');
var ffmpeg = require('fluent-ffmpeg');

// express and models
var router = require('express').Router();
var Video = mongoose.model('Video');

// file paths setup
var filesPath = path.join(__dirname, "..", "..", "..", "files");
var userDir;
var uploadedFilesPath;
var stagingAreaPath;
var createdFilePath;
var tempFilePath;

router.use(function (req,res,next) {
    // all this has to be inside of router.use (or at least the userDir part) so that we have access to req
    userDir = req.user ? req.user._id.toString() : 'anon'; // to prevent errors/crashes in case we somehow fail to enforce login
    uploadedFilesPath = path.join(filesPath,userDir,"uploaded");
    stagingAreaPath = path.join(filesPath,userDir,"staging");
    createdFilePath = path.join(filesPath,userDir,"created");
    tempFilePath = path.join(filesPath,userDir,"temp");
    next();
});

// multer file handling
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadedFilesPath);
    },
    filename: function(req, file, cb) {
        let parsedFile = path.parse(file.originalname);
        let video = {
            title: parsedFile.name,
            ext: parsedFile.ext
        };
        if (req.user) video.editor = req.user._id; // if user is not logged in, we won't remember who uploaded the video. sorry.
        Video.create(video)
            .then(function(created) {
                cb(null, created._id + parsedFile.ext);
            });
    }
});
var upload = multer({
    storage: storage
});

var filters = {
    "Grayscale": 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3',
    "Sepia": 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
    "Invert": 'lutrgb=r=maxval+minval-val:g=maxval+minval-val:b=maxval+minval-val',
    "Brightness": {command:'hue=b=', translate: translateBrightness},
    "Contrast": {command:['mp=eq2=1:',':0:1:1:1:1'], translate: translateContrast},
    "Saturation": {command: ['mp=eq2=1:1:0:',':1:1:1'],translate: translateSaturation},
    "Hue": {command:'hue=h=', translate: translateHue},
};

function translateBrightness(command,val){
    let newVal;
    if(val<=1) newVal = (1-val)*10*-1;
    else newVal = (val-1)*4;
    return command+newVal.toString();
}
function translateContrast(command,val){
    return command[0]+val.toString()+command[1];
}
function translateSaturation(command,val){
    return command[0]+val.toString()+command[1];
}
function translateHue(command,val){
    return command+val.toString();
}
function makeFilterString(filtArr){
    if(filtArr==[]) return;
    return filtArr.filter(el => el.applied).map(filt=>{
        let filterKey = filters[filt.displayName];
        if (filterKey.translate){
            return filterKey.translate(filterKey.command, filt.val);
        }
        else return filterKey;
    }).join(', ');
}

router.post('/makeit', function(req, res) {

    let instructions = req.body.instructions;
    let instructionsId = req.body.id;
    let vidsDone = 0;
    let mergedVideo = ffmpeg();

    //first search in the videos collections for whether the video already exists
    //based on whether there is a video that has the same instructions ID
    Video.findOne({instructionsId: instructionsId})
    .then(video => {
      //send back the file name
      if(video && video.instructionsId){
        //let videoPath = path.join(createdFilePath, video._id + ".mp4");
        console.log("video already exists for this set of instructions!",instructionsId, video)
        return res.status(201).send(video._id+".mp4");
      }
      else{
        //create a new video for this set of instructions
        console.log("video doesn't exist yet, make it!")
        return makeClipsToBeMerged(instructions)
        .then(inst => {
          mergeVids(mergedVideo, createdFilePath, inst, instructionsId);
        })
      }
    })
    .catch(err=> {
      console.log("error!!!", err);
    });

    function makeClipsToBeMerged(instructions){

      return new Promise((resolve, reject) => {

        instructions.forEach(function(instruction, ind) {
            let vid = instruction.videoSource.mongoId;
            let sourceVid = uploadedFilesPath + '/' + vid + '.webm';
            let destVid = stagingAreaPath + '/' + vid + '.mp4';
            let startTime = instruction.startTime;
            let duration = (Number(instruction.endTime) - Number(startTime)).toString();
            // TODO: Need an option for "no filter" that doesn't break the child process
            // (which expects a filter). If instruction.filter is left "undefined", the proc breaks.
            // That's why we currently force it to have grayscale if it doesn't already have a filter.
            let filterCode = makeFilterString(instruction.filters) || "mp=eq2=1:1:0:1:1:1:1";
            let filtersProc = spawn('ffmpeg', ['-ss', startTime, '-i', sourceVid, '-t', duration, '-filter_complex', filterCode, '-strict', 'experimental', '-preset', 'ultrafast', '-vcodec', 'libx264', destVid, '-y']);
            filtersProc.on('error',function(err,stdout,stderr){
                console.error('Errored when attempting to convert this video. Details below.');
                console.error(err);
                console.error(stdout);
                console.error(stderr);
                reject(err);
            });
            filtersProc.on('exit', function(code, signal) {
                console.log('Filtered and converted', vid);
                vidsDone++;
                if (vidsDone == instructions.length) {
                    console.log('Filters done, now merging.');
                    resolve(instructions);
                    //mergeVids(mergedVideo, createdFilePath, instructions);
                }
                req.resume();
            });
          });
      });
    }

    function mergeVids(mergedVideo, createdFilePath, instructions, instructionsId) {

        //create the video record (but don't save it yet) to get the _id of it
        let createdVideo = new Video({
          editor: req.user? req.user._id.toString() : 'anon',
          instructionsId: instructionsId,
          ext: '.mp4'
        })

        let createdVidName = createdVideo._id + '.mp4';

        let mergedVideoDest = path.join(createdFilePath,createdVidName); // name of file based on Date.now(). file is already located in the user's created folder so it we would be able to pull it up
        console.log("merging to destination", mergedVideoDest);
        // add inputs in the same order as they were in the instructions
        instructions.forEach(function (inst) {
            let filename = inst.videoSource.mongoId+'.mp4';
            let input = path.join(stagingAreaPath,filename);
            console.log("added input", input);
            mergedVideo.addInput(input);
        });

        mergedVideo.mergeToFile(mergedVideoDest, tempFilePath)
            .on('error', function(err) {
                console.log('Error ' + err.message);
            })
            .on('end', function() {
                console.log('Finished!');
                deleteStagedFiles()
                .then(() => {
                  return createdVideo.save();
                })
                .then(()=> {
                  res.status(201).send(createdVidName);
                });
            });
    }

    function deleteStagedFiles () {
        return fs.readdirAsync(stagingAreaPath)
            .then(arrayOfFiles => Promise.map(arrayOfFiles, function (file) { return fs.unlinkAsync(path.join(stagingAreaPath, file)); }));
    }

});

router.get('/getconverted/:userId/:videoId',function (req,res){
    var filename = req.params.videoId+'.webm';
    var pathToVid = path.join(filesPath, req.params.userId, 'uploaded', filename);
    fs.createReadStream(pathToVid).pipe(res);
});

router.get('/download/:videoId',function (req,res) {
    res.setHeader('Content-disposition', 'attachment; filename=reelcoolmovie.mp4');
    res.setHeader('Content-type', 'video/mp4');

    var pathToMovie = path.join(createdFilePath,req.params.videoId);
    fs.createReadStream(pathToMovie).pipe(res);
});

router.post('/upload', upload.single('uploadedFile'), function(req, res) {
    var parsedFile = path.parse(req.file.filename);
    var mongoId = parsedFile.name;
    var desiredExt = '.webm';
    if (parsedFile.ext === desiredExt) res.status(201).send(parsedFile.name);
    else {
        var dest = req.file.destination + '/' + parsedFile.name + '.webm';
        var ffmpeg = spawn('ffmpeg', ['-i', req.file.path, '-c:v', 'libvpx', '-crf', '10', '-b:v', '1M', '-c:a', 'libvorbis', dest, '-y']);
        ffmpeg.on('message', function(msg) {
            console.log(msg);
        });
        ffmpeg.on('error', function(err) {
            console.error(err);
            res.status(500).send();
        });
        ffmpeg.on('exit', function(code, signal) {
            fs.unlinkAsync(req.file.path)
                .then(function () {
                    return Video.findByIdAndUpdate(mongoId, { ext: desiredExt }, {new: true});
                })
                .then(updated => res.status(201).send(updated._id));
        });
    }
});

router.get('/byuser/:userId',function (req,res) {
    let userId = req.params.userId;
    if (userId==='anon' || userId===undefined) res.status(404).send('User not logged in.');
    else {
        // Only want webm videos because other extensions are not ready to plug into MediaSource
        // They'll get updated to webm once they are converted.
        Video.find({editor:userId, ext:'.webm'}).select('_id title')
            .then(videos => {
                // var vidIds = videos.map(vid => vid._id);
                res.send(videos);
            })
            .catch(e => {
                let msg = `Unable to find videos for ${userId}`;
                console.error(msg);
                console.error(e);
                res.status(404).send(msg);
            });
    }
});


router.delete('/:videoId', function (req,res) {
    let videoId = req.params.videoId;
    let filename = videoId+'.webm';
    let fullFilePath = path.join(uploadedFilesPath,filename);

    fs.unlinkAsync(fullFilePath)
        .then(
            // file found, proceed to delete reference from db
            () => true,
            // unlink will err if file not found, that's why we need this whole block,
            // to keep this on the success chain
            () => console.log('File not found. Attempting to remove any remaining reference to it from db.')
        )
        .then( () => Video.findByIdAndRemove(videoId))
        .then(function (removed) {
            if (removed) res.send(removed);
            else res.status(404).send();
        });

});

module.exports = router;
