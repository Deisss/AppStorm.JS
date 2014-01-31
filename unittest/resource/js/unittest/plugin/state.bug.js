// Unit test for a.state (plugin)
// We handle bug and test to check they are not coming back

module('plugin/state.js');

// In this unit test, we check 2 children, with same parent element,
// and same hashtag, are both loaded not only one
test('a.state.dualchildren', function() {
    stop();
    expect(4);

    a.state.clear();

    var se = strictEqual,
        st = start;

    var tree = {
        id : 'ok',
        children : [
            {
                hash : 'unittest-dualchildren',
                load : function(chain) {
                    se(1, 1, 'Test loading first child');
                    chain.next();
                },
                unload : function(chain) {
                    se(1, 1, 'Test unloading first child');
                    chain.next();
                }
            },
            {
                hash : 'unittest-dualchildren',
                load : function(chain) {
                    se(1, 1, 'Test loading second child');
                    chain.next();
                },
                unload : function(chain) {
                    se(1, 1, 'Test unloading second child');
                    chain.next();
                }
            }
        ]
    };

    a.state.add(tree);

    // Now starting to proceed loader
    setTimeout(function() {
        window.location.href = '#unittest-dualchildren';
    }, 200);

    // Old browser will need a little wait...
    setTimeout(function() {
        window.location.href = '#tmp';
    }, 600);

    // Old browser will need a little wait...
    setTimeout(function() {
        a.state.clear();
        window.location.href = '#';
        st();
    }, 1000);
});



// Bug : passing data threw preLoad, load and postLoad
test('a.state.parameter-passthrew', function() {
    stop();
    expect(3);
    a.state.clear();

    var se = strictEqual,
        st = start;

    var test = {
        id : 'testloadpassthrew',
        data : {
            objId : '{{memory : test_objid}}'
        },
        converter : function(data) {
            data.plop = data.objId;
        },
        preLoad : function(chain) {
            this.data['data2'] = 'ok';
            chain.done();
        },
        postLoad : function(chain) {
            se(this.data['objId'], 'hello from data', 'test data pass');
            se(this.data['plop'], 'hello from data', 'test data pass');
            se(this.data['data2'], 'ok', 'test from postload');
            a.state.clear();
            st();
        }
    };
    a.state.add(test);

    // Place a value and try result
    a.storage.memory.set('test_objid', 'hello from data');
    a.state.load('testloadpassthrew');
});


// Bug : too long request, may make the system putting
// content of #a while #b is already loading...
test('a.state.request-abort', function() {
    stop();
    expect(1);
    a.state.clear();

    var se = strictEqual,
        st = start;

    var b = {
        id : 'child-b',
        hash : 'request-abort-b',
        preLoad : function(chain) {
            se(true, true, 'Arrive on time');
            chain.done();
        }
    };

    var c = {
        id : 'child-c',
        hash : 'request-abort-c',
        preLoad : function(chain) {
            a.timer.once(chain.done, null, 1000);
        },
        load : function() {
            se(false, true, 'should be cancelled');
        }
    };

    a.state.add(c);
    a.state.add(b);

    // Now starting to proceed loader
    setTimeout(function() {
        window.location.href = '#request-abort-c';
    }, 200);

    // Old browser will need a little wait...
    setTimeout(function() {
        window.location.href = '#request-abort-b';
    }, 600);

    // Old browser will need a little wait...
    setTimeout(function() {
        a.state.clear();
        window.location.href = '#';
        st();
    }, 2000);
});