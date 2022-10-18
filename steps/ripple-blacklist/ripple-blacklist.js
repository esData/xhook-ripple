const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);

/* ripple-blacklist
 * **SUMMARY:** Emit a transaction by percentage
 * 
 * **PARAMETERS:**
 * @param emitted_account Target emitted account
 * @param origin_txn_drops_pct Percentage of original transaction drops to be emit to emitted account 1 < n < 99
 * @param min_drops_emitted Mininum/default emit drops
 * **OUTPUT:**
 * @param src A generate source snippet.
 */

module.exports = function (workflowId, stepName, step, log, callback) {
  callback( stepsHelper.setSource( step,stepsHelper.prepare_template(stepName, step, true) ));
};
