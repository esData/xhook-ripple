const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);
const metadata = stepsHelper.metadata;

/* test
 * **SUMMARY:** Load account trace to DB
 * 
 * **PARAMETERS:**
 * @param 
 */
module.exports = function (workflowId, stepName, step, log, callback) {

  const fs = require('fs');
  const workflowService = require('../../../db/workflows/workflow.service');
  
  const reports_path = process.env.REPORTS_PATH;

  fs.readdirSync(reports_path).forEach(file => {
    var base_name = file.split(".",1).toString();
    var run_id = base_name.split("_",1).toString();
    var account = base_name.split("_",2)[1];

    log.info(`[${workflowId}] [${stepName}]: id=${run_id}, account=${account}`);
    const content = require('fs').readFileSync(`${reports_path}/${file}`);
    workflowService.saveAcctLog(run_id, account,content);
    fs.unlinkSync(`${reports_path}/${file}`);
  });

  callback(step);
};
