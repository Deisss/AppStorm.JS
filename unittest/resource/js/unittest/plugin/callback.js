// Unit test for a.callback (plugin)

module('plugin/callback.js');

/*
---------------------------------
  SYNCHRONIZER RELATED
---------------------------------
*/
test('a.callback.synchronizer-working', function() {
    stop();
    expect(1);

    /*
     * The idea : we start a timeout which will fail everything
     * if the clearTimeout is not called before final time
     * So we set 4 function 100ms each (so 400ms in chainer),
     * and timeout at 200ms.
     * The synchronizer has to start all function on same time,
     * so 100ms < 200ms, the final callback have time to stop
    */


    // Prevent scope change
    var se = strictEqual,
        st = start;

    // This timeout has to be removed by final callback,
    // or the test will fail (too much test)
    var time = setTimeout(function() {
        se(true, true,
            'The test fail : this event should be cancelled on time');
    }, 200);

    // We will add 4 times this callback, then raise final callback
    var defaultCallback = function(result) {
        setTimeout(result.success, 100);
    };
    var finalCallback = function() {
        clearTimeout(time);
        se(true, true,
          'The test succeed : the system could stop event before final time');
        st();
    };

    var sync = a.callback.synchronizer([
        defaultCallback,
        defaultCallback,
        defaultCallback,
        defaultCallback
    ],
        finalCallback
    );

    // Now running system
    sync.start();
});



test('a.callback.synchronizer-error', function() {
    stop();
    expect(1);

    // Prevent scope change
    var se = strictEqual,
        st = start;

    // This timeout has to be removed by final callback,
    // or the test will fail (too much test)
    var time = setTimeout(function() {
        se(true, true,
            'The test fail : this event should be cancelled on time');
    }, 200);

    // We will add 4 times this callback, then raise final callback
    var defaultCallback = function(result) {
        setTimeout(result.fail, 100);
    };
    var finalCallback = function() {
        clearTimeout(time);
        se(true, true,
          'The test succeed : the system could stop event before final time');
        st();
    };

    // Now running system
    var sync = a.callback.synchronizer([
        defaultCallback,
        defaultCallback,
        defaultCallback,
        defaultCallback
    ],
        null,
        finalCallback
    );
    sync.start();
});



test('a.callback.synchronizer-removecallback', function() {
    stop();
    expect(1);

    /*
     * We set a pretty short timeout on synchronizer.start,
     * because the removeCallback should remove all callback...
     * So all callback 100ms function will be disabled,
     * which makes the system starting success function right before 50ms...
    */

    // Prevent scope change
    var se = strictEqual,
        st = start;

    // We will add 4 times this callback, then raise final callback
    var defaultCallback = function(result) {
        setTimeout(result.success, 100);
    };
    var defaultCallback2 = function(result) {
        result.success();
    };
    var finalCallback = function() {
        se(true, true,
          'The test succeed : the system could stop event before final time');
        st();
    };

    // Now running system
    var sync = a.callback.synchronizer([
        defaultCallback,
        defaultCallback,
        defaultCallback,
        defaultCallback,
        defaultCallback2
    ],
        finalCallback
    );
    sync.removeCallback(defaultCallback);

    sync.start();
});


// We check that synchronizer, without any callback, raise success function
test('a.callback.synchronizer-nocallback', function() {
    stop();
    expect(1);

    // Prevent scope change
    var se = strictEqual,
        st = start;

    var finalCallback = function() {
        se(true, true,
          'The test succeed : the system could stop event before final time');
        st();
    };

    var sync = a.callback.synchronizer(null, finalCallback);

    sync.start();
});


// Sending data threw callback works
test('a.callback.synchronizer-data', function() {
    stop();
    expect(2);

    // Prevent scope change
    var se = strictEqual,
        st = start;

    var finalCallback = function(result) {
        se(result.getData('ok'), 'hello', 'The first stored data');
        se(result.getData('ok2'), 'hello2', 'The second stored data');
        st();
    };

    var sync = a.callback.synchronizer(null, finalCallback);

    sync.addCallback(function(result) {
        result.setData('ok', 'hello');
        return result.done();
    });

    sync.addCallback(function(result) {
        result.setData('ok2', 'hello2');
        return result.done();
    });

    sync.start();
});


// Test sending data threw start function
test('a.callback.synchronizer-initial-data', function() {
    stop();
    expect(4);

    var se = strictEqual,
        st = start;

    function defaultCallback(arg1, arg2, result) {
        se(arg1, 'ok');
        se(arg2, 2);
        result.done();
    };

    var sync = a.callback.synchronizer([
        defaultCallback,
        defaultCallback
    ], function() {
        st();
    });
    sync.start('ok', 2);
});

// Test addCallback manually
test('a.callback.synchronizer-addCallback', function() {
    stop();
    expect(5);

    var se = ok,
        st = start;

    function defaultCallback() {
        se(true, true, 'Test default callback');
        this.next();
    };

    function finalCallback() {
        se(true, true, 'Test final callback');
    };

    var sync1 = a.callback.synchronizer(),
        sync2 = a.callback.synchronizer();

    sync1.addCallback(defaultCallback);
    sync1.addCallback(defaultCallback);

    sync2.addCallback(defaultCallback);

    sync1.successFunction = finalCallback;
    sync2.successFunction = finalCallback;

    sync1.start();
    sync2.start();

    // Release unit test
    setTimeout(st, 100);
});




/*
---------------------------------
  BOTH RELATED
---------------------------------
*/


// Because synchronizer and chainer got same initial prototype,
// we make sure any changes will broke the fact they are separated...
// Se we run multiple instance of both,
// and check they are running alone each of them
test('a.callback.synchronizer-chainer', function() {
    stop();
    expect(10);

    // Prevent scope change
    var se = strictEqual,
        st = start;

    // We will add 7 times this callback, two for each system and one alone
    var defaultCallback = function(result) {
        result = result || this;
        se(true, true, 'Not final result ');
        result.success();
    };
    // We add it 3 times : one of them will not have any success function
    var finalCallback = function() {
        se(true, true,
           'The test succeed : the system could stop event before final time');
    };

    var sync1  = a.callback.synchronizer(),
        sync2  = a.callback.synchronizer(),
        chain1 = a.callback.chainer([
            defaultCallback,
            defaultCallback
        ],
            finalCallback
        ),
        chain2 = a.callback.chainer([
            defaultCallback
        ],
            finalCallback
        );

    sync1.addCallback(defaultCallback);
    sync1.addCallback(defaultCallback);

    sync2.addCallback(defaultCallback);
    sync2.addCallback(defaultCallback);

    sync2.successFunction = finalCallback;

    chain1.successFunction = finalCallback;
    chain2.successFunction = finalCallback;

    sync1.start();
    sync2.start();
    chain1.start();
    chain2.start();

    setTimeout(function() {
        st();
    }, 200);
});


// This time, we do the same, but we include a scope change
test('a.callback.synchronizer-chainer-with-scope', function() {
    stop();
    expect(10);

    // Prevent scope change
    var se = strictEqual,
        st = start;

    // We will add 7 times this callback, two for each system and one alone
    var defaultCallback = function(result) {
        result = result || this;
        se(true, true, 'Not final result ');
        result.success();
    };
    // We add it 3 times : one of them will not have any success function
    var finalCallback = function() {
        se(true, true,
           'The test succeed : the system could stop event before final time');
    };

    var sync1  = a.callback.synchronizer(),
        sync2  = a.callback.synchronizer(),
        chain1 = a.callback.chainer([
            defaultCallback,
            defaultCallback
        ],
            finalCallback
        ),
        chain2 = a.callback.chainer([
            defaultCallback
        ],
            finalCallback
        ),
        o = {};

    sync1.addCallback(defaultCallback);
    sync1.addCallback(defaultCallback);

    sync2.addCallback(defaultCallback);
    sync2.addCallback(defaultCallback);

    sync2.successFunction = finalCallback;

    chain1.successFunction = finalCallback;
    chain2.successFunction = finalCallback;

    sync1.scope = o;
    sync1.start();
    sync2.scope = o;
    sync2.start();
    chain1.scope = o;
    chain1.start();
    chain2.scope = o;
    chain2.start();

    setTimeout(function() {
        st();
    }, 200);
});



/*
---------------------------------
  CHAINER RELATED
---------------------------------
*/


test('a.callback.chainer-working', function() {
    stop();
    expect(1);

    /*
     * The idea : we compare date between start and end time,
     * allowing to check elapsed time is correct (all run until end)
    */


    // Prevent scope change
    var se = ok,
        st = start;

    var time = (new Date()).getTime();

    // We will add 4 times this callback, then raise final callback
    var defaultCallback = function() {
        var that = this;
        setTimeout(function() {
            that.next.apply(that);
        }, 100);
    };
    var finalCallback = function() {
        var newTime = (new Date()).getTime();
        // Using timer is not extremely precise,
        // but will be around 400ms as expected
        se(newTime - time > 300,
                        'The system wait as expected chain to finish');
        st();
    };

    var chain = a.callback.chainer([
        defaultCallback,
        defaultCallback,
        defaultCallback,
        defaultCallback
    ],
        finalCallback
    );

    // Running system
    chain.start();
});



test('a.callback.chainer-error', function() {
    stop();
    expect(1);

    /*
     * The idea : we compare date between start and end time,
     * allowing to check elapsed time is correct (only one run, other stop)
    */

    // Prevent scope change
    var se = ok,
        st = start,
        time = (new Date()).getTime();

    // We will add 4 times this callback, then raise final callback
    var defaultCallback = function() {
        var that = this;
        setTimeout(function() {
            that.stop.apply(that);
        }, 100);
    };
    var finalCallback = function() {
        var newTime = (new Date()).getTime();
        se(newTime - time < 150,
                        'The system wait as expected chain to finish');
        st();
    };

    var chain = a.callback.chainer([
        defaultCallback,
        defaultCallback,
        defaultCallback,
        defaultCallback
    ],
        null,
        finalCallback
    );
    // Now running system
    chain.start();
});


// Test passing arguments
test('a.callback.chainer-arguments', function() {
    stop();
    expect(5);

    var se = strictEqual,
        st = start;

    function firstCallback(chain) {
        se(true, true, 'First callback');
        chain.setData('ok', 'yatta');
        // Passing a string to next element
        chain.next('something');
    };

    function secondCallback(str, chain) {
        se(str, 'something', 'Test argument');
        se(chain.getData('ok'), 'yatta', 'Arguments passed threw data');
        chain.next('ok', 2);
    };

    function finalCallback(str1, int1, chain) {
        se(str1, 'ok', 'Test arg1');
        se(int1, 2, 'Test arg2');
        st();
    };

    var chain = a.callback.chainer(
                    [firstCallback, secondCallback], finalCallback);
    chain.start();
});


// Test addCallback manually
test('a.callback.chainer-addCallback', function() {
    stop();
    expect(5);

    var se = ok,
        st = start;

    function defaultCallback() {
        se(true, true, 'Test default callback');
        this.next();
    };

    function finalCallback() {
        se(true, true, 'Test final callback');
    };

    var chain1 = a.callback.chainer(),
        chain2 = a.callback.chainer();

    chain1.addCallback(defaultCallback);
    chain1.addCallback(defaultCallback);

    chain2.addCallback(defaultCallback);

    chain1.successFunction = finalCallback;
    chain2.successFunction = finalCallback;

    chain1.start();
    chain2.start();

    // Release unit test
    setTimeout(st, 100);
});



test('a.callback.chainer-removeCallback', function() {
    stop();
    expect(1);

    /*
     * The idea : we remove all callback,
     * then success should be called directly, under 100ms
    */

    // Prevent scope change
    var se = ok,
        st = start,
        time  = (new Date()).getTime();

    // We will add 4 times this callback, then raise final callback
    var defaultCallback = function() {
        var that = this;
        setTimeout(function() {
            that.error.apply(that);
        }, 100);
    };
    var finalCallback = function() {
        var newTime = (new Date()).getTime();
        se(newTime - time < 50, 'The system wait as expected chain to finish');
        st();
    };

    // Now running system
    var chain = a.callback.chainer([
        defaultCallback,
        defaultCallback,
        defaultCallback,
        defaultCallback
    ],
        finalCallback
    );

    // We remove all first callbacks to keep only success
    chain.removeCallback(defaultCallback);
    chain.start();
});


// We test that without callback, chainer start success directly
test('a.callback.chainer-nocallback', function() {
    stop();
    expect(1);

    // Prevent scope change
    var se = ok,
        st = start;

    var finalCallback = function() {
        se(1==1, 'The system directly output result');
        st();
    };

    // Now running system
    var chain = a.callback.chainer(null, finalCallback);
    chain.start();
});


// Sending data threw callback works
test('a.callback.chainer-data', function() {
    stop();
    expect(3);

    // Prevent scope change
    var se = ok,
        st = start;

    var finalCallback = function(obj) {
        se(this.getData('ok'), 'hello', 'Test data stored');
        se(this.data['ok2'], 'hello2', 'Test data stored');
        st();
    };

    var chain = a.callback.chainer(null, finalCallback);

    chain.addCallback(function() {
        this.setData('ok', 'hello', 'Test data');
        this.done();
    });

    chain.addCallback(function() {
        this.setData('ok2', 'hello2', 'Test data');
        se(this.getData('ok'), 'hello', 'The system send data');
        this.done();
    });

    // Now running system
    chain.start();
});