const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);

/* ripple-memo_zero_accept
 * **SUMMARY:** Memo not found do nothing
 * 
 * **PARAMETERS:**
 * @param message A trace message when memo not found
 * **OUTPUT:**
 * @param src A generate source snippet.
 */

module.exports = function (workflowId, stepName, step, log, callback) {
  callback( stepsHelper.setSource( step,stepsHelper.prepare_template(stepName, step, true) ));
};
