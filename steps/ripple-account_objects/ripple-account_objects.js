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
  const xrpljs = require("xrpl-hooks");
  const account = step.parameters.secret ? xrpljs.Wallet.fromSeed(step.parameters.secret).classicAddress : step.parameters.account;

  // Enable account debug traces
  if ( step.parameters.traces_env ) {
    const accounts = step.parameters.accounts ? step.parameters.accounts : [];
    if ( step.parameters.account && !accounts.includes(step.parameters.account) ) {
      accounts.push(step.parameters.account);
    }
    stepsHelper.traces_on(workflowId, accounts, step.parameters.traces_env);
  }

  const client = new xrpljs.Client(`wss://${step.parameters.environment}`)
  await client.connect()
  try {
    const response = await client.request({
      "command": "account_objects",
      "account": account,
      "ledger_index": "validated",
      "id" : workflowId
    })
    stepsHelper.setOutputs(step, response.result.account_objects);
  } catch(e) { 
    step.status = 'error';
    step.message = `${workflowId}@${stepName}: ${stepsHelper.metadata.name}@${stepsHelper.metadata.version}, ${e.message}.`
  }
  
  client.disconnect()
  callback(step);
};
