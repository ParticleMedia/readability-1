var CommonUtil = require("./CommonUtil");


function test_expand_string_array() {
    s = ["a", "b", "c", "def", "gh", "xyz"];
    CommonUtil.expand_string_array(s, 4);
    for(var i=0; i<s.length; i++) {
        console.log(s[i]);
    }
}

test_expand_string_array();
