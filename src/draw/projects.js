import * as d3 from 'd3';
import moment from 'moment';
import * as database from '../scripts/database';
import * as toggl from '../scripts/toggl'

const x = d3.scaleBand().padding(0.1);
const y = d3.scaleLinear();


const area = d3.area()
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

const stack = d3.stack()
    .value((d,key) => (d[key] && d[key].sum) || 0)
    .order(d3.stackOrderInsideOut)
    .offset(d3.stackOffsetWiggle)

const margin = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 20,
    innerLeft: 25, // The padding between the Time and first column
};

/* Project Watcher */
let projectwatcher,
    projects = {};

/* Dimensions of the chart */
let width, height;

/* Containers */
let svg,
    chart,
    xAxis,
    yAxis,
    background

export function initialize(container){

    /* Create the SVG */
    svg = d3.select(container).append('svg')
        .attr('width', 752)
        .attr('height', 500);

    d3.select('chart').append('line')
        .attr('x1', 0)
        .attr('x2', svg.width)
        .attr('y1', 50)
        .attr('y2', 55);
        
    /* Calculate the inner dimensions */
    width = svg.node().clientWidth - margin.left - margin.right - margin.innerLeft;
    height = svg.node().clientHeight - margin.top - margin.bottom;

    chart = svg.append("g").attr('class', 'chart').attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    xAxis = chart.append("g").attr('class', 'axis axis--x');
    yAxis = chart.append("g").attr('class', 'axis axis--y');

    background = chart.append('rect')
        .attr('class', 'background')
        .attr('height', height)
        .attr('fill-opacity', 0)
        .on('mousemove', onmousemove)
        .on('mouseout', onmouseout);

    /* Update the ranges of the axies */
    x.rangeRound([margin.innerLeft, width + margin.innerLeft]).padding(0.1);
    y.rangeRound([0, height]);
    updateYAxis();
}

export function setTimeFrame([start,end],isWeek){

    database.projectSums([start,end],onProjectSums)

    const dates = Array.from({length:end.diff(start,'days')},
        (n,i) => start.clone().add(i,'days').format('MM-DD-YYYY'))

    /* Format the X Axis */
    x.domain(dates);
    xAxis.call(d3.axisTop(x)
        .tickFormat(d => moment(d,'MM-DD-YYYY').format(isWeek ? 'ddd D/M' : 'Do')));
    xAxis.select('.domain').remove();
    xAxis.selectAll('.tick line').remove();
    xAxis.selectAll('.tick text');

    area.x((d,key) => x(d[key].day))

    /* Update the background size */
    background
        .attr('width', x(dates.slice(-1)[0]) + x.bandwidth() - x(dates[0]))
        .attr('x', x(dates[0]));
}

function onProjectSums(err,days){
    if(err) return console.error(err)
    
    days = Object.values(days)

    console.debug('days',days)

    stack.keys(Object.keys(Object.assign({},...days)))
}

function updateYAxis() {
    yAxis.call(d3.axisRight(y)
        .tickValues(d3.range(...y.domain(), (1000 * 60 * 60)))
        .tickFormat(d => moment().startOf('day').add(d).format('h A'))
        .tickSize(width + margin.innerLeft));
    yAxis.select('.domain').remove();
    yAxis.selectAll(".tick:not(:first-of-type) line").attr("stroke", "#ddd");
    yAxis.selectAll(".tick text").attr("x", 0).attr("dy", 12);
}

/* Called every time there is an update to the projects */
function updateProjects(projs) {
    projects = projs
    console.groupCollapsed('got an update for projects');
    console.log(projects);
    console.groupEnd();
}