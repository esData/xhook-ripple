const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);
const metadata = stepsHelper.metadata
const xrpl_accountlib = require("xrpl-accountlib");

/* ripple-set_hooks
 * **SUMMARY:** deploy hook to specific account, list up to 4 accounts.
 * 
 * **PARAMETERS:**
 * @param account_sequence Account information to obtain the latest sequence number
 * @param secret Account secret
 */

module.exports = async function (workflowId, stepName, step, log, callback) {

  // Validate parameters based on metadata
  var missing_params = stepsHelper.validate_params(step.parameters);
  if (missing_params.length > 0) {
    stepsHelper.setError(step, `missing parameters ${missing_params}.`);
  } else if (!step.parameters.wasm) {
    console.log(step);
    stepsHelper.setError(step, `No prepared template, ensure accept/rollback step included.`);
  } else {
    const account = stepsHelper.validate_secret_account(step.parameters.secret);
    if ( !account ) {
      stepsHelper.setError(step, `invliad secret.`);
    } else {
      // Enable account debug traces
      if ( step.parameters.traces_env ) {
        const accounts = step.parameters.accounts ? step.parameters.accounts : [];
        if ( step.parameters.account && !accounts.includes(step.parameters.account) ) {
          accounts.push(step.parameters.account);
        }
        stepsHelper.traces_on(workflowId, accounts, step.parameters.traces_env);
      }
      
      const zlib = require('zlib');
      const wasm_bytes = stepsHelper.decodeRestrictedBase64ToBytes(step.parameters.wasm);
      const wasm_inflat = zlib.inflateSync(wasm_bytes);
      const xrpljs = require("@transia/xrpl");
 
      const namespace = step.parameters.namespace || stepName;
      //var hookon = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffbfffff";
      var hookon = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBFFFFF";
      var hook_params = step.parameters.hook_parameters || [];
      var txn = stepsHelper.prepare_sethook_txn(account,
                                                namespace,
                                                wasm_inflat,
                                                step.parameters.account_sequence,
                                                hookon,
                                                hook_params
                                                );

      try {
        const client = new xrpljs.Client(`wss://${step.parameters.environment}`);
        await client.connect();
        var response = await client.request(stepsHelper.prepare_fee_txn(xrpljs.encode(txn)));
      
        delete txn["SigningPubKey"];
        txn.Fee = response.result?.drops?.base_fee || "10";

        // const signedAccount = xrpljs.Wallet.fromSeed(step.parameters.secret);
        // const signedAccount = xrpl_accountlib.derive.familySeed(step.parameters.secret);
        // const { signedTransaction } = xrpl_accountlib.sign(txn, signedAccount);
        // var response = await xrplSend({command: 'submit', tx_blob: signedTransaction});
        // var response = await client.submit(signedTransaction, { wallet: xrpljs.Wallet.fromSeed(step.parameters.secret), autofill: true });
        var response = await client.submit(txn, { wallet: xrpljs.Wallet.fromSeed(step.parameters.secret) })
        if ( response.result.applied !== true || response.result.engine_result != 'tesSUCCESS' ) {
          stepsHelper.setError(step, response.result.engine_result_message);
        }
        stepsHelper.setOutputs(step, { 'result' : response.result} );
        client.disconnect();
      } catch(e) {
        stepsHelper.setError(step, `[${workflowId}] [${stepName}]: ${metadata.name}@${metadata.version}, ${e}.`);
      }
    }
  }
  callback(step);
};
