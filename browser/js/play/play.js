app.config(function($stateProvider) {

    $stateProvider.state('play', {
        url: '/play',
        templateUrl: 'js/play/play.html',
        controller: 'PlayCtrl'
    });
});

app.controller('PlayCtrl', function($scope, $state, $stateParams) {
    //$scope.source = $stateParams.source;
    $scope.videoSource = "dragon.ogg";
    //angular.element(document).ready(init); 
    setTimeout(init,2000);


    var fg;
    var video;
    var canvas;

    function init(event) {
        video = document.getElementById("video");
        canvas = document.getElementById("canvas");
        console.log(canvas);
        fg = new frameGrabber(video, canvas);
        displayEffects();
    }

    function displayEffects() {
        var effectsBlock = document.getElementById("effects");
        var ul = document.createElement("ul");
        for (var effect in JSManipulate) {
            var li = document.createElement("li");
            var input = document.createElement("input");
            input.type = "radio"
            input.name = "effects"
            input.value = effect;
            input.id = effect;
            input.addEventListener("click",
                function(evt) {
                    fg.setEffect(this.value);
                },
                false);
            li.appendChild(input);
            var label = document.createElement("label");
            label.innerHTML = JSManipulate[effect].name;
            label.setAttribute("for", input.id);
            li.appendChild(label);
            ul.appendChild(li);
        }
        effectsBlock.appendChild(ul);
        effectsBlock.getElementsByTagName('input')[0].checked = true;
    }
});
