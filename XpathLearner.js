var XpathUtil = require("./XpathUtil");
var CommonUtil = require("./CommonUtil");

/**
 * Public constructor.
 * @param {Object}       options The options object.
 */
function XpathLearner(options) {
    this.max_attributes_per_pattern = options.max_attributes_per_pattern;
    this.id_class_attributes_only = options.id_class_attributes_only
}

XpathLearner.prototype = {

  _add_pattern: function(pattern_dict, pattern, node) {
    var assiated_nodes = pattern_dict[pattern];
    if(assiated_nodes==null) {
        pattern_dict[pattern] = [];
        assiated_nodes = pattern_dict[pattern];
    }
    assiated_nodes.push(node);
  },

   /**
   * Iterates over a NodeList, calls `filterFn` for each node and removes node
   * if function returned `true`.
   *
   * If function is not passed, removes all the nodes in node list.
   *
   * @param nodes a array of nodes
   * @param node_xpaths a 2D array for a list of xpath list (here one xpath list correponds to a node and its ancestors' xpath)
   * @return dict {tag + "\t" + attribute_name + "=" + attribute_value...: node list}
   */
  _build_tag_attribute_dict: function(nodes, node_xpaths) {
    pattern_dict = {}
    for(var i = 0; i < node_xpaths.length; i++) {
        var node = nodes[i];
        var xpaths = node_xpaths[i];
        for(var j=0; j<xpaths.length; j++) {
            var xpath = xpaths[j];
            var tag = xpath["nodeName"];
            var attribute_strings = []
            for(var k=0; k<xpath.attributes.length; k++) {
                if(this.id_class_attributes_only) {
                    if(key.toLowerCase() != "id" && key.toLowerCase() != "class") {
                        continue;
                    }
                }
                var attribute = xpath.attributes[k]
                var key = attribute[0];
                var value = attribute[1];
                attribute_strings.push(key + "=" + value);
            }
            CommonUtil.expand_string_array(attribute_strings, this.max_attributes_per_pattern);
            this._add_pattern(pattern_dict, tag, node);
            for(var k=0; k<attribute_strings.length; k++) {
                var pattern = tag + " " + attribute_strings[k];
                this._add_pattern(pattern_dict, tag, node);
            }
        }
    }
  },

  /*
   * @param pattern_dict is a dict from pattern to node list
   * @param positive_nodes set of nodes
   * @param negative_nodes set of nodes
   * @return list of patterns
   */
  _rule_discovery: function(pattern_dict, positive_nodes, negative_nodes) {
    pr_dict = {}
    for(var pattern in pattern_dict) {
        pr_dict[pattern] = [0.0, 0.0]
        nodes = pattern_dict[pattern];
        for(var i=0; i<nodes.length; i++) {
            node = nodes[i];
            if(positive_nodes.has(node)) {
                pr_dict[pattern][0] += 1.0;
            }
            else if(negative_nodes.has(node)) {
                pr_dict[pattern][1] += 1.0;
            }
        }
    }
    var max_p_count = 0.0;
    var highest_precision = 0.0;
    var best_pattern = null;
    for(var pattern in pattern_dict) {
        var p_count = pr_dict[pattern][0];
        if(p_count == 0) {
            continue;
        }
        var n_count = pr_dict[pattern][1];
        var precision = p_count / (p_count + n_count);
        if((p_count >= max_p_count && precision > highest_precision) 
        || (p_count > max_p_count && precision >= highest_precision)) {
            max_p_count = p_count;
            highest_precision = precision;
            best_pattern = pattern;
        }
    }
    if(best_pattern == null) {
        return null;
    }
    if(p_count==positive_nodes.length && highest_precision == 1.0) {
        return {"pattern": pattern, "next": []}
    }
    covering_positive = new Set();
    missing_positive = new Set();
    causing_negative = new Set();
    nodes = new Set(pattern_dict[best_pattern]);
    for(var node in positive_nodes) {
        if(!nodes.has(node)) {
            missing_positive.add(node);
        }
    }
    for(var node in nodes) {
        if(positive_nodes.has(node)) {
            covering_positive.add(node);
        }
        if(!negative_nodes.has(node)) {
            causing_negative.add(node);
        }
    }
    pattern_0 = this._rule_discovery(pattern_dict, covering_positive, causing_negative);
    pattern_1 = this._rule_discovery(pattern_dict, missing_positive, negative_nodes);
    return {"pattern": best_pattern, "next": [pattern_0, pattern_1]};
  },

  rule_discovery: function(text_nodes, matched_nodes, nonmatched_nodes) {
    node_xpaths = []
    for(var i=0; i<text_nodes.length; i++) {
        var xpaths = XpathUtil.node_to_xpaths_recursive(text_nodes[i]);
        node_xpaths.push(xpaths);
    }
    var tag_attribute_dict = this._build_tag_attribute_dict(text_nodes, node_xpaths);
    var rules = this._rule_discovery(tag_attribute_dict, matched_nodes, nonmatched_nodes);
    return rules;
  }
}


global.xpath_learner = new XpathLearner({"max_attributes_per_pattern": 3, "id_class_attributes_only": false});

module.exports.xpath_learner = global.xpath_learner;
