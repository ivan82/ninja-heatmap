var NinjaHeatMap = function(width, height, gradientMaxValue, gradientCircleRadius, gradientCircleBlur){
	this.width = width;
	this.height = height;
	this.gradientCircleRadius = gradientCircleRadius || 10;
	this.gradientCircleBlur = gradientCircleBlur || 5;
	this.gradientCircleShadowColor = 'black';
	this.gradientMinOpacity = 0.05;
	this.gradientWidth = 1;
	this.gradientHeight = 256;
	this.gradientMaxValue = gradientMaxValue || 1;

	this.gradientColorStops = [
		{stop: 0.0, color: 'blue'},
		{stop: 0.3, color: 'cyan'},
		{stop: 0.4, color: 'lime'},
		{stop: 0.7, color: 'yellow'},
		{stop: 1.0, color: 'red'}];

	//{x:int, y:int, value:dec, data:obj}
	this.data = [];

	//stats
	this.maxDataXValue = 0;
	this.maxDataYValue = 0;
	this.maxDataValue = 0;

	this.onMaxDataXValueExceededed = undefined;
	this.onMaxDataYValueExceededed = undefined;

	//cached
	this.heatMap = undefined;
	this.gradient = undefined;
	this.circle = undefined;
};

NinjaHeatMap.prototype = {
	draw: function(canvasRef, x, y){
		var grayscaleHeatMap = this.createGrayscaleHeatMap(this.data);
		var gradient = this.createDefaultGradient();
		this.colorHeatMap(canvasRef, grayscaleHeatMap, gradient, x, y);
	},

	colorHeatMap: function(canvasRef, grayscaleHeatmapCanvas, gradientCanvas, x, y){
		x = x || 0;
		y = y || 0;
		var heatMapData = this.getCanvasImageData(grayscaleHeatmapCanvas);
		var gradientData = this.getCanvasImageData(gradientCanvas);

		this.colorize(heatMapData.data, gradientData.data);
		context = canvasRef.getContext('2d');
		context.putImageData(heatMapData, x, y);
	},

	colorize: function(pixels, gradient){
		for(var i = 0, len = pixels.length, j; i < len; i += 4){
			// extracts gradient color from opacity
			j = pixels[i + 3] * 4;

			if(j){
				pixels[i] = gradient[j];
				pixels[i + 1] = gradient[j + 1];
				pixels[i + 2] = gradient[j + 2];
			}
		}
	},

	createDefaultGradient: function(width, height){
		width = width || this.gradientWidth;
		height = height || this.gradientHeight;
		return this.createLinearGradient(this.gradientColorStops, 0, 0, width, height);
	},

	createDefaultBluredCircle: function(radius, blur, shadowColor){
		radius = radius || this.gradientCircleRadius;
		blur = blur || this.gradientCircleBlur;
		shadowColor = shadowColor || this.gradientCircleShadowColor;
		return this.createBluredCircle(radius, blur, shadowColor);
	},


	createBluredCircle: function(radius, blur, shadowColor){
		var radiusWithBlur = radius + blur;
		var widthAndHeight = radiusWithBlur * 2;
		var circle = this.createCanvas(widthAndHeight, widthAndHeight);
		var context = circle.getContext('2d');

		context.shadowOffsetX = widthAndHeight;
		context.shadowOffsetY = widthAndHeight;
		context.shadowBlur = blur;
		context.shadowColor = shadowColor;

		context.beginPath();
		context.arc(-radiusWithBlur, -radiusWithBlur, radius, 0, Math.PI * 2, true);
		context.closePath();
		context.fill();
		return circle;
	},

	createBluredLine: function(x0, y0, x1, y1, strokeStyle, blur, shadowColor){
		var line = this.createCanvas();
		var context = line.getContext('2d');
		context.shadowBlur = blur;
		context.shadowColor = shadowColor;
		context.beginPath();
		context.moveTo(x0, y0);
		context.lineTo(x1, y1);

		context.strokeStyle(strokeStyle);
		context.stroke();
		return line;
	},

	createLinearGradient: function(gradientColorStops, x0, y0, x1, y1){
		var width = Math.abs(x1 - x0);
		var height = Math.abs(y1 - y0);
		var canvas = this.createCanvas(width, height);
		var context = canvas.getContext('2d');
		var gradient = context.createLinearGradient(x0, y0, x1, y1);

		for(var gradientColorStop, i = 0, len = gradientColorStops.length; i < len; i++){
			gradientColorStop = gradientColorStops[i];
			gradient.addColorStop(gradientColorStop.stop, gradientColorStop.color);
		}

		context.fillStyle = gradient;
		context.fillRect(x0, y0, width, height);
		return canvas;
	},

	createGrayscaleHeatMap: function(data, minOpacity, shapeCanvas, shapeOffsetX, shapeOffsetY, width, height){
		minOpacity = minOpacity || this.gradientMinOpacity;
		shapeCanvas = shapeCanvas || this.createDefaultBluredCircle();
		shapeOffsetX = shapeOffsetX || shapeCanvas.width / 2;
		shapeOffsetY = shapeOffsetY || shapeCanvas.height / 2;
		width = width || this.width;
		height = height || this.height;

		var canvas = this.createCanvas(width, height);
		var context = canvas.getContext('2d');

		context.clearRect(0, 0, width, height);
		for(var dataItem, dataItemValue, i = 0, len = data.length; i < len; i++){
			dataItem = data[i];
			dataItemValue = dataItem.value || 0;
			context.globalAlpha = Math.max(dataItemValue / this.gradientMaxValue, minOpacity);
			context.drawImage(shapeCanvas, dataItem.x - shapeOffsetX, dataItem.y - shapeOffsetY);
		}
		return canvas;
	},

	addShapeToHeatMap: function(refHeatMapCanvas, minOpacity, shapeCanvas, dataItem, shapeOffsetX, shapeOffsetY){
		minOpacity = minOpacity || this.gradientMinOpacity;
		var context = refHeatMapCanvas.getContext('2d');
		var dataItemValue = dataItem.value || 0;
		context.globalAlpha = Math.max(dataItemValue / this.gradientMaxValue, minOpacity);
		context.drawImage(shapeCanvas, dataItem.x - shapeOffsetX, dataItem.y - shapeOffsetY);
	},

	getCanvasImageData: function(canvas, x, y, width, height){
		x = x || 0;
		y = y || 0;
		width = width || canvas.width;
		height = height || canvas.height;
		return canvas.getContext('2d').getImageData(x, y, width, height);
	},


	createCanvas: function(width, height){
		var canvas = document.createElement('canvas');
		if(width){ canvas.width = width; }
		if(height){ canvas.height = height; }
		return canvas;
	},

	max: function(value){
		this.gradientMaxValue = value;
	},

	add: function(x, y, value){
		this.data.push({x: x, y: y, value: value});
		if(x > this.maxDataXValue){ this.maxDataXValue = x; }
		if(y > this.maxDataYValue){ this.maxDataYValue = y; }
		if(value && value > this.maxDataValue){ this.maxDataValue = value; }

		if(this.onMaxDataXValueExceededed && x > this.width){ this.onMaxDataXValueExceededed(x); }
		if(this.onMaxDataYValueExceededed && y > this.height){ this.onMaxDataYValueExceededed(y); }
	},

	data: function(data){
		this.data = data;
	}
};
