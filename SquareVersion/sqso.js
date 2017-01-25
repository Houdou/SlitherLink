(function(){
	var SQ = window.SQ || {};

	var absPos = function(ele) {
		return ele.sqs.offsetX + "," + ele.sqs.offsetY + " + "
		+ ((ele.x == undefined)?ele.u:ele.x) + "," + ((ele.y == undefined)?ele.v:ele.y);
	}

	var SQSO = function(sqs, ui) {
		this.sqs = sqs;
		this.ui = ui;

		this.subs = [];
	};
	SQSO.prototype.getRegion = function(u, v, size) {
		if(size < 1 || ~~u !== u || ~~v !== v || ~~size !== size) { throw new Error("Invalid argument"); return; }
		if(u < 0 || u >= this.sqs.size || v < 0 || v >= this.sqs.size) { throw new Error("uv index out of range"); return; }

		let values = [];
		let yCount = v + size > this.sqs.sizeY ? this.sqs.sizeY - v : size;
		let xCount = u + size > this.sqs.sizeX ? this.sqs.sizeX - u : size;

		for(let y = v; y < v + yCount; y++) {
			for(let x = u; x < u + xCount; x++) {
				values.push(this.sqs.cells[2 * y + 1][2 * x + 1].value);
			}
		}
		return new SQ.SQS(yCount, xCount, values, v, u);
	};
	SQSO.prototype.solve = function() {
		// Start from every single cell
		let size = 1;
		this.subs[size] = [];
		for(let j = 0; j < this.sqs.sizeY; j += size) {
			this.subs[size][j] = []
			for(let i = 0; i < this.sqs.sizeX; i += size) {
				if(i == 1 && j == 0)
				this.subs[size][j][i] = this.solveCell(this.getRegion(i, j, size));
			}
		}
		this.merge();
		// console.log("solved");
	};
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
			if(this.verifySQS(solution)){
				sqset.try(solution);
			}
		})
		console.log(sqset);
		return sqset;
	};
	SQSO.prototype.merge = function() {
		console.log(this.subs[1]);
	}
	SQSO.prototype.permu = function(value, total) {
		if(value > total || value < -1) {console.error("Invalid argument"); return [];}
		if(value == -1) { return this.permuAll(total); }
		if(total == 1) { return [value == 1]; }
		else if(total > 1) {
			let result = (value >= total) ? [] : this.permu(value, total-1).map(p => ([false]).concat(p));
			return result.concat((value <= 0) ? [] : this.permu(value-1, total-1).map(p => ([true]).concat(p)));
		}
	};
	SQSO.prototype.permuAll = function(total) {
		if(total == 1) { return [false, true]; }
		let result = this.permuAll(total - 1).map(p => ([false]).concat(p));
		return result.concat(this.permuAll(total-1).map(p => ([true]).concat(p)));
	}
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
				console.warn("Disconnection on: " + absPos(vert));
				// valid = false;
			}
		});
		sqs.CellEach((cell) => {
			let result = cell.CountEdge();
			if(result.CONN != cell.value) {
				console.warn("Insufficient edges on: " + absPos(cell));
				valid = false;
			}
		});
		return valid;
	};

	var SQSET = function(sqs) {
		this.sqs = sqs;
		this.solutions = [];
	};
	SQSET.prototype.try = function(solution) {
		this.solutions.push(solution);
	};
	SQSO.SQSET = SQSET;

	SQ.SQSO = SQSO;
}());