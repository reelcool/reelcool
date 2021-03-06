app.directive("modalDialog", () => {
  return {
    restrict: 'E',
    scope: {
      show: '='
    },
    templateUrl: 'js/common/directives/modalwindow/modalwindow.html',
    //replace: true,
    controller: ($scope, InstructionsFactory, $rootScope) => {
      $scope.dialogStyle = {};

      $scope.$on('toggleModal', (e, args) => {
        //this should be the only place where "show" is toggled
        //only the modal directly affects whether it should be shown
        $scope.show = args.show;
        $scope.instructions = InstructionsFactory.get();
      })

      $scope.hideModal = function() {
        $rootScope.$broadcast('toggleModal', {show: false});
      };
    }
  }
})
