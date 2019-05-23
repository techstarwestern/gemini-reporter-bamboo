'use strict';

var inherit = require('inherit'),
    _ = require('lodash'),
    chalk = require('chalk'),
	fs = require('fs'),

    RunnerEvents = require('../gemini/lib/constants/events'),

    ICON_SUCCESS = chalk.green('\u2713'),
    ICON_FAIL = chalk.red('\u2718'),
    ICON_WARN = chalk.bold.yellow('!');

var Runner = inherit({
    attachRunner: function(runner) {
        runner.on(RunnerEvents.BEGIN, this._onBegin.bind(this));
        runner.on(RunnerEvents.END_TEST, this._onEndTest.bind(this));
        runner.on(RunnerEvents.CAPTURE, this._onCapture.bind(this));
        runner.on(RunnerEvents.ERROR, this._onError.bind(this));
        runner.on(RunnerEvents.WARNING, this._onWarning.bind(this));
        runner.on(RunnerEvents.END, this._onEnd.bind(this));
        runner.on(RunnerEvents.INFO, this._onInfo.bind(this));
        runner.on(RunnerEvents.SKIP_STATE, this._onSkipState.bind(this));
    },

    _compile: function(tmpl, data) {
        return _.template(tmpl, {
            imports: {
                chalk: chalk
            }
        })(data);
    },

    _onBegin: function() {
		this.beginTestTime = this.startTime = new Date();
		this.suiteSet = {};
		this.results = {
			stats:{},
			passes:[],
			failures:[],
			skipped:[]
		};
    },

    _onEndTest: function(result) {
        var handler = result.equal? this._onCapture : this._onError;
        handler.call(this, result);
    },

    _onCapture: function(result) {
		var pass = this._createResult(result);
		this.results.passes.push(pass);
    },

    _onError: function(result) {
		var error = this._createResult(result);
		error.error = result.message;
		this.results.failures.push(error);
    },

    _onWarning: function(result) {
		var warn = this._createResult(result);
		warn.warning = result.message;
		this.results.skipped.push(warn);
    },

    _onSkipState: function(result) {
		var warn = this._createResult(result);
		warn.warning = result.message;
		this.results.skipped.push(warn);
    },

    _onInfo: function(result) {
        console.log(result.message);
    },

    _onEnd: function() {
        var total = this.results.failures.length + this.results.passes.length + this.results.skipped.length;
        console.log('Total: %s Passed: %s Failed: %s Skipped: %s',
            chalk.underline(total),
            chalk.green(this.results.passes.length),
            chalk.red(this.results.failures.length),
            chalk.cyan(this.results.skipped.length)
        );
		var endTime = new Date();
		var suites = 0;
		for(var k in this.suiteSet){
			suites++;
		}
		this.results.stats = {
			"suites": suites,
			"tests": total,
			"passes": this.results.passes.length,
			"pending": this.results.skipped.length,
			"failures": this.results.failures.length,
			"start": this.startTime.toISOString(),
			"end": endTime.toISOString(),
			"duration": Math.round((endTime - this.startTime) / 1000)
		};
		// Write test results as parsable JSON file
		fs.writeFile('gemini-bamboo.json', JSON.stringify(this.results, null, 2));
    },

	_createResult: function(result){
		var obj = {};
		obj.title = result.state ? result.state.name : "unknown";
		obj.fullTitle = result.suite.path.join(' ');
		obj.browserID = result.browserId;
		obj.duration = this._getDuration();
		this.suiteSet[result.suite.name] = true;
		return obj;
	},

	_getDuration: function(){
		var now = new Date();
		var duration = Math.round((now - this.beginTestTime) / 1000);
		this.beginTestTime = now;
		return duration;
	}

});

module.exports = function(gemini, options){
	var runner = new Runner();
    gemini.on('startRunner', runner.attachRunner.bind(runner));
};
