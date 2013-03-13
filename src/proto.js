/**
	Tools and utils needed for various objects that should but do not exist in useless JS libraries
*/



function contains(arr, value) {

    var i = arr.length;
    while (i--) {
        if (arr[i] === value) return true;
    }
    return false;
}

/**

// Useless crap breakes the GUI library for some freaking reason!

Array.prototype.contains = function ( element ) {
   for (i in this) {
       if (this[i] === element) return true;
   }
   return false;
}
*/


function median(array){

	array.sort(function(a, b) { return a - b; });	
	var half = Math.floor(array.length/2);
 
    if(array.length % 2) return array[half];
    else return (array[half-1] + array[half]) / 2.
}


function mean(array){
	var m = 0;
	for (i in array){
		m += array[i];
	}
	m = m/(array.length);
	return m;
}


function min(array){
	if (array.length >1) {
		array.sort(function(a, b) { return a - b; });
		return array[0];
	}
	else if (array.length == 1) return array[0];
		else {
		console.log("MIN: ARRAY EMPTY!")
		return null;
	}
}


function max(array){
	
	if (array.length >1) {
		array.sort(function(a, b) { return a - b; });
		return array[array.length-1];
	}
	else if (array.length == 1) return array[0];
	else {
		console.log("MAX: ARRAY EMPTY!")
		return null;
	}
}

function remove(array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = from < 0 ? array.length + from : from;
  return array.push.apply(array, rest);
};







