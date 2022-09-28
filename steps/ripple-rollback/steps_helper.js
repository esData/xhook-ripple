const yaml = require("js-yaml");
const fs = require("fs");
const metadata = yaml.load(fs.readFileSync(__dirname + "/step.yaml", "utf8"));
const template_path = `${__dirname}/../../templates`;
const mustache = require("mustache");

function prepare_template(stepName, step, bodyOnly=true) {
  // Loading template
  // log.debug(`${stepName}: metadata=${JSON.stringify(metadata)}`)
  var main_template = '';
  var body_template = '';
  var body = ''
  // log.debug(`${stepName}: metadata=${JSON.stringify(metadata['templates'])}`)
  Object.keys(metadata['templates'] || {}).forEach( function(key) {
    main_template = fs.readFileSync(
      `${template_path}/${metadata['templates'][key]['main']}`,
      "utf8"
    );

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
      body: body,
      comment: `XhookControl-autogen ${stepName}@${step.step}: ${metadata.name}@${metadata.version}`,
      reason: step.parameters.reason,
    });
}

module.exports = { prepare_template }