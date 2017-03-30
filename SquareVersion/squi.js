(function(){
	var SQ = window.SQ || {};
	var canvas;
	var using = function(fromClass, classNames) {
		classNames.forEach((n)=>{
			window[n] = fromClass[n];
		})
	}

	var SQUI = function(canvasID, width, height) {
		this.canvas = document.getElementById(canvasID);
		canvas.width = window.innerWidth * width;
		canvas.height = window.innerHeight * height;

	};

	var setupPaper = function() {
		canvas = document.getElementById('canvas');
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight * 0.5;
		window.onresize = ()=>{
			paper.view.viewSize.width = canvas.width = window.innerWidth;
			paper.view.viewSize.height = canvas.height = window.innerHeight * 0.5;
		};
		canvas.oncontextmenu = (event)=>{
			event.preventDefault();
			if(event.button == 2) {
				console.clear();
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
		using(SQ, [
			'HexVertCord'
		]);

		init();
		run();
	}

	const SLEN = 32.0;
	var B = -1;
	var sq = {};
	var so;
	var SQCord = function(x, y) {
		return new Point(SLEN * x, SLEN * y);
	}
	var SQCordUV = function(u, v) {
		return new Point(SLEN * (2 * u + 1), SLEN * (2 * v + 1));
	}

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


		// var values = [
		// 2, 2, 2, B, B, 2, B,
		// B, 2, 2, B, B, B, 3,
		// B, B, B, 3, B, 0, B,
		// B, 2, 0, B, B, 1, B,
		// 2, B, B, 3, B, B, 3,
		// B, 2, 2, B, 3, B, 3,
		// 3, B, B, B, B, 2, B
		// ];
		
		// var values = [
		// 3, B, B, B, 1, B, 2,
		// B, 2, B, 1, B, 1, 3,
		// 3, 0, 2, 2, B, B, 2,
		// B, B, B, B, 1, 2, 3,
		// 3, B, B, B, B, B, 2,
		// B, B, B, B, 2, B, B,
		// 3, B, B, 3, 1, B, 3,
		// ];
		var values = [
		3, B, 2, B, B, 2, B, 2, 1, 1, B, B, B, B, B, B, B, 2, 3, B, B, 3, B, B, 2,
		B, B, B, 2, B, B, 2, 2, B, 2, 2, B, B, 1, B, B, 1, B, B, B, 1, 0, B, B, 2,
		B, 0, 2, 2, B, 1, B, 2, 2, 2, B, B, 2, B, 2, 3, 1, B, 1, B, 2, 2, B, B, B,
		B, 3, B, B, B, 1, B, 2, B, 2, B, 3, B, B, B, B, B, B, 2, B, B, B, B, B, 3,
		2, B, B, 2, 2, B, B, 2, 2, B, 2, B, B, 2, B, 2, B, 3, 1, B, B, B, B, 2, B,
		B, B, B, 2, B, 2, B, B, B, 2, B, 3, B, 2, B, 1, 1, B, 1, 1, B, 3, B, B, B,
		B, 2, 3, 1, B, B, 2, B, B, B, 1, B, B, 1, 3, B, B, 2, B, 2, 1, B, 0, 2, B,
		B, B, 3, B, B, 2, 2, B, B, B, B, 1, 2, B, 2, B, B, 1, B, 2, B, 3, 3, B, 3,
		2, 2, B, 3, B, 2, B, B, 2, 1, B, 1, B, 1, B, 3, B, 3, B, 2, B, B, B, B, B,
		B, B, B, B, B, 2, B, B, B, 3, 2, B, 3, 1, 2, B, B, B, 0, B, 2, B, 2, B, B,
		B, B, 1, 3, B, B, 3, B, B, 3, B, B, 2, B, B, B, B, B, 3, 2, B, B, 1, 3, B,
		2, B, 2, B, B, 1, B, B, B, 2, 0, B, B, B, 2, B, B, 1, B, B, B, B, 2, 3, B,
		B, B, 1, 1, 1, B, 3, B, 2, 2, B, 3, B, B, B, B, 2, B, B, 2, B, B, B, B, B,
		B, 3, B, 2, B, B, 1, B, 2, 2, B, B, B, 3, 3, 3, B, 3, B, 3, B, 2, B, 3, 2,
		3, 2, B, 2, 2, 3, B, 1, B, B, 2, B, 1, B, B, B, 2, B, B, 1, 2, B, B, 0, 2,
		B, 1, 2, B, 2, B, B, 2, B, 3, B, B, 3, 2, B, B, 2, B, B, B, B, B, 2, 2, B,
		B, 1, B, B, B, 2, 3, B, 2, 1, B, B, 2, B, B, 1, B, B, B, 3, B, 2, 1, B, 1,
		3, B, B, 2, B, B, 2, 1, B, B, B, 2, 3, B, 2, 1, 2, B, B, B, B, 1, 3, B, 1,
		B, B, B, B, B, 2, 3, 3, 2, 2, 2, 3, 1, 1, 1, B, 2, B, B, 3, 2, B, B, 2, 3,
		1, B, B, 2, 1, B, B, B, B, B, B, B, B, B, 2, B, B, 2, B, 1, B, 3, B, 2, B,
		2, 0, B, 3, B, 3, B, 3, B, 1, B, 3, 2, B, B, B, B, B, B, B, B, B, B, B, B,
		2, B, 2, 2, 1, B, B, B, B, 2, 2, 2, 0, 2, B, B, 2, 3, 2, 2, B, 2, B, 3, B,
		2, B, B, 2, B, 1, B, 2, 3, B, 2, B, B, B, 2, 2, 2, 2, B, B, 3, B, 3, B, 2,
		B, B, B, 2, 1, B, B, 1, 2, B, B, B, B, B, B, B, 2, B, B, B, B, B, 1, B, B,
		B, 2, 2, B, 3, 3, 2, B, B, B, 2, B, 2, 3, B, B, B, 2, 2, B, 3, 1, B, B, 3,
		];
		let size = Math.sqrt(values.length);
		sq.sqs = new SQ.SQS(size, size, values);
		// console.log(sq.sqs);
		// sq.sqs.print();
		paper.view.center = new Point(size * SLEN, size * SLEN);

		sq.ui = {
			cells: {},
			edges: {},
			verts: {}
		};
		sq.sqs.CellEach(function(cell) {
			sq.ui.cells[cell.id] = createSquare(cell);
		});
		sq.sqs.EdgeEach(function(edge) {
			sq.ui.edges[edge.id] = createEdge(edge);
		});
		sq.sqs.VertEach(function(vert) {
			sq.ui.verts[vert.id] = createVert(vert);
		});

		paper.view.onResize = function(event) {
			paper.view.center = new Point(size * SLEN, size * SLEN);
		};

		so = new SQ.SQSO(sq.sqs, sq.ui);

		window.sq = sq;
		window.so = so;
	};

	var run = function() {
		so.solve();
	};

	var createSquare = function(cell) {
		let square = new Path.RegularPolygon(SQCordUV(cell.u, cell.v), 4, 1.5 * SLEN);
		// if(cell.u == 2 && cell.v == 2)
			square.fillColor = '#E0E0E0';
		// console.log(square.fillColor);
		// square.strokeColor = '#333333';

		let text = new PointText();
		if(cell.value >= 0)
			text.content = cell.value;
		text.fontFamily = "Helvetica";
		text.fontSize = '1.6em';
		text.position = SQCordUV(cell.u, cell.v);

		let squareGroup = new Group();
		squareGroup.addChild(square);
		squareGroup.addChild(text);

		squareGroup.onClick = (event) => {
			if(event.event.button != 0) return;

			let p = event.point.subtract(SQCordUV(cell.u, cell.v)).multiply(0.9/SLEN).round();
			if(p.isZero()) {
				console.log("Cell");
			} else {
				var edgeID = (2 * cell.u + 1 + p.x) + "," + (2 * cell.v + 1 + p.y);
				console.log(edgeID);
				cell.sqs.ToggleEdge(edgeID, (edge) => {
					drawEdge(sq.ui.edges[edge.id], edge.state);
				});
			}
		}

		return squareGroup;
	};
	var createEdge = function(edge) {
		let line = new Path();
		line.moveTo(SQCord(edge.x, edge.y).add(SQCord(edge.ndir[0]/2, edge.ndir[1]/2).rotate(90)));
		line.lineTo(SQCord(edge.x, edge.y).add(SQCord(-edge.ndir[0]/2, -edge.ndir[1]/2).rotate(90)));
		line.strokeColor = 'black';
		line.strokeWidth = 2;
		line.dashArray = [6, 6];

		line.onClick = (event) => {
			if(event.event.button != 0) return;
			edge.sqs.ToggleEdge(edge.id, (edge) => {
				drawEdge(sq.ui.edges[edge.id], edge.state);
			})
		}

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