
var matchdep = require('matchdep');

module.exports = function (grunt) {

    require("load-grunt-tasks")(grunt);

    matchdep.filterDev('grunt-*', './package.json').forEach(grunt.loadNpmTasks);

    grunt.initConfig({

      pkg: grunt.file.readJSON('package.json'),

      cssFiles: ['compiled/<%= pkg.name %>.css'],

      less: {
        development: {
          files: {
            'compiled/<%= pkg.name %>.css': 'src/less/index.less'
          }
        }
      },

      copy: {
        debug: {
          files: [
            { cwd: "src/static/assets", src: "**/*", dest: "dist/assets", expand: true },
            { cwd: "node_modules/font-awesome/fonts", src: "*", dest: "dist/fonts", expand: true },
            { src: "src/static/index.html", dest: "dist/index.html" },
            { src: "src/static/config.json", dest: "dist/config.json" },
            { src: "src/static/es6-polyfill.js", dest: "dist/js/es6-polyfill.js" },
          ]
        }
      },

      concat: {
        css: {
          src: ['<%= cssFiles %>'],
          dest: 'dist/assets/<%= pkg.name %>.css'
        },
        jsrelease:{
          src:[
              'dist/js/dependencies.js',
              'release/js/<%= pkg.name %>-<%= pkg.version %>.min.js'
             ],
          dest: 'release/js/<%= pkg.name %>-<%= pkg.version %>.min.js'
        }
      },

      autoprefixer: {
         options: {
            browsers: [
               "Android 2.3",
               "Android >= 4",
               "Chrome >= 20",
               "Firefox >= 24",
               "Explorer >= 8",
               "iOS >= 6",
               "Opera >= 12",
               "Safari >= 6"
            ]
         },
         core: {
            options: {
               map: true
            },
            src: 'compiled/<%= pkg.name %>.css'
         }
      },

      react: {
        "admin": {
          "files": {
            "src/js/views/compiled/application.js": ["src/js/views/application.jsx"],
            "src/js/views/compiled/manager.js": ["src/js/views/manager.jsx"],
            "src/js/views/compiled/menu.js": ["src/js/views/menu.jsx"],
            "src/js/views/compiled/map.js": ["src/js/views/map.jsx"],
            "src/js/views/compiled/release.js": ["src/js/views/release.jsx"],
            "src/js/views/compiled/alert.js": ["src/js/views/alert.jsx"]
          }
        }
      },

      babel: {
        options: {
          compact: true,
          sourceMap: true,
          presets: ['es2015']
        },
        dist: {
          files: {
            'dist/js/<%= pkg.name %>-transpiled.js' : 'compiled/<%= pkg.name %>.js'
          }
        }
      },

      browserify: {
        app: {
          options: {
            transform:  [require('grunt-react').browserify],
            alias: {
              "views/application":  "./src/js/views/compiled/application.js",
              "views/manager":      "./src/js/views/compiled/manager.js",
              "views/menu":         "./src/js/views/compiled/menu.js",
              "views/map":          "./src/js/views/compiled/map.js",
              "views/release":      "./src/js/views/compiled/release.js",
              "views/alert":        "./src/js/views/compiled/alert.js",
              "models/application": "./src/js/models/application.js",
              "models/manager":     "./src/js/models/manager.js",
              "models/menu":        "./src/js/models/menu.js",
              "models/map":         "./src/js/models/map.js",
              "models/release":     "./src/js/models/release.js"
            }
          },
          files: {
            'compiled/<%= pkg.name %>.js': ["src/js/index.js"]
          }
        },
        dependencies: {
          options: {
          },
          files: {
            'dist/js/dependencies.js': ['src/js/dependencies.js']
          }
        }
      },

      uglify: {
        options: {
          banner: '/* <%= pkg.name %> <%= pkg.version %> */',
          compress: {
            drop_console: true
          },
          sourceMap: true,
          sourceMapName: 'release/js/<%= pkg.name %>-<%= pkg.version %>.js.map'
        },
        dist: {
          files: {
            'release/js/<%= pkg.name %>-<%= pkg.version %>.min.js': [
              'dist/js/dependencies.js',
              'dist/js/<%= pkg.name %>-transpiled.js'
            ]
          }
        }
      },

      cssmin: {
        options: {
          shorthandCompacting: false,
          roundingPrecision: -1
        },
        target: {
          files: {
            'release/assets/<%= pkg.name %>-<%= pkg.version %>.min.css': ['dist/assets/<%= pkg.name %>.css']
          }
        }
      },

      replace: {
        debughtml: {
          src: ['dist/index.html'],
          dest: 'dist/index.html',
          replacements: [{
            from: '{js}',
            to: '<script src="js/dependencies.js" charset="utf-8"></script>\r\n    <script src="js/<%= pkg.name %>-transpiled.js" charset="utf-8"></script>'
          }, {
            from: '{css}',
            to: '<link rel="stylesheet" href="assets/<%= pkg.name %>.css" charset="utf-8">'
          }]
        },

        releasehtml: {
          src: ['release/index.html'],
          dest: 'release/index.html',
          replacements: [{
            from: '{js}',
            to: '<script src="js/<%= pkg.name %>-<%= pkg.version %>.min.js"></script>'
          }, {
            from: '{css}',
            to: '<link rel="stylesheet" href="assets/<%= pkg.name %>-<%= pkg.version %>.min.css" charset="utf-8">'
          }]
        },

        bablecleanup: {
          src: ['dist/js/<%= pkg.name %>-transpiled.js'],
          dest: 'dist/js/<%= pkg.name %>-transpiled.js',
          replacements: [{
            from: '"use strict";',
            to: ''
          }, {
            from: 'require = ',
            to: 'var require = '
          }]
        }
      },

      watch: {
          css: {
            files: ['src/less/**/*.less'],
            tasks: ['less', 'autoprefixer:core', 'concat:css'],
            options: {
              livereload: true
            }
          },
          jsx: {
            files: [
              'src/js/**/*.jsx'
            ],
            tasks: ['react', 'browserify:app', 'babel', 'replace:bablecleanup'],
            options: {
              livereload: true
            }
          },
          js: {
            files: [
              'src/js/**/*.js'
            ],
            tasks: ['browserify:app', 'babel', 'replace:bablecleanup'],
            options: {
              livereload: true
            }
          },
          statics: {
            files: [
              'src/static/config.json',
              'src/static/index.html'
            ],
            tasks: ['copy:debug', 'replace:debughtml'],
            options: {
              livereload: true
            }
          }
      }

    });

    grunt.registerTask('dependencies', ['browserify:dependencies']);

    grunt.registerTask('build', ['copy:debug', 'replace:debughtml', 'less', 'autoprefixer:core', 'concat:css', 'react:admin', 'browserify:app', 'babel', 'replace:bablecleanup']);

    grunt.registerTask('debug', ['watch']);

};
