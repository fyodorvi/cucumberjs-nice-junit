## CucumberJS Nice JUnit Reporter

A reporter for CucumberJS (only version 2 is supported) which outputs test results in a nice way: one scenario equals one test (unlike all other reporters where one step equals one test). Steps are written to system-out section.

## Example output:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="The internet - Logging in" time="0" tests="1" failures="0" errors="0" skipped="0">
    <testcase classname="The internet - Logging in" name="User can log in with valid details" time="0">
      <system-out>
        <![CDATA[I navigate to login page....................................................passed
I attempt to log in as "user@email.com" with password "12345678".passed
I arrive on dashboard page..................................................passed
I should see dashboard page with "Fyodor" in the greeting...................passed]]>
      </system-out>
    </testcase>
  </testsuite>
</testsuites>
```


### Installation

- `npm i cucumberjs-nice-junit`

## Usage

Require that code within cucumber:

```javascript
import { defineSupportCode } from 'cucumber';
import { registerReporter } from 'cucumberjs-nice-junit';

defineSupportCode(function(cucumber) {
    registerReporter(cucumber, {
       reportDir: 'test_reports',
       reportPrefix: 'TEST-',
       reportSuffix: '.xml',
       reportFile: 'test_results.xml',
       oneReportPerFeature: true,
       numberSteps: true
   });
});
```