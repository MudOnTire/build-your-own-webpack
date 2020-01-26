(function(modules) {

  function require(id) {
    const [fn, mapping] = modules[id];

    function localRequire(relPath) {
      return require(mapping[relPath]);
    }

    const localModule = {
      exports: {}
    };

    fn(localRequire, localModule, localModule.exports);

    return localModule.exports;
  }

  require(0);

})({
  0: [
    function(require, module, exports) {
      "use strict";

      var _greeting = _interopRequireDefault(require("./greeting.js"));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
          "default": obj
        };
      }

      console.log(_greeting["default"]);
    },
    {
      "./greeting.js": 1
    }
  ],
  1: [
    function(require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports["default"] = void 0;

      var _name = require("./name.js");

      var _default = "hello ".concat(_name.name, "!");

      exports["default"] = _default;
    },
    {
      "./name.js": 2
    }
  ],
  2: [
    function(require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.name = void 0;
      var name = 'MudOnTire';
      exports.name = name;
    },
    {}
  ],
})