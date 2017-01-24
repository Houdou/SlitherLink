(function(){
	// Classes
	var SQ = SQ || {};
	// Clockwise: 0 - RT, 1 - R, 2 - RB, 3 - LB, 4 - L, 5 - LT
	var DIR = [
		[2, 0, 0],
		[0, 2, 1],
		[-2, 0, 2],
		[0, -2, 3],
	];

	var STATE = {
		CONN: 1,
		IMP: 0,
		UND: -1,
		'1': 'CONN',
		'0': 'IMP',
		'-1': 'UND'
	};
	SQ.STATE = STATE;

	var IsPos = function(cell, x, y){
		return (cell.x == x && cell.y == y);
	};
	SQ.IsPos = IsPos;

	var SQS = function(sizeY, sizeX, values, offsetY, offsetX) {
		if(values.length != sizeX*sizeY) {
			throw new Error("Insufficient values");
		}
		this.sizeX = sizeX;
		this.sizeY = sizeY;
		this.values = values;
		this.cells = [];
		this.edges = new Map();
		this.verts = new Map();
		this.offsetX = offsetX == undefined ? 0 : offsetX;
		this.offsetY = offsetY == undefined ? 0 : offsetY;
		var p = 0;
		// Initialize mesh;
		for(let y = 0; y < 2 * this.sizeY + 1; y++) {
			this.cells[y] = [];
			for(let x = 0; x < 2 * this.sizeX + 1; x++) {
				this.cells[y][x] = null;
			}
		}
		// Create cells at (2x+1, 2y+1)
		for(let v = 0; v < this.sizeY; v++) {
			for(let u = 0; u < this.sizeX; u++) {
				this.cells[2 * v + 1][2 * u + 1] = new Cell(values[p++], u, v, this);
			}
		}

		// Create sqs, Cell, Vert, Connect CC, CV
		this.CellUVEach((u, v) => {
			if(!this.CellAt(u, v)) return;
			var cell = this.CellAt(u, v);
			for(let i = 0; i < DIR.length; i++) {
				var neibCell = this.CellAt(u + DIR[i][0], v + DIR[i][1]);
				if(neibCell)
					cell.setNeib(DIR[i], neibCell);

				let vertX = +(2 * cell.u + 1 + (DIR[i][0] + DIR[(i+3)%4][0]) / 2);
				let vertY = +((2 * cell.v + 1 + (DIR[i][1] + DIR[(i+3)%4][1]) / 2));
				let vertID = vertX + ',' + vertY;

				// console.log(DIR[i]);
				// console.log(DIR[(i+3)%4]);
				// console.log((DIR[i][1] + DIR[(i+3)%4][1]) / 2);
				// console.log(u, v, i, vertID);
				if(!this.verts.has(vertID)) {
					let vert = new Vert(vertID, this);
					this.cells[vertY][vertX] = vert;
					this.verts.set(vertID, vert);
				}
				cell.setVert(DIR[i], this.verts.get(vertID));
			}
		});
		// Create Edge, Connect EV, VE
		this.CellEach((cell) => {
			for(let i = 0; i < DIR.length; i++) {
				let edgeX = +(2 * cell.u + 1 + DIR[i][0]/2);
				let edgeY = +(2 * cell.v + 1 + DIR[i][1]/2);
				var edgeID = edgeX + "," + edgeY;
				if(!this.edges.has(edgeID)) {
					let edge = new Edge(edgeID, DIR[i%2], this);
					this.cells[edgeY][edgeX] = edge;
					this.edges.set(edgeID, edge);
				}
				cell.setEdge(DIR[i], this.edges.get(edgeID));

				// console.log(edgeID);
				// console.log(cell.Vert[i]);
				// console.log(cell.Vert[(i+1)%4]);
				this.edges.get(edgeID).setVert(cell.Vert[i]);
				cell.Vert[i].setEdge(this.edges.get(edgeID));

				this.edges.get(edgeID).setVert(cell.Vert[(i+1)%4]);
				cell.Vert[(i+1)%4].setEdge(this.edges.get(edgeID));
			}
		});
		// Count VE
		this.VertEach((vert) => {
			var count = 0;
			for(var i in vert.Edge) { ++count; }
			vert.EdgeCount = count;
		});
	};
	SQS.prototype.print = function() {
		var str = "";
		for(let y = 0; y < this.sizeY; y++) {
			for(let x = this.sizeX; x < this.sizeX; x++) {
				str += (this.cells[2 * y + 1][2 * x + 1].value + " ");
			}
			str += "\n";
		}
		console.log(str);
	};
	// Cell
	SQS.prototype.CellEach = function(f) {
		for(let y = 0; y < this.sizeY; y++) {
			for(let x = 0; x < this.sizeX; x++) {
				f(this.cells[2*y+1][2*x+1]);
			}
		}
	};
	SQS.prototype.CellUVEach = function(f) {
		for(let y = 0; y < this.sizeY; y++) {
			for(let x = 0; x < this.sizeX; x++) {
				f(x, y);
			}
		}
	};
	SQS.prototype.CellAt = function(u, v) {
		if(!this.cells[2 * v + 1] || !this.cells[2 * v + 1][2 * u + 1])
			return null;
		return this.cells[2 * v + 1][2 * u + 1];
	};
	// Edge
	SQS.prototype.EdgeEach = function(f) {
		for(let [edgeID, e] of this.edges) {
			f(e);
		}
	};
	SQS.prototype.ToggleEdge = function(edgeID, callback) {
		if(this.edges.get(edgeID)) {
			--this.edges.get(edgeID).state;
			if(this.edges.get(edgeID).state < -1)
				this.edges.get(edgeID).state = 1;
			if(callback) {
				callback(this.edges.get(edgeID));
			}
		}
	};
	// Vert
	SQS.prototype.VertEach = function(f) {
		for(let [vertID, v] of this.verts) {
			f(v);
		}
	}
	SQ.SQS = SQS;

	var Cell = function(value, u, v, sqs) {
		this.value = value;
		this.id = u + ',' + v;
		this.u = u;
		this.v = v;
		this.sqs = sqs;
		this.Edge = [];
		this.Vert = [];
		this.Neib = [];
		this.full = (value == 0)?true:false;
	};
	Cell.prototype.setNeib = function(dir, cell) {
		this.Neib[dir[2]] = cell;
		if(cell)
			cell.Neib[(dir[2] + 2)%4] = this;
	};
	Cell.prototype.setEdge = function(dir, edge) {
		this.Edge[dir[2]] = edge;
	};
	Cell.prototype.setVert = function(dir, vert) {
		this.Vert[dir[2]] = vert;
	};
	// Query
	Cell.prototype.CountEdge = function() {
		var result = { CONN: 0, IMP: 0, UND: 0, ALL: this.Edge.length };
		for(var i in this.Edge) {
			result[STATE[this.Edge[i].state]]++;
		}
		if((result.CONN == this.value) || (result.UND == 0)) {
			this.full = true;
		}
		return result;
	};
	Cell.prototype.FindEdgeInState = function(state) {
		var result = [];
		for(var i in this.Edge) {
			if(this.Edge[i].state == state) {
				result.push(this.Edge[i]);
			}
		}
		return result;
	};
	Cell.prototype.IsEdgeContained = function(edge) {
		var contained = false;
		this.Edge.forEach((e) => {
			if(e.id == edge.id)
				contained = true;
		});
		return contained;
	}
	SQ.Cell = Cell;

	var Edge = function(id, ndir, sqs) {
		var pos = id.split(',');
		this.x = +pos[0];
		this.y = +pos[1];
		this.id = id;
		this.state = STATE.UND;
		this.ndir = ndir;
		this.Vert = [];
		this.sqs = sqs;
	};
	Edge.prototype.setVert = function(vert) {
		this.Vert[vert.id] = vert;
	};
	Edge.prototype.getConnectedVert = function(vert) {
		var valid = false;
		var _vert;
		for(var i in this.Vert) {
			if(vert.id == i)
				valid = true;
			else {
				_vert = this.Vert[i];
			}
		}
		return valid?_vert:null;
	}
	SQ.Edge = Edge;

	var Vert = function(id, sqs) {
		var pos = id.split(',');
		this.x = +pos[0];
		this.y = +pos[1];
		this.id = id;
		this.Edge = [];
		this.EdgeCount = 0;
		this.sqs = sqs;
	};
	Vert.prototype.setEdge = function(edge) {
		this.Edge[edge.id] = edge;
	};
	// Query
	Vert.prototype.CountEdge = function() {
		var result = { CONN: 0, IMP: 0, UND: 0, ALL: this.EdgeCount };
		for(var i in this.Edge) {
			result[STATE[this.Edge[i].state]]++;
		}
		return result;
	};
	Vert.prototype.FindEdgeInState = function(state) {
		var result = [];
		for(var i in this.Edge) {
			if(this.Edge[i].state == state) {
				result.push(this.Edge[i]);
			}
		}
		return result;
	};
	Vert.prototype.getConnectedEdge = function(edge) {
		var result = this.CountEdge();
		if(result.CONN == 2) {
			var valid = false;
			var _edge;
			this.FindEdgeInState(SQ.STATE.CONN).forEach((e) => {
				if(e.id == edge.id)
					valid = true;
				else
					_edge = e;
			});
			return valid?_edge:null;
		} else {
			return null;
		}
	}
	SQ.Vert = Vert;

	window.SQ = SQ;
}());