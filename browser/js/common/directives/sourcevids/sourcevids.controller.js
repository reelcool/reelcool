app.controller("SourceVidsCtrl", function($rootScope, $scope, VideoFactory, InstructionsFactory, $state, RandomVideoGenerator) {

    $scope.videos = [];

    var fileInput = document.getElementById("videofileinput");

    $scope.selectVideoFile = function() {
        fileInput.click();
    };

    $scope.$on("videosource-deleted", function(event, videoSourceId) {
        $scope.videos.some(function(videoElement, index) {
            if (videoElement.videoSource.id === videoSourceId) {
                $scope.videos.splice(index, 1);
                return true;
            }
        });
    });
    

    fileInput.addEventListener('change', function (e) {
        var filesArr = Array.prototype.slice.call(fileInput.files, 0);
        filesArr.forEach(putVidOnScope);
    });

    var putVidOnScope = function(file) {
        var videoElement = VideoFactory.createVideoElement();
        $scope.videos.push(videoElement);
        VideoFactory.addVideoSource(file)
            .then(function(videoSource) {
                videoElement.addSource(videoSource);
                // if it was originally a webm video, we'll want to digest
                // if it wasn't, there will be a digest in progress, so we need to check before doing it
                let phase = $rootScope.$$phase;
                if (phase !== "$apply" && phase !== "$digest") $scope.$digest();
                return VideoFactory.attachVideoSource(videoSource, videoElement.id);
            }).then(function() {
                videoElement.sourceAttached = true;
                var duration = document.getElementById(videoElement.id).duration;
                // videoElement.duration = duration;
                videoElement.instructions.endTime = duration;
                // same here as above
                let phase = $rootScope.$$phase;
                if (phase !== "$apply" && phase !== "$digest") $scope.$digest();
            }).then(null, function(error) {
                //TODO show error on video tag
                console.error("Error occured when attaching video source", error);
            });
    };

    var putRemoteVidOnScope = function (mediaData) {
        var videoElement = VideoFactory.createVideoElement(mediaData.title);
        $scope.videos.push(videoElement);
        VideoFactory.addRemoteSource(mediaData._id)
            .then(function (videoSource) {
                let phase = $rootScope.$$phase;
                videoElement.addSource(videoSource);
                if (phase !== "$apply" && phase !== "$digest") $scope.$digest();
                return VideoFactory.attachVideoSource(videoSource, videoElement.id);
            })
            .then(function () {
                videoElement.sourceAttached = true;
                var duration = document.getElementById(videoElement.id).duration;
                // videoElement.duration = duration;
                videoElement.instructions.endTime = duration;
                let phase = $rootScope.$$phase;
                if (phase !== "$apply" && phase !== "$digest") $scope.$digest();
            })
            .then(null, function (error) {
                //TODO show error on video tag
                console.error("Error occured when attaching video source", error);
            });
    };


    var updateSourceVids = function () {
        VideoFactory.getPrevUploads($scope.videos).then(function (mediaData) {
            mediaData.forEach(putRemoteVidOnScope);
        });
    };

    setTimeout(updateSourceVids,1000);
    setInterval(updateSourceVids,20000); // polls the server every 20 seconds

    // This is here just for testing the preview player
    $scope.previewVideo = () => {
        var cutsNumber = 4;
        var cutLength = 2;
        var allInstructions = RandomVideoGenerator.createVideo($scope.videos, cutsNumber, cutLength);
        InstructionsFactory.update(allInstructions);
        $state.go('preview');
    };
});
