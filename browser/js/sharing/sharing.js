app.directive('sharing', () => {
    return {
        restrict: 'E',
        scope: {
            //videoSource: '=',
            //filters: '='
        },
        controller: 'ShareCtrl',
        templateUrl: 'js/sharing/sharing.html'
    };
});

app.controller('ShareCtrl', function ($http, $scope, DownloadFactory, InstructionsFactory) {
	$scope.socialNetworks = ['Download', 'Twitter', 'Facebook', 'Instagram'];
    $scope.isOpen = false;
    $scope.openDialog = function($event, item) {
      console.log('oh hey I was clicked')
      var sequence = InstructionsFactory.getSequence();
      if (item==='Download') {
        DownloadFactory.promisifiedDownload(sequence);
      }
      else {
        // Show the dialog
        $mdDialog.show({
          clickOutsideToClose: true,
          controller: function($mdDialog) {
            // Save the clicked item
            this.item = item;
            // Setup some handlers
            this.close = function() {
              $mdDialog.cancel();
            };
            this.submit = function() {
              $mdDialog.hide();
            };
          },
          controllerAs: 'dialog',
          templateUrl: "js/common/directives/dialog/dialog.html",
          targetEvent: $event
        });
      }
    }
});
