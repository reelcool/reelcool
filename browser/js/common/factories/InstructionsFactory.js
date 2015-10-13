app.factory('InstructionsFactory',function (IdGenerator) {
	var instructions = [],
		audio = {
			id: null, // null to keep original track, otherwise mongoID
			fadeIn: false,
			fadeOut: false
		};

	return {
		add: (instruction) => {
			instructions.push(instruction);
		},
		get: () => {
			return instructions;
		},
		generate: (videoSource, endTime) => {
			return {
				id: IdGenerator(),
				videoSource: videoSource,
				startTime: 0,
				endTime: endTime,
			};
		},
		update: (newInstructions) => instructions = newInstructions,
		getAudio: function () {
			return audio;
		}
	};
});
