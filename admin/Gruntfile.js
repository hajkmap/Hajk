module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    licence_text: grunt.file.read('licence_header.txt'),
    
    clean: [
      'dist',
      'node_modules'
    ],
    
    browserify: {
      debug: {
        options: {
          transform: [
            ['babelify', {presets: ['es2015', 'react']}]
          ],
          browserifyOptions: {
            debug: true
          }
        },
        src: ['src/**/*.js', 'src/**/*.jsx'],
        dest: 'dist/js/<%= pkg.name %>.js',
      },
      dist: {
        options: {
          transform: [
            ['babelify', {presets: ['es2015', 'react']}],
          ],
          browserifyOptions: {
            debug: false
          }
        },
        src: ['src/**/*.js', 'src/**/*.jsx'],
        dest: 'dist/js/<%= pkg.name %>.min.js',
      }
    },

    uglify: {
      options: {
        mangle: true
      },
      target: {
        files: {
          'dist/js/<%= pkg.name %>.min.js': ['dist/js/<%= pkg.name %>.min.js']
        }
      }
    },

    less: {
      production: {
        options: {
        },
        files: {
          'dist/css/hajk-admin.css': 'src/less/*.less'
        }
      }
    },

    env: {
        prod: {
            NODE_ENV: 'production'
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
            'dist/js/<%= pkg.name %>.min.js'
          ]
        }
      }
    },

    copy: {
      main: {
        files: [
          {
            src: "src/static/config.json",
            dest: "dist/config.json"
          },
          {
            src: "src/static/index.html",
            dest: "dist/index.html"
          },
          {
            src: "src/static/debug.html",
            dest: "dist/debug.html"
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
        ]
      }
    },
    connect: {
      debug: {
        options: {
          livereload: true,
          hostname: 'localhost',
          port: 3000,
          base: 'dist'
        }
      }
    },
    proxy: {
      proxy1: {
        options: {
          port: 9000, // We will access debug environment through localhost:9000
          router: {
            'localhost/mapservice': 'http://localhost:80/mapservice/', // Create a virtual route on 9000 that redirects to IIS' /mapservice. NB: Make sure to have IIS running! //localhost/mapservice must be available.
            'localhost/postProxy.aspx': 'http://localhost:80/postProxy.aspx', // proxy runs on IIS too, so it isn't available on port 9000. Since it isn't in /mapservice subdir, we need to be explicit about it
            'localhost/Temp': 'http://localhost:80/Temp/', // Similar fix for Temp where PDF/Tiff exports are placed
            'localhost/util': 'http://localhost:80/util',
            'localhost': 'http://localhost:3000' // Redirect all request from 9000 to 3000, since /mapservice is not available on 3000 but only via the virtual route on 9000.
          },
          changeOrigin: true
        }
      }
    },
    watch: {
      css: {
        files: ['src/less/**/*.less'],
        tasks: ['copy', 'less:production', 'browserify:debug'],
        options: {
          livereload: true
        }
      },
      jsx: {
        files: [
          'src/js/**/*.jsx'
        ],
        tasks: ['copy', 'less:production', 'browserify:debug'],
        options: {
          livereload: true
        }
      },
      js: {
        files: [
          'src/js/**/*.js'
        ],
        tasks: ['copy', 'less:production', 'browserify:debug'],
        options: {
          livereload: true
        }
      },
      statics: {
        files: [
          'src/static/clientconfig.json',
          'src/static/index.html'
        ],
        tasks: ['copy', 'less:production', 'browserify:debug'],
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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-proxy');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-usebanner');
  grunt.loadNpmTasks('grunt-env');

  grunt.registerTask('default', ['debug', 'release']);
  grunt.registerTask('debug', ['copy', 'less:production', 'browserify:debug']);
  grunt.registerTask('release', ['copy', 'less:production', 'env', 'browserify:dist', 'uglify', 'licence']);
  grunt.registerTask('licence', ['usebanner']);
  grunt.registerTask('livedebug', ['connect:debug', 'proxy:proxy1', 'watch']);
};
