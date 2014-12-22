var Countersign = require('../countersign.js');

// Specify the tests when creating a new Countersign.
var cs = new Countersign({
  length:      8,
  digits:      false,
  uppercase:   true,
  lowercase:   false,
  whitespace:  false,
  punctuation: true
});

// Or set tests later.
cs.setTest('punctuation', false);
cs.setTest({
  whitespace: true,
  digits:     2
});

// Add a custom test.
cs.addTest('customTest', function (input, setting, finish) {
  var success = (input !== 'passw0rd');
  return finish(null, success);
});

// Run the test.
cs.test('abc123', 5, function (err, success, result) {
  console.log('success', success);
  console.log('result', result);
});