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
		for(let u = 1; u < 2 * sizeX + 1; u += 2) {
			for(let v = 0; v < 2 * sizeY + 1; v += 2) {
				if(sqs.cells[v][u].state == SQ.STATE.CONN)
					cellsHori.push(SQ.STATE.CONN);
				if(sqs.cells[v][u].state == SQ.STATE.IMP)
					cellsHori.push(SQ.STATE.IMP);
			}
		}
		let cellsVert = [];
		for(let v = 1; v < 2 * sizeY + 1; v += 2) {
			for(let u = 0; u < 2 * sizeX + 1; u += 2) {
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
		for(let u = 1; u < 2 * sizeX + 1; u += 2) {
			for(let v = 0; v < 2 * sizeY + 1; v += 2) {
				sqs.cells[v][u].state = (cellsHori[count++] == '0' ? SQ.STATE.IMP : SQ.STATE.CONN);	
			}
		}

		count = 0;
		for(let v = 1; v < 2 * sizeY + 1; v += 2) {
			for(let u = 0; u < 2 * sizeX + 1; u += 2) {
				sqs.cells[v][u].state = (cellsVert[count++] == '0' ? SQ.STATE.IMP : SQ.STATE.CONN);
			}
		}
		return sqs;
	}
	SQ.SQSS = SQSS;

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
		this.startTime = (new Date()).getTime();

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

		// let _sqs = new SQ.SQS(3, 3, [0, 1, 0, 1, 0, 1, 0, 1, 0], 0, 0);
		// let _sqset = new SQSET(_sqs);
		// _sqset.solutions = ['011001010110,000010010110'];

		// let resSQS = SQSS.restoreSQS(_sqset.solutions[0], 0, 0, 3, 3, [0, 1, 0, 1, 0, 1, 0, 1, 0]);
		// resSQS.print();

		// let s = SQSO.verifySQS(resSQS);

		//console.log(this.subs[1]);

		//while(size <= Math.max(so.sqs.sizeX, so.sqs.sizeY)) {
			size *= 3;
			this.subs[size] = [];
			for(let j = 0; j < this.sqs.sizeY; j += size) {
				this.subs[size][j/size] = [];
				for(let i = 0; i < this.sqs.sizeX; i += size) {
					if(i == 0 && j == 0)
					//{
					//	console.log(i, j);
						this.subs[size][j/size][i/size] = this.solveRegion3(i, j, size, true);
					//}
				}
			}
		//}

		this.endTime = (new Date()).getTime();
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
			if(SQSO.verifySQS(solution)) {
				let sqss = SQSS.parseSQS(1, 1, solution);
				sqset.try(sqss);
			}
		})
		//console.log(sqset);
		return sqset;
	};
	SQSO.prototype.solveRegion = function(offsetX, offsetY, size, debug) {
		if(size < 2) { throw new Error("Wrong cells size."); return; }

		//if(debug)
			console.clear();

		console.log("Merging at:")
		console.log(offsetX, offsetY, size);

		let sqsetUL = this.getSubSqset(size/2, offsetX / (size / 2), offsetY / (size / 2));
		//console.log("SQSET at:", offsetX, ", ", offsetY, "\n", sqsetUL);
		let sqsetUR = this.getSubSqset(size/2, offsetX / (size / 2) + 1, offsetY / (size / 2));
		//console.log("SQSET at:", offsetX+1, ", ", offsetY, "\n", sqsetUR);

		let sqsetBL = this.getSubSqset(size/2, offsetX / (size / 2), offsetY / (size / 2) + 1);
		//console.log("SQSET at:", offsetX, ", ", offsetY+1, "\n", sqsetBL);
		let sqsetBR = this.getSubSqset(size/2, offsetX / (size / 2) + 1, offsetY / (size / 2) + 1);
		//console.log("SQSET at:", offsetX+1, ", ", offsetY+1, "\n", sqsetBR);
		

		// Improving merging sequence
		if(sqsetUR == undefined && sqsetBL == undefined)
			return sqsetUL;
		if(sqsetUR == undefined && sqsetBR == undefined)
			return this.merge(sqsetUL, sqsetBL, debug);
		if(sqsetBL == undefined && sqsetBR == undefined)
			return this.merge(sqsetUL, sqsetUR, debug);

		// let horiMergeCount = sqsetUL.solutions.length * sqsetUR.solutions.length
		// 	+ sqsetBL.solutions.length * sqsetBR.solutions.length;
		// let vertMergeCount = sqsetUL.solutions.length * sqsetBL.solutions.length
		// 	+ sqsetUR.solutions.length * sqsetBR.solutions.length;

		let sqsetU, sqsetB;
		
		// if(horiMergeCount > vertMergeCount) {
			sqsetU = this.merge(sqsetUL, sqsetUR, debug);
			sqsetB = this.merge(sqsetBL, sqsetBR, debug);
		// } else {
		// 	sqsetU = this.merge(sqsetUL, sqsetBL, debug);
		// 	sqsetB = this.merge(sqsetUR, sqsetBR, debug);
		// }			

		let sqset = this.merge(sqsetU, sqsetB, debug);

		return sqset;
		
	};
	SQSO.prototype.solveRegion3 = function(offsetX, offsetY, size, debug) {
		if(size < 2) { throw new Error("Wrong cells size."); return; }

		if(debug)
			console.clear();

		console.log("Merging at:")
		console.log(offsetX, offsetY, size);

		let sqsetUL = this.getSubSqset(size/3, offsetX / (size / 3) + 0, offsetY / (size / 3) + 0);
		let sqsetUC = this.getSubSqset(size/3, offsetX / (size / 3) + 1, offsetY / (size / 3) + 0);
		let sqsetUR = this.getSubSqset(size/3, offsetX / (size / 3) + 2, offsetY / (size / 3) + 0);
		let sqsetCL = this.getSubSqset(size/3, offsetX / (size / 3) + 0, offsetY / (size / 3) + 1);
		let sqsetCC = this.getSubSqset(size/3, offsetX / (size / 3) + 1, offsetY / (size / 3) + 1);
		let sqsetCR = this.getSubSqset(size/3, offsetX / (size / 3) + 2, offsetY / (size / 3) + 1);
		let sqsetBL = this.getSubSqset(size/3, offsetX / (size / 3) + 0, offsetY / (size / 3) + 2);
		let sqsetBC = this.getSubSqset(size/3, offsetX / (size / 3) + 1, offsetY / (size / 3) + 2);
		let sqsetBR = this.getSubSqset(size/3, offsetX / (size / 3) + 1, offsetY / (size / 3) + 2);

		let p00 = sqsetUL != undefined ? this.evaluate(size, size, sqsetUL.sqs.values) : 1;
		let p01 = sqsetUC != undefined ? this.evaluate(size, size, sqsetUC.sqs.values) : 1;
		let p02 = sqsetUR != undefined ? this.evaluate(size, size, sqsetUR.sqs.values) : 1;
		let p10 = sqsetCL != undefined ? this.evaluate(size, size, sqsetCL.sqs.values) : 1;
		let p11 = sqsetCC != undefined ? this.evaluate(size, size, sqsetCC.sqs.values) : 1;
		let p12 = sqsetCR != undefined ? this.evaluate(size, size, sqsetCR.sqs.values) : 1;
		let p20 = sqsetBL != undefined ? this.evaluate(size, size, sqsetBL.sqs.values) : 1;
		let p21 = sqsetBC != undefined ? this.evaluate(size, size, sqsetBC.sqs.values) : 1;
		let p22 = sqsetBR != undefined ? this.evaluate(size, size, sqsetBR.sqs.values) : 1;

		if(debug) {
			console.log("p values")
			console.log(p00, p01, p02);
			console.log(p10, p11, p12);
			console.log(p20, p21, p22);
		}
		
		let sqset;
		if(sqsetBR != undefined) {
			// Hori 3 Vert 3
			let pul = p00 * p01 * p10;
			let pur = p01 * p02 * p12;
			let pbl = p10 * p20 * p21;
			let pbr = p12 * p21 * p22;
			let min = Math.min(pul, pur, pbl, pbr);

			if(min == pul) {

				if(debug) {
					console.log("PUL");
				}
				let sqset00;
				if(p00 * p01 + p10 * p11 < p00 * p10 + p01 * p11) {
					sqset00 = this.merge(this.merge(sqsetUL, sqsetUC, debug),
						this.merge(sqsetCL, sqsetCC, debug), debug);
				} else {
					sqset00 = this.merge(this.merge(sqsetUL, sqsetCL, debug),
						this.merge(sqsetUC, sqsetCC, debug), debug);
				}
				let sqset01 = this.merge(sqsetUR, sqsetCR, debug);
				let sqset10 = this.merge(sqsetBL, sqsetBC, debug);
				
				sqset = this.merge(
					this.merge(sqset00, sqset01, debug),
					this.merge(sqset10, sqsetBR, debug), debug);

			} else if(min == pur) {

				if(debug) {
					console.log("PUR");
				}
				let sqset00 = this.merge(sqsetUL, sqsetCL, debug);
				let sqset01;
				if(p01 * p02 + p11 * p12 < p01 * p11 + p02 * p12) {
					sqset01 = this.merge(this.merge(sqsetUL, sqsetUC, debug),
						this.merge(sqsetCL, sqsetCC, debug), debug);
				} else {
					sqset01 = this.merge(this.merge(sqsetUL, sqsetCL, debug),
						this.merge(sqsetUC, sqsetCC, debug), debug);
				}
				let sqset11 = this.merge(sqsetBC, sqsetBR, debug);
				
				sqset = this.merge(
					this.merge(sqset00, sqset01, debug),
					this.merge(sqsetBL, sqset11, debug), debug);

			} else if(min == pbl) {

				if(debug) {
					console.log("PBL");
				}
				let sqset00 = this.merge(sqsetUL, sqsetUC, debug);
				let sqset10;
				if(p10 * p11 + p20 * p21 < p10 * p20 + p11 * p21) {
					sqset10 = this.merge(this.merge(sqsetCL, sqsetCC, debug),
						this.merge(sqsetBL, sqsetBC, debug), debug);
				} else {
					sqset10 = this.merge(this.merge(sqsetCL, sqsetBL, debug),
						this.merge(sqsetCC, sqsetBC, debug), debug);
				}
				let sqset11 = this.merge(sqsetCR, sqsetBR, debug);
				
				sqset = this.merge(
					this.merge(sqset00, sqsetUR, debug),
					this.merge(sqset10, sqset11, debug), debug);

			} else if(min == pbr) {

				if(debug) {
					console.log("PBR");
				}
				let sqset01 = this.merge(sqsetUC, sqsetUR, debug);
				let sqset10 = this.merge(sqsetCL, sqsetBL, debug);
				let sqset11;
				if(p11 * p12 + p21 * p22 < p11 * p21 + p12 * p22) {
					sqset11 = this.merge(this.merge(sqsetCC, sqsetCR, debug),
						this.merge(sqsetBC, sqsetBR, debug), debug);
				} else {
					sqset11 = this.merge(this.merge(sqsetCC, sqsetBC, debug),
						this.merge(sqsetCR, sqsetBR, debug), debug);
				}
				
				sqset = this.merge(
					this.merge(sqsetUL, sqset01, debug),
					this.merge(sqset10, sqset11, debug), debug);
			}
		} else {
			if(sqsetBC == undefined && sqsetCR != undefined) {
				// Hori 3 Vert 2
				let pl = p00 * p10;
				let pr = p02 * p12;
				debugger;

			} else if(sqsetBC != undefined && sqsetCR == undefined) {
				// Hori 2 Vert 3
				let pu = p00 * p01;
				let pb = p20 * p21;
				debugger;
				
			} else {
				if(sqsetBL != undefined) {
					// Hori 1 Vert 3
					if(p00 < p02) {
						sqset = this.merge(this.merge(sqsetUL, sqsetCL, debug), sqsetBL, debug);
					} else {
						sqset = this.merge(sqsetUL, this.merge(sqsetCL, sqsetBL, debug), debug);
					}
				} else if(sqsetCC != undefined) {
					// Hori 2 Vert 2
					if(p00 * p01 + p10 * p11 < p00 * p10 + p01 * p11) {
						sqset = this.merge(this.merge(sqsetUL, sqsetUC, debug),
							this.merge(sqsetCL, sqsetCC, debug), debug);
					} else {
						sqset = this.merge(this.merge(sqsetUL, sqsetCL, debug),
							this.merge(sqsetUC, sqsetCC, debug), debug);
					}
				} else if(sqsetUR != undefined) {
					// Hori 3 Vert 1
					if(p00 < p20) {
						sqset = this.merge(this.merge(sqsetUL, sqsetCL, debug), sqsetBL, debug);
					} else {
						sqset = this.merge(sqsetUL, this.merge(sqsetCL, sqsetBL, debug), debug);
					}
				} else {
					if(sqsetCL != undefined) {
						// Hori 1 Vert 2
						sqset = this.merge(sqsetUL, sqsetCL, debug);
					} else if(sqsetUC != undefined) {
						// Hori 2 Vert 1
						sqset = this.merge(sqsetUL, sqsetUC, debug);
					} else if(sqsetUL != undefined){
						// Hori 1 Vert 1
						sqset = sqsetUL;
					} else {
						throw new Error(`Empty SQSet, at ${offsetX}, ${offsetY}`);
					}
				}					
			}
		}

		if(debug) {
			debugger;
			console.clear();
		}
		return sqset;
		
	};
	SQSO.prototype.evaluate = function(sizeX, sizeY, values) {
		let BORDER = [0.1, 0.5, 2, 0.5];
		BORDER[-1] = 3;
		let CENTER = [0.2, 0.8, 2, 0.8];
		CENTER[-1] = 5;

		let p = 1;
		let u = 0, v = 0;
		values.every((value) => {
			if(u == 0 || u == sizeX -1 || v == 0 || v == sizeY -1) {
					p *= BORDER[value];
			} else {
				p *= CENTER[value];
			}

			++u;
			if(u >= sizeX) {u = 0; ++v;}
			if(v >= sizeY) return false;
			return true;
		})
		return p;
	};
	SQSO.prototype.merge = function(sqsetA, sqsetB, debug) {
		if(!sqsetA) { debugger; throw new Error("Unable to merge empty sqset."); }
		if(!sqsetB) { return sqsetA; }

		let offsetY = Math.min(sqsetA.sqs.offsetY, sqsetB.sqs.offsetY);
		let sizeY = Math.abs(sqsetA.sqs.offsetY - sqsetB.sqs.offsetY) + sqsetB.sqs.sizeY;
		let offsetX = Math.min(sqsetA.sqs.offsetX, sqsetB.sqs.offsetX);
		let sizeX = Math.abs(sqsetA.sqs.offsetX - sqsetB.sqs.offsetX) + sqsetB.sqs.sizeX;

		//if(debug) {
			//console.clear()
			//console.log(offsetY, sizeY, offsetX, sizeX);
		//}		

		if(!sqsetA || !sqsetB) {
			console.log("NULL");
		}
		
		let sqset = new SQSET(this.getRegion(offsetX, offsetY, sizeX, sizeY));

		if(sqsetA.solutions.size <= 0 || sqsetB.solutions.size <= 0) {
			return;
		}

		if(debug) {
			console.log("Merging:");
			console.log(sqsetA);
			console.log(sqsetB);
		}
		let isHori = (sqsetA.sqs.offsetY - sqsetB.sqs.offsetY) == 0;


		//if(sqsetA.solutions.length * sqsetB.solutions.length > 50000) {debugger;}
		//console.clear();
		let consoleCount = 0;
		for(let u = 0; u < sqsetA.solutions.length; u++) {
			for(let v = 0; v < sqsetB.solutions.length; v++) {

				// if(debug)
					console.log("(", offsetX, ", ", offsetY, "), ", sizeX, "x", sizeY, ", SQSetA", u, "/" , sqsetA.solutions.length, "SQSetB", v , "/", sqsetB.solutions.length);
				
				++consoleCount;
				if(consoleCount > 10000) { console.clear(); consoleCount = 0; }


				// TODO: improve the merging algorithm.
				//let l = SQSS.restoreSQS(sqsetA.solutions[u], sqsetA.sqs.offsetX, sqsetA.sqs.offsetY, sqsetA.sqs.sizeX, sqsetA.sqs.sizeY, sqsetA.sqs.values);
				//let r = SQSS.restoreSQS(sqsetB.solutions[v], sqsetB.sqs.offsetX, sqsetB.sqs.offsetY, sqsetB.sqs.sizeX, sqsetB.sqs.sizeY, sqsetB.sqs.values);
				let l  = sqsetA.solutions[u];
				let [lHori, lVert] = l.split(',');
				let r  = sqsetB.solutions[v];
				let [rHori, rVert] = r.split(',');
				let valid = true;

				if(debug) {
					let lSQS = SQSS.restoreSQS(sqsetA.solutions[u], sqsetA.sqs.offsetX, sqsetA.sqs.offsetY, sqsetA.sqs.sizeX, sqsetA.sqs.sizeY, sqsetA.sqs.values);
					let rSQS = SQSS.restoreSQS(sqsetB.solutions[v], sqsetB.sqs.offsetX, sqsetB.sqs.offsetY, sqsetB.sqs.sizeX, sqsetB.sqs.sizeY, sqsetB.sqs.values);
					lSQS.print();
					rSQS.print();
				}


				let lNumOfEdgesInRow = sqsetA.sqs.sizeX + 1;
				let lNumOfRow = lVert.length / lNumOfEdgesInRow;
				let lNumOfEdgesInColumn = sqsetA.sqs.sizeY + 1;
				let lNumOfColumn = lHori.length / lNumOfEdgesInColumn;

				let rNumOfEdgesInRow = sqsetB.sqs.sizeX + 1;
				let rNumOfRow = rVert.length / rNumOfEdgesInRow;
				let rNumOfEdgesInColumn = sqsetB.sqs.sizeY + 1;
				let rNumOfColumn = rHori.length / rNumOfEdgesInColumn;

				if(isHori) {
					if(lNumOfRow != rNumOfRow){
						valid = false;
					} else {
						for(let o = 0; o < lNumOfRow; ++o) {
							valid &= lVert[o * lNumOfEdgesInRow + lNumOfEdgesInRow - 1] == rVert[o * rNumOfEdgesInRow];
						}
					}
				} else {
					if(lNumOfColumn != rNumOfColumn) {
						valid = false;
					} else {
						for(let o = 0; o < lNumOfColumn; ++o) {
							valid &= lHori[o * lNumOfEdgesInColumn + lNumOfEdgesInColumn - 1] == rHori[o * rNumOfEdgesInColumn];
						}
					}
				}

				// if(debug)
				// 	console.log(valid);

				if(valid) {
					// Construct the new solutions.
					let cellsHori = [];
					let cellsVert = [];

					if(isHori) {
						cellsHori.push(lHori);
						cellsHori.push(rHori);
						for(let o = 0; o < lNumOfRow; ++o) {
							for(let _u = 0; _u <= sqsetA.sqs.sizeX; ++_u) {
								cellsVert.push(lVert[_u + o * lNumOfEdgesInRow]);
							}
							for(let _u = 1; _u <= sqsetB.sqs.sizeX; ++_u) {
								cellsVert.push(rVert[_u + o * rNumOfEdgesInRow]);
							}
						}
					} else {
						cellsVert.push(lVert);
						cellsVert.push(rVert);
						for(let o = 0; o < lNumOfColumn; ++o) {
							for(let _u = 0; _u <= sqsetA.sqs.sizeY; ++_u) {
								cellsHori.push(lHori[_u + o * lNumOfEdgesInColumn]);
							}
							for(let _u = 1; _u <= sqsetB.sqs.sizeY; ++_u) {
								cellsHori.push(rHori[_u + o * rNumOfEdgesInColumn]);
							}
						}
					}
					if(debug)
						console.log(cellsHori, cellsVert);

					sqss = cellsHori.map(value => '' + value).join('') + ',' + cellsVert.map(value => '' + value).join('');
					let sqs = SQSS.restoreSQS(sqss, offsetX, offsetY, sizeX, sizeY ,sqsetA.sqs.values.concat(sqsetB.sqs.values));

					let s = SQSO.verifySQS(sqs);
					if(debug) {
						sqs.print();
						console.log("Verification: ", s);
					}
					if(s) {
						sqset.try(sqss);
					}
				}
			}
		}
		if(debug) {
			console.log("Merging result:");
			console.log(sqset);
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
	SQSO.verifySQS = function(sqs) {
		let valid = true;
		// console.log(sqs.sizeX, sqs.sizeY);
		sqs.VertEach((vert) => {
			let result = vert.CountEdge();
			if(result.CONN > 2) {
				//console.warn("Multiple connection on: " + absPos(vert));
				valid = false;
				return valid;
			}
			if(result.CONN > 0 && result.CONN < 2 && result.UND == 0) {
				let left = vert.x == 0 ? 1 : 0;
				let right = vert.x == 2 * vert.sqs.sizeX ? 1 : 0;
				let top = vert.y == 0 ? 1 : 0;
				let bottom = vert.y == 2 * vert.sqs.sizeY ? 1 : 0;

				if(!left && !right && !top && !bottom) {
					valid = false;
					return valid;
				}

				if(left && !top && !bottom && 2 * vert.sqs.offsetX + vert.x == 0) {
					valid = false;
					return valid;
				}
				if(right && !top && !bottom && 2 * vert.sqs.offsetX + vert.x == 2 * so.sqs.sizeX) {
					valid = false;
					return valid;
				}
				if(top && !left && !right && 2 * vert.sqs.offsetY + vert.y == 0) {
					valid = false;
					return valid;
				}
				if(bottom && !left && !right && 2 * vert.sqs.offsetY + vert.y == 2 * so.sqs.sizeY) {
					valid = false;
					return valid;
				}

				//Border corner
				if(left && top && 2 * vert.sqs.offsetX + vert.x == 0 && 2 * vert.sqs.offsetY + vert.y == 0) {
					valid = false;
					return valid;
				}
				if(right && top && 2 * vert.sqs.offsetX + vert.x == 2 * so.sqs.sizeX && 2 * vert.sqs.offsetY + vert.y == 0) {
					valid = false;
					return valid;
				}
				if(left && bottom && 2 * vert.sqs.offsetX + vert.x == 0 && 2 * vert.sqs.offsetY + vert.y == 2 * so.sqs.sizeY) {
					valid = false;
					return valid;
				}
				if(right && bottom && 2 * vert.sqs.offsetX + vert.x == 2 * so.sqs.sizeX && 2 * vert.sqs.offsetY + vert.y == 2 * so.sqs.sizeY) {
					valid = false;
					return valid;
				}
			}
		});
		if(valid) {
			sqs.EdgeEach((edge) => {
				edge.checked = false;
			});

			let ignoreResultLoop = (sqs.sizeX == so.sqs.sizeX && sqs.sizeY == so.sqs.sizeY);
			if(!ignoreResultLoop) {
				sqs.EdgeEach((edge) => {
					if(edge.checked) return;
					if(edge.state == SQ.STATE.CONN) {
						let s = this.checkLoop(edge);
						if(s) {
							valid = false;
							return valid;
						}
					}
				});
			} else {
				let loopCount = 0;
				sqs.EdgeEach((edge) => {
					if(edge.checked) return;
					if(edge.state == SQ.STATE.CONN) {
						let s = this.checkLoop(edge);
						if(s) { ++loopCount; }
					}
				});
				if(loopCount > 1) {
					valid = false
					return valid;
				}
			}
		}
		if(valid) {
			sqs.CellEach((cell) => {
				let result = cell.CountEdge();
				if(cell.value >= 0 && result.CONN != cell.value) {
					//console.warn("Insufficient edges on: " + absPos(cell));
					valid = false;
					return valid;
				}
			});
		}
		return valid;
	};
	SQSO.checkLoop = function(edge) {
		edge.checked = true;
		//console.log(edge);
		//debugger;
		let start, end;
		for(let i in edge.Vert) {
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
		let nodeVert = start;
		let nodeEdge = edge;
		let initialCheck = start.CountEdge();
		if(initialCheck.CONN == 2) {
			while(nodeVert.id != end.id) {
				let _nodeEdge = nodeVert.getConnectedEdge(nodeEdge);
				if(_nodeEdge) {
					nodeEdge = _nodeEdge;
					nodeEdge.checked = true;
					let _nodeVert = nodeEdge.getConnectedVert(nodeVert);
					if(_nodeVert) {
						nodeVert = _nodeVert;
					} else { return false; }
				} else { return false; }
			}
			return true;
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
		console.clear();
		this.solutions.forEach((sqss) => {
			result += "-----------------\n";
			let resSQS = SQSS.restoreSQS(sqss, this.sqs.offsetX, this.sqs.offsetY, this.sqs.sizeX, this.sqs.sizeY, this.sqs.values);
			resSQS.print();

			result += "\n";
		});

		// console.log(result);
	};
	SQSO.SQSET = SQSET;

	SQ.SQSO = SQSO;
}());