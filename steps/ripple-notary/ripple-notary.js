const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);

/* ripple-multi_sign
 * **SUMMARY:** Implementation for multi-sign transaction
 * 
 * **PARAMETERS:**
 * @param
 * **OUTPUT:**
 * @param src A generate source snippet.
 */

module.exports = function (workflowId, stepName, step, log, callback) {
  callback( stepsHelper.setSource( step,stepsHelper.prepare_template(stepName, step, true) ));
};
