app.factory('InstructionsFactory',function (IdGenerator) {

	var sequence = {};
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
		updateSequence: (newInstructions) => {
			sequence.instructions = newInstructions;
			sequence.id = IdGenerator();
		},
		getSequence: () => {
			return sequence;
		},
		update: (newInstructions) => instructions = newInstructions,
		makeUniqueInstructions: function(instructions){
			var instCopy = {filters:[]};
			if(instructions.filters){
				instructions.filters.forEach(function(filt,ind){
					instCopy.filters[ind]={};
					_.assign(instCopy.filters[ind], filt);
				});
			}
			for(var key in instructions){
				if(key!="filters"){
					instCopy[key]=instructions[key];
				}
			}
			return instCopy;
		},
		getAudio: function () {
			return audio;
		}
	};
});
