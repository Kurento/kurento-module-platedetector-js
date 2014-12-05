/*
 * (C) Copyright 2014 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */


module.exports = function(grunt)
{
  var DIST_DIR = 'dist';

  var pkg = grunt.file.readJSON('package.json');

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    bower:
    {
      TOKEN:      process.env.TOKEN,
      repository: 'Kurento/kurento-module-platedetector-js'
    },

    // Plugins configuration
    clean:
    {
      'doc': '<%= jsdoc.all.dest %>',

      'browser': DIST_DIR,
      'code': 'lib'
    },

    // Generate documentation
    jsdoc:
    {
      all:
      {
        src: [
          'README.md',
          'lib/**/*.js',
          'test/*.js'
        ],
        dest: 'doc/jsdoc'
      }
    },

    // Check if Kurento Module Creator exists
    'path-check':
    {
      'generate plugin': {
        src: 'kurento-module-creator',
        options: {
          tasks: ['shell:kmd']
        }
      }
    },

    shell:
    {
      // Generate the Kurento Javascript client
      kmd: {
        command: [
          'mkdir -p ./lib',
          'kurento-module-creator --delete'
          +' --templates node_modules/kurento-client/templates'
          +' --deprom node_modules/kurento-client-core/src'
          +' --deprom node_modules/kurento-client-elements/src'
          +' --deprom node_modules/kurento-client-filters/src'
          +' --rom ./src --codegen ./lib'
        ].join('&&')
      },

      // Publish / update package info in Bower
      bower: {
        command: [
          'curl -X DELETE "https://bower.herokuapp.com/packages/<%= pkg.name %>?auth_token=<%= bower.TOKEN %>"',
          'node_modules/.bin/bower register <%= pkg.name %> <%= bower.repository %>',
          'node_modules/.bin/bower cache clean'
        ].join('&&')
      }
    },

    // Generate browser versions and mapping debug file
    browserify:
    {
      options: {
        external: ['kurento-client']
      },

      'require':
      {
        src:  '<%= pkg.main %>',
        dest: DIST_DIR+'/<%= pkg.name %>_require.js'
      },

      'standalone':
      {
        src:  '<%= pkg.main %>',
        dest: DIST_DIR+'/<%= pkg.name %>.js',

        options: {
          browserifyOptions: {
            standalone: '<%= pkg.name %>',
          }
        }
      },

      'require minified':
      {
        src:  '<%= pkg.main %>',
        dest: DIST_DIR+'/<%= pkg.name %>_require.min.js',

        options:
        {
          browserifyOptions: {
            debug: true
          },
          plugin: [
            ['minifyify',
             {
               compressPath: DIST_DIR,
               map: '<%= pkg.name %>.map'
             }]
          ]
        }
      },

      'standalone minified':
      {
        src:  '<%= pkg.main %>',
        dest: DIST_DIR+'/<%= pkg.name %>.min.js',

        options:
        {
          browserifyOptions: {
            debug: true,
            standalone: '<%= pkg.name %>'
          },
          plugin: [
            ['minifyify',
             {
               compressPath: DIST_DIR,
               map: '<%= pkg.name %>.map',
               output: DIST_DIR+'/<%= pkg.name %>.map'
             }]
          ]
        }
      }
    },

    // Generate bower.json file from package.json data
    sync:
    {
      bower:
      {
        options:
        {
          sync: [
            'name', 'description', 'license', 'keywords', 'homepage',
            'repository'
          ],
          overrides: {
            authors: (pkg.author ? [pkg.author] : []).concat(pkg.contributors || []),
            ignore: ['doc/', 'lib/', 'Gruntfile.js', 'package.json'],
            main: DIST_DIR+'/<%= pkg.name %>.js'
          }
        }
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-path-check');
  grunt.loadNpmTasks('grunt-shell');

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-npm2bower-sync');

  // Alias tasks
  grunt.registerTask('generate', ['path-check:generate plugin', 'browserify']);
  grunt.registerTask('default',  ['clean', 'jsdoc', 'generate', 'sync:bower']);
  grunt.registerTask('bower',    ['shell:bower']);
};
