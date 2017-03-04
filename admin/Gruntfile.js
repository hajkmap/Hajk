module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),    

    browserify: {
      dist: {
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
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('build', ['copy', 'less:production', 'browserify']);
};
