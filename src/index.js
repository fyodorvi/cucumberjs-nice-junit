const builder = require('junit-report-builder');
const reporter = require('./reporter');

module.exports.registerReporter = function (cucumber, config) {
    return reporter(config, builder).call(cucumber);
};
