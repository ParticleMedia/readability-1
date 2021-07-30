function node_to_xpaths_once(node) {
    if(node == null) {
        return null;
    }
    nodeName = node.nodeName;
    var attributes = [];
    if(node.attributes != null) {
        for(var i=0; i<node.attributes.length; i++) {
            attributes.push([node.attributes[i].nodeName, node.attributes[i].nodeValue]);
        }
    }
    return {"nodeName": nodeName, "attributes": attributes}
}

function node_to_xpaths_recursive(node) {
    xpaths = []
    while(node != null) {
        xpath = node_to_xpaths_once(node)
        xpaths.push(xpath)
        node = node.parentNode;
    }
    return xpaths;
}

function match_once(node_xpath, xpath_pattern) {
    node_name_pattern = xpath_pattern["nodeName"]
    if(node_name_pattern != null) {
        node_name = node_xpath["nodeName"]
        if(node_name == null) {
            return false;
        }
        if(node_name != node_name_pattern) {
            return false;
        }
    }
    attributes_pattern = xpath_pattern["attributes"]
    if(attributes_pattern == null) {
        for(var key in xpath_pattern) {
            var value_pattern = xpath_pattern[key]
            var value = node_xpath[key]
            if(value==null || value != value_pattern) {
                return false;
            }
        }
    }
    return true;
}

function match(node_xpaths, xpath_pattern) {
    if(node_xpaths.length == 0 || xpath_pattern.length == 0) {
        return false;
    }
    return match(node_xpaths, xpath_pattern, 0, 0);
}

function match(node_xpaths, xpath_pattern, from_xpaths, from_pattern) {
    while(from_xpaths < node_xpaths.length) {
        if(match_once(node_xpaths[from_xpaths], xpath_pattern[from_pattern])) {
            if(from_pattern >= xpath_pattern.length) {
                return true
            }    
            from_pattern += 1;
        }
        from_xpaths += 1
    }
    return false
}

module.exports.node_to_xpaths_recursive = node_to_xpaths_recursive;
