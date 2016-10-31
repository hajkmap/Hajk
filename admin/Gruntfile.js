
var matchdep = require('matchdep');

module.exports = function (grunt) {

    require("load-grunt-tasks")(grunt);

    matchdep.filterDev('grunt-*', './package.json').forEach(grunt.loadNpmTasks);

    grunt.initConfig({

      licence_text: grunt.file.read('licence_header.txt'),

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
            { cwd: "src/static/fonts", src: "*", dest: "dist/fonts", expand: true },
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
            "src/js/views/compiled/search.js": ["src/js/views/search.jsx"],
            "src/js/views/compiled/edit.js": ["src/js/views/edit.jsx"],
            "src/js/views/compiled/map.js": ["src/js/views/map.jsx"],
            "src/js/views/compiled/info.js": ["src/js/views/info.jsx"],
            "src/js/views/compiled/release.js": ["src/js/views/release.jsx"],
            "src/js/views/compiled/alert.js": ["src/js/views/alert.jsx"]
          }
        }
      },

      babel: {
        options: {
          compact: true,
          sourceMap: false,
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

              "views/search":         "./src/js/views/compiled/search.js",
              "views/edit":         "./src/js/views/compiled/edit.js",

              "views/map":          "./src/js/views/compiled/map.js",
              "views/info":          "./src/js/views/compiled/info.js",
              "views/release":      "./src/js/views/compiled/release.js",
              "views/alert":        "./src/js/views/compiled/alert.js",

              "models/application": "./src/js/models/application.js",
              "models/menu":        "./src/js/models/menu.js",
              "models/manager":     "./src/js/models/manager.js",

              "models/search":      "./src/js/models/search.js",
              "models/edit":      "./src/js/models/edit.js",

              "models/map":         "./src/js/models/map.js",
              "models/info":        "./src/js/models/info.js",
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
          compress: {
            drop_console: true
          },
          sourceMap: true,
          sourceMapName: 'dist/js/<%= pkg.name %>-<%= pkg.version %>.js.map'
        },
        dist: {
          files: {
            'dist/js/<%= pkg.name %>-<%= pkg.version %>.min.js': [
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
        licence: {
          src: ['src/**/*.js', 'src/**/*.jsx'],
          overwrite: true,
          replacements: [{
            from: '<%= licence_text %>',
            to: ''
          }]
        },

        debughtml: {
          src: ['dist/index.html'],
          dest: 'dist/index.html',
          replacements: [{
            from: '{js}',
            to: '<script src="js/<%= pkg.name %>-<%= pkg.version %>.min.js"></script>'
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
      },

      usebanner: {
        taskName: {
          options: {
            position: 'top',
            banner: '<%= licence_text %>',
            linebreak: true
          },
          files: {
            src: [
              //'src/**/*.js',
              //'src/**/*.jsx'
              'dist/js/<%= pkg.name %>-<%= pkg.version %>.min.js'
            ]
          }
        }
      }

    });

    grunt.registerTask('clean', 'Clean dist folder', function() {
      var pkg = grunt.file.readJSON('package.json');
      grunt.file.delete(`dist/js/${pkg.name}-transpiled.js`);
    });

    grunt.registerTask('build', ['copy:debug', 'replace:debughtml', 'less', 'autoprefixer:core', 'concat:css', 'react:admin', 'browserify:app', 'babel', 'replace:bablecleanup', 'uglify', 'usebanner', 'clean']);

    grunt.registerTask('licence', ['usebanner']);

    grunt.registerTask('unlicence', ['replace:licence']);

    grunt.registerTask('debug', ['watch']);

};
