use itertools::Itertools;
use wasm_bindgen::JsValue;
use wasm_bindgen_test::wasm_bindgen_test;
extern crate solver_rust_wasm;
use solver_rust_wasm::{CalculateResult, format_equation, get_operations, calculate_results, Operation, OPERATIONS, SolverConfig};

// wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
pub fn test_get_operations() {
  let operations: Vec<Operation> = get_operations().into_serde().unwrap();
  assert_eq!(operations, OPERATIONS.iter().map(|op| op.operation.clone()).collect_vec());
}

#[wasm_bindgen_test]
pub fn test_format_equation() {
  assert_eq!(
    format_equation("plus".to_string(), "2".to_string(), "3".to_string()).unwrap(),
    "2 + 3".to_string()
  );

  assert_eq!(
    format_equation("unknown".to_string(), "2".to_string(), "3".to_string()).is_err(),
    true
  );
}

#[wasm_bindgen_test]
pub fn test_get_solutions() {
  let res_js_value = calculate_results(JsValue::from_serde(&SolverConfig {
    minTotal: 1,
    maxTotal: 36,
    faces: vec![4, 5, 6],
    operation_ids: OPERATIONS.iter()
      .map(|op| op.operation.id.clone())
      .collect_vec()
  }).unwrap()).unwrap();

  let results: Vec<CalculateResult> = res_js_value.into_serde().unwrap();
  assert_eq!(results.len(), 106);
}
