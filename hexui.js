(function(){
	var HEX = window.HEX || {};
	var canvas;
	var using = function(fromClass, classNames) {
		classNames.forEach((n)=>{
			window[n] = fromClass[n];
		})
	}

	var HEXUI = function(canvasID) {

	};

	var setupPaper = function() {
		canvas = document.getElementById('canvas');
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		window.onresize = ()=>{
			paper.view.viewSize.width = canvas.width = window.innerWidth;;
			paper.view.viewSize.height = canvas.height = window.innerHeight;;
		};
		canvas.oncontextmenu = (event)=>{
			event.preventDefault();
			if(event.button == 2) {
				run();
			}
		}

		paper.setup(canvas);
		using(paper, [
			'Path',
			'Point',
			'PointText',
			'Group'
		]);
		using(HEX, [
			'HexVertCord'
		]);

		init();
		// run();
	}

	const HLEN = 40.0;
	const WHR = Math.sqrt(3)/2;
	var HexCord = function(u, v) {
		return new Point(HLEN * u + HLEN / 2 * v, -HLEN * WHR * v);
	}
	var HexCordInv = function(point) {
		var v = point.y / (-HLEN * WHR);
		var u = point.x / HLEN - v / 2;
		return new Point(u, v);
	}
	var B = -1;
	var hg = {};
	var so;
	var init = function() {

		// var values = [
		// 	  5, B, 5,
		// 	 B, B, 3, 4,
		// 	5, B, 4, 3, 5,
		// 	 B, 4, B, B,
		// 	  B, B, 4,
		// ];
		// var values = [
		// 	B, B, 3, B, 4, 3, 4, 4, 4,
		// 	4, B, B, 2, B, B, 4, 3, B, 4,
		// 	B, 4, B, B, 0, 1, B, 3, 0, B, 4,
		// 	B, 3, 4, B, 3, B, 1, 4, B, 2, 4, 3,
		// 	B, B, B, 3, B, B, B, 3, 3, 5, B, 4, 3,
		// 	B, 3, 4, B, 5, B, B, 3, 2, 4, 4, B, B, 3,
		// 	4, B, B, 4, B, 5, 3, B, 5, B, B, 5, B, 3, 3,
		// 	4, 3, B, 4, B, 3, 3, 2, 3, B, B, 4, 3, 3, 4, 4,
		// 	5, B, B, 3, 5, 4, 3, B, 3, 5, 3, 5, 4, B, 4, B, 5,
		// 	4, B, B, B, B, 2, B, 2, B, 3, 3, 3, 4, B, B, 3,
		// 	4, 2, B, B, B, 3, 1, B, 3, 3, 4, B, B, B, 5,
		// 	B, B, 3, 5, B, B, B, B, B, B, B, B, 5, 3,
		// 	5, 4, 4, 4, 4, 3, 5, 3, B, 5, 2, 3, B,
		// 	B, B, B, B, 4, 4, B, 4, B, B, B, B,
		// 	5, B, 1, B, 4, 4, B, 2, B, 4, 3,
		// 	4, B, 3, 4, B, B, B, 2, 4, B,
		// 	5, 4, 4, B, B, B, B, B, B,
		// ]
		var values = [
		5, 1, B, 4, B, B, B, B, 3, B, B, B,
		B, B, 2, B, 4, B, B, 5, B, B, 4, 4, B,
		B, 5, 5, B, B, B, B, 5, B, B, B, B, 4, B,
		B, B, B, B, B, B, 4, B, B, 4, B, 4, B, 3, 3,
		4, B, 3, B, B, 3, B, 4, 2, B, 3, 2, 3, B, B, B,
		4, 3, B, 5, B, B, 3, 4, B, 4, 3, B, 5, 4, 5, B, B,
		4, B, B, 4, 3, 3, 3, 4, B, 5, B, 2, B, B, B, B, 3, B,
		B, 4, 4, B, B, B, 3, 5, 4, 4, B, 2, B, 3, 3, 2, 4, 5, 4,
		4, 4, B, B, B, B, 4, B, B, 3, B, B, 4, B, B, B, B, B, 4, B,
		4, B, 4, B, 3, B, B, 4, B, B, 2, 4, 4, 2, 4, 4, 2, 2, B, B, B,
		B, 5, 3, 4, 4, B, 4, B, B, 5, 3, B, B, 4, 4, B, B, 1, 3, 3, 4, B,
		B, B, B, B, B, 3, B, 4, B, 5, B, B, B, 2, 4, 5, B, B, 4, B, B, 5, 4,
		4, B, B, 4, B, B, 4, B, 4, B, B, 4, B, 4, B, B, 3, 4, 3, 2, B, 3,
		3, B, 4, 5, B, 4, B, B, B, B, 4, 5, B, B, B, 4, B, B, 0, 3, B,
		B, B, B, B, 3, 5, B, B, B, B, 3, B, B, 3, B, 4, 5, B, 3, B,
		B, 4, 4, 4, B, 4, 5, B, 4, B, B, 4, 3, B, B, B, 5, B, 3,
		4, B, 3, 4, B, 3, 5, 4, B, 4, 4, 4, B, 4, 3, B, 2, 2,
		B, 3, 5, B, B, 3, B, 5, 4, 5, B, B, 3, 3, B, B, 3,
		B, 3, B, B, B, B, 5, 4, B, B, 4, 4, 4, B, 5, B,
		B, B, 4, B, 3, B, 3, 2, B, B, B, 4, 3, 4, B,
		B, 4, 5, 2, 3, 4, B, 3, 4, B, B, B, 3, 5,
		4, 4, B, 4, 4, B, B, B, B, B, B, B, 4,
		B, B, B, 3, B, 4, B, 4, B, B, 3, 5,
		];
		hg.hesh = new HEX.HESH(12, values);
		console.log(hg.hesh);
		// hg.hesh.print();
		paper.view.center = new Point(0, 0);

		hg.ui = {
			cells: {},
			edges: {},
			verts: {}
		};
		hg.hesh.CellEach(function(cell) {
			hg.ui.cells[cell.id] = createHexagon(cell);
		});
		hg.hesh.EdgeEach(function(edge) {
			hg.ui.edges[edge.id] = createEdge(edge);
		});
		hg.hesh.VertEach(function(vert) {
			hg.ui.verts[vert.id] = createVert(vert);
		});

		paper.view.onResize = function(event) {
			paper.view.center = new Point(0, 0);
		};

		so = new HEX.HEXSO(hg.hesh, hg.ui);

		window.hg = hg;
		window.so = so;
	};

	var run = function() {
		so.CheckCells();
		// if(!so.MarkZero())
		// 	// setTimeout(run, 0);
		// else {
		// 	console.log("DONE");
		// }
	};

	var createHexagon = function(cell) {
		var hex = new Path.RegularPolygon(HexCord(cell.u, cell.v), 6, HLEN/(WHR*2) + 0.5);
		// if(cell.u == 2 && cell.v == -2)
			hex.fillColor = '#F0F0F0';
		// hex.strokeColor = '#333333';

		var text = new PointText();
		if(cell.value >= 0)
			text.content = cell.value;
		text.fontSize = '1.4em';
		text.position = HexCord(cell.u, cell.v);

		var hexGroup = new Group();
		hexGroup.addChild(hex);
		hexGroup.addChild(text);

		hexGroup.onClick = (event) => {
			if(event.event.button != 0) return;

			var p = HexCordInv(event.point).subtract(new Point(cell.u, cell.v)).multiply(2).round();
			if(p.isZero()) {
				console.log("Cell");
			} else {
				var edgeID = (cell.u + p.x/2) + "," + (cell.v + p.y/2);
				cell.hesh.MarkEdge(edgeID, (edge) => {
					drawEdge(hg.ui.edges[edge.id], edge.state);
				});
			}
		}

		return hexGroup;
	};
	var createEdge = function(edge) {
		var line = new Path();
		line.moveTo(HexCord(edge.u, edge.v).add(HexCord(edge.ndir[0]*WHR/3, edge.ndir[1]*WHR/3).rotate(90)));
		line.lineTo(HexCord(edge.u, edge.v).add(HexCord(-edge.ndir[0]*WHR/3, -edge.ndir[1]*WHR/3).rotate(90)));
		line.strokeColor = 'black';
		line.strokeWidth = 2;
		line.dashArray = [6, 6];

		return line;
	}
	var drawEdge = function(line, state) {
		if(state == 1) {
			line.strokeColor = '#E91E63';
			line.strokeWidth = 3;
			line.dashArray = [];
		}
		if(state == 0) {
			line.strokeColor = '#BBBBBB';
			line.strokeWidth = 2;
			line.dashArray = [];
		}
		if(state == -1) {
			line.strokeColor = 'black';
			line.strokeWidth = 2;
			line.dashArray = [6, 6];
		}
	};
	window.drawEdge = drawEdge;

	var createVert = function(vert) {
		var pos = vert.id.split(',');
		var line = new Path.Circle(new Point(+pos[0], +pos[1]), 2);
		// line.strokeColor = 'black';
		line.strokeWidth = 1.5;

		return line;
	}

	window.onload = setupPaper;
}());