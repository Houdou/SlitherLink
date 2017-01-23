(function(){
	// Classes
	var HEX = HEX || {};
	// Clockwise: 0 - RT, 1 - R, 2 - RB, 3 - LB, 4 - L, 5 - LT
	var DIR = [
		[0, 1, 0],
		[1, 0, 1],
		[1, -1, 2],
		[0, -1, 3],
		[-1, 0, 4],
		[-1, 1, 5]
	];
	const WHR = Math.sqrt(3)/2;
	var HexVertCord = function(u, v, d) {
		var HLEN = 40;
		var du = DIR[d][1] * WHR/3;
		var dv = -DIR[d][0] * WHR/3;
		var x = HLEN * u + HLEN / 2 * v - HLEN * 2 * WHR * dv;
		var y = -HLEN * WHR * v - HLEN * 2 * du + HLEN * dv;
		return {
			x: (Math.round(x*100)/100),
			y: (Math.round(y*100)/100),
		};
	};
	HEX.HexVertCord = HexVertCord;

	var IsPos = function(cell, u, v){
		return (cell.u == u && cell.v == v);
	};
	HEX.IsPos = IsPos;

	var HESH = function(size, values) {
		if(values.length != 3*size*size - 3*size + 1) {
			throw new Error("Insufficient values");
		}

		this.size = size;
		this.cells = [];
		this.edges = [];
		this.verts = [];
		var p = 0;
		for(let y = 0; y < 2 * this.size - 1; y++) {
			this.cells[y] = [];
			for(let x = Math.max(this.size - y - 1, 0);
				x < Math.min(2 * this.size - 1, 3 * this.size - 2 - y); x++) {
					this.cells[y][x] = new Cell(values[p++], x - size + 1, y -size + 1, this);
				// console.log(x, y);
			}
		}

		// Create hesh, Cell, Vert, Connect CC, CV
		this.CellUVEach((u, v) => {
			if(!this.CellAt(u, v)) return;
			var cell = this.CellAt(u, v);
			for(let i = 0; i < DIR.length; i++) {
				var neibCell = this.CellAt(u + DIR[i][0], v + DIR[i][1]);
				if(neibCell)
					cell.setNeib(DIR[i], neibCell);

				var p = HexVertCord(u, v, i);
				var vertID = p.x + ',' + p.y;
				if(!this.verts[vertID]) {
					this.verts[vertID] = new Vert(vertID);
				}
				cell.setVert(DIR[i], this.verts[vertID]);
			}
		});
		// Create Edge, Connect EV, VE
		this.CellEach((cell) => {
			for(let i = 0; i < DIR.length; i++) {
				var edgeID = (cell.u + DIR[i][0]/2) + "," + (cell.v + DIR[i][1]/2);
				if(!this.edges[edgeID]) {
					var edge = new Edge(edgeID, DIR[i%3]);
					this.edges[edgeID] = edge;
				}
				cell.setEdge(DIR[i], this.edges[edgeID]);

				// console.log(edgeID);
				// console.log(cell.Vert[i]);
				// console.log(cell.Vert[(i+1)%6]);
				this.edges[edgeID].setVert(cell.Vert[i]);
				cell.Vert[i].setEdge(this.edges[edgeID]);

				this.edges[edgeID].setVert(cell.Vert[(i+1)%6]);
				cell.Vert[(i+1)%6].setEdge(this.edges[edgeID]);
			}
		});
		// Count VE
		this.VertEach((vert) => {
			var count = 0;
			for(var i in vert.Edge) { ++count; }
			vert.EdgeCount = count;
		});
	};
	HESH.prototype.print = function() {
		var str = "";
		for(let y = 0; y < 2 * this.size - 1; y++) {
			for(let x = Math.max(this.size - y - 1, 0);
				x < Math.min(2 * this.size - 1, 3 * this.size - 2 - y); x++) {
				str += (this.cells[y][x].value + " ");
			}
			str += "\n";
		}
		console.log(str);
	};
	// Cell
	HESH.prototype.CellEach = function(f) {
		for(let y = 0; y < 2 * this.size - 1; y++) {
			for(let x = Math.max(this.size - y - 1, 0);
				x < Math.min(2 * this.size - 1, 3 * this.size - 2 - y); x++) {
					f(this.cells[y][x]);
			}
		}
	};
	HESH.prototype.CellUVEach = function(f) {
		for(let y = 0; y < 2 * this.size - 1; y++) {
			for(let x = Math.max(this.size - y - 1, 0);
				x < Math.min(2 * this.size - 1, 3 * this.size - 2 - y); x++) {
					f(x - this.size + 1, y - this.size + 1);
			}
		}
	};
	HESH.prototype.CellAt = function(u, v) {
		if(!this.cells[v + this.size - 1] || !this.cells[v + this.size - 1][u + this.size - 1])
			return null;
		return this.cells[v + this.size - 1][u + this.size - 1];
	};
	// Edge
	HESH.prototype.EdgeEach = function(f) {
		for(var e in this.edges) {
			f(this.edges[e]);
		}
	};
	HESH.prototype.MarkEdge = function(edgeID, callback) {
		if(this.edges[edgeID]) {
			--this.edges[edgeID].state;
			if(this.edges[edgeID].state < -1)
				this.edges[edgeID].state = 1;
			if(callback) {
				callback(this.edges[edgeID]);
			}
		}
	};
	// Vert
	HESH.prototype.VertEach = function(f) {
		for(var v in this.verts) {
			f(this.verts[v]);
		}
	}
	HEX.HESH = HESH;

	var Cell = function(value, u, v, hesh) {
		this.value = value;
		this.id = u + ',' + v;
		this.u = u;
		this.v = v;
		this.hesh = hesh;
		this.Edge = [];
		this.Vert = [];
		this.Neib = [];
		this.full = (value == 0)?true:false;
	};
	Cell.prototype.setNeib = function(dir, cell) {
		this.Neib[dir[2]] = cell;
		if(cell)
			cell.Neib[(dir[2] + 3)%6] = this;
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
	HEX.Cell = Cell;

	var STATE = {
		CONN: 1,
		IMP: 0,
		UND: -1,
		'1': 'CONN',
		'0': 'IMP',
		'-1': 'UND'
	};
	HEX.STATE = STATE;

	var Edge = function(id, ndir) {
		var pos = id.split(',');
		this.u = +pos[0];
		this.v = +pos[1];
		this.id = id;
		this.state = STATE.UND;
		this.ndir = ndir;
		this.Vert = [];
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
	HEX.Edge = Edge;

	var Vert = function(id) {
		var pos = id.split(',');
		this.x = +pos[0];
		this.y = +pos[1];
		this.id = id;
		this.Edge = [];
		this.EdgeCount = 0;
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
			this.FindEdgeInState(HEX.STATE.CONN).forEach((e) => {
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
	HEX.Vert = Vert;

	window.HEX = HEX;
}());