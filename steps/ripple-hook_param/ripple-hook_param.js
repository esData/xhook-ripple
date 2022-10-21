const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);

/* ripple-hook_param
 * **SUMMARY:** Step to implement hook param
 * 
 * **PARAMETERS:**
 * @param param_field Soruce parameter field name to be declare
 * @param param_name Hook parameter name
 * **OUTPUT:**
 * @param src A generate source snippet.
 */

module.exports = function (workflowId, stepName, step, log, callback) {
  // Validate parameters based on metadata
  var missing_params = stepsHelper.validate_params(step.parameters);
  if (missing_params.length > 0) {
    stepsHelper.setError(step, `${workflowId}@${stepName}: missing parameters ${missing_params}.`);
    callback(step);
  } else {
    callback( stepsHelper.setSource( step,stepsHelper.prepare_template(stepName, step, true) ));
  }
};
