use std::cmp::Ordering;
use std::error::Error;
use std::fmt;
use std::fmt::Formatter;
use std::hash::Hash;
use itertools::Itertools;
use wasm_bindgen::prelude::*;
use serde::Deserialize;
use serde::Serialize;
use lazy_static::lazy_static;

type SolveFn = fn(f64, f64) -> f64;
type DisplayFn = fn(String, String) -> String;
type GroupingFn = fn(String) -> String;

#[derive(Debug, Serialize, Deserialize, Hash, Eq)]
pub struct Operation {
  pub id: String,
  pub name: String,
  pub is_commutative: bool,
}

impl PartialEq<Self> for Operation {
  fn eq(&self, other: &Self) -> bool {
    self.id == other.id
      && self.name == other.name
      && self.is_commutative == other.is_commutative
  }
}

impl Clone for Operation {
  fn clone(&self) -> Self {
    Operation {
      id: self.id.clone(),
      name: self.name.clone(),
      is_commutative: self.is_commutative,
    }
  }
}

#[derive(Debug, Hash, Eq)]
struct OperationActions {
  pub solve: SolveFn,
  pub display: DisplayFn,
  pub display_group: GroupingFn,
}

impl PartialEq<Self> for OperationActions {
  fn eq(&self, other: &Self) -> bool {
    self.solve == other.solve
      && self.display == other.display
      && self.display_group == other.display_group
  }
}

#[derive(Debug, Hash, Eq)]
pub struct OperationWithActions {
  pub operation: Operation,
  actions: OperationActions,
}

impl PartialEq<Self> for OperationWithActions {
  fn eq(&self, other: &Self) -> bool {
    self.operation == other.operation
      && self.actions == other.actions
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SolverConfig {
  pub minTotal: u64,
  pub maxTotal: u64,
  pub faces: Vec<isize>,
  pub operation_ids: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Hash, Eq)]
pub struct CalculateResult {
  pub total: u64,
  pub equation: String,
  pub fullEquation: String,
  pub sortableEquation: String,
}

impl PartialEq<Self> for CalculateResult {
  fn eq(&self, other: &Self) -> bool {
    self.total == other.total
      && self.equation == other.equation
      && self.fullEquation == other.fullEquation
      && self.sortableEquation == other.sortableEquation
  }
}

#[derive(Debug, Clone)]
struct IntermediateResult {
  pub total: f64,
  pub equation: String,
  pub is_leaf: bool,
}

impl Ord for IntermediateResult {
  fn cmp(&self, other: &Self) -> Ordering {
    if self.is_leaf && self.total < other.total {
      return Ordering::Less;
    }

    if other.is_leaf && other.total < self.total {
      return Ordering::Greater;
    }

    if self.is_leaf {
      return Ordering::Less;
    }

    if other.is_leaf {
      return Ordering::Greater;
    }

    if self.total < other.total {
      return Ordering::Less;
    }

    if other.total < self.total {
      return Ordering::Greater;
    }

    Ordering::Equal
  }
}

impl PartialOrd for IntermediateResult {
  fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
    Some(self.cmp(other))
  }
}

impl PartialEq for IntermediateResult {
  fn eq(&self, other: &Self) -> bool {
    self.equation == other.equation
      && self.total == other.total
      && self.is_leaf == other.is_leaf
  }
}

impl Eq for IntermediateResult {}

#[derive(Debug)]
struct CannotSolveError {
  equation: String
}

impl fmt::Display for CannotSolveError {
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    write!(f, "Cannot solve '{}'.", self.equation)
  }
}

impl Error for CannotSolveError {
  fn description(&self) -> &str {
    &self.equation
  }
}


#[derive(Debug)]
struct InvalidOperationError {
  operation_id: String,
}

impl fmt::Display for InvalidOperationError {
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    write!(f, "Invalid operation {}", self.operation_id)
  }
}

impl Error for InvalidOperationError {
  fn description(&self) -> &str {
    &self.operation_id
  }
}

static GROUPING_NONE: GroupingFn = |text: String| text;
static GROUPING_PARENTHESIS: GroupingFn = |text: String| format!("({text})");

lazy_static! {
  pub static ref OPERATIONS: [OperationWithActions; 7] = [
    OperationWithActions {
      operation: Operation {
        id: "plus".to_string(),
        name: "Plus".to_string(),
        is_commutative: true,
      },
      actions: OperationActions {
        solve: |left: f64, right: f64| left + right,
        display: |left: String, right: String| format!("{left} + {right}"),
        display_group: GROUPING_PARENTHESIS,
      }
    },
    OperationWithActions {
      operation: Operation {
        id: "minus".to_string(),
        name: "Minus".to_string(),
        is_commutative: false,
      },
      actions: OperationActions {
        solve: |left: f64, right: f64| left - right,
        display: |left: String, right: String| format!("{left} - {right}"),
        display_group: GROUPING_PARENTHESIS,
      }
    },
    OperationWithActions {
      operation: Operation {
        id: "multiply".to_string(),
        name: "Multiply".to_string(),
        is_commutative: true,
      },
      actions: OperationActions {
        solve: |left: f64, right: f64| left * right,
        display: |left: String, right: String| format!("{left} * {right}"),
        display_group: GROUPING_PARENTHESIS,
      }
    },
    OperationWithActions {
      operation: Operation {
        id: "divide".to_string(),
        name: "Divide".to_string(),
        is_commutative: false,
      },
      actions: OperationActions {
        solve: |left: f64, right: f64| left / right,
        display: |left: String, right: String| format!("{left} / {right}"),
        display_group: GROUPING_PARENTHESIS,
      }
    },
    OperationWithActions {
      operation: Operation {
        id: "power".to_string(),
        name: "Power".to_string(),
        is_commutative: false,
      },
      actions: OperationActions {
        solve: |left: f64, right: f64| left.powf(right),
        display: |left: String, right: String| format!("{left} ^ {right}"),
        display_group: GROUPING_NONE,
      }
    },
    OperationWithActions {
      operation: Operation {
        id: "root".to_string(),
        name: "Root".to_string(),
        is_commutative: false,
      },
      actions: OperationActions {
        solve: |left: f64, right: f64| left.powf(1.00_f64 / right),
        display: |left: String, right: String| format!("root({left})({right})"),
        display_group: GROUPING_NONE,
      }
    },
    OperationWithActions {
      operation: Operation {
        id: "modulo".to_string(),
        name: "Modulo".to_string(),
        is_commutative: false,
      },
      actions: OperationActions {
        solve: |left: f64, right: f64| left % right,
        display: |left: String, right: String| format!("{left} % {right}"),
        display_group: GROUPING_NONE,
      }
    }
  ];
}

#[wasm_bindgen]
extern {
  fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
  alert("Hello, wasm-game-of-life!");
}

#[wasm_bindgen]
pub fn format_equation(operation_id: String, left: String, right: String) -> Result<String, String> {
  OPERATIONS.iter()
    .find(|operation_with_actions| operation_with_actions.operation.id == operation_id)
    .map(|operation_with_actions| &operation_with_actions.actions)
    .map(|actions| (actions.display)(left, right))
    .ok_or(format!("Failed to find operation with id of '{operation_id}'.").to_string())
}

#[wasm_bindgen]
pub fn get_operations() -> JsValue {
  let results: Vec<&Operation> = OPERATIONS.iter()
    .map(|operation_with_actions| &operation_with_actions.operation)
    .collect();
  JsValue::from_serde(&results).unwrap()
}

#[derive(Debug, Clone, PartialEq)]
pub enum PairingEntry {
  Single(f64),
  Pair {
    left: Box<PairingEntry>,
    right: Box<PairingEntry>,
  }
}

fn get_pairing_permutations(pairings: &Vec<PairingEntry>) -> Vec<PairingEntry> {
  if pairings.len() == 1 {
    return pairings.to_vec();
  }

  // Ignore last index, that will get pulled into a pair.
  (0..pairings.len() - 1).into_iter()
    // Replace two items in the collection with a Pair.
    .map(|index| {
      let mut permutation = pairings.to_vec();
      let pair = pairings[index..index + 2].iter()
        .map(|pair_entry| pair_entry.clone())
        .collect_vec();

      let lv = pair[0].clone();
      let rv = pair[1].clone();
      let data = PairingEntry::Pair {
        left: Box::new(lv),
        right: Box::new(rv),
      };

      let splice_replacement = [data];

      permutation.splice(
        index..index + 2,
        splice_replacement.iter()
          .map(|pair_entry| pair_entry.clone())
      );

      permutation.to_vec()
    })
    .flat_map(|permutation| get_pairing_permutations(&permutation).iter()
                    .map(|pairing_entry| pairing_entry.clone())
                    .collect_vec()
    )
    .collect_vec()
}

fn validate_solver_config(solver_config: &SolverConfig) -> Result<(), Box<dyn Error>> {
  // Assert the provided operation ids are supported.
  let operation_ids = OPERATIONS.iter()
    .map(|operation_with_actions| &operation_with_actions.operation.id)
    .collect_vec();

  solver_config.operation_ids.iter()
    .filter(|provided_operation_id| !operation_ids.iter().contains(provided_operation_id))
    .try_for_each(|unsupported_operation_id| {
      return Err(InvalidOperationError {
        operation_id: unsupported_operation_id.to_string(),
      });
    })?;

  // Everything looks good.
  Ok(())
}

fn calculate_result(pairing_entry: &PairingEntry, operations: &[&OperationWithActions], is_root: bool) -> Result<IntermediateResult, Box<dyn Error>> {
  match pairing_entry {
    PairingEntry::Single(number) => Ok(IntermediateResult {
      total: *number,
      equation: format!("{number}"),
      is_leaf: true,
    }),
    PairingEntry::Pair {left, right} => {
      let operation = operations.last().unwrap();
      let next_operations = &operations[ ..operations.len() - 1];
      let mut calculated_left = calculate_result(left, next_operations, false)?;
      let mut calculated_right = calculate_result(right, next_operations, false)?;

      if operation.operation.is_commutative {
        let mut values = vec!(calculated_left, calculated_right);
        values.sort();
        calculated_left = values[0].clone();
        calculated_right = values[1].clone();
      }

      let group_function = if is_root { GROUPING_NONE } else { operation.actions.display_group };
      let equation = group_function((operation.actions.display)(calculated_left.equation, calculated_right.equation));

      let total = (operation.actions.solve)(calculated_left.total, calculated_right.total);
      if total.is_nan() {
        return Err(Box::new(CannotSolveError {
          equation
        }));
      }

      Ok(IntermediateResult {
        total,
        equation,
        is_leaf: false,
      })
    },
  }
}

pub fn get_sortable_equation(full_equation: &String) -> String {
  full_equation.as_str()
    .replace("(", "X")
    .replace(")", "Y")
    .replace("=", "Z")
    .to_string()
}

fn calculate_results_real(solver_config: &SolverConfig) -> Result<Vec<CalculateResult>, Box<dyn Error>> {
  validate_solver_config(solver_config)?;

  if solver_config.faces.len() < 2 || solver_config.operation_ids.len() == 0 {
    return Ok(Vec::new());
  }

  let selected_operations = OPERATIONS.iter()
    .filter(|operation_with_actions| solver_config.operation_ids.contains(&operation_with_actions.operation.id))
    .collect_vec();

  let operation_permutations: Vec<Vec<&OperationWithActions>> = solver_config.faces[1..].iter()
    .map(|_face| selected_operations.clone().into_iter())
    .multi_cartesian_product()
    .collect_vec();

  let face_permutations = solver_config.faces.iter()
    .map(|face| (PairingEntry::Single(*face as f64)).clone())
    .permutations(solver_config.faces.len())

    .collect_vec();

  let face_pairing_permutations = face_permutations.iter()
    .flat_map(|faces| get_pairing_permutations(faces))
    .collect_vec();

  let results = face_pairing_permutations.iter()
    .cartesian_product(operation_permutations)
    .map(|product| calculate_result(
        product.0,
        &product.1[..],
        true
      )
      .ok()
    )
    .filter(|option| option.is_some())
    .map(|option| option.unwrap())
    // Exclude non-integer totals.
    .filter(|intermediate_result| intermediate_result.total.fract() == 0.00_f64.fract())
    // Exclude out of bounds totals.
    .filter(|intermediate_result| intermediate_result.total >= solver_config.minTotal as f64 && intermediate_result.total <= solver_config.maxTotal as f64)
    // Map to CalculateResult.
    .map(|intermediate_result| {
      let full_equation = format!("{} = {}", intermediate_result.total, intermediate_result.equation);
      let sortable_equation = get_sortable_equation(&format!("{:0>4} = {}", intermediate_result.total, intermediate_result.equation));
      CalculateResult {
        total: intermediate_result.total as u64,
        equation: intermediate_result.equation,
        fullEquation: full_equation,
        sortableEquation: sortable_equation
      }
    })
    .sorted_by(|a, b| a.sortableEquation.cmp(&b.sortableEquation))
    .dedup()
    .collect();

  Ok(results)
}

#[wasm_bindgen]
pub fn calculate_results(solver_config_json_string: JsValue) -> Result<JsValue, String> {
  let solver_config: SolverConfig = (&solver_config_json_string).into_serde().unwrap();

  calculate_results_real(&solver_config)
    .map(|result| JsValue::from_serde(&result).unwrap())
    .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
  use super::*;

  fn new_pair_group_first_123() -> PairingEntry {
    PairingEntry::Pair {
      left: Box::new(PairingEntry::Pair {
        left: Box::new(PairingEntry::Single(1.00)),
        right: Box::new(PairingEntry::Single(2.00)),
      }),
      right: Box::new(PairingEntry::Single(3.00)),
    }
  }

  fn new_pair_group_last_123() -> PairingEntry {
    PairingEntry::Pair {
      left: Box::new(PairingEntry::Single(1.00)),
      right: Box::new(PairingEntry::Pair {
        left: Box::new(PairingEntry::Single(2.00)),
        right: Box::new(PairingEntry::Single(3.00)),
      }),
    }
  }

  fn new_pair_group_first_321() -> PairingEntry {
    PairingEntry::Pair {
      left: Box::new(PairingEntry::Pair {
        left: Box::new(PairingEntry::Single(3.00)),
        right: Box::new(PairingEntry::Single(2.00)),
      }),
      right: Box::new(PairingEntry::Single(1.00)),
    }
  }

  #[test]
  fn test_get_sortable_equation() {
    assert_eq!(
      get_sortable_equation(&"4 = (1 + 3)".to_string()),
      "4 Z X1 + 3Y"
    );
  }

  #[test]
  fn test_get_pairing_permutations() {
    assert_eq!(
      get_pairing_permutations(&vec![
        PairingEntry::Single(1.00),
        PairingEntry::Single(2.00),
        PairingEntry::Single(3.00),
      ]),
      vec![
        new_pair_group_first_123(),
        new_pair_group_last_123(),
      ]
    );
  }

  #[test]
  fn test_calculate_result_with_commutative_swap() {
    let result = calculate_result(
      &new_pair_group_first_321(),
      &(vec![&OPERATIONS[0], &OPERATIONS[1]])[..],
      true
    );

    assert_eq!(
      result.unwrap(),
      IntermediateResult {
        total: 4.00,
        equation: "(2 + 3) - 1".to_string(),
        is_leaf: false,
      }
    );
  }

  #[test]
  fn test_calculate_result_without_commutative_swap() {
    let result = calculate_result(
      &new_pair_group_first_123(),
      &(vec![&OPERATIONS[0], &OPERATIONS[1]])[..],
      true
    );

    assert_eq!(
      result.unwrap(),
      IntermediateResult {
        total: 0.00,
        equation: "(1 + 2) - 3".to_string(),
        is_leaf: false,
      }
    );
  }

  // #[test]
  // fn test_get_solutions_real() {
  //   let results: Vec<CalculateResult> = get_solutions_real(&SolverConfig {
  //       min_total: 1,
  //       max_total: 36,
  //       faces: vec![2, 3, 4, 5, 6, 7],
  //       operation_ids: OPERATIONS.iter()
  //         .map(|op| op.operation.id.clone())
  //         .collect_vec()
  //     })
  //     .unwrap();
  //
  //   println!("AAAA: {:#?}", results.len());
  // }

  // #[wasm_bindgen_test]
  // #[test]
  // fn test_get_solutions() {
  //   let operations: Vec<Operation> = get_operations().into_serde().unwrap();
  //
  //   // let results: Vec<CalculateResult> = get_solutions_real(&SolverConfig {
  //   //   min_total: 1,
  //   //   max_total: 36,
  //   //   faces: vec![2, 3, 4, 5, 6, 7],
  //   //   operation_ids: OPERATIONS.iter()
  //   //     .map(|op| op.operation.id.clone())
  //   //     .collect_vec()
  //   // })
  //   //   .unwrap();
  //   //
  //   // println!("AAAA: {:#?}", results.len());
  // }
}
