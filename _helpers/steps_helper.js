const yaml = require("js-yaml");
const fs = require("fs");
const mustache = require("mustache");
const crypto = require("crypto");
const xrpljs = require("xrpl-hooks");

/* steps_helper
 * **SUMMARY:** Xhook steps helper class
 * **VERSION:** 0.1.0
 * 
 * **PARAMETERS:**
 * @param 
 */

class stepsHelper {
  constructor(stepdir) {
    try {
      this.metadata = yaml.load(fs.readFileSync(stepdir + "/step.yaml", "utf8"));
      this.template_path = `${stepdir}/../../templates`;
    } catch (e) {
      throw new Error(`unable to prepare hook: ${e}`);
    }
  }

  toHex(str) {
    var result = ''
    for (var i = 0; i < str.length; i++) {
      result += str.charCodeAt(i).toString(16)
    }
    return result.toUpperCase()
  }

  hexlify_memos(x) {
    if (!("Memos" in x)) return;

    for (let y = 0; y < x["Memos"].length; ++y) {
      let Memo = x["Memos"][y]["Memo"];
      let Fields = ["MemoFormat", "MemoType", "MemoData"];
      for (let z = 0; z < Fields.length; ++z) {
        if (Fields[z] in Memo) {
          let u = Memo[Fields[z]].toUpperCase()
          if (u.match(/^[0-9A-F]+$/)) {
            Memo[Fields[z]] = u;
            continue;
          }
          let v = Memo[Fields[z]], q = "";
          for (let i = 0; i < v.length; ++i) {
            q += Number(v.charCodeAt(i)).toString(16).padStart(2, '0');
          }
          Memo[Fields[z]] = q.toUpperCase();
        }
      }
    }
  }

  arrayBufferToHex(arrayBuffer) {
    if (!arrayBuffer) {
      return ''
    }
    if (
      typeof arrayBuffer !== 'object' ||
      arrayBuffer === null ||
      typeof arrayBuffer.byteLength !== 'number'
    ) {
      throw new TypeError('Expected input to be an ArrayBuffer')
    }
  
    var view = new Uint8Array(arrayBuffer)
    var result = ''
    var value
  
    for (var i = 0; i < view.length; i++) {
      value = view[i].toString(16)
      result += value.length === 1 ? '0' + value : value
    }
    return result
  }

  decodeBinary(input) {
    let data = decodeRestrictedBase64ToBytes(input)
    if (isZlibData(data)) {
      // data = decompressZlib(data)
    }
    return data
  }
  
  base64DecodeMap = [
      // starts at 0x2B
      62,
      0,
      0,
      0,
      63,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      59,
      60,
      61,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      0,
      0,
      0,
      0,
      0,
      0,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36,
      37,
      38,
      39,
      40,
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48,
      49,
      50,
      51
  ];
  
  decodeRestrictedBase64ToBytes(encoded) {
    var base64DecodeMapOffset = 0x2b;
    var base64EOF = 0x3d;
    var ch;
    var code;
    var code2;
    var len = encoded.length;
    var padding = encoded.charAt(len - 2) === '=' ? 2 : encoded.charAt(len - 1) === '=' ? 1 : 0;
    var decoded = new Uint8Array((encoded.length >> 2) * 3 - padding);
    for (var i = 0, j = 0; i < encoded.length;) {
      ch = encoded.charCodeAt(i++);
      code = this.base64DecodeMap[ch - base64DecodeMapOffset];
      ch = encoded.charCodeAt(i++);
      code2 = this.base64DecodeMap[ch - base64DecodeMapOffset];
      decoded[j++] = (code << 2) | ((code2 & 0x30) >> 4);
      ch = encoded.charCodeAt(i++);
      if (ch === base64EOF) {
        return decoded;
      }
      code = this.base64DecodeMap[ch - base64DecodeMapOffset];
      decoded[j++] = ((code2 & 0x0f) << 4) | ((code & 0x3c) >> 2);
      ch = encoded.charCodeAt(i++);
      if (ch === base64EOF) {
        return decoded;
      }
      code2 = this.base64DecodeMap[ch - base64DecodeMapOffset];
      decoded[j++] = ((code & 0x03) << 6) | code2;
    }
    return decoded;
  }
  
  isZlibData(data) {
    var firstByte = data[0], secondByte = data[1];
    return firstByte === 0x78 && (secondByte === 0x01 || secondByte === 0x9c || secondByte === 0xda);
  }

  prepare_template(stepName, step, bodyOnly=true) {
    // Loading template
    var template_path = this.template_path;
    var metadata = this.metadata;
    var main_template = '';
    var body_template = '';
    var body = '';
    Object.keys(metadata['templates'] || {}).forEach( function(key) {
      if (metadata['templates'][key]['main'] != undefined ) {
        main_template = fs.readFileSync(
          `${template_path}/${metadata['templates'][key]['main']}`,
          "utf8"
        );
      }
  
      metadata['templates'][key]['body'].forEach( function(value) {
        body_template = fs.readFileSync(
          `${template_path}/${value}`,
          "utf8"
        );
        body += mustache.render(body_template, {
          stepname: stepName,
          step: step.step,
          ...step.parameters,
        });
      });
    });
  
    return bodyOnly ? body : mustache.render(main_template, {
        comment: `XhookControl-autogen [${stepName}] [${step.step}]`,
        body: (step.parameters?.src || '') + body,
        ...step.parameters,
      });
  }

  prepare_hook_compiler_request(name, src) {
    var raw = JSON.stringify({
      output: "wasm",
      compress: true,
      strip: true,
      files: [
        {
          type: "c",
          options: "-O2",
          name: `${name}.c`,
          src: src,
        },
      ],
    });
  
    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
      redirect: "follow",
    };
  }

  prepare_sethook_txn(account, stepname, wasm, sequence, hookon = "0000000000000000", hook_params = []) {
    var hooks = [];
    if (wasm == '') {
      // if no WASM pass here, will rmeove the hook
      hooks.push( { Hook: {
                      CreateCode: '',
                      Flags: 1,
                  }});
    } else {
      var hook =  {
                    CreateCode: this.arrayBufferToHex(wasm).toUpperCase(),
                    HookApiVersion: 0,
                    HookNamespace: crypto.createHash('sha256').update(stepname).digest('hex').toUpperCase(),
                    HookOn: hookon,
                    Flags: 1, // 1-Override, 2-NSDelete, 4-Collect 
                  };
      if ( hook_params.length > 0 ) {
        const filteredHookParameters = hook_params.filter(
          hp => hp.HookParameter.HookParameterName && hp.HookParameter.HookParameterValue
        )?.map(aa => ({
          HookParameter: {
            HookParameterName: this.toHex(aa.HookParameter.HookParameterName || ''),
            HookParameterValue: aa.HookParameter.HookParameterValue || ''
          }
        }))
        hook['HookParameters'] = filteredHookParameters;
      }
      // TODO: cater more than 1 hooks
      hooks.push({ Hook: hook });
    }

    return {
      Account: account,
      TransactionType: "SetHook",
      Hooks: hooks,
      SigningPubKey: '',
      Sequence: sequence,
      Fee: "0" 
    }
  }

  prepare_fee_txn(tx_blob) {
    return {
      "command": "fee",
      "tx_blob": tx_blob,
    }
  }
  
  setSource(step, src, final=false) {
    step['src'] = src;
    final ? step['src_final'] = true : '';
    return step;
  }

  setWasm(step, data) {
    step.wasm = data;
  }
  
  getWabt(data) {
      // Decode base64 encoded wasm that is coming back from the endpoint
      const {readWasm} = require('wabt');
      return readWasm(new Uint8Array(decodeBinary(data)));
  }

  setOutputs(step, output) {
    step['outputs'] = output;
  }

  setError(step, message) {
    step.status = 'error';
    step.message = message;
  }

  getOutputs(step) {
    return step['outputs'];
  }

  traces_on(workflowId, accounts = [], environment = 'hooks-testnet-v2-debugstream.xrpl-labs.com' ) {
    const WebSocketClient = require('websocket').client;
    var connections = [];

    accounts.map( function(account) {
      var client = new WebSocketClient();
      var writableStream = fs.createWriteStream(`${process.env.REPORTS_PATH}/${workflowId}_${account}.log`);
  
      client.on('connectFailed', function(error) {
        // do nothing
      });
  
      client.on('connect', function(connection) {  
        connection.on('message', function(raw_data) {
          if (raw_data.type === 'utf8') {
            try {
              writableStream.write(`\n` + raw_data.utf8Data);
            } catch (e) {
              // do nothing
            }
          }
        });
      });
  
      client.connect(`wss://${environment}\\${account}`, 'echo-protocol');
      connections.push(client);
    });
  }

  validate_params(parameters) {
    var metadata = this.metadata;
    var missing = [];
    Object.keys(metadata['parameters'] || {}).forEach( function(key) {
      if (!parameters[key] && metadata.parameters[key].optional != true ) {
        if (metadata.parameters[key].default) {
          parameters[key] = metadata.parameters[key].default;
        } else {
          missing.push(key);
        }
      }
    });
    return missing;
  }

  validate_secret_account(secret) {
    try {
      return xrpljs.Wallet.fromSeed(secret).classicAddress;
    } catch {
      return undefined;
    }
  }
}

module.exports = stepsHelper
