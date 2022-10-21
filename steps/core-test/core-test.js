const yaml = require('js-yaml');
const fs = require('fs');
const metadata = yaml.load(fs.readFileSync( __dirname + '/step.yaml', 'utf8'));

/* test
 * **SUMMARY:** test sleep and pause step
 * 
 * **PARAMETERS:**
 * @param step.parameters.delay A sleep step timeout in second
 */
module.exports = function (workflowId, stepName, step, log, callback) {

  if (step.parameters.paused === true) {
    step.status = "paused";
  }
  step.result = 2;
  step.status = 'error';
  step.message = 'Throw error';
  setTimeout(function() {
    callback(step);
  }, ( step.parameters?.delay || 0));
};
