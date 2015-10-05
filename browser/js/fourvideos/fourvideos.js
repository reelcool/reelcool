app.config(($stateProvider) => {

    $stateProvider.state('fourvideos', {
        url: '/fourvideos',
        templateUrl: 'js/fourvideos/fourvideos.html',
        controller: 'FourVideosCtrl'
    });
});

app.controller('FourVideosCtrl', ($scope) => {
    $scope.currentClip = 0;
    $scope.totalCurrentTime = 0;
    $scope.totalEndTime = 0;

    $scope.instructions = [{
      source: 'lego.ogv',
      startTime: 0,
      endTime: 4,
      duration: 4,
      filter: 'blur'
    },{
      source: 'IMG_2608.MOV',
      startTime: 30,
      endTime: 35,
      duration: 5,
      filter: 'bw'
    },{
      source: 'lego.ogv',
      startTime: 0,
      endTime: 4,
      duration: 4,
      filter: 'sepia'
    },{
      source: 'IMG_2608.MOV',
      startTime: 40,
      endTime: 45,
      duration: 5,
      filter: 'invert'
    }];

    $scope.instructions.forEach(function(instruction){
      $scope.totalEndTime += instruction.duration;
    });


    setTimeout(run, 1000);

    var videos;

    function run() {
      videos = document.getElementsByClassName('hiddenVideo');

      var canvas = document.getElementById('canvas');
      var context = canvas.getContext('2d');

      var cw = Math.floor(canvas.clientWidth);
      var ch = Math.floor(canvas.clientHeight);
      canvas.width = cw;
      canvas.height = ch;
      var cumulativeTimeBefore = 0;

      for(var i = 0; i < $scope.instructions.length; i++){
        setUpPauseAndContinue(videos[i],i);
        addTimeUpdateEvents(videos[i],i);
        videos[i].timeBefore = cumulativeTimeBefore;
        cumulativeTimeBefore += $scope.instructions[i].duration;
      }

      $scope.$on('newMovingTime', (event, ...args) => {
        $scope.totalCurrentTime = args[0];
        setCurrentPlace();
      })

      $scope.$on('UIpause', (event, ...args) => {
        [].forEach.call(videos, cancelSetUpPauses);
        videos[$scope.currentClip].pause();
      })

      $scope.$on('UIplay', (event, ...args) => {
        [].forEach.call(videos, cancelSetUpPauses);
        videos[$scope.currentClip].play();
      })

      // $scope.$on('previewMovingTime', (event, ...args) => {
      //   $scope.totalCurrentTime = args[0];
      //   setCurrentPlace();
      //   [].forEach.call(videos, cancelSetUpPauses);
      // })

      function cancelSetUpPauses(video){
        if(video.currentSetTimeoutId){
          clearTimeout(video.currentSetTimeoutId);
        }
      }

      function setUpPauseAndContinue(video, index){
        video.addEventListener('play', ()=> {
          if(video.currentTime< $scope.instructions[index].startTime){
            video.currentTime = $scope.instructions[index].startTime;
          }
          //console.log("START PLAYING video.currentTime", video.currentTime);
          for(var i = 0; i<videos.length; i++){
            if(videos[i].currentSetTimeoutId){
              clearTimeout(videos[i].currentSetTimeoutId);
              //console.log("cleared timeout for video", index);
            }
            if(i!==index){
              videos[i].pause();
            }
          }
          var playDuration = 1000*($scope.instructions[index].endTime - video.currentTime);

          video.currentSetTimeoutId = setTimeout(() => {
            video.pause();
            //console.log("stopped video", index);
            if(index+1 < videos.length){
              var nextVideo = videos[index+1];
              nextVideo.currentTime = $scope.instructions[index+1].startTime;
              //console.log("^**********next current Time, for", index+1, "is", videos[index+1].currentTime)
              nextVideo.play();
              $scope.currentClip = index+1;
              $scope.$digest();
            }
          }, playDuration);

          //console.log("set new timeout for video", index);

          draw(video, context, cw, ch);

        }, false);
      }

      function setCurrentPlace() {
        //console.log("SETTING NEW PLACE WITH SCOPE.TOTALCURRENTTIME", $scope.totalCurrentTime)
        videos[$scope.currentClip].pause();
        var clipToPlay;
        for(var i = 0; i< videos.length; i++){
          if($scope.totalCurrentTime < videos[i].timeBefore){
              $scope.currentClip = i - 1;
              clipToPlay = videos[$scope.currentClip];
              //console.log('clip to play (from slider)', $scope.currentClip)
              break;
          }
          else if(i===videos.length - 1){
              $scope.currentClip = i;
              clipToPlay = videos[$scope.currentClip];
              //console.log('clip to play (from slider)', $scope.currentClip)
          }
        }
        //clipToPlay.load();
        clipToPlay.currentTime = $scope.totalCurrentTime - clipToPlay.timeBefore + $scope.instructions[$scope.currentClip].startTime;
        $scope.$broadcast('CTRLplay');
        clipToPlay.play();
      }

      function addTimeUpdateEvents(video, index){
        video.ontimeupdate = function(){
          $scope.totalCurrentTime = video.timeBefore + video.currentTime -$scope.instructions[index].startTime;
          $scope.$digest();
        };
      }

      videos[0].currentTime = $scope.instructions[0].startTime;
      videos[0].play();
    }

    function draw(v, c, w, h){
      if(v.paused || v.ended) return false;
      c.drawImage(v,0,0,w,h);
      setTimeout(draw,20,v,c,w,h);
    }

});
