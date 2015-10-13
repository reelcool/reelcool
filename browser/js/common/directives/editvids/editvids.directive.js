app.directive("editvids", function (VideoFactory, InstructionsFactory) {
	return {
		restrict: "E",
		scope: {},
		templateUrl: "js/common/directives/editvids/editvids.html",
		controller: function ($scope, IdGenerator, $rootScope, DownloadFactory) {

			$scope.videos = [];

			var instructionsToVideoMap = {};
			//$scope.instructions= Pedit reel got instructions"reviewFactory.instructions;
			$scope.$on('sendClipToReel', (e,instructions) => {

				var index = getVideoIndexByInstructionsId(instructions.id);
				var instCopy = InstructionsFactory.makeUniqueInstructions(instructions);
				console.log('instructions after', instCopy);
				if(index> -1){
					//clip was previously added to list
					_.assign($scope.videos[index].instructions, instCopy);
				}
				else{
					//clip is not already there, add it to the end
					var updatedVideoElement = VideoFactory.createVideoElement();
					updatedVideoElement.addSource(instCopy.videoSource, instCopy);
					$scope.videos.push(updatedVideoElement);

					setTimeout(()=> {
						attachSourceToVideo(updatedVideoElement, instCopy);
					}, 0);
				}
				//the only time that this scope's instructions are updated
				updateInstructions($scope.videos);
			});

			$scope.$on('unstageClip', (e, clip)=> {
				var index = getVideoIndexByInstructionsId(clip.instructions.id);
				if(index>-1){
					$scope.videos.splice(index, 1);
				}
			});

			function getVideoIndexByInstructionsId (id) {
				return _.findIndex($scope.videos, (el) => {
					return el.instructions.id === id;
				});
			}

			function attachSourceToVideo(updatedVideoElement, instructions) {
				VideoFactory.attachVideoSource(instructions.videoSource, updatedVideoElement.id)
				.then(() =>  {
					updatedVideoElement.sourceAttached = true;
					updatedVideoElement.instructions = instructions;
					if(typeof updatedVideoElement.instructions.endTime==='undefined'){
						updatedVideoElement.instructions.endTime = document.getElementById(updatedVideoElement.id).duration;
					}
					$scope.$digest();
					console.log("attached video");
				}).then(null, (error) => {
					//TODO show error on video tag
					console.error("Error occured when attaching video source", error);
				});
			}

			function updateInstructions(videosList) {
				// Updates the instructions in the InstructionsFactory
				// and puts them on the scope.
				var newInstructions = videosList.map(el => el.instructions);
				InstructionsFactory.updateSequence(newInstructions);
			}

			$scope.previewVideo = () => {
				// console.log('instructions are updated')
				// console.log('from InstructionsFactory',InstructionsFactory.get());
				// console.log('from the $scope',$scope.instructions);
				console.log("preview requesting dl for sequence", InstructionsFactory.getSequence());
				DownloadFactory.requestReelVideo(InstructionsFactory.getSequence());
				$rootScope.$broadcast('toggleModal', {show: true});
			};
		}

	};
});
