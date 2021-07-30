/**
 * @param {*} l list of strings. it is also output
 * @param {*} n integer, number of strings to append
 * e.g. l: ['a', 'b', 'c'], n=2
 * after the function, l is changed to ['a', 'b', 'c', 'a b', 'a c', 'b c', 'a b c']
 */
function expand_string_array(l, n) {
    if(n<=1) {
        return;
    }
    var length_0 = l.length;
    if(length_0 == 0) {
        return;
    }
    var ids = [];
    for(var i=0; i<length_0; i++) {
        ids.push([i]);
    }
    var from = 0;
    for(var i=2; i<=n; i++) { //iterate n loops
        var j = from;
        from = ids.length;  //set the from position for the next loop
        for(; j<from; j++) {
            var x = ids[j][i-2];
            for(var k=x+1; k<length_0; k++) {
                var a = ids[j].slice();
                a.push(k);
                ids.push(a);
            }
        }
    }
    for(var i=length_0; i<ids.length; i++) {
        var s = ""
        for(var j=0; j<ids[i].length; j++) {
            if(j>0) {
                s += " ";
            }
            s += l[ids[i][j]];
        }
        l.push(s);
    }
}

module.exports.expand_string_array = expand_string_array;
