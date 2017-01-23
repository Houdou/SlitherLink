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

	const SLEN = 40.0;
	var B = -1;
	var sg = {};
	var so;
	var SQCord = function(x, y) {
		return new Point(SLEN * x, SLEN * y);
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
		var values = [
		4, B, 2, B,
		3, B, B, 4,
		B, 2, 4, 4,
		5, 3, B, B,
		];
		sg.sqs = new SQ.SQS(4, values);
		console.log(sg.sqs);
		// sg.sqs.print();
		paper.view.center = new Point(0, 0);

		sg.ui = {
			cells: {},
			edges: {},
			verts: {}
		};
		sg.sqs.CellEach(function(cell) {
			sg.ui.cells[cell.id] = createSquare(cell);
		});
		sg.sqs.EdgeEach(function(edge) {
			sg.ui.edges[edge.id] = createEdge(edge);
		});
		sg.sqs.VertEach(function(vert) {
			sg.ui.verts[vert.id] = createVert(vert);
		});

		paper.view.onResize = function(event) {
			paper.view.center = new Point(0, 0);
		};

		so = new HEX.HEXSO(sg.sqs, sg.ui);

		window.sg = sg;
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

	var createSquare = function(cell) {
		var square = new Path.RegularPolygon(SQCord(cell.x, cell.y), 4, SLEN);
		// if(cell.x == 2 && cell.y == -2)
			square.fillColor = '#F0F0F0';
		// square.strokeColor = '#333333';

		var text = new PointText();
		if(cell.value >= 0)
			text.content = cell.value;
		text.fontSize = '1.4em';
		text.position = SQCord(cell.x, cell.y);

		var squareGroup = new Group();
		squareGroup.addChild(square);
		// hexGroup.addChild(text);

		// hexGroup.onClick = (event) => {
		// 	if(event.event.button != 0) return;

		// 	var p = SQCordInv(event.point).subtract(new Point(cell.x, cell.y)).multiply(2).round();
		// 	if(p.isZero()) {
		// 		console.log("Cell");
		// 	} else {
		// 		var edgeID = (cell.x + p.x/2) + "," + (cell.y + p.y/2);
		// 		cell.sqs.MarkEdge(edgeID, (edge) => {
		// 			drawEdge(sg.ui.edges[edge.id], edge.state);
		// 		});
		// 	}
		// }

		return hexGroup;
	};
	var createEdge = function(edge) {
		var line = new Path();
		line.moveTo(SQCord(edge.x, edge.y).add(SQCord(edge.ndir[0]*WHR/3, edge.ndir[1]*WHR/3).rotate(90)));
		line.lineTo(SQCord(edge.x, edge.y).add(SQCord(-edge.ndir[0]*WHR/3, -edge.ndir[1]*WHR/3).rotate(90)));
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