const _ = require('lodash');
const path = require('path');

function cucumberJUnitReporter(providedConfig, builder) {

    const config = _.defaults(providedConfig || {}, {
        reportDir: 'test_reports',
        reportPrefix: 'TEST-',
        reportSuffix: '.junit',
        reportFile: 'test_results.xml',
        oneReportPerFeature: true,
        numberSteps: true
    });

    let suite = builder;
    let featurePath;
    let featureName;
    let scenarioName;

    let scenarioOutput = [];
    let scenarioResult;
    let scenarioFailed = false;
    let scenarioSkipped = false;
    let scenarioFailureException;
    let scenarioFailureExceptionStack;
    let scenarioDuration;
    let featureDuration;

    function getCurrentTestClassName() {
        let testClassName = '';
        if (featureName) {
            testClassName += 'Feature: ' + featureName.replace(/\./g, ' ');
        }
        if (scenarioName) {
            testClassName += '.Scenario: ' + scenarioName.replace(/\./g, ' ');
        }
        return testClassName;
    }

    function getFeatureReportPath() {
        let reportName = config.reportPrefix +
            featurePath.replace(/[\/]/g, '.') +
            config.reportSuffix;
        return path.join(config.reportDir, reportName);
    }

    function getGlobalReportPath() {
        return path.join(config.reportDir, config.reportFile);
    }

    function getStepName(stepCount, step) {
        let name = '';
        if (config.numberSteps) {
            if (stepCount < 10) {
                name += '0';
            }
            name += stepCount + '. ';
        }
        name += step.getKeyword() + step.getName();
        return name;
    }

    function formatTime(duration) {
        if (typeof duration === 'number') {
            return Math.round(duration / 1e6) / 1e3;
        }
        return null;
    }

    function registerHandlers() {

        this.registerHandler('BeforeFeature', function (event, callback) {
            let feature = event.getPayloadItem('feature');
            featureName = feature.getName();
            featurePath = path.relative(process.cwd(), feature.getUri());
            suite = builder.testSuite().name(featureName);
            featureDuration = 0;
            callback();
        });

        this.registerHandler('BeforeScenario', function (event, callback) {
            let scenario = event.getPayloadItem('scenario');
            scenarioName = scenario.getName();
            scenarioDuration = 0;
            scenarioOutput = [];
            scenarioFailed = false;
            scenarioSkipped = false;
            callback();
        });

        this.registerHandler('StepResult', function (event, callback) {
            let stepResult = event.getPayloadItem('stepResult');
            let step = stepResult.getStep();
            let stepName = step.getName();

            if (!stepName) {
                callback();
                return;
            }

            scenarioDuration += stepResult.getDuration();
            scenarioResult = stepResult.getStatus();


            scenarioOutput.push({ stepName, status: stepResult.getStatus()});

            if (stepResult.getStatus() == 'failed') {
                scenarioFailed = true;

                let failureException = stepResult.getFailureException();
                scenarioOutput.push(failureException);

                scenarioFailureException = failureException;

                if (failureException.stack) {
                    scenarioFailureExceptionStack = failureException.stack;
                }

                scenarioOutput.push('');
            }

            if (stepResult.getStatus() == 'skipped' && !scenarioFailed) {
                scenarioSkipped = true;
            }


            callback();
        });

        this.registerHandler('AfterScenario', function (event, callback) {
            let scenario = event.getPayloadItem('scenario');
            scenarioName = scenario.getName();

            let testCase = suite.testCase()
                .className(featureName)
                .name(scenarioName);

            const longest = (_.map(scenarioOutput, item => item.stepName + item.status)).sort((a, b) =>  b.length - a.length)[0].length + 1;
            let output = '';

            _.forEach(scenarioOutput, (line, key) => {
                if (line.stepName) {
                    output += line.stepName + '.'.repeat(Math.max(1, longest - (line.stepName.length + line.status.length))) + line.status;
                    if (key != scenarioOutput.length-1) {
                        output += '\n';
                    }
                }
            });

            if (scenarioFailed) {
                testCase.failure(scenarioFailureException).time(formatTime(scenarioDuration || 0)).standardOutput(output);

                if (scenarioFailureExceptionStack) {
                    testCase.stacktrace(scenarioFailureExceptionStack);
                }
            } else if (scenarioSkipped) {
                testCase.skipped().standardOutput(output);
            } else {
                testCase.time(formatTime(scenarioDuration || 0)).standardOutput(output);
            }

            featureDuration += scenarioDuration;

            callback();
        });

        this.registerHandler('AfterFeature', function (event, callback) {
            suite.time(formatTime(featureDuration));
            if (config.oneReportPerFeature) {
                builder.writeTo(getFeatureReportPath());
                builder = builder.newBuilder();
            }

            featureName = undefined;
            featurePath = undefined;
            suite = builder;
            callback();
        });

        this.registerHandler('AfterFeatures', function (event, callback) {
            if (!config.oneReportPerFeature) {
                builder.writeTo(getGlobalReportPath());
            }
            callback();
        });

    }

    return registerHandlers;
}

module.exports = cucumberJUnitReporter;
