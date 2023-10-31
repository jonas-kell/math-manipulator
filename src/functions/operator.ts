import { v4 as uuidv4 } from "uuid";

const MAX_CHILDREN = 99999999;

export enum OperatorType {
    Fraction = "fraction",
    BracketedSum = "bracketed_sum",
    Numerical = "number",
    Variable = "variable",
    StructuralVariable = "structural_variable",
    BigSum = "big_sum",
    BigInt = "big_int",
    RawLatex = "raw_latex",
    BracketedMultiplication = "bracketed_multiplication",
    Negation = "negation",
    Pi = "constant_pi",
    Infinity = "infinity",
    Psi = "constant_psi",
    Phi = "constant_phi",
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
    Iff = "iff",
}
const FERMIONIC_BOSONIC_OPERATORS = [
    OperatorType.BosonicAnnihilationOperator,
    OperatorType.FermionicAnnihilationOperator,
    OperatorType.BosonicCreationOperator,
    OperatorType.FermionicCreationOperator,
];
const BRA_C_KET_OPERATORS = [OperatorType.Bra, OperatorType.Ket, OperatorType.Braket, OperatorType.Bracket];

export interface ExportOperatorContent {
    type: OperatorType;
    children: ExportOperatorContent[];
    value: string;
    uuid: string;
}

export abstract class Operator {
    protected _type: OperatorType;
    protected _startDisplayFormula: string;
    protected _midDisplayFormula: string;
    protected _endDisplayFormula: string;
    protected _children: Operator[];
    protected _value: string;
    protected _uuid: string;
    protected _hasMidDisplayOverwrite: boolean = false;
    protected _midDisplayOverwrite: string[] = [];
    protected _renderChildren: boolean = true;

    constructor(
        type: OperatorType,
        startDisplayFormula: string,
        midDisplayFormula: string,
        endDisplayFormula: string,
        children: Operator[],
        value: string,
        midDisplayOverwrite: string[] = [],
        renderChildren: boolean = true
    ) {
        if (children.length < MIN_CHILDREN_SPECIFICATIONS[type]) {
            throw Error("Not enough children for Operator");
        }
        if (children.length > MAX_CHILDREN_SPECIFICATIONS[type]) {
            throw Error("Too many children for Operator");
        }
        let hasMidDisplayOverwrite = false;
        if (midDisplayOverwrite.length != 0) {
            if (midDisplayOverwrite.length == children.length - 1) {
                hasMidDisplayOverwrite = true;
            } else {
                throw Error("Mid display overwrite needs to contain exactly #children-1 elements");
            }
        }
        const uuid = uuidv4();

        this._type = type;
        this._startDisplayFormula = startDisplayFormula;
        this._midDisplayFormula = midDisplayFormula;
        this._endDisplayFormula = endDisplayFormula;
        this._children = children;
        this._value = value;
        this._uuid = uuid;
        this._hasMidDisplayOverwrite = hasMidDisplayOverwrite;
        this._midDisplayOverwrite = midDisplayOverwrite;
        this._renderChildren = renderChildren;
    }

    getType() {
        return this._type;
    }

    getUUIDRef() {
        return "ref_" + this._uuid;
    }

    static uuidFromUUIDRef(UUIDRef: string) {
        return UUIDRef.substring(4);
    }

    manuallySetUUID(uuid: string) {
        this._uuid = uuid;
    }

    private assembleFormulaString(renderHtmlIds: boolean, renderImpliedSymbols: boolean) {
        let formula = "";

        if (renderHtmlIds) {
            formula += `\\htmlId{${this.getUUIDRef()}}{`;
        }

        let anyMiddleDisplayRendered = false;
        let middleFormula = "";
        if (this._renderChildren) {
            this._children.forEach((child, index) => {
                middleFormula += child.assembleFormulaString(renderHtmlIds, renderImpliedSymbols);

                // Special Cases: skipping middle display stuff
                if (!renderImpliedSymbols) {
                    const nextChild = this._children[index + 1];
                    if (nextChild && nextChild != undefined) {
                        // 4 + -(1) ==> 4-1
                        if (this._type == OperatorType.BracketedSum && nextChild._type == OperatorType.Negation) {
                            return;
                        }
                        // Hide multiplication
                        if (this._type == OperatorType.BracketedMultiplication) {
                            // between fermionic/bosonic operators
                            if (
                                FERMIONIC_BOSONIC_OPERATORS.includes(child._type) &&
                                FERMIONIC_BOSONIC_OPERATORS.includes(nextChild._type)
                            ) {
                                return;
                            }
                            // next to bra/ket
                            if (BRA_C_KET_OPERATORS.includes(child._type) || BRA_C_KET_OPERATORS.includes(nextChild._type)) {
                                return;
                            }
                        }
                    }
                }

                // Insert the middle stuff normally
                if (this._children.length > index + 1) {
                    if (this._hasMidDisplayOverwrite) {
                        middleFormula += this._midDisplayOverwrite[index];
                    } else {
                        middleFormula += this._midDisplayFormula;
                    }
                    anyMiddleDisplayRendered = true;
                }
            });
        }

        if (!renderImpliedSymbols) {
            // skip parts of the equation depending on types/middle content, as they are extraneous
            if (this._type == OperatorType.BracketedMultiplication && !anyMiddleDisplayRendered) {
                // ( * * * ) if all * have been skipped, also omit the brackets
                // I wanted to do this for ( + + + ) too, ( a "+" gets skipped before a "-"), to make (n+-1) => n-1 but his transforms {1 - {2 - 3}} into 1-2-3, which differs from 1-(2-3)
                formula += this._value;
                formula += middleFormula;
            } else {
                // do not render stuff that can be implied, however no suitable implication-situation was met, so render everything
                formula += this._startDisplayFormula;
                formula += this._value;
                formula += middleFormula;
                formula += this._endDisplayFormula;
            }
        } else {
            // default situation, render all parts of the equation
            formula += this._startDisplayFormula;
            formula += this._value;
            formula += middleFormula;
            formula += this._endDisplayFormula;
        }

        if (renderHtmlIds) {
            formula += "}"; //closing the second htmlID bracket
        }

        return formula;
    }

    getFormulaString(renderImpliedSymbols: boolean = false) {
        return this.assembleFormulaString(true, renderImpliedSymbols);
    }

    exportFormulaString(renderImpliedSymbols: boolean = false) {
        return this.assembleFormulaString(false, renderImpliedSymbols);
    }

    getContainedUUIDRefs() {
        let out = [] as string[];

        out.push(this.getUUIDRef());
        this._children.forEach((child) => {
            out.push(...child.getContainedUUIDRefs());
        });

        return out;
    }

    serializeStructure() {
        return JSON.stringify(this.serializeStructureRecursive());
    }

    private serializeStructureRecursive() {
        let children = [] as ExportOperatorContent[];

        this._children.forEach((child) => {
            children.push(child.serializeStructureRecursive());
        });

        let res: ExportOperatorContent = {
            type: this._type,
            value: this._value,
            children: children,
            uuid: this._uuid,
        };
        return res;
    }

    static generateStructure(input: string, keepUUIDs: boolean = false): Operator {
        const json: ExportOperatorContent = JSON.parse(input); // unsure if this is possible type-safe (this is too complicated https://dev.to/codeprototype/safely-parsing-json-to-a-typescript-interface-3lkj)

        return Operator.generateStructureRecursive(json, keepUUIDs);
    }

    private static generateStructureRecursive(input: ExportOperatorContent, keepUUIDs: boolean): Operator {
        let res = new Numerical(0) as Operator;

        let childrenReconstructed = [] as Operator[];
        (input.children ?? []).forEach((childJson) => {
            childrenReconstructed.push(Operator.generateStructureRecursive(childJson, keepUUIDs));
        });

        if (
            childrenReconstructed.length < MIN_CHILDREN_SPECIFICATIONS[input.type] ||
            childrenReconstructed.length > MAX_CHILDREN_SPECIFICATIONS[input.type]
        ) {
            throw Error(
                `For ${input.type} to be reconstructed, it needs between ${MIN_CHILDREN_SPECIFICATIONS[input.type]} and ${
                    MAX_CHILDREN_SPECIFICATIONS[input.type]
                } children!`
            );
        }

        switch (input.type) {
            case OperatorType.BigSum:
                res = new BigSum(childrenReconstructed[0], childrenReconstructed[1], childrenReconstructed[2]);
                break;
            case OperatorType.Fraction:
                res = new Fraction(childrenReconstructed[0], childrenReconstructed[1]);
                break;
            case OperatorType.BracketedSum:
                res = new BracketedSum(childrenReconstructed);
                break;
            case OperatorType.Numerical:
                res = new Numerical(Number(input.value));
                break;
            case OperatorType.Variable:
                res = new Variable(input.value);
                break;
            case OperatorType.StructuralVariable:
                res = new StructuralVariable(input.value, childrenReconstructed[0]);
                break;
            case OperatorType.BigInt:
                res = new BigInt(
                    childrenReconstructed[0],
                    childrenReconstructed[1],
                    childrenReconstructed[2],
                    childrenReconstructed[3]
                );
                break;
            case OperatorType.RawLatex:
                res = new RawLatex(input.value);
                break;
            case OperatorType.BracketedMultiplication:
                res = new BracketedMultiplication(childrenReconstructed);
                break;
            case OperatorType.Negation:
                res = new Negation(childrenReconstructed[0]);
                break;
            case OperatorType.Pi:
                res = new Pi();
                break;
            case OperatorType.Phi:
                res = new Phi();
                break;
            case OperatorType.Psi:
                res = new Psi();
                break;
            case OperatorType.Infinity:
                res = new Infinity();
                break;
            case OperatorType.Exp:
                res = new Exp(childrenReconstructed[0]);
                break;
            case OperatorType.Power:
                res = new Power(childrenReconstructed[0], childrenReconstructed[1]);
                break;
            case OperatorType.Bra:
                res = new Bra(childrenReconstructed[0]);
                break;
            case OperatorType.Ket:
                res = new Ket(childrenReconstructed[0]);
                break;
            case OperatorType.Braket:
                res = new Braket(childrenReconstructed[0], childrenReconstructed[1]);
                break;
            case OperatorType.Bracket:
                res = new Bracket(childrenReconstructed[0], childrenReconstructed[1], childrenReconstructed[2]);
                break;
            case OperatorType.FermionicCreationOperator:
                res = new FermionicCreationOperator(childrenReconstructed[0]);
                break;
            case OperatorType.FermionicAnnihilationOperator:
                res = new FermionicAnnihilationOperator(childrenReconstructed[0]);
                break;
            case OperatorType.BosonicCreationOperator:
                res = new BosonicCreationOperator(childrenReconstructed[0]);
                break;
            case OperatorType.BosonicAnnihilationOperator:
                res = new BosonicAnnihilationOperator(childrenReconstructed[0]);
                break;
            case OperatorType.FunctionMathMode:
                res = new FunctionMathMode(childrenReconstructed[0], childrenReconstructed[1]);
                break;
            case OperatorType.FunctionMathRm:
                res = new FunctionMathRm(childrenReconstructed[0], childrenReconstructed[1]);
                break;
            case OperatorType.Sin:
                res = new Sin(childrenReconstructed[0]);
                break;
            case OperatorType.Cos:
                res = new Cos(childrenReconstructed[0]);
                break;
            case OperatorType.StructuralContainer:
                res = new StructuralContainer(childrenReconstructed);
                break;
            case OperatorType.EmptyArgument:
                res = new EmptyArgument();
                break;
            case OperatorType.Equals:
                res = new Equals();
                break;
            case OperatorType.NotEquals:
                res = new NotEquals();
                break;
            case OperatorType.Iff:
                res = new Iff();
                break;
            default:
                throw Error(`type ${input.type} could not be parsed to an implemented Operator`);
        }

        if (keepUUIDs) {
            res.manuallySetUUID(input.uuid);
        }

        return res;
    }

    getOperatorByUUID(uuid: string): Operator | null {
        if (this._uuid == uuid) {
            return this;
        }

        for (const child of this._children) {
            const res = child.getOperatorByUUID(uuid);
            if (res && res != null) {
                return res;
            }
        }

        return null;
    }

    allChildrenAreNumbers(): [boolean, number[]] {
        let allChildrenAreNumbers = true;
        let numbers = [] as number[];
        this._children.forEach((child) => {
            if (Object.getOwnPropertyNames(Object.getPrototypeOf(child)).includes("getNumericalValue")) {
                numbers.push((child as any).getNumericalValue());
            } else {
                allChildrenAreNumbers = false;
            }
        });

        return [allChildrenAreNumbers, numbers];
    }

    copyWithReplaced(uuid: string, replacement: Operator) {
        let copy = this.serializeStructureRecursive();
        copy = Operator.replaceRecursive(copy, uuid, replacement.serializeStructureRecursive());

        return Operator.generateStructure(JSON.stringify(copy), false);
    }

    private static replaceRecursive(
        structure: ExportOperatorContent,
        uuid: string,
        replacement: ExportOperatorContent
    ): ExportOperatorContent {
        if (structure.uuid == uuid) {
            return replacement;
        } else {
            let newChildren = [] as ExportOperatorContent[];

            structure.children.forEach((child) => {
                newChildren.push(Operator.replaceRecursive(child, uuid, replacement));
            });

            structure.children = newChildren;
            return structure;
        }
    }
}

export const MAX_CHILDREN_SPECIFICATIONS: { [key in OperatorType]: number } = {
    [OperatorType.Numerical]: 0,
    [OperatorType.BracketedSum]: MAX_CHILDREN,
    [OperatorType.BracketedMultiplication]: MAX_CHILDREN,
    [OperatorType.Fraction]: 2,
    [OperatorType.BigSum]: 3,
    [OperatorType.BigInt]: 4,
    [OperatorType.Variable]: 0,
    [OperatorType.RawLatex]: 0,
    [OperatorType.StructuralVariable]: 1,
    [OperatorType.Negation]: 1,
    [OperatorType.Pi]: 0,
    [OperatorType.Infinity]: 0,
    [OperatorType.Exp]: 1,
    [OperatorType.Power]: 2,
    [OperatorType.Psi]: 0,
    [OperatorType.Phi]: 0,
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
};

export const MIN_CHILDREN_SPECIFICATIONS: { [key in OperatorType]: number } = {
    [OperatorType.Numerical]: 0,
    [OperatorType.BracketedSum]: 2,
    [OperatorType.BracketedMultiplication]: 2,
    [OperatorType.Fraction]: 2,
    [OperatorType.BigSum]: 3,
    [OperatorType.BigInt]: 4,
    [OperatorType.Variable]: 0,
    [OperatorType.RawLatex]: 0,
    [OperatorType.StructuralVariable]: 1,
    [OperatorType.Negation]: 1,
    [OperatorType.Pi]: 0,
    [OperatorType.Infinity]: 0,
    [OperatorType.Exp]: 1,
    [OperatorType.Power]: 2,
    [OperatorType.Psi]: 0,
    [OperatorType.Phi]: 0,
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
    [OperatorType.StructuralContainer]: 2, // makes no sense keeping extraneous containers if they don't contain anything
    [OperatorType.EmptyArgument]: 0,
    [OperatorType.Equals]: 0,
    [OperatorType.NotEquals]: 0,
    [OperatorType.Iff]: 0,
};

export class Numerical extends Operator {
    constructor(value: number) {
        super(OperatorType.Numerical, "", "", "", [], String(parseFloat(value.toFixed(4))));
    }

    getNumericalValue(): number | null {
        return Number(this._value);
    }
}

export class BracketedSum extends Operator {
    constructor(summands: Operator[]) {
        super(OperatorType.BracketedSum, "\\left(", "+", "\\right)", summands, "");
    }

    getNumericalValue(): number | null {
        let res = this.allChildrenAreNumbers();
        if (res[0]) {
            return res[1].reduce((acc, current) => acc + current, 0);
        }
        return null;
    }

    foldNumbersMODIFICATION(): Operator {
        let res = this.getNumericalValue();
        if (res == null) {
            return this;
        } else {
            return new Numerical(res);
        }
    }
}

export class BracketedMultiplication extends Operator {
    constructor(multiplicators: Operator[]) {
        super(OperatorType.BracketedMultiplication, "\\left(", " \\cdot ", "\\right)", multiplicators, "");
    }
}

export class Fraction extends Operator {
    constructor(dividend: Operator, divisor: Operator) {
        super(OperatorType.Fraction, "\\frac{", "}{", "}", [dividend, divisor], "");
    }
}

export class BigSum extends Operator {
    constructor(lower: Operator, upper: Operator, content: Operator) {
        super(OperatorType.BigSum, "\\sum\\limits_{", "", "", [lower, upper, content], "", [" }^{ ", "}"]);
    }
}

export class BigInt extends Operator {
    constructor(lower: Operator, upper: Operator, content: Operator, differentialVariable: Operator) {
        super(OperatorType.BigInt, "\\int\\limits_{", "", "", [lower, upper, content, differentialVariable], "", [
            "}^{",
            "}",
            "\\mathrm{d}",
        ]);
    }
}

export class Variable extends Operator {
    constructor(name: string) {
        super(OperatorType.Variable, "{", "", "}", [], name);
    }
}

export class RawLatex extends Operator {
    constructor(formula: string) {
        super(OperatorType.RawLatex, "{", "", "}", [], formula);
    }
}

export class StructuralVariable extends Operator {
    constructor(name: string, content: Operator) {
        super(OperatorType.StructuralVariable, "{", "", "}", [content], name, [], false);
    }
}

export class Negation extends Operator {
    constructor(content: Operator) {
        super(OperatorType.Negation, "-", "", "", [content], "");
    }

    getNumericalValue(): number | null {
        let res = this.allChildrenAreNumbers();
        if (res[0]) {
            return -res[1][0];
        }
        return null;
    }

    foldNumbersMODIFICATION(): Operator {
        let res = this.getNumericalValue();
        if (res == null) {
            return this;
        } else {
            return new Numerical(res);
        }
    }
}

export class Pi extends Operator {
    constructor() {
        super(OperatorType.Pi, "\\pi", "", "", [], "");
    }
}

export class Infinity extends Operator {
    constructor() {
        super(OperatorType.Infinity, "\\infty", "", "", [], "");
    }
}

export class Exp extends Operator {
    constructor(exponent: Operator) {
        super(OperatorType.Exp, "\\mathrm{e}^{", "", "}", [exponent], "");
    }
}

export class Power extends Operator {
    constructor(base: Operator, exponent: Operator) {
        super(OperatorType.Power, "{", "}^{", "}", [base, exponent], "");
    }
}

export class Psi extends Operator {
    constructor() {
        super(OperatorType.Psi, "\\Psi", "", "", [], "");
    }
}

export class Phi extends Operator {
    constructor() {
        super(OperatorType.Phi, "\\Phi", "", "", [], "");
    }
}

export class Bra extends Operator {
    constructor(content: Operator) {
        super(OperatorType.Bra, "\\left\\lang", "", "\\right\\vert", [content], "");
    }
}

export class Ket extends Operator {
    constructor(content: Operator) {
        super(OperatorType.Ket, "\\left\\vert", "", "\\right\\rang", [content], "");
    }
}

export class Braket extends Operator {
    constructor(bra: Operator, ket: Operator) {
        super(OperatorType.Braket, "\\left\\lang", "\\middle\\vert", "\\right\\rang", [bra, ket], "");
    }
}

export class Bracket extends Operator {
    constructor(bra: Operator, operator: Operator, ket: Operator) {
        super(OperatorType.Bracket, "\\left\\lang", "\\middle\\vert", "\\right\\rang", [bra, operator, ket], "");
    }
}

export class FermionicCreationOperator extends Operator {
    constructor(index: Operator) {
        super(OperatorType.FermionicCreationOperator, "\\mathrm{c}^\\dagger_{", "", "}", [index], "");
    }
}

export class FermionicAnnihilationOperator extends Operator {
    constructor(index: Operator) {
        super(OperatorType.FermionicAnnihilationOperator, "\\mathrm{c}_{", "", "}", [index], "");
    }
}

export class BosonicCreationOperator extends Operator {
    constructor(index: Operator) {
        super(OperatorType.BosonicCreationOperator, "\\mathrm{b}^\\dagger_{", "", "}", [index], "");
    }
}

export class BosonicAnnihilationOperator extends Operator {
    constructor(index: Operator) {
        super(OperatorType.BosonicAnnihilationOperator, "\\mathrm{b}_{", "", "}", [index], "");
    }
}

export class FunctionMathMode extends Operator {
    constructor(name: Operator, content: Operator) {
        super(OperatorType.FunctionMathMode, "{", "}\\left(", "\\right)", [name, content], "");
    }
}

export class FunctionMathRm extends Operator {
    constructor(name: Operator, content: Operator) {
        super(OperatorType.FunctionMathRm, "\\mathrm{", "}\\left(", "\\right)", [name, content], "");
    }
}

export class Sin extends Operator {
    constructor(content: Operator) {
        super(OperatorType.Sin, "\\mathrm{sin}\\left(", "", "\\right)", [content], "");
    }
}

export class Cos extends Operator {
    constructor(content: Operator) {
        super(OperatorType.Cos, "\\mathrm{cos}\\left(", "", "\\right)", [content], "");
    }
}

export class StructuralContainer extends Operator {
    constructor(children: Operator[]) {
        super(OperatorType.StructuralContainer, "", "\\,\\,", "", children, "");
    }
}

export class EmptyArgument extends Operator {
    constructor() {
        super(OperatorType.EmptyArgument, "{", "", "}", [], "");
    }
}

export class Equals extends Operator {
    constructor() {
        super(OperatorType.Equals, "\\eq", "", "", [], ""); // custom macro check
    }
}

export class NotEquals extends Operator {
    constructor() {
        super(OperatorType.NotEquals, "\\neq", "", "", [], "");
    }
}

export class Iff extends Operator {
    constructor() {
        super(OperatorType.Iff, "\\iff", "", "", [], "");
    }
}
