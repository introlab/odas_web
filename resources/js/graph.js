var totalFrames;
var refreshFrame;

var watchPot;
var hasPotential = false;

var watchTrack;

// Refresh params for mobile
if( window.innerWidth < 992 ) {
    totalFrames = 40;
    refreshFrame = 20;
}

// Refresh params for desktop
else {
    totalFrames = 80;
    refreshFrame = 20;
}

/*
 * Chart bundle containing chart and chart data
 */

class ChartBundle {
    
    constructor() {
        
        this.chart = null;  // Chart.js element
        
        this.cdata = [];
        this.datasets = [];
        
        // Generate source dataset from rgb colors
        
        rgbValueStrings.forEach(function(color,index) {
            
            this.cdata.push(new Array(0));
            
            var dataset = {
                
                label : 'source' + index.toString(),
                fill : false,
                borderColor: color,
                spanGaps: false,
                data: this.cdata[index],
                hidden : false,
                cubicInterpolationMode : 'monotone'
            };
            
            this.datasets.push(dataset);
            document.addEventListener('clearChart',function(e){
                this.cdata[index].length = 0;
            }.bind(this));
            
            
        }.bind(this));
        
        this.pdata = [];
        this.pdatasets = [];
        
        // Generate potential dataset from heatmap color
        
        heatmapColors.forEach(function(color,index) {
            
            this.pdata.push(new Array(0));
            
            var dataset = {
                
                label : 'pot' + index.toString(),
                fill : false,
                pointBorderColor: color,
                pointBackgroundColor: color,
                pointRadius: 3,
                borderColor: "rgba(0,0,0,0)",
                spanGaps: false,
                data: this.pdata[index],
                hidden : false,
                showLines : false
            };
            
            this.pdatasets.push(dataset);
            document.addEventListener('clearChart',function(e){
                this.pdata[index].length = 0;
            }.bind(this));
            
        }.bind(this));
        
        this.cdataSetup = {
              datasets: this.datasets.concat(this.pdatasets)
        };
    }
}

/*
 * Generate charts from html tags and chart bundles
 */

var charts = [];

var ctxc = document.getElementsByClassName('graph');
var ctxs = Array.prototype.slice.call( ctxc );

var mins = [-90,-180];
var maxs = [90,180];
var stepSizes = [30, 60];
var pointsRadius = [0,0];

var dataMin = 0;
var dataMax = totalFrames * refreshFrame;

ctxs.forEach(function(ctx,i) {
    
    charts[i] = new ChartBundle();
    charts[i].chart = new Chart(ctx.getContext('2d'),{
        type: "line",
        data: charts[i].cdataSetup,
        options: {
            showLines: true,
            animation: false,
            tooltips: {
                enabled: false
            },
            
            elements: {
                point: {
                    radius: pointsRadius[i]
                }
            },
            
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        min : dataMin,
                        max : dataMax,
						maxRotation : 0
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Sample'
                    },
                    display : true
                }],
                
                yAxes: [{
                    ticks: {
                        max: maxs[i],
                        min: mins[i],
                        stepSize: stepSizes[i]
                    }
                }]
            },
            
            legend: {
                display:false
            },
            
            responsive:true,
            maintainAspectRatio: false
        }
        
    });
    
    document.addEventListener('request-chart',function(e) {
        charts[i].chart.update();
    });
});

/*
 * Update graph with tracking data received from Mars
 */

var framCnt = 0;

document.addEventListener('tracking', function(e) {
    
    if(framCnt%refreshFrame == 0) {
    
        currentFrame.sources.forEach(function(source,index) {

            var x = source.x;
            var y = source.y;
            var z = source.z;

            var inc = Math.acos(z/Math.sqrt(x*x+y*y+z*z));
            var az = Math.atan2(y,x);

            if(source.active) {
                
                charts[0].cdata[index].push({x:currentFrame.timestamp,y:90 - inc*180/Math.PI});     
                charts[1].cdata[index].push({x:currentFrame.timestamp,y:az*180/Math.PI});
                
            }
            
            else {
                
                charts[0].cdata[index].push({x:currentFrame.timestamp,y:null});     
                charts[1].cdata[index].push({x:currentFrame.timestamp,y:null});
            }
            
            if(charts[0].cdata[index].length>totalFrames) {
                charts[0].cdata[index].shift();
                charts[1].cdata[index].shift();
            }

        });
        
        if(!hasPotential)
            document.dispatchEvent(new Event('request-chart'));
        
        framCnt = 0;
        
		dataMax = currentFrame.timestamp;
        
        if(currentFrame.ptimestamp) {
            if(currentFrame.ptimestamp > currentFrame.timestamp) {
                dataMax = currentFrame.ptimestamp;
            }
        }
        
        charts.forEach(function(bundle) {
			
            bundle.chart.config.options.scales.xAxes[0].ticks.max = dataMax;
            bundle.chart.config.options.scales.xAxes[0].ticks.min = dataMax - totalFrames * refreshFrame;
        });
        
        clearInterval(watchTrack);
        watchTrack = setInterval(function() {
            document.dispatchEvent(new Event('clearChart'));
            clearInterval(watchTrack);
        },10000);
    }
    
    framCnt++;
    
});

/*
 * Update graph with potential source data received from Mars
 */

var pframCnt = 0;

document.addEventListener('potential', function(e) {
    
    hasPotential = true;
    
    if(pframCnt%refreshFrame == 0) {

        var noPot = true;
        currentFrame.potentialSources.forEach(function(source) {

            var x = source.x;
            var y = source.y;
            var z = source.z;
            var e = source.e;
            
            if( energyIsInRange(e) ) {

                var inc = Math.acos(z/Math.sqrt(x*x+y*y+z*z));
                var az = Math.atan2(y,x);

                charts[0].pdata[scaleEnergy(e)].push({x:currentFrame.ptimestamp, y: 90 - inc*180/Math.PI});
                charts[1].pdata[scaleEnergy(e)].push({ x:currentFrame.ptimestamp, y: az*180/Math.PI});
                
                noPot = false;
            }
        });
        
        if( noPot ) {
            charts[0].pdata[0].push({x:currentFrame.ptimestamp, y: null});
            charts[1].pdata[0].push({x:currentFrame.ptimestamp, y: null});
        }

        for(var i=0; i<heatmapColors.length; i++) {

            if(charts[0].pdata[i].length > 0) {
                while(charts[0].pdata[i][0].x < currentFrame.ptimestamp - totalFrames*refreshFrame) {
                    
                    charts[0].pdata[i].shift();
                    charts[1].pdata[i].shift();
                    
                    if(charts[0].pdata[i].length <= 0)
                        break;
                }
            }
        }

        clearInterval(watchPot);
        watchPot = setInterval(function() {
            hasPotential = false;
            document.dispatchEvent(new Event('clearChart'));
            clearInterval(watchPot);
        },10000);
        
        document.dispatchEvent(new Event('request-chart'));
        
		dataMax = currentFrame.ptimestamp;
        
        if(currentFrame.timestamp) {
            if(currentFrame.timestamp > currentFrame.ptimestamp) {
                dataMax = currentFrame.timestamp;
            }
        }
        
        charts.forEach(function(bundle) {

            bundle.chart.config.options.scales.xAxes[0].ticks.max = dataMax;
            bundle.chart.config.options.scales.xAxes[0].ticks.min = dataMax - totalFrames * refreshFrame;
        });
        
        pframCnt = 0;
    }  
    
    pframCnt++;
    
});

/*
 * Update dataset visibility for sources
 */

document.addEventListener('update-selection',function(e){
    
    charts.forEach(function(bundle) {
        
        bundle.datasets.forEach(function(dataset,i) {
            
            dataset.hidden = !(currentFrame.sources[i].selected && filterManager.showSources);
        });
        
        document.dispatchEvent(new Event('request-chart'));
    });

});

/*
 * Update dataset visibility for potential sources
 */

document.addEventListener('potential-visibility', function(e){
    
    charts.forEach(function(bundle) {
        
            bundle.pdatasets.forEach(function(dataset) { 
                
                dataset.hidden = !filterManager.showPotentials;
            });
        
        document.dispatchEvent(new Event('request-chart'));
    })
})
