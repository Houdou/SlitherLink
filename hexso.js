(function(){
	var HEX = window.HEX || {};

	var SolutionStep = function(edgeid, state) {
		this.edgeid = edgeid;
		this.state = state;
	};

	var HEXSO = function(hesh, ui) {
		this.hesh = hesh;
		this.ui = ui;
		this.solutions = [];
		this.checklist = [];
	};
	HEX.HEXSO = HEXSO;

	HEXSO.prototype.MarkZero = function() {
		var solved = true;
		this.hesh.CellEach((cell) => {
			var edgeGroup = [];
			if(cell.value == 0) {
				for(var i in cell.Vert) {
					var edges = cell.Vert[i].FindEdgeInState(HEX.STATE.UND);
					edges.forEach((e) => {
						e.state = HEX.STATE.IMP;
						drawEdge(this.ui.edges[e.id], HEX.STATE.IMP);
					});	
				}
			} else {
				var result = cell.CountEdge();
				if(result.CONN == cell.value) {
					var edges = cell.FindEdgeInState(HEX.STATE.UND);
					edges.forEach((e) => {
						e.state = HEX.STATE.IMP;
						drawEdge(this.ui.edges[e.id], HEX.STATE.IMP);
					});	
				}
				if(result.IMP == 6 - cell.value) {
					var edges = cell.FindEdgeInState(HEX.STATE.UND);
					edges.forEach((e) => {
						e.state = HEX.STATE.CONN;
						drawEdge(this.ui.edges[e.id], HEX.STATE.CONN);
					});	
				}
				// Check loop
				if(result.UND > 0) {
					var edges = cell.FindEdgeInState(HEX.STATE.UND);
					edges.forEach((e) => {
						var needCheck = true;
						for(var i in e.Vert) {
							if(e.Vert[i].CountEdge().CONN != 1)
								needCheck = false;
						}
						if(needCheck && this.CheckLoop(e)){
							e.state = HEX.STATE.IMP;
							drawEdge(this.ui.edges[e.id], HEX.STATE.IMP);
						}
					});	
				}
			}
			for(var i in cell.Vert) {
				var result = this.CheckVert(cell.Vert[i]);
				if(result.CONN == 1 && result.UND == 2) {
					var inGroup = true;
					var edges = cell.Vert[i].FindEdgeInState(HEX.STATE.UND);
					edges.forEach((e) => {
						inGroup &= cell.IsEdgeContained(e);
					});
					if(inGroup)
						edgeGroup.push(edges);
				}
			}
			// if(!cell.full) {
			// 	console.log(cell);
			// }
			solved &= cell.full;
		});
		// console.log(solved);
		return solved;
	};
	HEXSO.prototype.CheckVert = function(vert) {
		var result = vert.CountEdge();
		// ERROR
		if(result.CONN > 2) throw new Error("Multiple connection on Vert: ", vert);
		if(result.CONN < 2 && result.CONN > 0 && result.UND == 0) throw new Error("Disconnection on Vert: ", vert);
		// Possible
		if(result.CONN == 2) {
			var edges = vert.FindEdgeInState(HEX.STATE.UND);
			edges.forEach((e) => {
				e.state = HEX.STATE.IMP;
				drawEdge(this.ui.edges[e.id], HEX.STATE.IMP);
			});
		}
		if(result.ALL - result.IMP == 2 && result.CONN == 1) {
			var edges = vert.FindEdgeInState(HEX.STATE.UND);
			edges.forEach((e) => {
				e.state = HEX.STATE.CONN;
				drawEdge(this.ui.edges[e.id], HEX.STATE.CONN);
			});
		}
		if(result.ALL - result.IMP == 1 && result.CONN == 0) {
			var edges = vert.FindEdgeInState(HEX.STATE.UND);
			edges.forEach((e) => {
				e.state = HEX.STATE.IMP;
				drawEdge(this.ui.edges[e.id], HEX.STATE.IMP);
			});	
		}
		return result;
	}
	HEXSO.prototype.CheckLoop = function(edge) {
		var start, end;
		for(var i in edge.Vert) {
			if(!end) {
				end = edge.Vert[i];
				continue;
			}
			if(!start) {
				start = edge.Vert[i];
				continue;
			}
		}
		// console.log(start, end);
		var nodeVert = start;
		var nodeEdge;
		var initialCheck = start.CountEdge();
		if(initialCheck.CONN == 1) {
			nodeEdge = nodeVert.FindEdgeInState(HEX.STATE.CONN)[0];
			nodeVert = nodeEdge.getConnectedVert(nodeVert);

			while(nodeVert.id != end.id) {
				var _nodeEdge = nodeVert.getConnectedEdge(nodeEdge);
				if(_nodeEdge) {
					nodeEdge = _nodeEdge;
					var _nodeVert = nodeEdge.getConnectedVert(nodeVert);
					if(_nodeVert) {
						nodeVert = _nodeVert;
					} else { return false; }
				} else { return false; }
			}
			return true;
		} else { return false; }
	}

	window.HEXSO = HEXSO;
}());