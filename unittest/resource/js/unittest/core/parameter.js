// Unit test for a.parameter

module('core/parameter.js')

// Test extract on begin
test('a.parameter.extract-beginning', function() {
    var begin = '{{super: [a-f0-9]+}}/something';
    var extrapolate = a.parameter.extract(begin);

    strictEqual(extrapolate.length, 1);
    strictEqual(extrapolate[0].name, 'super');
    strictEqual(extrapolate[0].original, '{{super: [a-f0-9]+}}');
    strictEqual(extrapolate[0].regex, '[a-f0-9]+');
    strictEqual(extrapolate[0].start, 0);
});

// Test extract on end
test('a.parameter.extract-end', function() {
    var end = '/dashboard/{{another: \\d+}}';
    var extrapolate = a.parameter.extract(end);

    strictEqual(extrapolate.length, 1);
    strictEqual(extrapolate[0].name, 'another');
    strictEqual(extrapolate[0].original, '{{another: \\d+}}');
    strictEqual(extrapolate[0].regex, '\\d+');
    strictEqual(extrapolate[0].start, 11);
});

// Test extract on full string
test('a.parameter.extract-all', function() {
    var test = '/dashboard/{{groupId: [a-fA-F0-9]+}}/note/{{noteId: \\w+}}';
    var extrapolate = a.parameter.extract(test);

    strictEqual(extrapolate.length, 2);

    strictEqual(extrapolate[0].name, 'groupId');
    strictEqual(extrapolate[1].name, 'noteId');

    strictEqual(extrapolate[0].original, '{{groupId: [a-fA-F0-9]+}}');
    strictEqual(extrapolate[1].original, '{{noteId: \\w+}}');

    strictEqual(extrapolate[0].regex, '[a-fA-F0-9]+');
    strictEqual(extrapolate[1].regex, '\\w+');

    strictEqual(extrapolate[0].start, 11);
    strictEqual(extrapolate[1].start, 42);
});

// Test custom regex extract
test('a.parameter.extract-custom', function() {
    var test = '/dash/||ok||/||another||';
    var customRegex = /\|\|([a-z]*)\|\|/gi;
    var extrapolate = a.parameter.extract(test, customRegex);

    strictEqual(extrapolate.length, 2);

    strictEqual(extrapolate[0].name, 'hash');
    strictEqual(extrapolate[1].name, 'hash');

    strictEqual(extrapolate[0].original, '||ok||');
    strictEqual(extrapolate[1].original, '||another||');

    strictEqual(extrapolate[0].regex, 'ok');
    strictEqual(extrapolate[1].regex, 'another');

    strictEqual(extrapolate[0].start, 6);
    strictEqual(extrapolate[1].start, 13);
});

// Test parameter replace
test('a.parameter.replace', function() {
    var test = '/dashboard/{{groupId: \\d+}}/ok';
    var extrapolate = a.parameter.extract(test);

    var result = a.parameter.replace(test, extrapolate[0], 'customString');
    strictEqual(result, '/dashboard/customString/ok');
});

// Test parameter convert
test('a.parameter.convert', function() {
    var test = '/dashboard/{{groupId: [a-fA-F0-9]+}}/note/{{noteId: \\w+}}';
    var converted = a.parameter.convert(test);

    strictEqual(converted, '/dashboard/([a-fA-F0-9]+)/note/(\\w+)');
});

// Test parameter convert (custom regex)
test('a.parameter.convert-regex', function() {
    var test = '/dashboard/||something|other||/note/||another|ok||';
    var customRegex = /\|\|([a-z-\|]*)\|\|/gi;
    var converted = a.parameter.convert(test, customRegex);

    strictEqual(converted, '/dashboard/(something|other)/note/(another|ok)');
});

// Test parameter extrapolate
test('a.parameter.extrapolate', function() {
    var url      = '/ok/{{id}}',
        hash     = '/dashboard/32',
        internal = '/dashboard/{{id: [0-9]+}}';

    var result = a.parameter.extrapolate(url, hash, internal);

    strictEqual(result, '/ok/32');
});

// Test parameter addParameterType
test('a.parameter.addParameterType', function() {
    var add = 'unit1';
    a.parameter.addParameterType(add, function() {return 'ok';});

    strictEqual(a.parameter._fct[add](), 'ok');

    a.parameter.removeParameterType(add);
});

// Test parameter type (working as expected)
test('a.parameter.parameterType', function() {
    // We add a function
    var name = 'unittestparamType';
    a.parameter.addParameterType(name, function(content) {
        return content + 'ok';
    });

    // Now we send request and check extrapolate result
    var hash = '/dashboard',
        url  = 'http://mylink.com/{{unittestparamType: supername}}';
        result = a.parameter.extrapolate(url, hash, '');

    strictEqual(result, 'http://mylink.com/supernameok');

    a.parameter.removeParameterType(name);
});

// Test parameter type (working as expected)
test('a.parameter.parameterType2', function() {
    // We add a function
    var name = 'unittest-paramType';
    a.parameter.addParameterType(name, function(content) {
        return content + 'ok';
    });

    // Now we send request and check extrapolate result
    var hash = '/dashboard',
        url  = 'http://mylink.com/{{unittest-paramType: supername}}';
        result = a.parameter.extrapolate(url, hash, '');

    strictEqual(result, 'http://mylink.com/supernameok');

    a.parameter.removeParameterType(name);
});

// Test parameter removeParameterType
test('a.parameter.removeParameterType', function() {
    var add1 = 'unitest1',
        add2 = 'unitest2',
        l1   = a.size(a.parameter._fct);

    // Add first test
    a.parameter.addParameterType(add1, function() {});
    a.parameter.addParameterType(add2, function() {});
    strictEqual(a.size(a.parameter._fct), l1 + 2);

    // Remove first
    a.parameter.removeParameterType(add1);
    strictEqual(a.size(a.parameter._fct), l1 + 1);

    // Remove second
    a.parameter.removeParameterType(add2);
    strictEqual(a.size(a.parameter._fct), l1);
});











// Test extracting elements from system
test('a.parameter.extract-old-unittest', function() {
    expect(26);

    var param1 = 
    'this is a string with {{type :    [a-zA-Z0-9]?}} and also {{id : .*  }}',
        param2 = 'another {{ example : \\d+}} and also {{this : a|b}}',
        param3 = 
        'The last {{one : \\w+}} but not least {{invalidate : [^a-fA-F]+  }}',
        param4 = 
'But this one don\'t work {{worknot}} and also this one too {{oups : @ok}}';

    // Now we test extract system does work as expected
    var extracted1 = a.parameter.extract(param1),
        extracted2 = a.parameter.extract(param2),
        extracted3 = a.parameter.extract(param3),
        extracted4 = a.parameter.extract(param4);

    // Test tab length
    strictEqual(extracted1.length, 2, 'Test length');
    strictEqual(extracted2.length, 2, 'Test length');
    strictEqual(extracted3.length, 2, 'Test length');
    strictEqual(extracted4.length, 0, 'Test length');

    // Test content (name)
    strictEqual(extracted1[0]['name'], 'type', 'Test name');
    strictEqual(extracted1[1]['name'], 'id', 'Test name');
    strictEqual(extracted2[0]['name'], 'example', 'Test name');
    strictEqual(extracted2[1]['name'], 'this', 'Test name');
    strictEqual(extracted3[0]['name'], 'one', 'Test name');
    strictEqual(extracted3[1]['name'], 'invalidate', 'Test name');

    // Test content (original)
    strictEqual(extracted1[0]['original'], 
                        '{{type :    [a-zA-Z0-9]?}}', 'Test original');
    strictEqual(extracted1[1]['original'], '{{id : .*  }}', 'Test original');
    strictEqual(extracted2[0]['original'], 
                        '{{ example : \\d+}}', 'Test original');
    strictEqual(extracted2[1]['original'], '{{this : a|b}}', 'Test original');
    strictEqual(extracted3[0]['original'], '{{one : \\w+}}', 'Test original');
    strictEqual(extracted3[1]['original'], 
                        '{{invalidate : [^a-fA-F]+  }}', 'Test original');

    // Test content (regex)
    strictEqual(extracted1[0]['regex'], '[a-zA-Z0-9]?', 'Test regex');
    strictEqual(extracted1[1]['regex'], '.*', 'Test regex');
    strictEqual(extracted2[0]['regex'], '\\d+', 'Test regex');
    strictEqual(extracted2[1]['regex'], 'a|b', 'Test regex');
    strictEqual(extracted3[0]['regex'], '\\w+', 'Test regex');
    strictEqual(extracted3[1]['regex'], '[^a-fA-F]+', 'Test regex');

    // Now we try custom regex behaviour to handle param4
    var rgx = /\{\{(\s*\w+\s*)\}\}/gmi;
    extracted4 = a.parameter.extract(param4, rgx);

    // Now this time the worknot does work...
    strictEqual(extracted4.length, 1, 'Test length');
    strictEqual(extracted4[0]['name'], 'hash', 'Test name');
    strictEqual(extracted4[0]['original'], '{{worknot}}', 'Test original');
    strictEqual(extracted4[0]['regex'], 'worknot', 'Test regex');
});

// Testing the replace content system
test('a.parameter.replace-old-unittest', function() {
    expect(8);

    var param1 =
    'this is a string with {{type :    [a-zA-Z0-9]?}} and also {{id : .*  }}',
        param2 = 'another {{ example : \\d+}} and also {{this : a|b}}',
        param3 =
    'The last {{one : \\w+}} but not least {{invalidate : [^a-fA-F]+  }}',
        param4 = 
'But this one don\'t work {{worknot}} and also this one too {{oups : @ok}}';

    // For second unit test series
    var e1 = param1, e2 = param2, e3 = param3, e4 = param4;

    // Now we test extract system does work as expected
    var extracted1 = a.parameter.extract(param1),
        extracted2 = a.parameter.extract(param2),
        extracted3 = a.parameter.extract(param3),
        extracted4 = a.parameter.extract(param4);

    // Now we use default extract system, and check result
    var l = extracted1.length;
    while(l--) {param1 = a.parameter.replace(param1, extracted1[l]);}
    strictEqual(param1, 
        'this is a string with ([a-zA-Z0-9]?) and also (.*)', 'Test replace');

    l = extracted2.length;
    while(l--) {param2 = a.parameter.replace(param2, extracted2[l]);}
    strictEqual(param2, 'another (\\d+) and also (a|b)', 'Test replace');

    l = extracted3.length;
    while(l--) {param3 = a.parameter.replace(param3, extracted3[l]);}
    strictEqual(param3, 
        'The last (\\w+) but not least ([^a-fA-F]+)', 'Test replace');

    l = extracted4.length;
    while(l--) {param4 = a.parameter.replace(param4, extracted4[l]);}
    strictEqual(param4, 
    'But this one don\'t work {{worknot}} and also this one too {{oups : @ok}}'
    , 'Test replace');

    // Now we test with replacer
    l = extracted1.length;
    while(l--) {e1 = a.parameter.replace(e1, extracted1[l], 'a');}
    strictEqual(e1, 'this is a string with a and also a', 'Test replace');

    l = extracted2.length;
    while(l--) {e2 = a.parameter.replace(e2, extracted2[l], 'a');}
    strictEqual(e2, 'another a and also a', 'Test replace');

    l = extracted3.length;
    while(l--) {e3 = a.parameter.replace(e3, extracted3[l], 'a');}
    strictEqual(e3, 'The last a but not least a', 'Test replace');

    l = extracted4.length;
    while(l--) {e4 = a.parameter.replace(e4, extracted4[l], 'a');}
    strictEqual(e4, 
    'But this one don\'t work {{worknot}} and also this one too {{oups : @ok}}'
    , 'Test replace');
});

// Testing extrapolate data from content
test('a.parameter.extrapolate-old-unittest', function() {
    expect(6);

    var t1 = [
            'This test need to be {{hash : type}} to be ' +
            'replaced but not {{everywhere}}',
            'current-hash-ab-yes',
            'current-hash-{{type : [ab]+}}-yes'
        ],
        t2 = [
            'Also this one should {{hash : not}} be parsed ' +
            'because {{hash : it}} does not exist',
            'yatta',
            '{{it : [a-z]+}}'
        ],
        t3 = [
            'This one does use {{store : unittest_memory}} internal mem',
            'yatta',
            '{{memory : [a-z]+}}'
        ],
        t4 = [
            'This one is limited to {{temporary : unittest_mem}} storage',
            'yatta',
            '{{memory : [a-z]+}}'
        ],
        t5 = [
            'And that one is {{cookie : unittest_ok}} land',
            'yatta',
            '{{memory : [a-z]+}}'
        ],
        t6 = [
            'And that one is {{root_test}} using direct binding',
            'yatta',
            '{{root_test : [a-z]+}}'
        ];

    // Setting storage item to use right after
    a.storage.persistent.set('unittest_memory', 'ppp1');
    a.storage.temporary.set('unittest_mem', 'ppp2');
    a.storage.cookie.set('unittest_ok', 'ppp3');

    // Now we do unit test
    var r1 = a.parameter.extrapolate(t1[0], t1[1], t1[2]);
    var r2 = a.parameter.extrapolate(t2[0], t2[1], t2[2]);
    var r3 = a.parameter.extrapolate(t3[0], t3[1], t3[2]);
    var r4 = a.parameter.extrapolate(t4[0], t4[1], t4[2]);
    var r5 = a.parameter.extrapolate(t5[0], t5[1], t5[2]);
    var r6 = a.parameter.extrapolate(t6[0], t6[1], t6[2]);

    strictEqual(r1, 
        'This test need to be ab to be replaced but not {{everywhere}}', 
        'Test result');
    strictEqual(r2, 
'Also this one should {{hash : not}} be parsed because yatta does not exist',
        'Test result');
    strictEqual(r3, 'This one does use ppp1 internal mem', 'Test result');
    strictEqual(r4, 'This one is limited to ppp2 storage', 'Test result');
    strictEqual(r5, 'And that one is ppp3 land', 'Test result');
    strictEqual(r6, 'And that one is yatta using direct binding', 
                        'Test result');
});

// Test a pretty complex one
test('a.parameter.extrapolate-complex-old-unittest', function() {
    var test = [
        'http://localhost/Bugs/project/{{projectId}}/bug/{{bugId}}',
        'bugs-51cc10cd9b2b60ec50897d99-51cc10cd9b2b60ec50897d96',
        '{{type : [a-zA-Z0-9]*}}-{{projectId : [a-fA-F0-9]+}}' +
        '{{separator : -?}}{{bugId : .*}}'
    ];

    var result = a.parameter.extrapolate(test[0], test[1], test[2])

    strictEqual(result, 'http://localhost/Bugs/project/' +
            '51cc10cd9b2b60ec50897d99/bug/51cc10cd9b2b60ec50897d96');
});