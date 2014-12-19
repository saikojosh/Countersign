# Countersign
Countersign is **password strength testing made simple**. All you need to do is provide a few simple values when you instantiate Countersign and it will score given passwords against various tests. Each test that is passed will score 1 point.


# Example Usage
This example will work 'out of the box' and shows the main functionality.

```javascript
var Countersign = require('countersign');

// Specify the tests when creating a new Countersign.
var cs = new Countersign({
  length:      8,
  letters:     false,
  digits:     false,
  uppercase:   true,
  lowercase:   false,
  whitespace:  false,
  punctuation: false
});

// Or set tests later.
cs.setTest('punctuation', 1);
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

/*
 * OUTPUT
 * success = false
 * result = {
 *   success: false,
 *   score: 2,
 *   minScore: 5,
 *   maxScore: 6,
 *   testResults: {
 *     length: false,
 *     digits: true,
 *     uppercase: false,
 *     whitespace: false,
 *     punctuation: false,
 *     customTest: true
 *   }
 * }
 */
```


# Full API Reference

### > var cs = new Countersign()
Instantiate a new countersign class with the given test settings. Any truthy value will enable a test. If the test accepts a value this can be given instead of `true`, e.g. a number to specify the minimum number of 'uppercase' characters in the password.

##### Usage
```javascript
var cs = new Countersign({
  digits:  true,        // This test will be used (at least 1 digit will be required).
  punctuation: false,   // This test will NOT be used.
  uppercase: 2,         // This test will be used (at least 2 uppercase letters will be required).
  ...
});
```


### > cs.setTest()
Change the setting for a specific test or a range of tests. Any values set here will overwrite those set during instantiation.

##### Usage
```javascript
cs.setTest('digits', false);   // This will disable the test.
cs.setTest({
  punctuation: true,           // This will enable the test.
  uppercase: 3,                // This will change the test setting.
  ...
});
```


### > cs.addTest()
Adds a custom test of your creation. All tests are called asynchronously (in parallel) and *must* call the `finish()` callback to complete.

##### Usage
```javascript
cs.addTest('customTest', function (input, setting, finish) {
  ...
  return finish(null, success);
});
```

##### Test Parameters
* **input** - This will be the password.
* **setting** - This will either be `true` or a value given during instantiation.
* **finish** - The callback. This must be called to continue with the testing.

##### Callback Parameters
* **err** - If an error has occured pass it back, otherwise `null`.
* **success** - Specify a boolean to indicate whether the test has passed.

##### Error Handling
If you pass an error as the first paremeter of `finish()` it will not be thrown, instead it will be passed up the chain to your final callback given to either `cs.test()` or `cs.score()`.


### > cs.test()
Runs all the tests that have been setup against the given password and passes a 'success' boolean to the callback.

##### Usage
```javascript
cs.test('abc123', 5, function (err, success, result) { ... });
```

##### Parameters
* **input** - This will be the password.
* **minScore** - The minimum score required to pass testing.
* **callback** - The function to run after testing is complete.

##### Callback Parameters
* **err** - If an error has occured it will be given here, otherwise `null`.
* **success** - True if the minium score has been achieved.
* **result** - A hash of all the results.

### > cs.score()
Runs all the tests that have been setup against the given password and passes the 'score' to the callback.

##### Usage
```javascript
cs.score('abc123', function (err, score, result) { ... });
```

##### Parameters
* **input** - This will be the password.
* **callback** - The function to run after testing is complete.

##### Callback Parameters
* **err** - If an error has occured it will be given here, otherwise `null`.
* **score** - The score given to the password (i.e. the number of tests successfully passed).
* **result** - A hash of all the results.
