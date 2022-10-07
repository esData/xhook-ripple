const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);
const metadata = stepsHelper.metadata

/* ripple-account_info
 * **SUMMARY:** collect account information.
 * 
 * **PARAMETERS:**
 * @param account_info Account information to obtain the latest sequence number
 * @param secret Account secret
  * **OUTPUT:**
 * @param result Account informations.
 */

module.exports = async function (workflowId, stepName, step, log, callback) {
  const xrpljs = require("xrpl-hooks");
  const account = step.parameters.secret ? xrpljs.Wallet.fromSeed(step.parameters.secret).classicAddress : step.parameters.account;

  const client = new xrpljs.Client(`wss://${step.parameters.environment}`)
  await client.connect()
  try {
    const response = await client.request({
      "command": "account_info",
      "account": account,
      "ledger_index": "validated"
    })
    stepsHelper.setOutputs(step, { 'result' : response.result.account_data} );
  } catch(e) { 
    step.status = 'error';
    step.message = `${workflowId}@${stepName}: ${metadata.name}@${metadata.version}, ${e.message}.`
  }
  
  client.disconnect()
  callback(step);
};
