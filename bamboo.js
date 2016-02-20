'use strict';

var inherit = require('inherit'),
    _ = require('lodash'),
    chalk = require('chalk'),
	fs = require('fs'),

    RunnerEvents = require('../gemini/lib/constants/runner-events'),

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
		this.startTime = new Date();
		this.results = {
			status:{},
			passes:[],
			failures:[],
			skips:[]
		};
    },

    _onEndTest: function(result) {
        var handler = result.equal? this._onCapture : this._onError;
        handler.call(this, result);
    },

    _onCapture: function(result) {
		var pass = {};
		pass.title = result.state.name;
		pass.fullTitle = result.suite.path.join(' ');
		pass.error = result.message;
		pass.browserID = result.browserId;
		pass.duration = 0;
		this.results.passes.push(pass);
    },

    _onError: function(result) {
		var error = {};
		error.title = result.state.name;
		error.fullTitle = result.suite.path.join(' ');
		error.error = result.message;
		error.browserID = result.browserId;
		error.duration = 0;
		this.results.failures.push(error);
    },

    _onWarning: function(result) {
		var warn = {};
		warn.title = result.state.name;
		warn.fullTitle = result.suite.path.join(' ');
		warn.warning = result.message;
		warn.browserID = result.browserId;
		warn.duration = 0;
		this.results.skips.push(warn);
    },

    _onSkipState: function(result) {
		var warn = {};
		warn.title = result.state.name;
		warn.fullTitle = result.suite.path.join(' ');
		warn.warning = result.message;
		warn.browserID = result.browserId;
		warn.duration = 0;
		this.results.skips.push(warn);
    },

    _onInfo: function(result) {
        console.log(result.message);
    },

    _onEnd: function() {
        var total = this.results.failures.length + this.results.passes.length + this.results.skips.length;
        console.log('Total: %s Passed: %s Failed: %s Skipped: %s',
            chalk.underline(total),
            chalk.green(this.results.passes.length),
            chalk.red(this.results.failures.length),
            chalk.cyan(this.results.skips.length)
        );
		var endTime = new Date();
		this.results.status = {
			"suites": 1,
			"tests": total,
			"passes": this.results.passes.length,
			"pending": this.results.skips.length,
			"failures": this.results.failures.length,
			"start": this.startTime.toISOString(),
			"end": endTime.toISOString(),
			"duration": ~~((endTime - this.startTime) / 1000)
		};
		// Write test results as parsable JSON file 
		fs.writeFile('gemini-bamboo.json', JSON.stringify(this.results, null, 2));
    }

});

module.exports = function(gemini, options){
	var runner = new Runner();
    gemini.on('startRunner', runner.attachRunner.bind(runner));
};
