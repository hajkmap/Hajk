module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

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
    }

  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', ['build', 'release']);
  grunt.registerTask('build', ['copy', 'less:production', 'browserify:debug']);
  grunt.registerTask('release', ['copy', 'less:production', 'browserify:dist', 'uglify']);
};
