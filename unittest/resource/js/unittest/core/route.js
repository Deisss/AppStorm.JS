// Unit test for a.route

module('core/route.js', {
    setup: function() {
        hashtag('');
    },
    teardown: function() {
        hashtag('');
    }
});




// Test entering route system
asyncTest('a.route.enter', function() {
    expect(1);

    // Dummy function to test entering route element
    function checkRoute(hash) {
        strictEqual(hash, 'unittest-route1', 'Test entering');
    };

    // Binding function to route
    a.route.bind('unittest-route1', checkRoute);

    chain('unittest-route1', function() {
        hashtag('unittest-noroute1');
    });

    chain('unittest-noroute1', function() {
        a.route.unbind('unittest-route1', checkRoute);
        start();
    }, 100);

    hashtag('unittest-route1');
});

// Test leaving route system
asyncTest('a.route.leave', function() {
    expect(1);

    // Dummy function to test leaving route element
    function checkRoute(hash) {
        strictEqual(hash, 'unittest-route2', 'Test leaving');
    };

    // Binding function to route
    a.route.bind('unittest-route2', checkRoute, 'leave');

    chain('unittest-route2', function() {
        hashtag('unittest-noroute2');
    });

    chain('unittest-noroute2', function() {
        a.route.unbind('unittest-route2', checkRoute, 'leave');
        start();
    }, 100);

    // Starting system
    hashtag('unittest-route2');
});

// Test entering - otherwise system
asyncTest('a.route.enter-otherwise', function() {
    expect(2);

    // Dummy function to test entering route element
    function checkOtherwise() {
        strictEqual(1, 1, 'Test otherwise enter');
    };

    // Binding function to route
    a.route.otherwise(checkOtherwise);

    chain('unittest-route-otherwise1', function() {
        hashtag('unittest-route-nootherwise1');
    });

    chain('unittest-route-nootherwise1', function() {
       a.route.otherwise(null);
        start();
    }, 100);

    hashtag('unittest-route-otherwise1');
});

// Test leaving - otherwise system
asyncTest('a.route.leaving-otherwise', function() {
    expect(2);

    // Dummy function to test leaving route element
    function checkOtherwise() {
        strictEqual(1, 1, 'Test otherwise leaving');
    };

    // Binding function to route
    a.route.otherwise(checkOtherwise, 'leave');

    chain('unittest-route-otherwise2', function() {
        hashtag('unittest-route-nootherwise2');
    });

    chain('unittest-route-nootherwise2', function() {
        a.route.otherwise(null, 'leave');
        start();
    }, 100);

    hashtag('unittest-route-otherwise2');
});


asyncTest('a.route.fake', function() {
    expect(1);


    // Dummy function to test entering route element
    function checkRoute(hash) {
        strictEqual(hash, 'unittest-route3', 'Test entering');
        a.route.unbind('unittest-route3', checkRoute);
        start();
    };

    // Binding function to route
    a.route.bind('unittest-route3', checkRoute);
    a.route.fake('unittest-route3');
});