(function(){
	var HEX = window.HEX || {};

	var SolutionStep = function(edgeid, state) {
		this.edgeid = edgeid;
		this.state = state;
	};

	var EdgeChoice = function(edges) {
		this.edges = edges;
		this.choosed = false;
	};
	EdgeChoice.Concat = function(edgeChoicelist) {
		var edgeList = [];
		edgeChoicelist.forEach((edgeChoice) => {
			for(var i = 0; i < edgeChoice.edges.length; i++) {
				var inList = false;
				for(var j = 0; j < edgeList.length; j++) {
					if(edgeList[j].id == edgeChoice.edges[i].id) {
						inList = true;
					}
				}
				if(!inList)
					edgeList.push(edgeChoice.edges[i]);
			}
		})
		return edgeList;
	};

	var EdgeConnect = function(edges) {
		this.edges = edges;
		this.state = null;
	};
	EdgeConnect.prototype.Merge = function(anotherEdgeConnect) {
		var valid = false;
		var toExtend = [];
		for(var i = 0; i < anotherEdgeConnect.length; i++) {
			var edge = anotherEdgeConnect[i];
			for(var j = 0; j < this.edges.length; j++) {
				if(e.id == edge.id) {
					valid = true;
					continue;
				} else {
					toExtend.push(edge);
					break;
				}
			}
		}
		if(valid)
			this.edges.concat(toExtend);
		console.log(this.edges);
	};

	var CellInfo = function(cell) {
		this.cell = cell;
		this.edgeChoices = [];
		this.edgeConnects = [];
	}

	var HEXSO = function(hesh, ui) {
		this.hesh = hesh;
		this.ui = ui;
		this.solutions = [];
		this.checklist = [];
	};
	HEX.HEXSO = HEXSO;

	HEXSO.prototype.CheckCells = function() {
		var solved = true;
		this.hesh.CellEach((cell) => {
			var cellInfo = new CellInfo(cell);
			var result = cell.CountEdge();
			if(cell.value == 0) {
				// Mark zero
				for(var i in cell.Vert) {
					var edges = cell.Vert[i].FindEdgeInState(HEX.STATE.UND);
					edges.forEach((e) => {
						e.state = HEX.STATE.IMP;
						drawEdge(this.ui.edges[e.id], HEX.STATE.IMP);
					});
				}
				cell.full = true;
			} else {
				// Full connected
				if(result.CONN == cell.value) {
					var edges = cell.FindEdgeInState(HEX.STATE.UND);
					edges.forEach((e) => {
						e.state = HEX.STATE.IMP;
						drawEdge(this.ui.edges[e.id], HEX.STATE.IMP);
					});
				}
				// All undetermined edges are must
				if(result.IMP == 6 - cell.value) {
					var edges = cell.FindEdgeInState(HEX.STATE.UND);
					edges.forEach((e) => {
						e.state = HEX.STATE.CONN;
						drawEdge(this.ui.edges[e.id], HEX.STATE.CONN);
					});
					cell.full = true;
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
					var inCell = true;
					var edges = cell.Vert[i].FindEdgeInState(HEX.STATE.UND);
					edges.forEach((e) => {
						inCell &= cell.IsEdgeContained(e);
					});
					if(inCell) {
						var edgeChoice = new EdgeChoice(edges);
						cellInfo.edgeChoices.push(edgeChoice);
					}
				}
				if((result.ALL - result.IMP == result.UND) && result.UND == 2) {
					var inCell = true;
					var edges = cell.Vert[i].FindEdgeInState(HEX.STATE.UND);
					edges.forEach((e) => {
						inCell &= cell.IsEdgeContained(e);
					});
					if(inCell) {
						var edgeConnect = new EdgeConnect(edges);
						cellInfo.edgeConnects.push(edgeConnect);
					}
				}
			}
			cell.cellInfo = cellInfo;
			if(cellInfo.edgeConnects.length > 0 || cellInfo.edgeChoices.length > 0) {
				// All other need to be connected
				if(cellInfo.edgeChoices.length > 0){
					var edgeList;
					var totalEdges = 0;
					if(cellInfo.edgeChoices.length > 1) {
						edgeList = EdgeChoice.Concat(cellInfo.edgeChoices);
						// TODO:
						// calculate complex total edges
					} else {
						edgeList = cellInfo.edgeChoices[0].edges;
						totalEdges = 1;
					}
					cellInfo.edgeChoices.forEach((edgeChoice) => {
						result = cell.CountEdge();
						if((result.UND - 2 == cell.value - result.CONN - 1) && cell.value > 0) {
							var edges = cell.FindEdgeInState(HEX.STATE.UND);
							edges.forEach((e) => {
								
								if(edgeChoice.edges.indexOf(e) == -1) {
									e.state = HEX.STATE.CONN;
									drawEdge(this.ui.edges[e.id], HEX.STATE.CONN);
								}
							});
						}
						result = cell.CountEdge();
						if((cell.value - result.CONN - 1 == 0) && result.UND - 2 > 0 && cell.value > 0) {
							var edges = cell.FindEdgeInState(HEX.STATE.UND);
							edges.forEach((e) => {
								if(edgeChoice.edges.indexOf(e) == -1) {
									e.state = HEX.STATE.IMP;
									drawEdge(this.ui.edges[e.id], HEX.STATE.IMP);
								}
							});
						}
					})
				}
				result = cell.CountEdge();
				if(cellInfo.edgeConnects.length > 0) {
					// Will be illeage if disconnected
					cellInfo.edgeConnects.forEach((edgeConnect) => {
						if(edgeConnect.edges.length > 6 - cell.value && cell.value > 0) {
							edgeConnect.edges.forEach((e) => {
								e.state = HEX.STATE.CONN;
								drawEdge(this.ui.edges[e.id], HEX.STATE.CONN);
							});
						}
						if(edgeConnect.edges.length > cell.value && cell.value > 0) {
							edgeConnect.edges.forEach((e) => {
								e.state = HEX.STATE.IMP;
								drawEdge(this.ui.edges[e.id], HEX.STATE.IMP);
							});	
						}
						if(result.UND - edgeConnect.edges.length < cell.value - result.CONN && cell.value > 0) {
							var edges = cell.FindEdgeInState(HEX.STATE.UND);
							edges.forEach((e) => {
								if(edgeConnect.edges.indexOf(e) != -1) {
									e.state = HEX.STATE.CONN;
									drawEdge(this.ui.edges[e.id], HEX.STATE.CONN);
								}
							});
						}
					})
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
		if(result.CONN > 2) throw new Error("Multiple connection on Vert: " + vert.id);
		if(result.CONN < 2 && result.CONN > 0 && result.UND == 0) throw new Error("Disconnection on Vert: " + vert.id);
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