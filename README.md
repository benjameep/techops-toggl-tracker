# Techops Toggl Tracker


### To get list of github user ids
go to the [byuitechops members page](https://github.com/orgs/byuitechops/people) and run this script
``` js
(function(data){console.log(data);window.open("").document.write('<pre>'+JSON.stringify(data,null,2)+'</pre>')})(Array.from(document.querySelectorAll('[data-bulk-actions-id]')).reduce(function(obj,elm){ obj[elm.getAttribute('data-bulk-actions-id')] = elm.innerText.match(/Member|Owner/).toString(); return obj},{}))
```