var matchdep = require('matchdep');

module.exports = function (grunt) {

    require("load-grunt-tasks")(grunt);

    matchdep.filterDev('grunt-*', './package.json').forEach(grunt.loadNpmTasks);

    var jsconfig = require('./jsconfig.json');

    grunt.initConfig({

      licence_text: grunt.file.read('licence_header.txt'),

      pkg: grunt.file.readJSON('package.json'),

      cssFiles: [
        'compiled/<%= pkg.name %>.css'
      ],

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
            {
              cwd: "src/static/assets",
              src: "**/*",
              dest: "dist/assets", expand: true
            },
            {
              cwd: "src/static/fonts",
              src: "**/*",
              dest: "dist/fonts", expand: true
            },
            {
              cwd: "node_modules/font-awesome/fonts",
              src: "*",
              dest: "dist/fonts", expand: true
            },
            {
              src: "src/static/index.html",
              dest: "dist/index.html"
            },
            {
              src: "src/static/es6-polyfill.js",
              dest: "dist/js/es6-polyfill.js"
            }
          ]
        },
        release: {
          files: [
            {
              cwd: "src/static/fonts",
              src: "**/*",
              dest: "release/fonts", expand: true
            },
            {
              cwd: "node_modules/font-awesome/fonts",
              src: "*",
              dest: "release/fonts",
              expand: true
            },
            {
              cwd: "src/static/assets",
              src: "**/*",
              dest: "release/assets",
              expand: true
            },
            {
              src: "src/static/index.html",
              dest: "release/index.html"
            },
            {
              src: "src/static/es6-polyfill.js",
              dest: "release/js/es6-polyfill.js"
            }
          ]
        },
        admin: {
          files: [
            {
              src: "release/js/<%= pkg.name %>-<%= pkg.version %>.min.js",
              dest: "../admin/dist/js/<%= pkg.name %>-<%= pkg.version %>.min.js"
            },
            {
              src: "release/assets/<%= pkg.name %>-<%= pkg.version %>.min.css",
              dest: "../admin/dist/assets/<%= pkg.name %>-<%= pkg.version %>.min.css"
            }
          ]
        }
      },

      concat: {
        css: {
          src: ['<%= cssFiles %>'],
          dest: 'dist/assets/<%= pkg.name %>.css'
        },
        jsrelease: {
          src: [
            'dist/js/dependencies.min.js',
            'dist/js/<%= pkg.name %>-<%= pkg.version %>.min.js'
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

      react: jsconfig.react,

      babel: {
        options: {
          compact: true,
          sourceMap: true,
          presets: ['es2015']
        },
        dist: {
          files: {
            // target : source
            'dist/js/<%= pkg.name %>-transpiled.js' : 'compiled/<%= pkg.name %>.js'
          }
        }
      },

      browserify: {
        app: {
          options: {
            transform:  [require('grunt-react').browserify],
            alias: jsconfig.browserify.aliases
          },
          files: {
            'compiled/<%= pkg.name %>.js':  jsconfig.browserify.files
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
        dependencies: {
          sourceMap: false,
          files: {
            'dist/js/dependencies.min.js': ['dist/js/dependencies.js']
          }
        },
        application: {
          banner: '/* <%= pkg.name %> <%= pkg.version %> */',
          sourceMap: false,
          files: {
            'dist/js/<%= pkg.name %>-<%= pkg.version %>.min.js': ['dist/js/<%= pkg.name %>-transpiled.js']
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
            from: '<%= licence_text %>\n',
            to: ''
          }]
        },
        debughtml: {
          src: ['dist/index.html'],
          dest: 'dist/index.html',
          replacements: [{
            from: '{js}',
            to: '<script src="js/es6-polyfill.js" charset="utf-8">\r\n    </script><script src="js/dependencies.js" charset="utf-8"></script>\r\n    <script src="js/<%= pkg.name %>-transpiled.js" charset="utf-8"></script>'
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
            to: '<script src="js/es6-polyfill.js" charset="utf-8"></script>\r\n    <script src="js/<%= pkg.name %>-<%= pkg.version %>.min.js"></script>'
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

      connect: {
        debug: {
          options: {
            livereload: true,
            port: 3000,
            base: 'dist'
          }
        },
        release: {
          options: {
            port: 3000,
            base: 'release',
            keepalive: true
          }
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
            'src/static/clientconfig.json',
            'src/static/index.html'
          ],
          tasks: ['copy:debug', 'replace:debughtml'],
          options: {
            livereload: true
          }
        },
        defs: {
          files: [
            'jsconfig.json'
          ],
          options: { reload: true }
        }
      },

      proxy: {
        proxy1 : {
          options : {
            port: 9000,
            router : {
              'localhost/settings/settings': 'http://192.168.100.78/karta-dev/settings/settings/',
              'localhost': 'http://localhost:3000'
            },
            changeOrigin : true
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
              //'src/**/*.jsx',
              'release/js/<%= pkg.name %>-<%= pkg.version %>.min.js'
            ]
          }
        }
      }

    });

    grunt.registerTask('dependencies', ['browserify:dependencies', 'uglify:dependencies']);

    grunt.registerTask('build', ['copy:debug', 'replace:debughtml', 'less', 'autoprefixer:core', 'concat:css', 'react', 'browserify:app', 'babel', 'replace:bablecleanup']);

    grunt.registerTask('debug', ['connect:debug', 'proxy:proxy1', 'watch']);

    grunt.registerTask('release', ['copy:release', 'replace:releasehtml', 'less', 'concat:css', 'cssmin', 'react', 'browserify:app', 'babel', 'replace:bablecleanup', 'uglify:application', 'concat:jsrelease', 'usebanner', 'copy:admin']);

    grunt.registerTask('default', ['watch']);

    grunt.registerTask('licence', ['usebanner']);

    grunt.registerTask('unlicence', ['replace:licence']);
};
