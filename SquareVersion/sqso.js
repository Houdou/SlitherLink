(function(){
	var SQ = window.SQ || {};

	var absPos = function(ele) {
		return ele.sqs.offsetX + "," + ele.sqs.offsetY + " + "
		+ ((ele.x == undefined)?ele.u:ele.x) + "," + ((ele.y == undefined)?ele.v:ele.y);
	}

	var SQSS = {};
	SQSS.parseSQS = function(sizeX, sizeY, sqs) {
		let sqss = "";
		let cellsHori = [];
		for(let v = 1; v < 2 * sizeY + 1; v += 2) {
			for(let u = 0; u < 2 * sizeX + 1; u += 2) {
				if(sqs.cells[v][u].state == SQ.STATE.CONN)
					cellsHori.push(SQ.STATE.CONN);
				if(sqs.cells[v][u].state == SQ.STATE.IMP)
					cellsHori.push(SQ.STATE.IMP);
			}
		}
		let cellsVert = [];
		for(let v = 0; v < 2 * sizeY + 1; v += 2) {
			for(let u = 1; u < 2 * sizeX + 1; u += 2) {
				if(sqs.cells[v][u].state == SQ.STATE.CONN)
					cellsVert.push(SQ.STATE.CONN);
				if(sqs.cells[v][u].state == SQ.STATE.IMP)
					cellsVert.push(SQ.STATE.IMP);
			}
		}
		sqss = cellsHori.map(value => '' + value).join('') + ',' + cellsVert.map(value => '' + value).join('');
		return sqss;
	};
	SQSS.restoreSQS = function(sqss, offsetX, offsetY, sizeX, sizeY, values) {
		let sqs = new SQ.SQS(sizeY, sizeX, values, offsetY, offsetX);
		let [cellsHori, cellsVert] = sqss.split(',');
		let count = 0;
		for(let v = 1; v < 2 * sizeY + 1; v += 2) {
			for(let u = 0; u < 2 * sizeX + 1; u += 2) {
				sqs.cells[v][u].state = (cellsHori[count++] == '0' ? SQ.STATE.IMP : SQ.STATE.CONN);	
			}
		}

		count = 0;
		for(let v = 0; v < 2 * sizeY + 1; v += 2) {
			for(let u = 1; u < 2 * sizeX + 1; u += 2) {
				sqs.cells[v][u].state = (cellsVert[count++] == '0' ? SQ.STATE.IMP : SQ.STATE.CONN);
			}
		}
		return sqs;
	}

	var SQSO = function(sqs, ui) {
		this.sqs = sqs;
		this.ui = ui;

		this.subs = [];
	};
	SQSO.prototype.getRegion = function(u, v, sizeX, sizeY) {
		if(sizeY < 1 || sizeX < 1 || ~~u !== u || ~~v !== v || ~~sizeX !== sizeX || ~~sizeY !== sizeY) { throw new Error("Invalid argument"); return; }
		if(u < 0 || u >= this.sqs.size || v < 0 || v >= this.sqs.size) { throw new Error("uv index out of range"); return; }

		let values = [];
		let yCount = v + sizeY > this.sqs.sizeY ? this.sqs.sizeY - v : sizeY;
		let xCount = u + sizeX > this.sqs.sizeX ? this.sqs.sizeX - u : sizeX;

		for(let y = v; y < v + yCount; y++) {
			for(let x = u; x < u + xCount; x++) {
				values.push(this.sqs.cells[2 * y + 1][2 * x + 1].value);
			}
		}
		return new SQ.SQS(yCount, xCount, values, v, u);
	};
	SQSO.prototype.getSubSqset = function(size, u, v) {
		if(this.subs[size] && this.subs[size][v])
			return this.subs[size][v][u];
	};
	SQSO.prototype.solve = function() {
		this.subs[0] = [];
		// Start from every single cell
		let size = 1;
		this.subs[size] = [];
		for(let j = 0; j < this.sqs.sizeY; j += size) {
			this.subs[size][j] = [];
			for(let i = 0; i < this.sqs.sizeX; i += size) {
				this.subs[size][j][i] = this.solveCell(this.getRegion(i, j, size, size));
			}
		}

		size *= 2;
		this.subs[size] = [];
		for(let j = 0; j < this.sqs.sizeY; j += size) {
			this.subs[size][j/size] = [];
			for(let i = 0; i < this.sqs.sizeX; i += size) {
				//if(i == 0 && j == 0) {
				//	console.log(i, j);
					this.subs[size][j/size][i/size] = this.solveRegion(i, j, size);
				//}
			}
		}
		// console.log(this.subs);

		size *= 2;
		this.subs[size] = [];
		for(let j = 0; j < this.sqs.sizeY; j += size) {
			this.subs[size][j/size] = [];
			for(let i = 0; i < this.sqs.sizeX; i += size) {
				if(i == 0 && j == 0) {
				//	console.log(i, j);
					this.subs[size][j/size][i/size] = this.solveRegion(i, j, size);
				}
			}
		}
		// // console.log("solved");
	};
	SQSO.prototype.solveStep = function(size) {
		this.subs[size] = [];
		for(let j = 0; j < this.sqs.sizeY; j += size) {
			this.subs[size][j/size] = [];
			for(let i = 0; i < this.sqs.sizeX; i += size) {
				if(i == 0 && j == 0) {
				//	console.log(i, j);
					this.subs[size][j/size][i/size] = this.solveRegion(i, j, size);
				}
			}
		}
	}
	SQSO.prototype.solveCell = function(sqs) {
		let cell = sqs.cells[1][1];
		let permus = this.permu(cell.value, 4);
		let sqset = new SQSO.SQSET(sqs);
		permus.forEach((permu) => {
			let solution = new SQ.SQS(1, 1, cell.sqs.values, sqs.offsetY, sqs.offsetX);
			let i = 0;
			// console.log(solution);
			for(let [edgeID, edge] of solution.edges) {
				edge.state = permu[i++] ? SQ.STATE.CONN : SQ.STATE.IMP;
			}
			if(this.verifySQS(solution)) {
				let sqss = SQSS.parseSQS(1, 1, solution);
				sqset.try(sqss);
			}
		})
		//console.log(sqset);
		return sqset;
	};
	SQSO.prototype.solveRegion = function(offsetX, offsetY, size) {
		if(size < 2) { throw new Error("Wrong cells size."); return; }

		console.log("Merging at:")
		console.log(offsetX, offsetY, size);

		let sqsetUL = this.getSubSqset(size/2, offsetY, offsetX);
		//console.log("SQSET at:", offsetX, ", ", offsetY, "\n", sqsetUL);
		let sqsetUR = this.getSubSqset(size/2, offsetY, offsetX+1);
		//console.log("SQSET at:", offsetX+1, ", ", offsetY, "\n", sqsetUR);

		let sqsetBL = this.getSubSqset(size/2, offsetY+1, offsetX);
		//console.log("SQSET at:", offsetX, ", ", offsetY+1, "\n", sqsetBL);
		let sqsetBR = this.getSubSqset(size/2, offsetY+1, offsetX+1);
		//console.log("SQSET at:", offsetX+1, ", ", offsetY+1, "\n", sqsetBR);
		
		let sqsetU, sqsetB;
		if(sqsetUL) {
			sqsetU = this.merge(sqsetUL, sqsetUR);
			//console.log(sqsetU);
		} else { sqsetU = null; }
		if(sqsetBL) {
			sqsetB = this.merge(sqsetBL, sqsetBR);
			//console.log(sqsetB);
		} else { sqsetB = null; }

		let sqset = this.merge(sqsetU, sqsetB);

		// let sqsB = this.merge(sqsBL, sqsBR);
		// if((sqsU.solutions.length > 0) && (sqsB.solutions.length > 0)) {
		// 	sqs = this.merge(sqsU, sqsB);
		// } else {
		// 	throw new Error("Unsolvable map");
		// }
		// for(let u = 0; u < sqsUL.solutions.length; u++) {
		// for(let i = 0; i < sqsUR.solutions.length; i++) {
		// for(let o = 0; o < sqsBL.solutions.length; o++) {
		// for(let p = 0; p < sqsBR.solutions.length; p++) {
		// 	let sqsU = 
		// }}}}

		return sqset;
		
	};
	SQSO.prototype.merge = function(sqsetA, sqsetB) {
		if(!sqsetA) { throw new Error("Unable to merge empty sqset."); }
		if(!sqsetB) { return sqsetA; }

		let offsetY = Math.min(sqsetA.sqs.offsetY, sqsetB.sqs.offsetY);
		let sizeY = Math.abs(sqsetA.sqs.offsetY - sqsetB.sqs.offsetY) + sqsetB.sqs.sizeY;
		let offsetX = Math.min(sqsetA.sqs.offsetX, sqsetB.sqs.offsetX);
		let sizeX = Math.abs(sqsetA.sqs.offsetX - sqsetB.sqs.offsetX) + sqsetB.sqs.sizeX;

		console.clear()
		console.log(offsetY, sizeY, offsetX, sizeX);

		if(!sqsetA || !sqsetB) {
			console.log("NULL");
		}
		
		let sqset = new SQSET(this.getRegion(offsetX, offsetY, sizeX, sizeY));

		if(sqsetA.solutions.size <= 0 || sqsetB.solutions.size <= 0) {
			return;
		}

		for(let u = 0; u < sqsetA.solutions.length; u++) {
			for(let v = 0; v < sqsetB.solutions.length; v++) {
				console.log("OffsetX", offsetX, ", OffsetY", offsetY, ", sizeX", sizeX, ", sizeY", sizeY, ", SQSetA", u, ", SQSetB", v);

				// TODO: improve the merging algorithm.
				let l = SQSS.restoreSQS(sqsetA.solutions[u], sqsetA.sqs.offsetX, sqsetA.sqs.offsetY, sqsetA.sqs.sizeX, sqsetA.sqs.sizeY, sqsetA.sqs.values);
				let r = SQSS.restoreSQS(sqsetB.solutions[v], sqsetB.sqs.offsetX, sqsetB.sqs.offsetY, sqsetB.sqs.sizeX, sqsetB.sqs.sizeY, sqsetB.sqs.values);
				let isHori = (l.offsetY - r.offsetY) == 0;
				let valid = true;

				if(isHori) {
					let borderIndex = 2 * r.offsetX;
					for(let o = 1; o < r.sizeY * 2 + 1; o += 2) {
						if(l.cells[o][borderIndex - 2 * l.offsetX].state 
							!= r.cells[o][borderIndex - 2 * r.offsetX].state)
							valid = false;
					}
				} else {
					let borderIndex = 2 * r.offsetY;
					for(let o = 1; o < r.sizeX * 2 + 1; o += 2) {
						if(l.cells[borderIndex - 2 * l.offsetY][o].state 
							!= r.cells[borderIndex - 2 * r.offsetY][o].state)
							valid = false;
					}
				}

				if(valid) {
					// Construct the new solutions.
					let solution = this.getRegion(offsetX, offsetY, sizeX, sizeY);

					//solution.print();

					for(let y = 1; y < 2 * l.sizeY + 1; y+=2) {
						for(let x = 0; x < 2 * l.sizeX + 1; x+=2) {
							//console.log(y + 2 * l.offsetY - 2 * offsetY, x + 2 * l.offsetX - 2 * offsetX, y, x);
							solution.cells[y + 2 * l.offsetY - 2 * offsetY][x + 2 * l.offsetX - 2 * offsetX].state
								 = l.cells[y][x].state;
						}
					}
					for(let y = 0; y < 2 * l.sizeY + 1; y+=2) {
						for(let x = 1; x < 2 * l.sizeX + 1; x+=2) {
							//console.log(y + 2 * l.offsetY - 2 * offsetY, x + 2 * l.offsetX - 2 * offsetX, y, x);
							solution.cells[y + 2 * l.offsetY - 2 * offsetY][x + 2 * l.offsetX - 2 * offsetX].state
								 = l.cells[y][x].state;
						}
					}
					for(let y = 1; y < 2 * r.sizeY + 1; y+=2) {
						for(let x = 0; x < 2 * r.sizeX + 1; x+=2) {
							//console.log(y + 2 * r.offsetY - 2 * offsetY, x + 2 * r.offsetX - 2 * offsetX, y, x);
							solution.cells[y + 2 * r.offsetY - 2 * offsetY][x + 2 * r.offsetX - 2 * offsetX].state
								 = r.cells[y][x].state;
						}
					}
					for(let y = 0; y < 2 * r.sizeY + 1; y+=2) {
						for(let x = 1; x < 2 * r.sizeX + 1; x+=2) {
							//console.log(y + 2 * r.offsetY - 2 * offsetY, x + 2 * r.offsetX - 2 * offsetX, y, x);
							solution.cells[y + 2 * r.offsetY - 2 * offsetY][x + 2 * r.offsetX - 2 * offsetX].state
								 = r.cells[y][x].state;
						}
					}

					let sqss = SQSS.parseSQS(sizeX, sizeY, solution);
					sqset.try(sqss);
				}
			}
		}
		return sqset;
	};
	SQSO.prototype.permu = function(value, total) {
		if(value > total || value < -1) {console.error("Invalid argument"); return [];}
		if(value == -1) { return this.permuAll(total); }
		if(total == 1) { return [value == 1]; }
		else if(total > 1) {
			let result = (value >= total) ? [] : this.permu(value, total-1).map(p => ([false]).concat(p));
			return result.concat((value <= 0) ? [] : this.permu(value-1, total-1).map(p => ([true]).concat(p)));
		}
	};
	SQSO.prototype.combi = function(sizes) {
		let result = [];
	};
	SQSO.prototype.permuAll = function(total) {
		if(total == 1) { return [false, true]; }
		let result = this.permuAll(total - 1).map(p => ([false]).concat(p));
		return result.concat(this.permuAll(total-1).map(p => ([true]).concat(p)));
	};
	SQSO.prototype.verify = function() {
		let size = 1;
		for(let j = 0; j < this.sqs.sizeY; j += size) {
			for(let i = 0; i < this.sqs.sizeX; i += size) {
				this.verifySQS(this.subs[size][j][i]);
			}
		}
	};
	SQSO.prototype.verifySQS = function(sqs) {
		let valid = true;
		// console.log(sqs.sizeX, sqs.sizeY);
		sqs.VertEach((vert) => {
			let result = vert.CountEdge();
			if(result.CONN > 2) {
				console.warn("Multiple connection on: " + absPos(vert));
				valid = false;
			}
			if(result.CONN < 2 && result.UND == 0) {
				// console.warn("Disconnection on: " + absPos(vert));
				// valid = false;
			}
		});
		sqs.EdgeEach((edge) => {
			// if(edge.state == SQ.STATE.CONN)
				// console.log(this.checkLoop(edge));
		});
		sqs.CellEach((cell) => {
			let result = cell.CountEdge();
			if(cell.value >= 0 && result.CONN != cell.value) {
				console.warn("Insufficient edges on: " + absPos(cell));
				valid = false;
			}
		});
		return valid;
	};
	SQSO.prototype.checkLoop = function(edge) {
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
			nodeEdge = nodeVert.FindEdgeInState(SQ.STATE.CONN)[0];
			nodeVert = nodeEdge.getConnectedVert(nodeVert);
			if(nodeVert.id != end.id) {
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
		} else { return false; }
	}

	var SQSET = function(sqs) {
		this.sqs = sqs;
		this.solutions = [];
	};
	SQSET.prototype.try = function(solution) {
		this.solutions.push(solution);
	};
	SQSET.prototype.print = function() {
		let result = "";
		this.solutions.forEach((solutionSQS) => {
			result += "-----------------\n";
			solutionSQS.print();

			result += "\n";
		});

		// console.log(result);
	}
	SQSO.SQSET = SQSET;

	SQ.SQSO = SQSO;
}());