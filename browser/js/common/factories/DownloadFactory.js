app.factory("DownloadFactory", ($http, FilterFactory) => {

  let requestReelVideo = (sequence) => {
    FilterFactory.addFiltersToAllInstructions(sequence.instructions);
    return $http.post('/api/videos/makeit', sequence);
  };

  let promisifiedDownload = (sequence) => {
    requestReelVideo(sequence)
      .then(function (resp) {
        if (resp.status===201) {
          var url = '/api/videos/download/'+resp.data;
          // this "append" is what actually causes the video file to download to the user's computer
          $("body").append("<iframe src=" + url + " style='display: none;' ></iframe>");
        }
        else {
          console.error('The server responded with status', resp.status);
        }
      });
  }

  return {
    requestReelVideo: requestReelVideo,
    promisifiedDownload: promisifiedDownload
  };
});
