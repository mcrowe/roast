'use strict'

module.exports = function() {
  return {
    visitor: {
      JSXAttribute: function(node) {
        if (node.node.name.name === 'cl') {
          node.node.name.name = 'className'  
        }
      }
    }
  }
}
