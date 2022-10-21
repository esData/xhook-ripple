const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);
const metadata = stepsHelper.metadata

/* ripple-account_debug_stream
 * **SUMMARY:** Keep account debug stream
 * 
 * **PARAMETERS:**
 * @param accounts Account list
 */

module.exports = async function (workflowId, stepName, step, log, callback) {

  const fs = require('fs');
  const WebSocketClient = require('websocket').client;
  // const dateNow = Date.now();
  const accounts = step.parameters.accounts ? step.parameters.accounts : [];

  if ( step.parameters.account && !accounts.includes(step.parameters.account) ) {
    accounts.push(step.parameters.account);
  }
  
  var connections = [];
  // var account_logs = []

  function extractJSON(str) {
    if (!str) return
    let firstOpen = 0,
      firstClose = 0,
      candidate = ''
    firstOpen = str.indexOf('{', firstOpen + 1)
    do {
      firstClose = str.lastIndexOf('}')
      if (firstClose <= firstOpen) {
        return
      }
      do {
        candidate = str.substring(firstOpen, firstClose + 1)
        try {
          let result = JSON.parse(candidate)
          return { result, start: firstOpen < 0 ? 0 : firstOpen, end: firstClose }
        } catch (e) {}
        firstClose = str.substring(0, firstClose).lastIndexOf('}')
      } while (firstClose > firstOpen)
      firstOpen = str.indexOf('{', firstOpen + 1)
    } while (firstOpen != -1)
  }

  accounts.map( function(account) {
    var client = new WebSocketClient();
    var writableStream = fs.createWriteStream(`${process.env.REPORTS_PATH}/${workflowId}_${account}.log`);

    client.on('connectFailed', function(error) {
      step.status = 'ignore';
      step.message = `[${workflowId}] [${stepName}]: ${error.toString()}`;
    });

    client.on('connect', function(connection) {
      log.info(`[${workflowId}] [${stepName}]: start ${account} debug trace.`)
      connection.on('error', function(error) {
        step.status = 'ignore';
        step.message = `[${workflowId}] [${stepName}]: ${error.toString()}`;
      });

      connection.on('close', function() {
        try {
          callback(step);
        } catch (e) {}
      });

      connection.on('message', function(raw_data) {
        if (raw_data.type === 'utf8') {
          /* const regex = /([\s\S]+(?:UTC|ISO|GMT[+|-]\d+))?\ ?([\s\S]*)/gm;
          const match = regex.exec(raw_data.utf8Data);
          const [_, tm, msg] = match || []
          const timestamp = Date.parse(tm || '') || undefined
          const timestring = !timestamp ? tm : new Date(timestamp).toLocaleTimeString()

          const extracted = extractJSON(msg)
          const message = !extracted ? msg : msg.slice(0, extracted.start) + msg.slice(extracted.end + 1)
          const jsonData = extracted ? JSON.stringify(extracted.result, null, 2) : undefined*

          const account_log = {
            message,
            timestring,
            jsonData
          }; */
        
          // if (account_log) account_logs.push(account_log);

          // log.debug(`\nRECEIVED: ` + raw_data.utf8Data);
          // const extracted = extractJSON(raw_data.utf8Data)
          // log.info(JSON.stringify(extracted));
          try {
            writableStream.write(raw_data.utf8Data);
          } catch (e) {
            log.error(`[${workflowId}] [${stepName}]: ${e}`);
          }
        }
      });
    });

    client.connect(`wss://${step.parameters.environment}\\${account}`, 'echo-protocol');
    connections.push(client);
  });
}
