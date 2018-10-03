import * as d3 from 'd3'
import moment from 'moment'

function time(d) {
  var dur = moment.duration(d)
  return [['days','days'],['hours','hours'],['minutes','min'],['seconds','sec']]
    .map(([unit, dis]) => [dis, dur.get(unit)])
    .filter(([unit, time]) => time)
    .slice(0, 2)
    .map(([unit, amount]) => amount + ' ' + (amount == 1 ? unit.replace(/\s$/, '') : unit))
    .join(' ') || (d === 0 ? '0 sec' : 'under a second')
}

const morning = moment('8:00am','h:mma').diff(moment().startOf('day'))
const afternoon = moment('5:00pm','h:mma').diff(moment().startOf('day'))

export function scheduleChart(container,[start,end],isWeek,data){
  // remove all children
  d3.select(container).selectAll('*').remove()
  const svg = d3.select(container).append('svg')
    .attr('width',752)
    .attr('height',500)
  const margin = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 20,
    // The padding between the Time and first column
    innerLeft: 25,
  }
  // Width and Height of chart not the actual svg space
  const width = svg.node().clientWidth - margin.left - margin.right - margin.innerLeft
  const height = svg.node().clientHeight - margin.top - margin.bottom
  
  const x = d3.scaleBand().rangeRound([margin.innerLeft, width+margin.innerLeft]).padding(0.1)
  const y = d3.scaleLinear().rangeRound([0, height])
  
  const chart = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  const xAxis = chart.append("g").attr("class", "axis axis--x")
  const yAxis = chart.append("g").attr("class", "axis axis--y")
  const hoverbackground = chart.append('rect')
    .attr('fill','#eee')
    .attr('fill-opacity',0)
    .attr('y',2)
  const background = chart.append('rect')
    .attr('class','background')
    .attr('height',height)
    .attr('fill-opacity',0)
    .on('mouseout',function(){
      hoverbackground.attr('fill-opacity',0)
      tooltip.classed("hidden", true);
    })
  
  const barScale = d3.scaleLinear().range([0,width+margin.innerLeft+margin.left+margin.right])
  const bar = svg.append('g').attr('class','bar')
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
  
  const tooltip = d3.select('body').append('div').attr('class','tooltip')


  var days = data.reduce((obj,task) => {
    obj[task.day] = obj[task.day] || {projects:{},total:0}
    obj[task.day].projects[task.project] = obj[task.day].projects[task.project] || {project:projects[task.project],total:0}
    obj[task.day].total += task.time[1] - task.time[0]
    obj[task.day].projects[task.project].total += task.time[1] - task.time[0]
    return obj
  },[])
  console.log(days)

  y.domain([
    Math.min(morning,...data.map(d => d.time[0])),
    Math.max(afternoon,...data.map(d => d.time[1])),
  ].map((n,i) => (Math.floor(n/(1000*60*60))+i)*1000*60*60))
  x.domain(d3.range(end.diff(start,'days')+1))
  xAxis.call(d3.axisTop(x)
    .tickFormat((d,i) => start.clone().add(i,'day').format(isWeek ? 'ddd D/M' : 'Do')))
  xAxis.select('.domain').remove()
  xAxis.selectAll('.tick line').remove()
  xAxis.selectAll('.tick text')
  yAxis.call(d3.axisRight(y)
    .tickValues(d3.range(...y.domain(),(1000*60*60)))
    .tickFormat(d => moment().startOf('day').add(d).format('h A'))
    .tickSize(width+margin.innerLeft))
  yAxis.select('.domain').remove()
  yAxis.selectAll(".tick:not(:first-of-type) line").attr("stroke", "#ddd")
  yAxis.selectAll(".tick text").attr("x", 0).attr("dy", 12)
  background
    .attr('width',x(x.domain().length-1)+x.bandwidth() - x(0))
    .attr('x',x(0))
  hoverbackground
    .attr('width',x.bandwidth())
    .attr('height',y.range()[1])
  chart.append('g').selectAll('.task')
    .data(data)
    .enter().append('rect')
    .attr('class','task')
    .attr('x',d => x(d.day))
    .attr('y',d => y(d.time[0]))
    .attr('width',d => x.bandwidth())
    .attr('height',d => y(d.time[1]) - y(d.time[0]))
    .attr('fill',d => projects[d.project].color)
    .on("mousemove", d  => {
      tooltip.classed("hidden", false)
        .attr('style',`left:${d3.event.x+20}px;top:${d3.event.y+10}px`)
        .html(`<div class="swatch" style="background-color:${projects[d.project].color}"></div>${time(d.time[1]-d.time[0])}${d.description ? `<br/><em>${d.description}</em>`: ''}`)

      hoverbackground
        .attr('x',x(d.day))
        .attr('fill-opacity',0.6)
    })
    .on("mouseout",  function(d,i) {
      tooltip.classed("hidden", true);
      hoverbackground.attr('fill-opacity',0)
    });
  
  var totals = data.reduce((obj,d) => {
    obj[d.project] = obj[d.project] || 0
    obj[d.project] += d.time[1] - d.time[0]
    return obj
  },{})
  
  var sections = bar.selectAll('g')
    .data(d3.stack().offset(d3.stackOffsetExpand).keys(Object.keys(totals))([totals]))
    .enter().append('g')
    .attr('transform',d => `translate(${barScale(d[0][0])},${height+margin.top+margin.bottom-20})`)
  sections.append('rect')
    .attr('width',d => barScale(d[0][1] - d[0][0]))
    .attr('height',20)
    .attr('fill',d => projects[d.key].color)
    .on("mousemove", d  => {
      tooltip.classed("hidden", false)
        .attr('style',`left:${d3.event.x+20}px;top:${d3.event.y+10}px`)
        .html(`${time(d[0].data[d.key])}${`<br/><em>${projects[d.key].name}</em>`}`)
    })
    .on("mouseout",  function(d,i) {
      tooltip.classed("hidden", true);
    });
  sections.append('text')
    .attr('y',-2)
    .text(d => projects[d.key].name.toUpperCase())
    // .text(function(d){ return this.getComputedTextLength() < barScale(d[0][1] - d[0][0]) ? this.textContent : projects[d.key].name.toUpperCase()})
    .text(function(d){ return this.getComputedTextLength() < barScale(d[0][1] - d[0][0]) ? this.textContent : ''})

  background
    .on('mousemove',function(){
      var mouse = d3.mouse(this)
      var column = Math.floor((mouse[0]-margin.innerLeft)/x.step())
      hoverbackground
        .attr('x',x(column))
        .attr('fill-opacity',0.6)
      if(days[column]){
        tooltip.classed("hidden", false)
          .attr('style',`left:${d3.event.x+20}px;top:${d3.event.y+10}px`)
          .html(`
          <table>
            ${Object.values(days[column].projects).map(p => `
              <tr>
                <td><div class="swatch" style="background-color:${p.project.color}"></div></td>
                <td>${time(p.total)}</td>
                <td><em>${Math.round((p.total/days[column].total)*100)}%</em></td>
              </tr>
            `).join('')}
            <tr>
              <td>∑</td>
              <td>${time(days[column].total)}</td>
            </tr>
          </table>`)
      } else {
        tooltip.classed("hidden", true);
      }
    })
}