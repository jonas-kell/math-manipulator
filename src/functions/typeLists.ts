export type OperatorConfig = {
    mainLineUuid: string;
    variablesListUuid: string;
    macrosListUuid: string;
};

export function generateOperatorConfig(
    mainLineUuid: string | undefined = undefined,
    variablesListUuid: string | undefined = undefined,
    macrosListUuid: string | undefined = undefined
): OperatorConfig {
    if (mainLineUuid == undefined) {
        mainLineUuid = "MAIN_UUID";
    }
    if (variablesListUuid == undefined) {
        variablesListUuid = "MAIN_VARIABLE_LIST_UUID";
    }
    if (macrosListUuid == undefined) {
        macrosListUuid = "MAIN_MACRO_LIST_UUID";
    }

    return {
        mainLineUuid: mainLineUuid,
        variablesListUuid: variablesListUuid,
        macrosListUuid: macrosListUuid,
    };
}

export enum OperatorType {
    Fraction = "fraction",
    BracketedSum = "bracketed_sum",
    Numerical = "number",
    ComplexOperatorConstruct = "complex_operator_construct",
    Variable = "variable",
    BigSum = "big_sum",
    BigInt = "big_int",
    RawLatex = "raw_latex",
    String = "string",
    BracketedMultiplication = "bracketed_multiplication",
    Negation = "negation",
    PiConstant = "constant_pi",
    EConstant = "constant_e",
    Sqrt2Constant = "constant_sqrt2",
    ComplexIConstant = "constant_complex_i",
    InfinityConstant = "infinity",
    Psi = "op_psi",
    Phi = "op_phi",
    Up = "up_arrow",
    Down = "down_arrow",
    Exp = "exp_function",
    Power = "power",
    Bra = "singular_bra",
    Ket = "singular_ket",
    Braket = "double_braket",
    Bracket = "triple_bra_c_ket",
    FermionicCreationOperator = "fermionic_creation",
    FermionicAnnihilationOperator = "fermionic_annihilation",
    BosonicCreationOperator = "bosonic_creation",
    BosonicAnnihilationOperator = "bosonic_annihilation",
    FunctionMathMode = "general_function_math_mode",
    FunctionMathRm = "general_function_math_rm",
    Sin = "sin",
    Cos = "cos",
    StructuralContainer = "structural_container",
    EmptyArgument = "empty_argument",
    Equals = "equals",
    NotEquals = "not_equals",
    Less = "less",
    Greater = "greater",
    LessEquals = "less_equals",
    GreaterEquals = "greater_equals",
    Iff = "iff",
    KroneckerDelta = "kronecker_delta",
    Commutator = "commutator_minus",
    AntiCommutator = "commutator_plus",
    Faculty = "faculty",
    Percent = "percent",
    DefinedMacro = "defined_macro",
}

const MAX_CHILDREN = 99999999;
export const MAX_CHILDREN_SPECIFICATIONS: { [key in OperatorType]: number } = {
    [OperatorType.Numerical]: 0,
    [OperatorType.ComplexOperatorConstruct]: 2,
    [OperatorType.BracketedSum]: MAX_CHILDREN,
    [OperatorType.BracketedMultiplication]: MAX_CHILDREN,
    [OperatorType.Fraction]: 2,
    [OperatorType.BigSum]: 3,
    [OperatorType.BigInt]: 4,
    [OperatorType.Variable]: 0,
    [OperatorType.RawLatex]: 0,
    [OperatorType.String]: 0,
    [OperatorType.Negation]: 1,
    [OperatorType.PiConstant]: 0,
    [OperatorType.EConstant]: 0,
    [OperatorType.Sqrt2Constant]: 0,
    [OperatorType.InfinityConstant]: 0,
    [OperatorType.ComplexIConstant]: 0,
    [OperatorType.Exp]: 1,
    [OperatorType.Power]: 2,
    [OperatorType.Psi]: 0,
    [OperatorType.Phi]: 0,
    [OperatorType.Up]: 0,
    [OperatorType.Down]: 0,
    [OperatorType.Bra]: 1,
    [OperatorType.Ket]: 1,
    [OperatorType.Braket]: 2,
    [OperatorType.Bracket]: 3,
    [OperatorType.FermionicCreationOperator]: 1,
    [OperatorType.FermionicAnnihilationOperator]: 1,
    [OperatorType.BosonicCreationOperator]: 1,
    [OperatorType.BosonicAnnihilationOperator]: 1,
    [OperatorType.FunctionMathMode]: 2,
    [OperatorType.FunctionMathRm]: 2,
    [OperatorType.Sin]: 1,
    [OperatorType.Cos]: 1,
    [OperatorType.StructuralContainer]: MAX_CHILDREN,
    [OperatorType.EmptyArgument]: 0,
    [OperatorType.Equals]: 0,
    [OperatorType.NotEquals]: 0,
    [OperatorType.Iff]: 0,
    [OperatorType.Less]: 0,
    [OperatorType.Greater]: 0,
    [OperatorType.LessEquals]: 0,
    [OperatorType.GreaterEquals]: 0,
    [OperatorType.KroneckerDelta]: 2,
    [OperatorType.Commutator]: 2,
    [OperatorType.AntiCommutator]: 2,
    [OperatorType.Faculty]: 1,
    [OperatorType.Percent]: 1,
    [OperatorType.DefinedMacro]: MAX_CHILDREN,
};

export const MIN_CHILDREN_SPECIFICATIONS: { [key in OperatorType]: number } = {
    [OperatorType.Numerical]: 0,
    [OperatorType.ComplexOperatorConstruct]: 2,
    [OperatorType.BracketedSum]: 1, // on parsing from export, sums with only one element will remove themselves
    [OperatorType.BracketedMultiplication]: 1, // on parsing from export, products with only one element will remove themselves
    [OperatorType.Fraction]: 2,
    [OperatorType.BigSum]: 3,
    [OperatorType.BigInt]: 4,
    [OperatorType.Variable]: 0,
    [OperatorType.RawLatex]: 0,
    [OperatorType.String]: 0,
    [OperatorType.Negation]: 1,
    [OperatorType.PiConstant]: 0,
    [OperatorType.EConstant]: 0,
    [OperatorType.Sqrt2Constant]: 0,
    [OperatorType.InfinityConstant]: 0,
    [OperatorType.ComplexIConstant]: 0,
    [OperatorType.Exp]: 1,
    [OperatorType.Power]: 2,
    [OperatorType.Psi]: 0,
    [OperatorType.Phi]: 0,
    [OperatorType.Up]: 0,
    [OperatorType.Down]: 0,
    [OperatorType.Bra]: 1,
    [OperatorType.Ket]: 1,
    [OperatorType.Braket]: 2,
    [OperatorType.Bracket]: 3,
    [OperatorType.FermionicCreationOperator]: 1,
    [OperatorType.FermionicAnnihilationOperator]: 1,
    [OperatorType.BosonicCreationOperator]: 1,
    [OperatorType.BosonicAnnihilationOperator]: 1,
    [OperatorType.FunctionMathMode]: 2,
    [OperatorType.FunctionMathRm]: 2,
    [OperatorType.Sin]: 1,
    [OperatorType.Cos]: 1,
    [OperatorType.StructuralContainer]: 1, // on parsing from export, containers with only one element will remove themselves
    [OperatorType.EmptyArgument]: 0,
    [OperatorType.Equals]: 0,
    [OperatorType.NotEquals]: 0,
    [OperatorType.Iff]: 0,
    [OperatorType.Less]: 0,
    [OperatorType.Greater]: 0,
    [OperatorType.LessEquals]: 0,
    [OperatorType.GreaterEquals]: 0,
    [OperatorType.KroneckerDelta]: 2,
    [OperatorType.Commutator]: 2,
    [OperatorType.AntiCommutator]: 2,
    [OperatorType.Faculty]: 1,
    [OperatorType.Percent]: 1,
    [OperatorType.DefinedMacro]: 0,
};
