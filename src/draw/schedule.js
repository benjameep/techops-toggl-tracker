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

const x = d3.scaleBand().padding(0.1)
const y = d3.scaleLinear()
const margin = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 20,
  innerLeft: 25, // The padding between the Time and first column
}

/* Dimensions of the chart */
let width,height

/* Containers */
let
  tooltip,
  svg,
  chart,
  xAxis,
  yAxis,
  hoverbackground,
  background,
  $entries

export function initialize(container){
  /* Remove all of the children */
  d3.select(container).selectAll('*').remove()
  
  /* Create the SVG */
  svg = d3.select(container).append('svg')
    .attr('width',752)
    .attr('height',500)

  /* Calculate the inner dimensions */
  width = svg.node().clientWidth - margin.left - margin.right - margin.innerLeft
  height = svg.node().clientHeight - margin.top - margin.bottom

  /* Update the ranges of the axies */
  x.rangeRound([margin.innerLeft, width+margin.innerLeft]).padding(0.1)
  y.rangeRound([0, height])

  /* Create all of the containers */
  tooltip = d3.select(container).append('div').attr('class','tooltip')
  chart = svg.append("g").attr('class','chart').attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  xAxis = chart.append("g").attr('class', 'axis axis--x')
  yAxis = chart.append("g").attr('class', 'axis axis--y')
  hoverbackground = chart.append('rect')
    .attr('fill','#eee')
    .attr('fill-opacity',0)
    .attr('y',2)
  background = chart.append('rect')
    .attr('class','background')
    .attr('height',height)
    .attr('fill-opacity',0)
    .on('mouseout',function(){
      hoverbackground.attr('fill-opacity',0)
      tooltip.classed("hidden", true);
    })

  $entries = chart.append('g').attr('class','entries')
}

/* Called everytime there is an update to the projects */
function updateEntries(entries){
  var _entries = $entries.selectAll('.entry').data(entries)
  _entries.exit().remove()
  _entries.enter().append('rect')
    .attr('class','entry')
    .on('mousemove',onmousemove)
  .merge(_entries)
    .attr('x',d => x(d.day))
    .attr('y',d => y(d.time[0]))
    .attr('width',d => x.bandwidth())
    .attr('height',d => y(d.time[1]) - y(d.time[0]))
    .attr('fill',d => d.project_hex_color)
}

export function update([start,end],isWeek,entries){
  y.domain([
    Math.min(morning,...entries.map(d => d.time[0])),
    Math.max(afternoon,...entries.map(d => d.time[1])),
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

  updateEntries(entries)

  background
    .on('mousemove',onmousemove)
    .on('mouseout',onmouseout)
}

function onmousemove(entry){
  var mouse = d3.mouse(this)
  var column = Math.floor((mouse[0]-margin.innerLeft)/x.step())
  hoverbackground
    .attr('x',x(column))
    .attr('fill-opacity',0.6)

  // if hovering over entry
  if(entry){
    tooltip.classed('hidden',false)
      .style('left',d3.event.x+20)
      .style('right',d3.event.y+10)
      .html(time(entry.time[1] - entry.time[0]))
  } else {
    tooltip.classed('hidden',true)
  }
}
function onmouseout(){
  tooltip.classed('hidden',true)
}