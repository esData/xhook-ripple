const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);
const metadata = stepsHelper.metadata

/* ripple-set_hooks
 * **SUMMARY:** deploy hook to specific account, list up to 4 accounts.
 * 
 * **PARAMETERS:**
 * @param account_info Account information to obtain the latest sequence number
 * @param secret Account secret
 */

module.exports = async function (workflowId, stepName, step, log, callback) {
  if (!step.parameters.wasm) {
    step.status = 'error';
    step.message = `[${workflowId} [${stepName}]: No prepared template Or no accept step.`;
    callback(step);
  }

  const zlib = require('zlib');
  const wasm_bytes = stepsHelper.decodeRestrictedBase64ToBytes(step.parameters.wasm);
  const wasm_inflat = zlib.inflateSync(wasm_bytes);

  const xrpljs = require("xrpl-hooks");
  const secret = step.parameters.secret;
  const account = step.parameters.account || xrpljs.Wallet.fromSeed(secret).classicAddress;
  const client = new xrpljs.Client(`wss://${step.parameters.environment}`);
  await client.connect();

  var txn = stepsHelper.prepare_sethook_txn(account, stepName, wasm_inflat, step.parameters.account_info.Sequence);
  // log.debug(`[${workflowId} [${stepName}]: txn= ${JSON.stringify(txn)}`);

  try {
    var response = await client.request(stepsHelper.prepare_fee_txn(xrpljs.encode(txn)));
    // log.debug(`[${workflowId} [${stepName}]: ${JSON.stringify(response)}`);
  
    delete txn["SigningPubKey"];
    txn.Fee = response.result?.drops?.base_fee || "10";

    var response = await client.submit(txn, { wallet: xrpljs.Wallet.fromSeed(secret) })
    step['result'] = response.result;
  } catch(e) { 
    step.status = 'error';
    step.message = `[${workflowId} [${stepName}]: ${metadata.name}@${metadata.version}, ${e}.`
  }

  client.disconnect();
  callback(step);
};
