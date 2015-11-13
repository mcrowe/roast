'use strict'

module.exports = function(plugin) {
  return new plugin.Plugin('babel-plugin-react-cl', {
    visitor: {
      JSXAttribute: function(node) {
        if (node.name.name === 'cl') {
          node.name.name = 'className'  
        }
      }
    }
  })
}