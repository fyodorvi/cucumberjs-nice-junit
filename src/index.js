const builder = require('junit-report-builder');
const reporter = require('./reporter');

module.exports = function (config) {
    return reporter(config, builder);
};
