const { getParser } = require('codemod-cli').jscodeshift;
const { getOptions } = require('codemod-cli');

module.exports = function transformer(file, api) {
  let source = file.source;

  let json = JSON.parse(source);
  let newDev = withoutjQuery(json.devDependencies);
  let newRegular = withoutjQuery(json.dependencies);

  json.devDependencies = newDev;
  json.dependencies = newRegular;

  let result = JSON.stringify(json, null, 2);

  return result;
}


function withoutjQuery(depList) {
  if (!depList) return {};
  let allowedPackages = Object.keys(depList).filter(item => !item.toLowerCase().includes('jquery'));

  let result = {};

  allowedPackages.forEach(p => {
    result[p] = depList[p];
  });

  return result;
}
