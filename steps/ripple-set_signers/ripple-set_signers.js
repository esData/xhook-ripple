const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);
const metadata = stepsHelper.metadata

/* ripple-set_signers
 * **SUMMARY:** Setup signer list
 * 
 * **PARAMETERS:**
 * @param account_sequence Account information to obtain the latest sequence number
 * @param secret Account secret
 * @param signers Signer list
 */

module.exports = async function (workflowId, stepName, step, log, callback) {
  const xrpljs = require("xrpl-hooks");

  // Validate parameters based on metadata
  var missing_params = stepsHelper.validate_params(step.parameters);
  if (missing_params.length > 0) {
    stepsHelper.setError(step, `${workflowId}@${stepName}: missing parameters ${missing_params}.`);
    callback(step);
  } else {
    const account = xrpljs.Wallet.fromSeed(step.parameters.secret).classicAddress;

    // Enable account debug traces
    if ( step.parameters.traces_env ) {
      const accounts = step.parameters.accounts ? step.parameters.accounts : [];
      if ( step.parameters.account && !accounts.includes(step.parameters.account) ) {
        accounts.push(step.parameters.account);
      }
      stepsHelper.traces_on(workflowId, accounts, step.parameters.traces_env);
    }

    var txn = {
      Flags: 0,
      TransactionType: "SignerListSet",
      Account: account,
      SignerQuorum: step.parameters.signers.length,
      SignerEntries: step.parameters.signers,
      Sequence: +step.parameters.account_sequence,
      SigningPubKey: '',
      Fee: "0" 
    };

    try {
      const client = new xrpljs.Client(`wss://${step.parameters.environment}`);
      await client.connect();
      var response = await client.request(stepsHelper.prepare_fee_txn(xrpljs.encode(txn)));
    
      delete txn["SigningPubKey"];
      txn.Fee = response.result?.drops?.base_fee || "10";

      var response = await client.submit(txn, { wallet: xrpljs.Wallet.fromSeed(step.parameters.secret) })
      if ( response.result.applied !== true || response.result.engine_result != 'tesSUCCESS' ) {
        stepsHelper.setError(step, `[${workflowId}] [${stepName}]: ${response.result.engine_result_message}.`);
      }
      stepsHelper.setOutputs(step, { 'result' : response.result} );
      client.disconnect();
    } catch(e) {
      stepsHelper.setError(step, `[${workflowId}] [${stepName}]: ${metadata.name}@${metadata.version}, ${e}.`);
    }
    callback(step);
  }
};
