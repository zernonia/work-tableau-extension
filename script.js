'use strict';
// Default debugging port is 8696. http://localhost:8696
// Server port is http://localhost:4000

// Wrap everything in an anonymous function to avoid poluting the global namespace
(function () {
  // Event handlers for filter change
  let unregisterHandlerFunctions = [];

  let fontSettings = {
    size: 12,
    color: '#000000',
    x: 5,
    y: -10
  }
  let tierSettings = {
    tier1: 999,
    tier2: 7499,
    tier3: 14999,
    tier4: 24999,
    tier5: 34999,
    tier6: 44999
  }

  let worksheet1, worksheet2;
  
  // Use the jQuery document ready signal to know when everything has been initialized
  $(document).ready(function () {
    // initialize the initial layout
    var svg = d3.select("body")
      .append('svg')
      .classed('circleCard', true);
    var container = svg.append("g")
      .classed('container', true);
    var pathSeg = container.append("path").classed('path', true).attr('id','path')
    var target = container.append('g')
    var flag = container.append('svg')
    var marker = container.append('svg')
    var markerG = container.append('g')

    let width = window.innerWidth - 10
    let height = window.innerHeight - 10

    let curve = d3.line().curve(d3.curveNatural);
    let tier0 = [25, height - 15]
    let tier1 = [width / 2 - 20, height - 20]
    let tier2 = [width - 80, height - 60]
    let tier3 = [width / 2 + 20, height - 130]
    let tier4 = [60, height * 0.4]
    let tier5 = [width * 0.4 + 20, height / 5]
    let tier6 = [width * 0.8 - 20 , height / 10 + 20]

    let points = [tier0, tier1, tier2, tier3, tier4, tier5, tier6]
    
    // Initialize tableau extension
    tableau.extensions.initializeAsync().then(function () {
      // Get worksheets from tableau dashboard
      let extensionViewport = tableau.extensions.dashboardContent.dashboard.objects[0].size
      width = extensionViewport.width
      height = extensionViewport.height

      worksheet1 = tableau.extensions.dashboardContent.dashboard.worksheets[0];
      console.log(tableau.extensions.dashboardContent.dashboard)

      function getDataAndPlotChart() {
        // load data from worksheet
        let dataArr = [];
        let dataSingle = 0; // because we only consider single value this time
        worksheet1.getSummaryDataAsync().then(data => {
          let dataJson;
          data.data.map(d => {
            dataJson = {};
            dataJson[data.columns[0].fieldName] = d[0].value; //FSC id
            dataJson[data.columns[1].fieldName] = d[1].value; //Sum of Incentive 
            dataArr.push(dataJson);
          });
          dataSingle =  data.data[0][1].value
          plotChart(dataSingle);
        });
      }

      getDataAndPlotChart();

      // event listener for filters
      let unregisterHandlerFunction = worksheet1.addEventListener(tableau.TableauEventType.FilterChanged, filterChangedHandler);
      unregisterHandlerFunctions.push(unregisterHandlerFunction);

      function filterChangedHandler(event) {
        // for filter change
        // Add fieldName with (||) for other filters
        if (event.fieldName === "Action (Sales Staff ID)") {
          // reload summary data
          // console.log(event)
          getDataAndPlotChart();
        }
      }

      function settingChangedHandler(event) {
        console.log(event)
      }


    });


    // ========================== D3 CHART ===================== //
  function plotChart(data) {
    let valueCurrent = data
    let valueTarget = tierSettings.tier6 + 1
    let valuePercentage = (valueCurrent / valueTarget) * 100
    
    svg
      .attr("width", width)
      .attr("height", height)
    pathSeg
      .attr('d', curve(points))
      .attr('stroke', 'rgb(186, 234, 255)')
      .style("stroke-width", 25)
      .attr('fill', 'none')
    marker
      .attr('width', 100)
      .attr('height', 100)
      .attr('cx', 0)
      .attr('cy', 0);
    markerG
      .attr('fill', '#fff')
      .attr('stroke-width', 2)
      .attr('stroke', 'steelblue')
      .style('transform', `translate( 20px, -40px) scaleX(-1)`) // svgPositionX , svgPositionY
      .style('offset-path', `path("${curve(points)}")`)
      .style('offset-distance', "0%")
      .style('offset-rotate', "0deg")
      .append('circle')
      .attr('cx', 19.969)
      .attr('cy', 6.008)
      .attr('r', 6.008)

    markerG
      .append('path')
      .attr('d', "M53.99 37.782c-6.299 3.684-10.077-1.721-12.923-6.924a7.0082 7.0082 0 00-.57-1.522c-2.203-4.285-4.502-8.527-6.908-12.703 4.699-1.499 8.996-.13 12.375 4.602 2.748 3.85 9.176.158 6.396-3.737-6.54-9.159-16.292-11.432-26.055-5.636-.406.241-.732.521-.993.828-.148.058-.295.122-.44.19-.397.08-.806.233-1.219.478-6.069 3.603-11.709 2.92-15.921-2.98-2.75-3.85-9.176-.158-6.395 3.737 5.374 7.527 12.919 10.392 20.857 7.96 2.491 4.278 4.856 8.632 7.128 13.032-3.358 1.717-6.467 3.853-9.357 6.368-.125.109-.236.222-.341.335-.629.323-1.184.868-1.575 1.676-1.942 4.015-3.886 8.028-5.828 12.043-2.086 4.312 4.626 7.438 6.704 3.146 1.846-3.814 3.694-7.633 5.541-11.445.25-.141.498-.309.736-.518 3.352-2.918 7.191-5.283 11.396-6.748.207-.072.396-.158.574-.254 5.148 6.533 12.33 10.131 20.93 5.105 4.531-2.648.433-9.689-4.112-7.033z")

    markerG.transition()
      .ease(d3.easeLinear)
      .duration(2000)
      .style('offset-distance', `${valuePercentage}%`)

    flag
      .attr('width', "30px")
      .attr('height', "30px")
      .attr('fill', 'gray')
      .attr('viewBox', "-43 1 456 456.9981")
      .attr('x', tier6[0] - 10)
      .attr('y', tier6[1] - 50)
      .append('path')
      .attr('d', "M305.7773 165.4805c22.3243-28.457 41.6485-44.6328 58.9532-49.375 3.1875-.875 5.6562-3.4102 6.457-6.625.793-3.207-.207-6.5977-2.6172-8.8672-50.457-47.3477-102.707-23.0625-148.8086-1.625-45.6836 21.2383-85.2812 39.4883-125.6992 4.0898V81.9687c11.461-8.5898 18.2852-21.9374 18.2852-36.3984 0-15.4726-7.7422-29.75-20.6211-38.1445-14.7422-9.8281-35.004-9.918-49.9883-.1602C28.703 15.6758 20.918 30 20.918 45.5703c0 14.5469 6.8554 27.9336 18.2851 36.4414V438.711H9.6406C4.5938 438.711.5 442.8047.5 447.8555S4.5938 457 9.6406 457H123.625c5.0469 0 9.1406-4.0937 9.1406-9.1445s-4.0937-9.1446-9.1406-9.1446H94.0625V292.043c16.3594 10.8282 32.8203 15.0352 49.121 15.0352 29.1173 0 57.7227-13.3047 84.2852-25.6523 46.7657-21.7305 87.1563-40.5078 128.582-1.6133 3.2071 2.9883 8.0743 3.3125 11.6173.7383 3.5508-2.5703 4.7812-7.293 2.9336-11.2656-19.504-41.9649-40.7579-76.0196-64.8243-103.8047zm-230 273.2304h-18.289V90.2461c3.0156.625 6.0664 1.039 9.1445 1.039 3.1055 0 6.1524-.4101 9.1445-1.0195zm5.211-369.8359l-.7383.4727c-7.9922 4.75-18.2852 5.1328-27.746-.2852l-.8438-.5469c-7.8008-5.0351-12.457-13.6172-12.457-22.9453 0-9.332 4.6562-17.9101 12.4882-22.9648 4.4805-2.918 9.6524-4.4649 14.9414-4.4649 5.3672 0 10.5352 1.5547 15.0313 4.5547 7.7617 5.0547 12.3984 13.6055 12.3984 22.875 0 9.2656-4.6367 17.8203-13.0742 23.3047zm138.7695 195.9727c-45.6797 21.2421-85.2773 39.496-125.6953 4.0898V126.0508c45.5938 30.1836 91.9805 8.7851 133.4063-10.4727 42.457-19.7422 79.6406-37.0351 117.1601-10.9453-18.0586 9.6055-36.8516 27.7305-58.0039 55.75-2.6484 3.5078-2.4258 8.4024.5313 11.6602 18.6953 20.5703 35.6757 45.043 51.4726 74.2226-40.8476-17.6875-81.8398 1.3594-118.871 18.582zm0 0")

    
      drawTargetPoints(points, data)
  
      // .attr("class", "tooltip") // tooltip info

    function drawTargetPoints(points, dataView) {
      let valueCurrent = dataView
      let tierArray = []
      let tierText = []
      let tierLabel = ["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5", "Tier 6"]
      let tierPercent = ["5%", "6%", "7%", "8%", "9%", "10%"]
      let nextTierIndex = 0
      let j = 0

      let valueTarget = 45000 + 1 // this.visualSettings.tier.tier6
      let timeAnimation = 2.5;
      let timeAnimationFull = 2 * valueTarget / valueCurrent
      let curve = d3.line().curve(d3.curveNatural);
          
      for(const tier in tierSettings ) {
        tierArray.push(tierSettings[tier])
        tierText.push(`${ tierSettings[tier] + 1} `+ `(${ tierPercent[j] })`)
        j++
      }
      
      nextTierIndex = tierArray.findIndex( value => {
        if(value <= valueCurrent) return false 
        else return value >= valueCurrent
      })

      nextTierIndex == -1 ? nextTierIndex = 5 : ''
      
      
      target.selectAll("circle").remove()
      target.selectAll("text").remove()
      let pathPoints = getPointsLocation()
      let i = 0
      pathPoints.forEach((point, index) => {
          let circlePoint
          circlePoint = target.append('circle')
          circlePoint
              .attr('r', 2 + (index/2))
              .attr('cx', point.x)
              .attr('cy', point.y)
              .attr('fill', '#fff')
              .attr('stroke-width', 2)
              .attr('stroke', 'steelblue')
          let labelPoint
          labelPoint = target.append("text")
          labelPoint
              .text(tierText[i])
              .attr('x', point.x + fontSettings.x)
              .attr('y', point.y + fontSettings.y)
              .style('font-size', fontSettings.size + (index * 1) + 'px')
              .style('fill', fontSettings.color)

          if(index == nextTierIndex) {
            labelPoint.style('font-weight', 700)
          }
          i++
      })
    }

    function getPointsLocation() {
        let path = pathSeg.node()
        let pathLength = path.getTotalLength()
        let tierLength = Object.keys(tierSettings).map((val) => {
            let a = tierSettings[val]
            return a / tierSettings.tier6
        })
        let tierPathLength = tierLength.map(val => {
            return path.getPointAtLength(val * pathLength)
        })
        return tierPathLength
    }


  }
  });

  
})();