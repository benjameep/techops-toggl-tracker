import * as d3 from 'd3';
import moment from 'moment';
import * as database from '../scripts/database';
import * as toggl from '../scripts/toggl'

function time(d) {
    var dur = moment.duration(d);
    return [['days', 'days'], ['hours', 'hours'], ['minutes', 'min'], ['seconds', 'sec']]
        .map(([unit, dis]) => [dis, dur.get(unit)])
        .filter(([unit, time]) => time)
        .slice(0, 2)
        .map(([unit, amount]) => amount + ' ' + (amount == 1 ? unit.replace(/\s$/, '') : unit))
        .join(' ') || (d === 0 ? '0 sec' : 'under a second');
}

const morning = moment('8:00am', 'h:mma').diff(moment().startOf('day'));
const afternoon = moment('5:00pm', 'h:mma').diff(moment().startOf('day'));

const x = d3.scaleBand().padding(0.1);
const y = d3.scaleLinear();
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
let
    tooltip,
    svg,
    chart,
    xAxis,
    yAxis,
    hoverbackground,
    hoverLine,
    hoverTime,
    background,
    $entries;

/* Called when the page first loads */
export function initialize(container) {

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

    /* Create all of the containers */
    tooltip = d3.select(container).append('div').attr('class', 'tooltip');
    chart = svg.append("g").attr('class', 'chart').attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    xAxis = chart.append("g").attr('class', 'axis axis--x');
    yAxis = chart.append("g").attr('class', 'axis axis--y');

    hoverLine = chart.append("line")
        .attr('stroke-width', .5)
        .attr('stroke', '#bbb')
        .attr('x1', 0)
        .attr('x2', width + margin.innerLeft)
    hoverTime = chart.append('text')
        .attr('fill','#bbb')
        .attr('font-size',12)
        .attr('text-anchor','end')
        .attr('x', width + margin.innerLeft)
        
    hoverbackground = chart.append('rect')
        .attr('fill', '#eee')
        .attr('fill-opacity', 0)
        .attr('y', 2)
        .attr('height', height - 2);
    background = chart.append('rect')
        .attr('class', 'background')
        .attr('height', height)
        .attr('fill-opacity', 0)
        .on('mousemove', onmousemove)
        .on('mouseout', onmouseout);
    $entries = chart.append('g').attr('class', 'entries');

    /* Update the ranges of the axies */
    x.rangeRound([margin.innerLeft, width + margin.innerLeft]).padding(0.1);
    // Temporarily set to default 8am to 5pm, 
    // will be updated when get actual data
    y.rangeRound([0, height])
        .domain([morning, afternoon]);
    updateYAxis();

    projectwatcher = database.ProjectWatcher().onproject(updateProjects);
}

/* Called whenever the time frame changes */
export function setTimeFrame([start, end], isWeek) {

    // retrieve the data from toggl
    toggl.report([start,end], database.user)
        .then(setEntries)
        .catch(err => {
            console.log('Behold an error: ', err);
  
            // TODO: display error
    
            splash.classList.remove('d-none');
            svg.classList.add('d-none');
        })

    /* Format the X Axis */
    x.domain(d3.range(end.diff(start, 'days') + 1));
    xAxis.call(d3.axisTop(x)
        .tickFormat((d, i) => start.clone().add(i, 'day').format(isWeek ? 'ddd D/M' : 'Do')));
    xAxis.select('.domain').remove();
    xAxis.selectAll('.tick line').remove();
    xAxis.selectAll('.tick text');

    /* Update the background size */
    background
        .attr('width', x(x.domain().length - 1) + x.bandwidth() - x(0))
        .attr('x', x(0));
    hoverbackground
        .attr('width', x.bandwidth());

    /* Remove all old children */
    $entries.selectAll('rect').remove();
}

/* Called when need to update the y axis like when stretching from entries */
function updateYAxis() {
    yAxis.call(d3.axisRight(y)
        .tickValues(d3.range(...y.domain(), (1000 * 60 * 60)))
        .tickFormat(d => moment().startOf('day').add(d).format('h A'))
        .tickSize(width + margin.innerLeft));
    yAxis.select('.domain').remove();
    yAxis.selectAll(".tick:not(:first-of-type) line").attr("stroke", "#ddd");
    yAxis.selectAll(".tick text").attr("x", 0).attr("dy", 12);
}

/* Called everytime there is an update to the entries */
function setEntries(entries) {
    /* Register all of the projects we want to watch */
    projectwatcher.watch(entries.map(entry => entry.pid));
    /* Stretch the y domain to include all entries*/
    y.domain([
        Math.min(morning, ...entries.map(d => d.time[0])),
        Math.max(afternoon, ...entries.map(d => d.time[1])),
    ].map((n, i) => (Math.floor(n / (1000 * 60 * 60)) + i) * 1000 * 60 * 60));
    updateYAxis();

    var _entries = $entries.selectAll('.entry').data(entries);
    _entries.exit().remove();
    _entries.enter().append('rect')
        .attr('class', 'entry')
        .on('mousemove', onmousemove)
        // .on('mouseover', onmouseover)
        .merge(_entries)
        .attr('x', d => x(d.daydiff))
        .attr('y', d => y(d.time[0]))
        .attr('width', d => x.bandwidth())
        .attr('height', d => y(d.time[1]) - y(d.time[0]));
}

/* Called every time there is an update to the projects */
function updateProjects(projs) {
    projects = projs
    console.groupCollapsed('got an update for projects');
    console.log(projects);
    console.groupEnd();

    /* Update the entry color */
    $entries.selectAll('.entry')
        .attr('fill', d => projects[d.pid] ? projects[d.pid].color : 'none');
}

function onmousemove(entry) {
    var mouse = d3.mouse(this);

    /* Add a line on the mouse position that says the time*/
    // If it's one solid line, the background shading disappears sometimes, but adding a space fixes that
    hoverLine
        .attr('y1', mouse[1])
        .attr('y2', mouse[1])
        .attr('stroke-opacity', 1);
    
    var timeOfDay = moment().startOf('day').milliseconds(y.invert(mouse[1])).format('h:mma')

    hoverTime
        .attr('y', mouse[1] - 5)
        .html(timeOfDay)


    var column = Math.floor((mouse[0] - margin.innerLeft) / x.step());
    hoverbackground
        .attr('x', x(column))
        .attr('fill-opacity', 0.6);

    // if hovering over entry
    if (entry) {
        tooltip.style('display', 'unset');

        let tooltipHtml = `<div>${time(entry.time[1] - entry.time[0])}</div>
        <div>${(projects[entry.pid] && projects[entry.pid].name) || ''}</div>
        <div>${entry.description}</div>`;

        tooltip.html(tooltipHtml)
            .style('left', d3.event.pageX + 15 + 'px')
            .style('top', d3.event.pageY + -5 + 'px');
    } else {
        tooltip.style('display', 'none');
    }
}
function onmouseout() {
    tooltip.style('display', 'none');
    hoverbackground.attr('fill-opacity', 0);
    hoverLine.attr('stroke-opacity', 0);
    hoverTime.html('')
}