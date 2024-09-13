import { Component, OnInit } from '@angular/core';
import Chart, { InteractionMode } from 'chart.js/auto';
import { GRAPHDATA } from '../shared/graphData';
import { toFont } from 'chart.js/helpers'; // Import the helper function

@Component({
  selector: 'app-graph-line-chart',
  templateUrl: './graph-line-chart.component.html',
  styleUrls: ['./graph-line-chart.component.scss']
})
export class GraphLineChartComponent implements OnInit {  
  private delayed: boolean = false; // Declare the delayed variable
  private graphData: any;
  private minYaxesVaule: any;
  private maxYaxesVaule: any;
  private stepSize: any;
  chartAreaBorder = {
    id: 'chartAreaBorder',    
    beforeDraw(chart, args, options) {
      const { ctx, chartArea: { left, top, width, height } } = chart;
      ctx.save();
      ctx.strokeStyle = options.borderColor;
      ctx.lineWidth = options.borderWidth;
      ctx.setLineDash(options.borderDash || []);
      ctx.lineDashOffset = options.borderDashOffset;
      ctx.strokeRect(left, top, width, height);
      ctx.restore();
    }
  };

  customLegendPadding = {
    id: 'customLegendPadding',    
    beforeInit(chart) {
        // Get a reference to the original fit function
        const origFit = chart.legend.fit;
        chart.legend.fit = function fit() {
            origFit.bind(chart.legend)();
            // Change the height to any desired value
            this.height += 15;
        }
    }
  }
  
  ngOnInit(): void {    
    this.graphData = GRAPHDATA;
    const { minValue, maxValue } = this.getMinMaxSpendValues(GRAPHDATA);
    this.stepSize = 5000;
    this.minYaxesVaule = Math.floor(minValue / this.stepSize) * this.stepSize;
    this.maxYaxesVaule = Math.ceil(maxValue / this.stepSize) * this.stepSize;    

    this.createChart();
  }

  // Function to format date in "Oct 1" format
  private formatDate(dateString: string): string {    
    const year = parseInt(dateString.slice(0, 4), 10);
    const month = parseInt(dateString.slice(4, 6), 10) - 1; // Months are 0-based in JavaScript
    const day = parseInt(dateString.slice(6, 8), 10);
  
    const date = new Date(year, month, day);    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  
    // Format the date to the desired format
    return date.toLocaleDateString('en-US', options);
  }

  // get the Maximum value from GraphData array
  private getMinMaxSpendValues(data: any){    
    const values = data.flatMap(item => [
        parseFloat(item.spend.v.replace(/[^0-9.-]+/g, '')),
        parseFloat(item.spendFC.v.replace(/[^0-9.-]+/g, ''))
    ]);

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return { minValue, maxValue };
  }

  private extractLabelAndValueSplit(input:any) {    
    if (typeof input !== 'string') {
        input = String(input); // Convert to string if it's not
    }
    // Split the string by ": " to separate the label and the value
    const parts = input.split(": ");

    // Check if the split resulted in two parts to avoid undefined errors
    if (parts.length !== 2) {
        throw new Error("Invalid input format. Expected 'label: value' format.");
    }
    
    // Get the label part (string value)
    const label = parts[0];

    // Get the value part (number value) and convert it to a number
    const value = parts[1];
    return { label, value };
  }

  private createChart(): void {            
    const ctx = document.getElementById('acquisitions') as HTMLCanvasElement;
    const chart = new Chart(ctx, {
      type: 'line',
      plugins: [ this.customLegendPadding ],
      data: {
        labels: this.graphData.map(row => this.formatDate(row['sortKey']['v'])),
        datasets: [
          {
            label: 'Actual Spend',
            borderColor: '#21D598',
            backgroundColor: 'rgb(85, 220, 176)',
            pointBackgroundColor: '#58e0b2', // Set a single color for all points
            pointHoverBackgroundColor: '#58e0b2',
            tension: 0.1,
            borderWidth: 1,
            cubicInterpolationMode: 'monotone',
            data: this.graphData.map(row => ({
              x: this.formatDate(row['sortKey']['v']),
              y: row['spend']['n']
            }))
          },
          {
            label: 'Target Spend',
            borderColor: '#FFD32A',
            backgroundColor: 'rgb(255, 211, 42)',
            pointBackgroundColor: '#ffd32a',
            tension: 0.1,
            borderWidth: 1,
            cubicInterpolationMode: 'monotone',
            data: this.graphData.map(row => ({
              x: this.formatDate(row['sortKey']['v']),
              y: parseFloat(row['spendFC']['v'].replace(/[^0-9.]/g, ''))
            }))
          }
        ]
      },
      options: this.getChartOptions()
    });

    // Event listener for mouse movement over the chart
//     ctx.addEventListener('mousemove', (event) => {      
//       const rect = ctx.getBoundingClientRect();
//       const xPos = event.clientX - rect.left;
// 
//       // Determine the proportion of the mouse position on the chart's X-axis
//       const totalWidth = rect.width;
//       const percentage = xPos / totalWidth;
// 
//       // Calculate the number of days to reveal based on mouse position
//       const maxDays = 31; // Total days in May
//       const visibleDays = Math.floor(16 + (percentage * (maxDays - 16))); // Adjust visible range dynamically
// 
//       // Update the chart to show more data based on mouse movement
//       chart.options.scales.x.ticks.maxTicksLimit = visibleDays;
//       chart.update();
//     });
  }

  // Function to get chart options for better readability
  private getChartOptions() {
    return {
      responsive: false,    
      maintainAspectRatio: false,
      // aspectRatio: 3,     
      animation: {        
        radius: {
          duration: 400,
          easing: 'linear',
          loop: (context) => context.active
        },
        onComplete: () => {
          this.delayed = true;
        },
        delay: (context) => {
          let delay = 0;
          if (context.type === 'data' && context.mode === 'default' && !this.delayed) {
            delay = context.dataIndex * 100 + context.datasetIndex * 100;
          }
          return delay;
        },
      },    
      scales: {        
        x: {             
          // type: 'timeseries',          
          time: {
            // Luxon format string
            unit: 'day'
          },
          // title: {
          //   display: true,
          //   text: 'Month',
          //   color: '#911',
          // },
          grid: {
            color: '#E6E9F1', // Change the grid color for the x-axis
            display: true
          },
          ticks: {
            // autoSkip: true,
            // maxTicksLimit: 16,
            font: {
              size: 14
            },
            color: '#999fac'
          }
        },
        y: {
          min: 0,
          max: this.maxYaxesVaule,          
          grid: {
            color: '#E6E9F1', // Change the grid color for the x-axis;            
          },           
          ticks: {
            font: {
              size: 14
            },            
            beginAtZero: true,   
            stepSize: this.stepSize,
            color: '#999fac',            
            callback: value => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),            
          },          
        }
      },
      layout: {
        padding: {
          bottom: 70
        }
      },      
      hoverRadius: 5,      
      interaction: {
        intersect: false,
        mode: 'index' as InteractionMode, // Cast mode to InteractionMode
      },
      plugins: {        
        chartAreaBorder: {
          borderColor: '#E6E9F1',
          borderWidth: 1,
          borderDash: [ 1, 1 ],
          borderDashOffset: 2,
        },
        // title: {
        //   display: true,
        //   text: 'Spend History Graph'
        // },
        legend: this.getLegendOptions(),
        tooltip: this.getTooltipOptions(this.graphData),
        afterDatasetsDraw: (chart) => {
          console.log('afterdataset draw==================>');
          const { ctx, chartArea: { top, bottom, left, right }, tooltip } = chart;
          console.log('after data set here', chart);
          if (!tooltip || !tooltip.opacity) return;
  
          const x = tooltip.caretX;
          const y = tooltip.caretY;
  
          // Draw the dotted line
          ctx.save();
          ctx.strokeStyle = '#FF5733'; // Color of the dotted line
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]); // Dotted line
          ctx.beginPath();
          ctx.moveTo(x, top);
          ctx.lineTo(x, bottom);
          ctx.stroke();
          ctx.restore();
        }
      }
    };
  }

  // Function to get legend options
  private getLegendOptions() {
    return {
      display: true,           
      onClick: (e, legendItem, legend) => this.toggleDatasetVisibility(e, legendItem, legend),
      labels: {
        padding: 30,
        usePointStyle: true,        
        color: '#0f131b',
        pointStyle: 'circle',
        boxWidth: 4,
        boxHeight: 4,
        font: {
          size: 14
        }
      },
      padding: 50
    };
  }

  private footer = (tooltipItems) => {
    let sum = 0;
  
    tooltipItems.forEach(function(tooltipItem) {
      sum += tooltipItem.parsed.y;
    });
    return 'Sum: ' + sum;
  };
  // Custom function to handle legend click to show/hide datasets
  private toggleDatasetVisibility(e, legendItem, legend) {
    const index = legendItem.datasetIndex;
    const ci = legend.chart;
    const meta = ci.getDatasetMeta(index);
    meta.hidden = !meta.hidden;
    ci.update();
  }

  // Function to get tooltip options
  private getTooltipOptions(graphData) {
    return {
      enabled: false, // Disable the default on-canvas tooltip      
      external: (context) => {
        // Tooltip Element
        let tooltipEl = document.getElementById('chartjs-tooltip');
        let iconContainer = document.getElementById('event-icons-container');
        let styleMetric = 'display: flex; flex-direction: row; justify-content: flex-start;';
        let styleTitleFont = "font-family: 'SF Pro Display'; font-size: 12px; font-weight: 500; text-align: left; margin: 0; color: #0F131B; line-height: 1.8;";

        // Create element on first render
        if (!tooltipEl) {
          tooltipEl = document.createElement('div');
          tooltipEl.id = 'chartjs-tooltip';
          tooltipEl.style.opacity = '0';
          tooltipEl.style.background = '#fff';
          tooltipEl.style.border = '1px solid #E4E6E9';
          tooltipEl.style.borderRadius = '5px';
          tooltipEl.style.padding = '10px 10px';
          tooltipEl.style.margin = '0 10px';
          tooltipEl.style.minWidth = '237px';
          // tooltipEl.style.maxWidth = '237px';
          tooltipEl.style.wordBreak = 'break-all';
          tooltipEl.style.pointerEvents = 'none';
          tooltipEl.style.position = 'absolute';
          tooltipEl.style.transition = 'all .1s ease';
          document.body.appendChild(tooltipEl);
        }
        
        // Create the icon container if it doesn't exist
        if (!iconContainer) {
          iconContainer = document.createElement('div');
          iconContainer.id = 'event-icons-container';
          iconContainer.style.position = 'absolute';
          iconContainer.style.padding = '10px';
          iconContainer.style.display = 'flex';
          iconContainer.style.flexFlow = 'column';
          iconContainer.style.gap = '10px';
          document.body.appendChild(iconContainer);
        }

        // Hide if no tooltip
        const tooltipModel = context.tooltip;
        if (tooltipModel.opacity === 0) {
          tooltipEl.style.opacity = '0';
          return;
        }
  
        // Set caret position
        tooltipEl.classList.remove('above', 'below', 'no-transform');
        if (tooltipModel.yAlign) {
          tooltipEl.classList.add(tooltipModel.yAlign);
        } else {
          tooltipEl.classList.add('no-transform');
        }
  
        // Set Text
        if (tooltipModel.body) {
          const titleLines = tooltipModel.title || [];
          const bodyLines = tooltipModel.body.map((item) => item.lines);
          let innerHtml = '<thead>';
          let styleTooltipTitle = "font-family: 'SF Pro Display'; font-size: 12px;font-weight: 500; text-align: left; color: #999FAC;";
          titleLines.forEach((title) => {            
            innerHtml += `<tr><th style="${styleTooltipTitle}"> ${title} | Calendar Events </th></tr>`;
          });
          innerHtml += '</thead><tbody>';                
          bodyLines.forEach((body, i) => {
            const colors = tooltipModel.labelColors[i];            
            let style = `background: ${colors.backgroundColor}; border-color: ${colors.borderColor}; border-width: 7px; width: 7px; height: 7px; border-radius: 50%; gap: 10px; margin-right: 5px; line-height: 1.5; margin-top: 6px;`;
            let styleBudgetFont = `font-family: 'SF Pro Display'; font-size: 12px;font-weight: 500; text-align: left; margin: 0; color: ${colors.backgroundColor};`;
            let label = this.extractLabelAndValueSplit(body).label;
            let value = this.extractLabelAndValueSplit(body).value;
            if(label.includes('Actual Spend')){
              label += ': ' + (parseFloat(this.extractLabelAndValueSplit(bodyLines[1]).value) + parseFloat(this.extractLabelAndValueSplit(bodyLines[1]).value))/100 + '%';
            }
            const metricContent = `<div style="${styleMetric}"><div class="icon-dot" style="${style}"></div><div><p style="${styleTitleFont}">${label}</p><p style="${styleBudgetFont}">$${value}</p></div></div>`;
            innerHtml += `<tr><td>${metricContent}</td></tr>`;
          });
  
          // Add custom event data to the tooltip
          const index = tooltipModel.dataPoints[0].dataIndex;
          const events = graphData[index].eventIcons?.events || [];
          let styleEventTitle = "font-family: 'SF Pro Display'; font-size: 12px;font-weight: 500; text-align: left; color: #999FAC; padding-top: 10px;";
          if (events.length > 0) {
            innerHtml += `<tr><th style="${styleEventTitle}">Events</th></tr>`;
            let styleBudgetFont = `font-family: 'SF Pro Display'; font-size: 12px;font-weight: 500; text-align: left; margin: 0;`;            
            let revenueStyle: any;
            if(events.revenue < 0){
              revenueStyle = "font-family: 'SF Pro Display'; font-size: 12px;font-weight: 500; text-align: left; margin: 0; color: #F33053;";
            }else{
              revenueStyle = "font-family: 'SF Pro Display'; font-size: 12px;font-weight: 500; text-align: left; margin: 0; color: #14AB78;";
            }
            
            for(let index = 0; index < events.length; index++) {
              let evetName = events[index].type;
              let eventIndex;
              if(evetName.includes('email')==true){
                eventIndex = 1;
              }else if(evetName.includes('google')==true){
                eventIndex = 2;
              }else{
                eventIndex = 3;
              }
              // Update the style for each event using the eventIndex to dynamically set the background image
              let style = `
                width: 12px; 
                height: 12px; 
                border-radius: 50%;
                gap: 10px; 
                margin-right: 5px; 
                line-height: 1.5; 
                margin-top: 6px; 
                background-image: url('../../assets/img/star${eventIndex}.png');
                background-size: cover;
              `;              
              // Construct the event content with proper styling
              const eventContent = `
                <div style="${styleMetric}">
                  <div class="icon-dot" style="${style}"></div>
                  <div>
                    <p style="${styleTitleFont}">${events[index].desc}</p>
                    <p style="${styleBudgetFont}">
                      <span style="${styleTooltipTitle}">Revenue:</span> 
                      <span style="${revenueStyle}">$${events[index].revenue}</span>
                    </p>
                  </div>
                </div>
              `;
            
              // Append the event content to the tooltip's inner HTML
              innerHtml += `<tr><td>${eventContent}</td></tr>`;
              if(index == 4){     
                let moreStyle = `
                  font-family: 'SF Pro Display'; 
                  font-size: 12px; 
                  font-weight: 500; 
                  text-align: left; 
                  margin: 0;
                  padding-left: 20px;
                  padding-top: 5px;
                  color: #BC2540;
                `;
                let remainingEvents = events.length - index -1;
                let eventText = remainingEvents === 1 ? 'event' : 'events';
                if(remainingEvents != 0){
                  innerHtml += `<tr><td style="${moreStyle}">more ${remainingEvents} ${eventText}...</td></tr>`;
                }                
                break;  
              }
            };            
          }
  
          innerHtml += '</tbody>';
  
          const tableRoot = tooltipEl.querySelector('table') || document.createElement('table');
          tableRoot.innerHTML = innerHtml;
  
          if (!tooltipEl.querySelector('table')) {
            tooltipEl.appendChild(tableRoot);
          }
        }
        
        const position = context.chart.canvas.getBoundingClientRect();
        const tooltipWidth = tooltipEl.offsetWidth;
        const tooltipHeight = tooltipEl.offsetHeight;
        const chartWidth = position.width;
        const chartHeight = position.height;
        const bodyFont = toFont(tooltipModel.options.bodyFont); // Use toFont from helpers

        // Calculate new positions
        let tooltipLeft = position.left + window.pageXOffset + tooltipModel.caretX;
        let tooltipTop = position.top + window.pageYOffset + tooltipModel.caretY;

        // Adjust if tooltip is too close to the edges
        if (tooltipTop + tooltipHeight > window.innerHeight) {
          tooltipTop -= tooltipHeight;
        }
        if (tooltipTop < window.pageYOffset) {
          tooltipTop = window.pageYOffset;
        }
        if (tooltipLeft + tooltipWidth > window.innerWidth) {
          tooltipLeft -= tooltipWidth;
        }
        if (tooltipLeft < window.pageXOffset) {
          tooltipLeft = window.pageXOffset;
        }

        // Display, position, and set styles for font
        tooltipEl.style.opacity = '1';
        tooltipEl.style.left = tooltipLeft + 'px';
        tooltipEl.style.top = tooltipTop + 'px';
        tooltipEl.style.font = bodyFont.string; // Apply the font string from toFont
        tooltipEl.style.padding = tooltipModel.padding + 'px ' + tooltipModel.padding + 'px';          
        
        // Icon display logic (outside tooltip) - show unique event types
        const index = tooltipModel.dataPoints[0].dataIndex;
        const events = graphData[index].eventIcons?.events || [];
        const uniqueEventTypes = new Set(events.map(event => event.type)); // Get unique event types        
        if (uniqueEventTypes.size > 0) {
          iconContainer.innerHTML = ''; // Clear any previous icons

          uniqueEventTypes.forEach((eventType) => {

            const type = eventType as string; 
            let eventIndex;
            if (type.includes('email')) {
              eventIndex = 'email';
            } else if (type.includes('google')) {
              eventIndex = 'google';
            } else if(type.includes('facebook')){
              eventIndex = 'meta'; 
            }else{
              eventIndex = 'default'; 
            }

            // Display the icon based on unique event type
            let iconStyle = `
              width: 20px; 
              height: 20px; 
              background-image: url('../../assets/img/${eventIndex}.png'); 
              background-size: cover;
            `;
            const icon = document.createElement('div');
            icon.setAttribute('style', iconStyle);
            iconContainer.appendChild(icon);
          });
                    
          
          // Position and show the icon container near the tooltip
          const position = context.chart.canvas.getBoundingClientRect();

          let tooltipLeft = position.left + window.pageXOffset + tooltipModel.caretX;
          let tooltipTop = position.top + window.pageYOffset + tooltipModel.caretY;
          
          if (tooltipLeft + tooltipWidth > window.innerWidth) {            
            iconContainer.style.left = position.left + window.pageXOffset + tooltipModel.caretX - tooltipEl.offsetWidth - 25 + 'px'; // Shift to the left of the tooltip          
          }else{            
            iconContainer.style.left = position.left + window.pageXOffset + tooltipModel.caretX -25 + 'px'; // Shift to the left of the tooltip          
          }          
          iconContainer.style.opacity = '1';   
          if(tooltipTop + tooltipHeight > window.innerHeight){
            iconContainer.style.top = position.top + window.pageYOffset + tooltipModel.caretY - (tooltipEl.offsetHeight / 2) + 'px'; // Vertically center icons
          }else{
            iconContainer.style.top = position.top + window.pageYOffset + tooltipModel.caretY + (tooltipEl.offsetHeight /2) + 'px'; // Vertically center icons
          }
          
        } else {
          iconContainer.style.opacity = '0'; // Hide if no events
        }
        
        // Event listener for mouse leave to hide the icon list
        const chartCanvas = document.getElementById('acquisitions'); // The canvas element
        chartCanvas.addEventListener('mouseleave', () => {
          iconContainer.style.opacity = '0'; // Hide icon container when mouse leaves the chart
        });        
      }
    };
  }  
}