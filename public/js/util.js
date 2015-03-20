(function(global) {
  'use strict';
  
  global.ns = function(namespace){
      var ns = namespace.split('.');
      var here = global;
      for (var i = 0, l = ns.length; i < l; i++){
          if (typeof(here[ns[i]]) == 'undefined') here[ns[i]] = {};
          here = here[ns[i]];
      }
      return here;
  }
}).call(this, this);