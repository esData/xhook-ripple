const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);
const metadata = stepsHelper.metadata

/* ripple-set_hooks
 * **SUMMARY:** deploy hook to specific account, list up to 4 accounts.
 * 
 * **PARAMETERS:**
 * @param account_seq Account information to obtain the latest sequence number
 * @param secret Account secret
 */

module.exports = async function (workflowId, stepName, step, log, callback) {
  if (!step.parameters.wasm) {
    step.status = 'error';
    step.message = `[${workflowId} [${stepName}]: No prepared template Or no accept step.`;
    callback(step);
  }
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

  const xrpljs = require("xrpl-hooks");
  const secret = step.parameters.secret;
  const account = step.parameters.account || xrpljs.Wallet.fromSeed(secret).classicAddress;
  const namespace = step.parameters.namespace || stepName;
  const client = new xrpljs.Client(`wss://${step.parameters.environment}`);
  await client.connect();

  var hookon = "0000000000000000";
  var hook_params = step.parameters.hook_parameters || [];
  var txn = stepsHelper.prepare_sethook_txn(account,
                                            namespace,
                                            wasm_inflat,
                                            step.parameters.account_seq,
                                            hookon,
                                            hook_params
                                            );
  log.debug(`[${workflowId} [${stepName}]: txn= ${JSON.stringify(txn)}`);

  try {
    var response = await client.request(stepsHelper.prepare_fee_txn(xrpljs.encode(txn)));
  
    delete txn["SigningPubKey"];
    txn.Fee = response.result?.drops?.base_fee || "10";

    var response = await client.submit(txn, { wallet: xrpljs.Wallet.fromSeed(secret) })
    stepsHelper.setOutputs(step, { 'result' : response.result} );
  } catch(e) { 
    step.status = 'error';
    step.message = `[${workflowId} [${stepName}]: ${metadata.name}@${metadata.version}, ${e}.`
  }

  client.disconnect();
  callback(step);
};
