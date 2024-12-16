const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);

/* ripple-account_info
 * **SUMMARY:** collect account objects.
 * 
 * **PARAMETERS:**
 * @param account_info Account objects to obtain the latest sequence number
 * @param secret Account secret
  * **OUTPUT:**
 * @param result Account objects.
 */

module.exports = async function (workflowId, stepName, step, log, callback) {
  const xrpljs = require("@transia/xrpl");

  // Validate parameters based on metadata
  var missing_params = stepsHelper.validate_params(step.parameters);
  if (missing_params.length > 0) {
    stepsHelper.setError(step, `${workflowId}@${stepName}: missing parameters ${missing_params}.`);
  } else {
    // Derive from secret, if account not specified
    const account = step.parameters.secret ? stepsHelper.validate_secret_account(step.parameters.secret) : step.parameters.account;
    if ( !account ) {
      stepsHelper.setError(step, `${workflowId}@${stepName}: missing account or invliad secret.`);
    } else {
      // Enable account debug traces
      if ( step.parameters.traces_env ) {
        const accounts = step.parameters.accounts ? step.parameters.accounts : [];
        if ( step.parameters.account && !accounts.includes(step.parameters.account) ) {
          accounts.push(step.parameters.account);
        }
        stepsHelper.traces_on(workflowId, accounts, step.parameters.traces_env);
      }

      try {
        const client = new xrpljs.Client(`wss://${step.parameters.environment}`);
        await client.connect();
        const response = await client.request({
          "command": "account_objects",
          "account": account,
          "ledger_index": "validated",
          "id" : workflowId
        });
        stepsHelper.setOutputs(step, response.result.account_objects);
        client.disconnect();
      } catch(e) {
        stepsHelper.setError(step, `${workflowId}@${stepName}: ${stepsHelper.metadata.name}@${stepsHelper.metadata.version}, ${e.message}.`);
      }
    }
  }
  callback(step);
};
