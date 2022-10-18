const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);
const metadata = stepsHelper.metadata

/* ripple-remove_signers
 * **SUMMARY:** Remove signer list
 * 
 * **PARAMETERS:**
 * @param account_seq Account information to obtain the latest sequence number
 * @param secret Account secret
 */

module.exports = async function (workflowId, stepName, step, log, callback) {
  const xrpljs = require("xrpl-hooks");
  const secret = step.parameters.secret;
  const account = step.parameters.account || xrpljs.Wallet.fromSeed(secret).classicAddress;

  // Enable account debug traces
  if ( step.parameters.traces_env ) {
    const accounts = step.parameters.accounts ? step.parameters.accounts : [];
    if ( step.parameters.account && !accounts.includes(step.parameters.account) ) {
      accounts.push(step.parameters.account);
    }
    stepsHelper.traces_on(workflowId, accounts, step.parameters.traces_env);
  }

  const client = new xrpljs.Client(`wss://${step.parameters.environment}`);
  await client.connect();

  var txn = {
    Flags: 0,
    TransactionType: "SignerListSet",
    Account: account,
    SignerQuorum: 0,
    Sequence: +step.parameters.account_seq,
    SigningPubKey: '',
    Fee: "0" 
  };

  try {
    var response = await client.request(stepsHelper.prepare_fee_txn(xrpljs.encode(txn)));
  
    delete txn["SigningPubKey"];
    txn.Fee = response.result?.drops?.base_fee || "10";

    var response = await client.submit(txn, { wallet: xrpljs.Wallet.fromSeed(secret) })
    if ( response.result.applied !== true || response.result.engine_result != 'tesSUCCESS' ) {
      step.status = 'error';
      step.message = `[${workflowId}] [${stepName}]: ${metadata.name}@${metadata.version}, ${response.result.engine_result_message}.`;
    }
    stepsHelper.setOutputs(step, { 'result' : response.result} );
  } catch(e) { 
    step.status = 'error';
    step.message = `[${workflowId}] [${stepName}]: ${metadata.name}@${metadata.version}, ${e}.`
  }

  client.disconnect();
  callback(step);
};
