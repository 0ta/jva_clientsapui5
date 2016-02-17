jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("sap.ui.core.format.DateFormat");

sap.ui.core.mvc.Controller.extend("sap.ags.jvap.view.BlockPointAnalysis", {
	_oDevicewidth : 0,
	_oMarginFromLeft : 0,
	_oJsonModel : null,
	_fLineFunction : d3.svg.line().x(function(d) {
		return d.x;
	}).y(function(d) {
		return d.y;
	}).interpolate("linear"),
	_fCriteriaColor : function(d) {
		var ret = "#848f94";
		if (d > 50) {
			ret = "#d14900";
		} else if (d > 10) {
			ret = "#007833";
		}
		return ret;
	},
	_oTargetFirstPriorityPosition : {
		S1: "p2",
		S2: "p2",
		S3: "p2",
		S4: "p5",
		S5: "p5",
		S6: "p5"
	},
	_oColorForPosition : {
		p1: "gold",
		p2: "navy",
		p3: "green",
		p4: "pink",
		p5: "navy",
		p6: "green"
	},
	_oSelectedReceiverNumPosition_S1 : null,
	_oSelectedReceiverNumPosition_S2 : null,
	_oSelectedReceiverNumPosition_S3 : null,
	_oSelectedReceiverNumPosition_S4 : null,
	_oSelectedReceiverNumPosition_S5 : null,
	_oSelectedReceiverNumPosition_S6 : null,
	_oSVG_S1 : null,
	_oSVG_S2 : null,
	_oSVG_S3 : null,
	_oSVG_S4 : null,
	_oSVG_S5 : null,
	_oSVG_S6 : null,	
	_oCurrentSelectedRotation : "S1",
	_oUniformNumber : {},
	_oThrasholdForWarningMark : 70,
	_oDateFormat : null,
	_oTimeStampLabel : null,
	_oIsAutoPlayMode : true,
	_oIsAutoPlayModeBtn : null,
	_oResultDisplayPopOver : null,
	
	onInit : function() {
		// Preparation for this page
		this._oView = this.getView();
		this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
		this._oResourceBundle = this._oComponent.getModel("i18n").getResourceBundle();
		this._oRouter = this._oComponent.getRouter();
//		if (sap.ui.Device.system.tablet || sap.ui.Device.system.phone) {
//			this.oDevicewidth = window.parent.screen.height;
//		} else {
//			this.oDevicewidth = window.parent.screen.width;
//		}
		if (window.parent.screen.height > window.parent.screen.width) {
			this.oDevicewidth = window.parent.screen.height;
		} else {
			this.oDevicewidth = window.parent.screen.width;
		}
		this._oMarginFromLeft = (this.oDevicewidth - 900) / 2;

		// set first priority position
		this._oSelectedReceiverNumPosition_S1 = this._oTargetFirstPriorityPosition.S1;
		this._oSelectedReceiverNumPosition_S2 = this._oTargetFirstPriorityPosition.S2;
		this._oSelectedReceiverNumPosition_S3 = this._oTargetFirstPriorityPosition.S3;
		this._oSelectedReceiverNumPosition_S4 = this._oTargetFirstPriorityPosition.S4;
		this._oSelectedReceiverNumPosition_S5 = this._oTargetFirstPriorityPosition.S5;
		this._oSelectedReceiverNumPosition_S6 = this._oTargetFirstPriorityPosition.S6;
		
		// AutoPlayMode button
		this._oIsAutoPlayModeBtn = this.byId("autoPlayBtnID");
		
		// Default model settings
		var oBaseJsonModel = new sap.ui.model.json.JSONModel({
			result : {
				"score" : "0 - 0"
			}
		});
		this._oView.setModel(oBaseJsonModel);
		this._oView.bindElement("/result");
		this._oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
			pattern : "YYYY/MM/dd HH:mm:ss"
		}, new sap.ui.core.Locale("en-US"));
		this._oTimeStampLabel = this.byId("timestamp-lbl");
		this._oTimeStampLabel.setText(this._oDateFormat.format(new Date()));
		
		var me = this;
		//var url = "ws://" + location.host + "/zjva/BPR";
		var url = "ws://127.0.0.1:8080/zjva/BPR";
		var ws = new WebSocket(url);
		ws.onmessage = function(receive) {
			alert(receive.data);
			me._bindResult2ViewFromWebSocket(receive.data);
			me._oTimeStampLabel.setText(me._oDateFormat.format(new Date()));
		};
		ws.onclose = function(event) {
			var dialog = new sap.m.Dialog({
				title: 'Warning',
				type: 'Message',
				state: 'Warning',
				content: new sap.m.Text({
					text: 'Tomcatとの接続が破棄されました。F5ボタンを押下することで接続が復旧します。F5ボタンを押下しても接続が復旧しない場合は、Tomcatがダウンしている可能性があります。'
				}),
				beginButton: new sap.m.Button({
					text: 'OK',
					press: function () {
					  dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});
			dialog.open();
		};
	},

	onAfterRendering : function() {
		$('#fullpage').fullpage({
			slidesNavigation : true
		});
		for (var i = 1; i < 7; i++) {
			var idName = "#s" + i + "graph";
			var svg = d3.select(idName).append("svg").attr("width", this.oDevicewidth).attr("height", 550);
			this["_oSVG_" + "S" + i] = svg;
			this._svgHeaderRendering(svg, "S" + i);
			this._svgGraphRendering(svg, "S" + i);		
		}
	},
	
	_svgHeaderRendering : function(svg, rotation) {
		var me = this;
		var rrates = [ "0.00", "0.00", "0.00", "0.00", "0.00" ];
		// Base header container
		svg.append("rect").attr("x", 0).attr("y", 0).attr("width", this.oDevicewidth).attr("height", 150).attr("stroke", "white").attr("fill", "white");
		// Header container Group
		var svgHeaderContainer = svg.append("g").attr("transform", "translate(" + this._oMarginFromLeft + ", 0)");
		// Default Position Mark circle
		svgHeaderContainer.append("g").selectAll("circle").data(rrates).enter().append("circle").attr("cx",  function(d, i) {
			return 200 * i - 30;
		}).attr("cy", 25).attr("r", 18).attr("fill", "white").attr("stroke", "orange").attr("stroke-width", "2")
		.attr("visibility", function(d, i) {
			var currentPosition = "p" + (i + 2);
			if (me._oTargetFirstPriorityPosition[rotation] === currentPosition) {
				return "visible";
			}
			return "hidden";
		});
		// Position circle
		svgHeaderContainer.append("g").selectAll("circle").data(rrates).enter().append("circle").attr("cx",  function(d, i) {
			return 200 * i - 30;
		}).attr("cy", 25).attr("r", 15).attr("fill", "orange");
		// Position text
		svgHeaderContainer.append("g").selectAll("text").data(rrates).enter().append("text").text(function(d, i) {
			return "P" + (i + 2);
		}).attr("x",  function(d, i) {
			return 200 * i - 39;
		}).attr("y", 31).attr("fill", "white");
		// R rate percentage
		svgHeaderContainer.append("g").attr("class", "headercontainer_rrate_g").selectAll("text").data(rrates).enter().append("text").text(function(d) {
			return d;
		}).attr("x", function(d, i) {
			return 200 * i;
		}).attr("y", function(d, i) {
			return 70;
		}).attr("font-size", "35px").attr("fill", function(d, i) {
			return me._fCriteriaColor(d);
		});
		// R rate percentage unit
		svgHeaderContainer.append("g").selectAll("text").data(rrates).enter().append("text").text("R%").attr("x", function(d, i) {
			return 200 * i + 80;
		}).attr("y", function(d, i) {
			return 70;
		}).attr("font-size", "13px").attr("fill", function(d, i) {
			return me._fCriteriaColor(d);
		});
		// hit ratio Warning
		svgHeaderContainer.append("g").attr("class", "headercontainer_warningmark_g").selectAll("text").data(rrates).enter().append("text").attr("x", function(d, i) {
			return 200 * i - 30;
		}).attr("y", 67).style(
				"fill", "#007cc0")
				.style("stroke", "none").style("font-family", "SAP-icons").style("font-size", "20px")
				.text("")
				.attr("visibility", "hidden");
		// Separator
		var separatergroup = svgHeaderContainer.append("g");
		for (var i = 0; i < 4; i++) {
			separatergroup.append("path").attr("d", this._fLineFunction([ {
				"x" : 200 * i + 140,
				"y" : 20
			}, {
				"x" : 200 * i + 140,
				"y" : 135
			} ])).attr("stroke", "gray").attr("fill", "none").attr("stroke-width", 0.5);
		}
		// Header Triangle
		var lineData = [ {
			"x" : 0,
			"y" : 0
		}, {
			"x" : 30,
			"y" : 0
		}, {
			"x" : 15,
			"y" : 20
		}, {
			"x" : 0,
			"y" : 0
		} ];
		var currentSelectedNumPosition = this["_oSelectedReceiverNumPosition_" + rotation];
		var oSelectedReceiverNum = Number(currentSelectedNumPosition.substr(currentSelectedNumPosition.length - 1, 1)) - 2;
		var xPosition = oSelectedReceiverNum * 201 + 25;
		svgHeaderContainer.append("g").attr("class", "header_triangle_g").attr("transform", "translate(" + xPosition + ", 150)").append("path").attr("d", this._fLineFunction(lineData)).attr("stroke", "white").attr("fill",
				"white");
		// Button
		svgHeaderContainer.append("g").attr("class", "header_button_g");
		svgHeaderContainer.append("g").attr("class", "header_button_text_g");
		for (i = 0; i < 5; i++) {
			this._createReceiverButton(svgHeaderContainer, "#0" + i, i, rotation);
		}		
		// Title of Atack num per receiver
		svgHeaderContainer.append("g").attr("class", "headercontainer_atacknum_title_g").selectAll("text").data(rrates).enter().append("text").text(function(d) {
			return "アタック数:";
		}).attr("x", function(d, i) {
			return 200 * i;
		}).attr("y", function(d, i) {
			return 137;
		}).attr("font-size", "13px").attr("fill", "gray");
		
		// Atack num per receiver
		svgHeaderContainer.append("g").attr("class", "headercontainer_atacknum_g").selectAll("text").data(rrates).enter().append("text").text(function(d) {
			return "0";
		}).attr("x", function(d, i) {
			return 200 * i + 63;
		}).attr("y", function(d, i) {
			return 141;
		}).attr("font-size", "18px").attr("fill", "gray");
	},

	_createReceiverButton : function(svg, uninum, num, rotation) {
		var me = this;
		var buttonColor = "#428bca";
		var notSelectedButtonColor = "#f7f7f7";
		var width = 85, height = 25, // rect dimensions
		fontSize = 1.38 * height / 3, // font fills rect if fontSize  = 1.38*rectHeight
		x0 = 0, y0 = 90, x0Text = x0 + width / 2, y0Text = y0 + 0.66 * height, text = uninum;
		var modifiedX = num * 200 + x0;
		var modifiedTextX = num * 200 + x0Text;
		var positionForDisplayedButtonNow = "p" + (num + 2);
		var isSelected = (positionForDisplayedButtonNow === this["_oSelectedReceiverNumPosition_" + rotation]);
		// Button
		svg.select(".header_button_g").append("rect").attr("width", width + "px").attr("height", height + "px").style("fill", function(d, i) {
			if (isSelected) {
				return buttonColor;
			}
			return notSelectedButtonColor;
		}).attr("x", modifiedX).attr("y", y0).attr("ry", height / 10).attr("stroke", "gray").attr("stroke-width", 0.3);
		// Button text
		svg.select(".header_button_text_g").append("text").attr("x", modifiedTextX).attr("y", y0Text).style("text-anchor", "middle").style(
				"fill", function(d, i) {
					if (isSelected) {
						return "#ffffff";
					}
					return "gray";
				}).style("stroke", "none").style("font-family", "'Helvetica Neue', Helvetica, Arial, sans-serif").style("font-size", fontSize + "px")
				.text(text);
		// Transparent overlay to catch mouse events
		svg.append("rect").attr("id", "receiverNumButton" + num).attr("width", width + "px").attr("height", height + "px").style("opacity", 0).style(
				"pointer-events", "all").attr("x", modifiedX).attr("y", y0).attr("ry", height / 2).on("click", function() {
			var selectedId = d3.select(this).attr("id");
			var oSelectedReceiverNumPosition = Number(selectedId.substr(selectedId.length - 1, 1));
			svg.select(".header_button_g").selectAll("rect").transition().style("fill", function(d, i) {
				if (oSelectedReceiverNumPosition === i) {
					return buttonColor;
				}
				return notSelectedButtonColor;
			});
			svg.select(".header_button_text_g").selectAll("text").transition().style("fill", function(d, i) {
				if (oSelectedReceiverNumPosition === i) {
					return "#ffffff";
				}
				return "gray";
			});
			svg.select(".header_triangle_g").transition().attr("transform", function() {
				var xPosition = oSelectedReceiverNumPosition * 201 + 25;
				return "translate(" + xPosition + ", 150)";
			});
			me["_oSelectedReceiverNumPosition_" + rotation] = "p" + (oSelectedReceiverNumPosition + 2);
			me._svgPreMoveToTransitionWithoutAnimation(rotation, me);
		});
	},
	
	_svgPreMoveToTransitionWithoutAnimation : function(rotation, me) {
		// retreave from the latest svg.....
		var retreavedSvg = me["_oSVG_" + rotation];
		var result = me._oJsonModel.getProperty("/result");
		var selectedReceiver = me["_oSelectedReceiverNumPosition_" + rotation];
		var displayPosition = Number(selectedReceiver.substr(selectedReceiver.length - 1, 1)) - 2;
		var displaySetterPosition = Number(rotation.substr(rotation.length - 1, 1));
		var resultForPosition = result.setterPositions[displaySetterPosition - 1].passes[displayPosition];
		this._svgPageTransitionWithoutAnimation(retreavedSvg, resultForPosition, rotation, me);
	},
	
	_svgGraphRendering : function(svg, rotation) {
		// Preparation
		var vals = [0, 0, 0, 0, 0];
		var unums = [ "00", "01", "02", "03", "04" ];

		// Graph start
		var graphcontainer = svg.append("g").attr("transform", "translate(" + (this._oMarginFromLeft + 230) + ", 190)");
		// // Rule
		// for (var i = 0; i <= 10; i++) {
		// var ruleWidth = 60;
		// graphcontainer.append("path").attr("d", lineFunction([{"x": i *
		// ruleWidth, "y": -10}, {"x": i * ruleWidth, "y":
		// 300}])).attr("stroke", "lightsteelblue").attr("fill", "none");
		// }
		
		// Bar chart
		graphcontainer.append("g").attr("class", "chart_rect_g").selectAll("rect").data(vals).enter().append("rect").attr("x", 0).attr("y", function(d, i) {
			return i * 60 - 5;
		}).attr("width", function(d) {
			return d * 6;
		}).attr("height", 30).attr("fill", "CornflowerBlue");
		
		// Actual atacker stats
		var aastatsgroups = [];
		var aastatsGroup1 = graphcontainer.append("g").attr("class", "chart_aastats_g_1").attr("transform", "translate(0, 35)");
		aastatsgroups.push(aastatsGroup1);
		var aastatsGroup2 = graphcontainer.append("g").attr("class", "chart_aastats_g_2").attr("transform", "translate(0, 95)");
		aastatsgroups.push(aastatsGroup2);
		var aastatsGroup3 = graphcontainer.append("g").attr("class", "chart_aastats_g_3").attr("transform", "translate(0, 155)");
		aastatsgroups.push(aastatsGroup3);
		var aastatsGroup4 = graphcontainer.append("g").attr("class", "chart_aastats_g_4").attr("transform", "translate(0, 215)");
		aastatsgroups.push(aastatsGroup4);
		var aastatsGroup5 = graphcontainer.append("g").attr("class", "chart_aastats_g_5").attr("transform", "translate(0, 275)");
		aastatsgroups.push(aastatsGroup5);
//		for (var i = 0; i < 5; i++) {
//			var aastatsgroup = aastatsgroups[i];
//			for (var j = 0; j < 9 - i; j++) {
//				aastatsgroup.append("circle").attr("cx", j * 60 + 60).attr("r", 5).attr("fill", "red").attr("fill-opacity", 0.7);
//				aastatsgroup.append("path").attr("d", this._fLineFunction([ {
//					"x" : 0,
//					"y" : 0
//				}, {
//					"x" : j * 60 + 60,
//					"y" : 0
//				} ])).attr("stroke", "red").attr("fill", "none").attr("stroke-width", 10).attr("stroke-opacity", 0.2);
//			}
//		}		

		// Percentage number displayed on bar chart
		graphcontainer.append("g").attr("class", "chart_percentage_g").selectAll("text").data(vals).enter().append("text").text(function(d) {
			return d + "%";
		}).attr("x", function(d, i) {
			var margin = 40;
			if (d === 100) {
				margin = 48;
			} else if (d < 10) {
				margin = 32;
			}
			var ret = d * 6 - margin;
			if (ret <= 2) {
				ret = 2;
			}
			return ret;
		}).attr("y", function(d, i) {
			return i * 60 + 20 - 5;
		}).attr("font-size", "17px").attr("fill", "white");

		// Fill pattern
		var uniNumContainer = graphcontainer.append("g").attr("class", "chart_uninumber_g").attr("transform", "translate(-65, 0)");
		uniNumContainer.append("g").selectAll("rect").data(unums).enter().append("rect").attr("x", 0).attr("y", function(d, i) {
			return i * 60 - 2;
		}).attr("width", function(d) {
			return 55;
		}).attr("height", 34).attr("fill", "pink");
		// Uniform number
		uniNumContainer.append("g").selectAll("text").data(unums).enter().append("text").text(function(d) {
			return "#" + d;
		}).attr("x", function(d, i) {
			return 9;
		}).attr("y", function(d, i) {
			return i * 60 + 23;
		}).attr("font-size", "22px").attr("fill", "white").attr("font-weight", "bold");

		// Axis
		// X Axis
		var xScale = d3.scale.linear().domain([ 0, 100 ]).range([ 0, 600 ]);
		var xAxis = d3.svg.axis().scale(xScale).orient("bottom");
		graphcontainer.append("g").attr("class", "axis").attr("transform", "translate(0, 290)").call(xAxis);
		// Y Axis
		var yScale = d3.scale.linear().domain([ 0, 5 ]).range([ 0, 300 ]);
		var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(6).tickFormat(function(d) {
			return "";
		});
		graphcontainer.append("g").attr("class", "axis").attr("transform", "translate(0, -10)").call(yAxis);

		// Rotation
		var rotationGroup = svg.append("g").attr("class", "chart_rotation_g").attr("transform", "translate(0, 0)");
		rotationGroup.selectAll("text").data([ rotation ]).enter().append("text").text(function(d) {
			return d;
		}).attr("x", this._oMarginFromLeft + 50).attr("y", 230).attr("font-size", "80px").attr("fill", "gray").attr("font-weight", "bold");
		
		// Current rotation mark
		rotationGroup.append("circle").attr("cx", this._oMarginFromLeft + 40).attr("cy", 200).attr("r", 5).attr("fill", "#cc00cc").attr("visibility", "hidden");
		
		// HitRatio per rotation
		var hrate = [23];
		rotationGroup.append("g").attr("class", "chart_hrate_g").selectAll("text").data(hrate).enter().append("text").text(function(d) {
			return "正解率：-%(0/0)";
		}).attr("x", this._oMarginFromLeft + 33)
		.attr("y", 250)
		.attr("font-size", "13px").attr("fill", "gray");
	},

	onRefleshPressed : function(oEvent) {
		this._bindResult2ViewFromServlet();
		this._oTimeStampLabel.setText(this._oDateFormat.format(new Date()));
	},

	onAutoPlayBtnPressed : function(oEvent) {
		if (this._oIsAutoPlayMode === true) {
			this._oIsAutoPlayModeBtn.setIcon("sap-icon://play");
		} else {
			this._oIsAutoPlayModeBtn.setIcon("sap-icon://stop");
		}
		this._oIsAutoPlayMode = !this._oIsAutoPlayMode;
	},
	
	onDisplayResultPopup : function(oEvent) {
		if (!this._oResultDisplayPopOver) {
			this._oResultDisplayPopOver = sap.ui.xmlfragment("sap.ags.jvap.view.BlockPointAnalysisResult", this);
			this.getView().addDependent(this._oResultDisplayPopOver);
			this._oResultDisplayPopOver.open();
			this._createSVGonPopup();
			return;
		}
		this._oResultDisplayPopOver.open();
		this._svgPopOverUpdate();
	},
	
	_createSVGonPopup : function() {
		var stylename = ".volley-PopOverResult-Total";
		var svg = d3.select(stylename);
		var svgsize = {width: 400, height: 270};
		svg.attr("width", svgsize.width)
		 	.attr("height", svgsize.height);
		tests = [1];
		svg.append("g").attr("class", "testclass").selectAll("circle").data(tests).enter().append("circle").attr("cx",  function(d, i) {
			return 0;
		}).attr("cy", 0).attr("r", 15).attr("fill", "orange");		
	},
	
	_svgPopOverUpdate : function() {
		var stylename = ".volley-PopOverResult-Total";
		var svg = d3.select(stylename);
		var rref = svg.select(".testclass").selectAll("circle").attr("r");
		alert(rref);
		svg.select(".testclass").selectAll("circle").attr("r", rref + 5);
	},
	
	onResultDialogCancel : function(oEvent) {
		this._oResultDisplayPopOver.close();
	},
	
	_svgPageTransition : function(svg, result, rrates, atacknums, currentRotation, rotation) {
		var me = this;
		var vals = [];
		for(var i = 1; i < 7; i++) {
			var position = "p" + (i + 1);
			var percentage = result["targetPercent_" + position];
			var aastat = result["actualAtacknum_" + position];
			vals.push({
				position: position,
				percentage: percentage,
				aastat: aastat
			});
		}
		vals.sort(function(a, b) {
		if (a.percentage > b.percentage)
			return -1;
		if (a.percentage < b.percentage)
			return 1;
		return 0;
		});
		
		// Header container
		// RRate
		svg.select(".headercontainer_rrate_g").selectAll("text").data(rrates).transition().text(function(d) {
			return d;
		}).attr("fill", function(d, i) {
			return me._fCriteriaColor(d);
		});
		// Actual atack number
		svg.select(".headercontainer_atacknum_g").selectAll("text").data(atacknums).transition().text(function(d) {
			return d;
		});
		// Uniform number in button
		svg.select(".header_button_text_g").selectAll("text").data(rrates).transition().text(function(d, i) {
			var pnum = "p" + (i + 2);
			return "#" + me._oUniformNumber[pnum];
		});

		// Graph
		// Graph var transition
		svg.select(".chart_rect_g").selectAll("rect").data(vals).transition().attr("width", function(d) {
			return d.percentage * 6;
		}).attr("height", 30).attr("fill", function(d, i) {
			if (me._isFrontPlayer(d.position, rotation)) {
				return "CornflowerBlue";
			} else {
				return "gray";
			}
		});

		// Graph persentage transition
		svg.select(".chart_percentage_g").selectAll("text").data(vals).transition().text(function(d) {
			return d.percentage + "%";
		}).attr("x", function(d, i) {
			var margin = 40;
			if (d.percentage === 100) {
				margin = 48;
			} else if (d.percentage < 10) {
				margin = 32;
			}
			var ret = d.percentage * 6 - margin;
			if (ret <= 2) {
				ret = 2;
			}
			return ret;
		});
		
		// Actual atacker stats
		var aastatsgroups = [];
		aastatsgroups.push(svg.select(".chart_aastats_g_1"));
		aastatsgroups.push(svg.select(".chart_aastats_g_2"));
		aastatsgroups.push(svg.select(".chart_aastats_g_3"));
		aastatsgroups.push(svg.select(".chart_aastats_g_4"));
		aastatsgroups.push(svg.select(".chart_aastats_g_5"));
		for (var i = 0; i < 5; i++) {
			var aastatsgroup = aastatsgroups[i];
			aastatsgroup.selectAll("circle").remove();
			aastatsgroup.selectAll("path").remove();
			for (var j = 0; j < vals[i].aastat; j++) {
				aastatsgroup.append("circle").attr("cx", j * 60 + 60).attr("r", 5).attr("fill", "red").attr("fill-opacity", 0.7);
				aastatsgroup.append("path").attr("d", this._fLineFunction([ {
					"x" : 0,
					"y" : 0
				}, {
					"x" : j * 60 + 60,
					"y" : 0
				} ])).attr("stroke", "red").attr("fill", "none").attr("stroke-width", 10).attr("stroke-opacity", 0.2);
			}
		}		

		// Uniform number
		var chartUniformNumberGroup = svg.select(".chart_uninumber_g");
		// Uniform number box
		chartUniformNumberGroup.selectAll("rect").data(vals).transition().attr("fill", function(d, i) {
			return me._oColorForPosition[d.position];
		});
		// Uniform number
		chartUniformNumberGroup.selectAll("text").data(vals	).transition().text(function(d) {
			return "#" + me._oUniformNumber[d.position];
		});
		
		// Rotation
		var rotationVisibility = "hidden";
		if (rotation === "S" + currentRotation) {
			rotationVisibility = "visible";
		} 
		svg.select(".chart_rotation_g").select("circle").attr("visibility", rotationVisibility);
	},

	_svgPageTransitionWithoutAnimation : function(svg, result, rotation, me) {
		var vals = [];
		for(var i = 1; i < 7; i++) {
			var position = "p" + (i + 1);
			var percentage = result["targetPercent_" + position];
			var aastat = result["actualAtacknum_" + position];
			vals.push({
				position: position,
				percentage: percentage,
				aastat: aastat
			});
		}
		vals.sort(function(a, b) {
		if (a.percentage > b.percentage)
			return -1;
		if (a.percentage < b.percentage)
			return 1;
		return 0;
		});
		// Graph
		// Graph var transition
		svg.select(".chart_rect_g").selectAll("rect").data(vals).attr("width", function(d) {
			return d.percentage * 6;
		}).attr("fill", function(d, i) {
			if (me._isFrontPlayer(d.position, rotation)) {
				return "CornflowerBlue";
			} else {
				return "gray";
			}
		});
		// Graph persentage transition
		svg.select(".chart_percentage_g").selectAll("text").data(vals).text(function(d) {
			return d.percentage + "%";
		}).attr("x", function(d, i) {
			var margin = 40;
			if (d.percentage === 100) {
				margin = 48;
			} else if (d.percentage < 10) {
				margin = 32;
			}
			var ret = d.percentage * 6 - margin;
			if (ret <= 2) {
				ret = 2;
			}
			return ret;
		});
		// Actual atacker stats
		var aastatsgroups = [];
		aastatsgroups.push(svg.select(".chart_aastats_g_1"));
		aastatsgroups.push(svg.select(".chart_aastats_g_2"));
		aastatsgroups.push(svg.select(".chart_aastats_g_3"));
		aastatsgroups.push(svg.select(".chart_aastats_g_4"));
		aastatsgroups.push(svg.select(".chart_aastats_g_5"));
		for (var i = 0; i < 5; i++) {
			var aastatsgroup = aastatsgroups[i];
			aastatsgroup.selectAll("circle").remove();
			aastatsgroup.selectAll("path").remove();
			for (var j = 0; j < vals[i].aastat; j++) {
				aastatsgroup.append("circle").attr("cx", j * 60 + 60).attr("r", 5).attr("fill", "red").attr("fill-opacity", 0.7);
				aastatsgroup.append("path").attr("d", this._fLineFunction([ {
					"x" : 0,
					"y" : 0
				}, {
					"x" : j * 60 + 60,
					"y" : 0
				} ])).attr("stroke", "red").attr("fill", "none").attr("stroke-width", 10).attr("stroke-opacity", 0.2);
			}
		}
		// Uniform number
		var chartUniformNumberGroup = svg.select(".chart_uninumber_g");
		// Uniform number box
		chartUniformNumberGroup.selectAll("rect").data(vals).attr("fill", function(d, i) {
			return me._oColorForPosition[d.position];
		});
		// Uniform number
		chartUniformNumberGroup.selectAll("text").data(vals	).text(function(d) {
			return "#" + me._oUniformNumber[d.position];
		});
	},
	
	_isFrontPlayer : function(position, rotation) {
		switch (rotation) {
			case "S1":
				if (position === "p2" || position === "p3" || position === "p4") {
					return true;
				}
				return false;
			case "S2":
				if (position === "p1" || position === "p2" || position === "p3") {
					return true;
				}
				return false;
			case "S3":
				if (position === "p1" || position === "p2" || position === "p6") {
					return true;
				}
				return false;
			case "S4":
				if (position === "p1" || position === "p5" || position === "p6") {
					return true;
				}
				return false;
			case "S5":
				if (position === "p4" || position === "p5" || position === "p6") {
					return true;
				}
				return false;
			case "S6":
				if (position === "p3" || position === "p4" || position === "p5") {
					return true;
				}
				return false;
		}
	},

	_bindResult2ViewFromServlet: function() {
        this._oJsonModel = new sap.ui.model.json.JSONModel();
        this._oJsonModel.loadData("/zjva/bpr", {}, false);
		this._bindResult2SVG();
	},

	_bindResult2ViewFromServlet: function() {
        this._oJsonModel = new sap.ui.model.json.JSONModel();
        this._oJsonModel.loadData("/jva/bpr", {}, false);
		this._bindResult2SVG();
	},
	
	_bindResult2ViewFromWebSocket: function(jsonstr) {
	    this._oJsonModel = new sap.ui.model.json.JSONModel();
		this._oJsonModel.setJSON(jsonstr, false);
		this._bindResult2SVG();
	},

	_bindResult2SVG: function() {
		this._oView.setModel(this._oJsonModel);
		this._oView.bindElement("/result");
		var result = this._oJsonModel.getProperty("/result");
		
		// create uniform map
		for (var i = 0; i < 7; i++) {
			this._oUniformNumber["p" + i] = result["uninum_p" + i];	
		}
		
		// transition header container / graph
		var currentRotation = result.currentRotation;
		for (var i = 1; i < 7; i++) {
			var selectedReceiver = this["_oSelectedReceiverNumPosition_S" + i];
			var displayPosition = Number(selectedReceiver.substr(selectedReceiver.length - 1, 1)) - 2;
			var resultForRotation = result.setterPositions[i - 1];
			var atacknums = [];
			for (var k = 0; k < resultForRotation.passes.length; k++) {
				atacknums.push(resultForRotation.passes[k].actualAtacknumPerReceptionPlayer);
			}
			var resultForPosition = resultForRotation.passes[displayPosition];
			var rrates = [];
			for (var j = 0; j < 5; j++) {
				rrates.push(result["rrate_p" + (j + 2)]);
			}
			var svg = this["_oSVG_" + "S" + i];
			this._svgPutWarningMark(svg, resultForRotation);
			this._svgPageTransition(svg, resultForPosition, rrates, atacknums, currentRotation, "S" + i);
		}
		if (this._oIsAutoPlayMode) {
			$.fn.fullpage.moveTo(0, currentRotation - 1);
		}
	},

	_svgPutWarningMark : function(svg, resultForRotation) {
		var me = this;
		var maxPercentages = [];
		for(var i = 0; i < resultForRotation.passes.length; i++) {
			var resultForPosition = resultForRotation.passes[i];
			var maxPercentage = 0;
			for (var j = 0; j < 6; j++) {
				var targetPercentage = resultForPosition["targetPercent_p" + (j + 1)];
				if (maxPercentage < targetPercentage) {
					maxPercentage = targetPercentage;
				}
			}
			maxPercentages.push(maxPercentage);
		}
		// hit ratio Warning
		svg.select(".headercontainer_warningmark_g").selectAll("text").data(maxPercentages).transition()
		.attr("visibility", function(d, i) {
			if (d > me._oThrasholdForWarningMark) {
				return "visible"
			}
			return "hidden";
		});
	},
	
	// for test purpose
	// remove this functio after conducting the test!!
	_pp : function(obj) {
		var properties = '';
		for ( var prop in obj) {
			properties += prop + "=" + obj[prop] + "\n";
		}
		alert(properties);
	}

});