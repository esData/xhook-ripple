const yaml = require('js-yaml');
const fs = require('fs');
const metadata = yaml.load(fs.readFileSync( __dirname + '/step.yaml', 'utf8'));

/* request
 * **SUMMARY:** HTTP request step
 * 
 * **PARAMETERS:**
 * @param step.parameters.options The options object used by the request module
 * **OUTPUT:**
 * @param step.parameters.result The resulting request response object
 */
module.exports = function (workflowId, stepName, step, log, callback) {

  require('request')(step.parameters.options, function (error, response, body) {
    step.parameters.result = response;
    callback(step);
  });
};
