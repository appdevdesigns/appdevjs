fs      = require 'fs'
path    = require 'path'
async   = require './server/node_modules/async'
{print} = require 'util'
{spawn} = require 'child_process'

testCodes  = []

task 'build', 'Build project', ->
  build()

task 'test', 'Run tests', ->
  test()

build = (callback) ->
  builder = (args...) ->
    (callback) ->
      coffeeCmd = 'coffee' + if process.platform is 'win32' then '.cmd' else ''
      coffee = spawn coffeeCmd, args
      coffee.stderr.on 'data', (data) -> process.stderr.write data.toString()
      coffee.stdout.on 'data', (data) -> print data.toString()
      coffee.on 'exit', (code) -> callback?(code,code)
  async.parallel [
    builder('-c', '-o', 'test/lib', 'test/src')
  ], (err, results) -> callback?() unless err

test = ->
  tester = (file) ->
    (callback) ->
      mochaCmd = './node_modules/mocha-phantomjs/node_modules/mocha/bin/mocha' + if process.platform is 'win32' then '.cmd' else ''
      mocha = spawn mochaCmd, ['-u', 'bdd', '-R', 'json', '-t', '200000', '--colors', "test/#{file}"]
      mocha.stdout.pipe process.stdout, end: false
      mocha.stderr.pipe process.stderr, end: false
      mocha.on 'exit', (code) -> callback?(code,code)
  testFiles = ['test.js']
  testers = (tester file for file in testFiles)
  async.series testers, (err, results) -> 
    passed = results.every (code) -> code is 0
    process.exit if passed then 0 else 1



