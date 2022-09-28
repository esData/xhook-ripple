const yaml = require("js-yaml");
const fs = require("fs");
const xrpjs = require(`${__dirname}/../../../utils/xrpjs_utils`)
const zlib = require('zlib');
const crypto = require('crypto');
const metadata = yaml.load(fs.readFileSync( __dirname + '/step.yaml', 'utf8'));

module.exports = function (workflowId, stepName, step, log, callback) {

  const wasm_bytes = xrpjs.decodeRestrictedBase64ToBytes(step.parameters.wasm);
  const wasm_inflat = zlib.inflateSync(wasm_bytes);

  //log.debug(`${stepName}: data=[${JSON.stringify(step)}].`);

  xrpjs.Rig(`wss://${step.parameters.environment}`)
  .then((t) => {
    const secret = step.parameters.secret;
    const account = t.xrpljs.Wallet.fromSeed(secret);
    t.feeSubmit(secret, {
      Account: account.classicAddress,
      TransactionType: "SetHook",
      Hooks: [
        {
          Hook: {
            CreateCode: xrpjs.arrayBufferToHex(wasm_inflat).toUpperCase(),
            HookApiVersion: 0,
            HookNamespace: crypto.createHash('sha256').update('accept').digest('hex').toUpperCase(),
            HookOn: "0000000000000000",
            Flags: t.hsfOVERRIDE,
          },
        },
      ],
    })
      .then((x) => {
        t.assertTxnSuccess(x);
        callback(step);
        // t.disconnect()
        // TODO: process.exit(0);
      })
      .catch((e) => { 
        step.status = 'error';
        step.message = `${stepName}: ${metadata.name}@${metadata.version}, ${e}.`
      });
  })
  .catch((e) => { 
    step.status = 'error';
    step.message = `${stepName}: ${metadata.name}@${metadata.version}, ${e}.`
  });
};
