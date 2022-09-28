const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);

/* ripple-trace
 * **SUMMARY:** Step to add trace in the hook
 * 
 * **PARAMETERS:**
 * @param message A trace message appear when invoked
 * **OUTPUT:**
 * @param src A generate source snippet.
 */

module.exports = function (workflowId, stepName, step, log, callback) {
  callback( stepsHelper.setSource( step,stepsHelper.prepare_template(stepName, step, true) ));
};
