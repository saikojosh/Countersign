/*
 * COUNTERSIGN.
 * Password strength testing made simple.
 */

var path         = require('path');
var fs           = require('fs');
var async        = require('async');
var escapeRegExp = require('escape-regexp');
var objectAssign = require('object-assign');

/*
 * Constructor.
 */
function Countersign (options) {

  // Instance variable defaults.
  this.tests = {};
  this.settings = {
    length:      false,
    digits:      false,
    uppercase:   false,
    lowercase:   false,
    whitespace:  false,
    punctuation: false,
    common:      false
  };

  // Save options.
  this.setTest(options);

  // Add the default tests.
  this.addTest('length', function (input, setting, finish) {
    var success = (input.length >= setting);
    return finish(null, success);
  });

  this.addTest('digits', function (input, setting, finish) {
    var success = Helpers.charMatch(input, setting, '0-9');
    return finish(null, success);
  });

  this.addTest('uppercase', function (input, setting, finish) {
    var success = Helpers.charMatch(input, setting, 'A-Z');
    return finish(null, success);
  });

  this.addTest('lowercase', function (input, setting, finish) {
    var success = Helpers.charMatch(input, setting, 'a-z');
    return finish(null, success);
  });

  this.addTest('whitespace', function (input, setting, finish) {
    var success = Helpers.charMatch(input, setting, '\s');
    return finish(null, success);
  });

  this.addTest('punctuation', function (input, setting, finish) {
    var symbols = [
      '±!@£$%^&*()_+',  //SHIFT + numbers.
      '¡€#¢∞§¶•ªº–≠',   //ALT + numbers.
      '[];\'\\,./',     //Other Symbols.
      '{}:"|<>?',       //SHIFT + Other Symbols.
      '“‘…æ«≤≥÷',       //ALT + Other Symbols.
      'œ∑´®†¥¨^øπ“‘',   //ALT + QWERTY Row.
      'åß∂ƒ©˙∆˚¬…æ«',   //ALT + ASDFG Row.
      '`Ω≈ç√∫~µ≤≥÷'     //ALT + ZXCVB Row.
    ];
    var success = Helpers.charMatch(input, setting, symbols.join());
    return finish(null, success);
  });

  this.addTest('common', function (input, setting, finish) {
    Helpers.dictionaryMatch(input, 'common', function (err, match) {
      if (err) { return finish(err); }
      return finish(null, !match);
    });
  });

};

/*
 * Apply the given settings to the given tests.
 * [Usage]
 *  [1] setTest({ length: 10, lowercase: true });
 *  [2] setTest('length', 10);
 */
Countersign.prototype.setTest = function (p1, p2) {

  // [1] setTest({ length: 10, lowercase: true });
  if (typeof p1 === 'object' && typeof p2 === 'undefined') {
    objectAssign(this.settings, p1);
  }

  // [2] setTest('length', 10);
  else if (typeof p1 === 'string' && typeof p2 !== 'undefined') {
    this.settings[p1] = p2;
  }

  // Allow method chaining.
  return this;

};

/*
 * Add a custom test.
 */
Countersign.prototype.addTest = function (key, fn) {

  // Can't add a new test if one already exists.
  if (typeof this.tests[key] !== 'undefined') {
    throw new Error('Test "' + key + '" is already present.');
    return;
  }

  // Function not passed.
  if (typeof fn !== 'function') {
    throw new Error('A custom test "' + key + '" must be a function.');
    return;
  }

  // Store the function for later.
  this.tests[key] = fn;

  // Ensure we add the test to the list of settings, if not already added.
  if (typeof this.settings[key] === 'undefined') {
    this.settings[key] = true;
  }

  // Allow method chaining.
  return this;

};

/*
 * Test the given password and pass true to the callback if the password
 * achieves the minimum score. Test methods cannot be chained further.
 * callback(err, success, result);
 */
Countersign.prototype.test = function (input, minScore, callback) {

  Helpers.runTest(this.settings, this.tests, input, minScore, function (err, result) {
    if (err) { return callback(err); }
    return callback(null, result.success, result);
  });

};

/*
 * Score the given password. Test methods cannot be chained further.
 * callback(err, score, result);
 */
Countersign.prototype.score = function (input, callback) {

  Helpers.runTest(this.settings, this.tests, input, 0, function (err, result) {
    if (err) { return callback(err); }
    return callback(null, result.score, result);
  });

};

/*
 * Contains various helpers not accessible from the outside.
 */
var Helpers = {

  /*
   * Runs a character match against the given input and returns true if the input
   * passed the generated regular expression.
   */
  charMatch: function (input, setting, chars, flags) {

    var num       = (typeof setting === 'number' ? setting : 1);
    var charBlock = '[' + escapeRegExp(chars) + ']';
    var joiner    = '(?:.+)?';
    var reArr     = [];

    // The block of characters needs to be repeated 'num' of times.
    for (var n = 0 ; n < num ; n++) {
      reArr.push(charBlock);
    }

    // Build the regular expression.
    var re  = new RegExp(joiner + reArr.join(joiner) + joiner, flags);

    // Run the test.
    return Boolean(input.match(re));

  },

  /*
   * Passes true to the callback if the
   * callback(err, match);
   */
  dictionaryMatch: function (input, name, callback) {

    Helpers.loadDictionary(name, function (err, dictionary) {

      if (err) { return callback(err); }

      // See if the password is in the dictionary.
      var match = (dictionary.indexOf(input) > -1);
      return callback(null, match);

    });

  },

  /*
   * Loads a dictionary file.
   * callback(err, dictionary);
   */
  loadDictionary: function (name, callback) {

    var filename = path.join(__dirname, 'dictionaries/' + name + '.json');

    fs.readFile(filename, function (err, data) {

      if (err) {
        throw new Error('Unable to load dictionary "' + name + '": ' + err);
        return;
      }

      // Try and parse as JSON.
      try {
        var dictionary = JSON.parse(data);
      }
      catch (err) {
        throw new Error('Unable to parse dictionary "' + name + '".');
        return;
      }

      // Pass dictionary to callback
      return callback(null, dictionary);

    });

  },

  /*
   * Runs all the tests and returns a result object.
   * callback(err, result);
   */
  runTest: function (settingsList, testsList, input, minScore, callback) {

    // Invalid input.
    if (typeof input !== 'string') {
      throw new Error('Test input must be a string, not "' + typeof input + '".');
      return;
    }

    var testResults    = {
      required: {},
      optional: {}
    };
    var overallSuccess = true;
    var score          = 0;
    var maxScore       = 0;
    var settingKeys    = Object.keys(settingsList);

    // Cycle through the tests.
    async.each(settingKeys, function (key, next) {

      var setting   = settingsList[key];
      var test      = testsList[key];
      var required  = Boolean(setting);
      var inputCopy = input;  //ensure the input can't be manipulated by a custom test.

      // Invalid test mean we drop this test.
      if (typeof test !== 'function') {
        throw new Error('Invalid setting "' + key + '" specified, there is no such test.');
        return;
      }

      // Run the test.
      test(inputCopy, setting, function (err, success) {

        if (err) { return next(err); }

        // Store the result of the test.
        if (required) { testResults.required[key] = success; }
        else          { testResults.optional[key] = success; }

        // Score the test.
        if (success) { score++; }
        maxScore++;

        // If a required test failed the password fails.
        if (!success && required) { overallSuccess = false; }

        // Continue to next test.
        return next(null);

      });

    }, function (err) {

      if (err) { return callback(err); }

      // Construct result object.
      var result = {
        success:  (overallSuccess && (score >= minScore)),
        score:    score,
        minScore: minScore,
        maxScore: maxScore,
        testResults: {
          required: testResults.required,
          optional: testResults.optional
        }
      };

      return callback(null, result);

    });

  }

};

/*
 * Export the constructor.
 */
module.exports = Countersign;