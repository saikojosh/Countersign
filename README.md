Countersign
===========

Countersign is **password strength testing made simple**. All you need to do is provide a few simple values when you instantiate Countersign and it will score your password. Each test that is passed will score 1 point.


Example
=======

```javascript
var Countersign = require('countersign');

// Specify the tests when creating a new Countersign.
var cs = new Countersign({
  length:      8,
  letters:     false,
  numbers:     false,
  uppercase:   true,
  lowercase:   false,
  whitespace:  false,
  punctuation: false
});

// Or set tests later.
cs.setTest('punctuation', 1);
cs.setTest({
  whitespace: true,
  numbers:    2
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

/*
 * success = false
 * result = {
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */
```
