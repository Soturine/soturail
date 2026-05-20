use soturail_native::{reduce_generic, reduce_git, reduce_test};

#[test]
fn generic_preserves_error_signal() {
    let out = reduce_generic("ok\nerror: denied\nok\n", "abc");
    assert!(out.contains("error: denied"));
    assert!(out.contains("soturail expand abc"));
}

#[test]
fn git_preserves_changed_file() {
    let out = reduce_git("diff --git a/src/app.ts b/src/app.ts\n@@ -1 +1 @@\n", "abc");
    assert!(out.contains("src/app.ts"));
    assert!(out.contains("@@ -1 +1 @@"));
}

#[test]
fn test_preserves_assertion() {
    let out = reduce_test("FAIL tests/app.test.ts\nAssertionError: Expected 1 Received 2\n", "abc");
    assert!(out.contains("AssertionError"));
    assert!(out.contains("tests/app.test.ts"));
}
