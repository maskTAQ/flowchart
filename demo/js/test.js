;
(function() {
	//在全局定义 图表 模型
	let diagram = null,
		model = null,
		$ = null;

	const diagramId = "myDiagramDiv";

	const initView = (next) => {
		$ = go.GraphObject.make; // for conciseness in defining templates

		diagram = $(go.Diagram, diagramId, {
			initialContentAlignment: go.Spot.Center,
			// 开启控制面板
			allowDrop: true,
			//当绘制线段和重置线段调用 showLinkLabel 函数,用以添加流程判断的是否字样
			"LinkDrawn": showLinkLabel,
			"LinkRelinked": showLinkLabel,
			"animationManager.duration": 800,
			"undoManager.isEnabled": true
		});

		//定义默认节点样式 模板
		// diagram.nodeTemplateMap.add('', makeNode({
		// 	shape: 'Rectangle',
		// 	width: NaN,
		// 	height: NaN,
		// 	minSize: [30, 30],
		// 	background: 'red',
		// 	color: '#000',
		// 	fontSize: '14px',
		// 	textMargin: 8,
		// }));



		//定义线条的样式
		diagram.linkTemplate =
			$(go.Link, // the whole link panel
				{
					routing: go.Link.AvoidsNodes,
					curve: go.Link.JumpOver,
					corner: 5,
					toShortLength: 4,
					relinkableFrom: true,
					relinkableTo: true,
					reshapable: true,
					resegmentable: true,
					// mouse-overs subtly highlight links:
					mouseEnter: function(e, link) {
						link.findObject("HIGHLIGHT").stroke = "rgba(30,144,255,0.2)";
					},
					mouseLeave: function(e, link) {
						link.findObject("HIGHLIGHT").stroke = "transparent";
					}
				},
				new go.Binding("points").makeTwoWay(),
				$(go.Shape, // the highlight shape, normally transparent
					{
						isPanelMain: true,
						strokeWidth: 8,
						stroke: "transparent",
						name: "HIGHLIGHT"
					}),
				$(go.Shape, // the link path shape
					{
						isPanelMain: true,
						stroke: "gray",
						strokeWidth: 2
					}),
				$(go.Shape, // the arrowhead
					{
						toArrow: "standard",
						stroke: null,
						fill: "gray"
					}),
				$(go.Panel, "Auto", // the link label, normally not visible
					{
						visible: false,
						name: "LABEL",
						segmentIndex: 2,
						segmentFraction: 0.5
					},
					new go.Binding("visible", "visible").makeTwoWay(),
					$(go.Shape, "RoundedRectangle", // the label shape
						{
							fill: "#F8F8F8",
							stroke: null
						}),
					$(go.TextBlock, "Yes", // the label
						{
							textAlign: "center",
							font: "10pt helvetica, arial, sans-serif",
							stroke: "#333333",
							editable: true
						},
						new go.Binding("text").makeTwoWay())
				)
			);


		//定义线的路由样式
		diagram.toolManager.linkingTool.temporaryLink.routing = go.Link.Orthogonal;
		diagram.toolManager.relinkingTool.temporaryLink.routing = go.Link.Orthogonal;



		//定义模型 可绘制线条的模型
		model = $(go.GraphLinksModel);

		//将节点的类型与type绑定在一起
		model.nodeCategoryProperty = 'type';

		//绑定模型到图表
		diagram.model = model;

		next && next();
	}


	const showLinkLabel = (e) => {
		var label = e.subject.findObject("LABEL");
		if (label !== null) label.visible = (e.subject.fromNode.data.figure === "Diamond");
	}


	const makeNode = (options = {
		type: '',
		shape: '',
		minSize: [30, 10],
		background: '',
		color: '',
		fontSize: '',
		textMargin: 8
	}) => {
		const nodeStyle = () => {
			const showPorts = (node, show) => {
				var diagram = node.diagram;
				if (!diagram || diagram.isReadOnly || !diagram.allowLink) return;
				node.ports.each(function(port) {
					port.stroke = (show ? "white" : null);
				});
			}

			return [
				//定义节点的样式 包括节点的位置信息 移入移出
				new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify), {
					// the Node.location is at the center of each node
					locationSpot: go.Spot.Center,
					mouseEnter: function(e, obj) {
						showPorts(obj.part, true);
					},
					mouseLeave: function(e, obj) {
						showPorts(obj.part, false);
					}
				}
			];
		}
		const makePort = (name, spot, output, input) => {
			// the port is basically just a small circle that has a white stroke when it is made visible
			return $(go.Shape, "Circle", {
				fill: "transparent",
				stroke: null, // this is changed to "white" in the showPorts function
				desiredSize: new go.Size(8, 8),
				alignment: spot,
				alignmentFocus: spot, // align the port on the main Shape
				portId: name, // declare this object to be a "port"
				fromSpot: spot,
				toSpot: spot, // declare where links may connect at this port
				fromLinkable: output,
				toLinkable: input, // declare whether the user may draw links to/from here
				cursor: "pointer" // show a different cursor to indicate potential link point
			});
		}

		const [node_width, node_height] = options.minSize;
		return $(go.Node, "Spot", nodeStyle(),
			//一个由文本构成具有形状的面板
			$(go.Panel, "Auto",
				$(go.Shape, options.shape, {
					fill: options.background,
					stroke: null,
					width: options.width,
					height: options.height
				}),
				$(go.TextBlock, {
						font: "bold " + options.fontSize + " 微软雅黑",
						stroke: options.color,
						margin: options.textMargin,
						minSize: new go.Size(node_width, node_height),
						wrap: go.TextBlock.WrapFit,
						editable: true
					},
					new go.Binding("text").makeTwoWay())
			),
			// four named ports, one on each side:
			makePort("T", go.Spot.Top, false, true),
			makePort("L", go.Spot.Left, true, true),
			makePort("R", go.Spot.Right, true, true),
			makePort("B", go.Spot.Bottom, true, false)
		);
	}


	window.smt = {
		init(options = [{
			type: 'xx',
			style: {
				shape: 'Diamond',
				width: 100,
				height: 100,
				minSize: [0, 50],
				background: 'green',
				color: '#000',
				fontSize: '18px',
				textMargin: new go.Margin(24, 0, 0, 0),
				defaultText: '方块'
			}
		}, {
			type: 'xxx',
			style: {
				shape: 'Ellipse',
				width: 100,
				height: 100,
				minSize: [0, 50],
				background: 'red',
				color: '#000',
				fontSize: '18px',
				textMargin: new go.Margin(24, 0, 0, 0),
				defaultText: '圆'
			}
		}]) {

			//先初始化视图
			initView(() => {
				//在定义自定义的节点
				this.maketemplateNode(options);
			});
			return model
		},
		maketemplateNode(options) {
			//初始化Palette 节点的数组
			let panelNodeData = [];
			options.forEach((node) => {
				//定义自定义节点样式 模板
				diagram.nodeTemplateMap.add(node.type, makeNode(node.style));
				panelNodeData.push({
					type: node.type,
					text: node.style.defaultText
				});
			});

			//把自定义节点填充到palette
			this.makePanelNode(panelNodeData);
		},
		makePanelNode(panelNodeData) {
			const palette = $(go.Palette, "myPaletteDiv", // must name or refer to the DIV HTML element
				{
					"animationManager.duration": 800, // slightly longer than default (600ms) animation
					nodeTemplateMap: diagram.nodeTemplateMap, // share the templates used by myDiagram
					model: new go.GraphLinksModel(panelNodeData)
				});

			//将控制面板的model类别(内部用作样式区分)跟mode的类别设置成一样的值
			palette.model.nodeCategoryProperty = model.nodeCategoryProperty;
		},
		getData() {
			return {
				linkDataArray: model.linkDataArray,
				nodeDataArray: model.nodeDataArray
			}
		}
	}
})();