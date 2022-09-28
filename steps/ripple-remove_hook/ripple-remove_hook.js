const yaml = require("js-yaml");
const fs = require("fs");
const xrpljs = require("xrpl-hooks");
const metadata = yaml.load(fs.readFileSync( __dirname + '/step.yaml', 'utf8'));

module.exports = async function (workflowId, stepName, step, log, callback) {

  //log.debug(`${stepName}: data=[${JSON.stringify(step)}].`);
  const secret = step.parameters.secret;
  const account = xrpljs.Wallet.fromSeed(secret);

  const client = new xrpljs.Client(`wss://${step.parameters.environment}`);
  await client.connect();

  var txn = {
    Account: account.classicAddress,
    TransactionType: "SetHook",
    Hooks: [
      {
        Hook: {
          CreateCode: '',
          Flags: 1,
        },
      },
    ],
    SigningPubKey: '',
    Sequence: step.parameters.account_info.Sequence,
    Fee: "0" 
  };

  var fee_txn = {
    "command": "fee",
    "tx_blob": xrpljs.encode(txn),
  }

  try {
    var response = await client.request(fee_txn);
    // log.debug(`${stepName}: ${JSON.stringify(response)}`);
    const base_drops = response.result.drops.base_fee;
    // log.debug(`${stepName}: base_drops ${JSON.stringify(base_drops)}`);
  
    delete txn["SigningPubKey"];
    txn.Fee = base_drops || "10";
    // txn.Sequence = step.parameters.account_info.Sequence;
    // log.debug(`${stepName}: Txn ${JSON.stringify(txn)}`);

    var response = await client.submit(txn, { wallet: xrpljs.Wallet.fromSeed(secret) })
    step['result'] = response.result;
  } catch(e) { 
    step.status = 'error';
    step.message = `${stepName}: ${metadata.name}@${metadata.version}, ${e}.`
  }

  client.disconnect();
  callback(step);
};
