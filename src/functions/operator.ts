import { v4 as uuidv4 } from "uuid";

const MAX_CHILDREN = 99999999;
enum OperatorType {
    Fraction = "fraction",
    BracketedSum = "bracketed_sum",
    Numerical = "number",
    Variable = "variable",
    StructuralVariable = "structural_variable",
    BigSum = "big_sum",
    BigInt = "big_int",
    RawLatex = "raw_latex",
    BracketedMultiplication = "bracketed_multiplication",
}

interface ExportOperatorContent {
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
    protected _minChildren: number;
    protected _maxChildren: number;
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
        minChildren: number,
        maxChildren: number,
        midDisplayOverwrite: string[] = [],
        renderChildren: boolean = true
    ) {
        if (children.length < minChildren) {
            throw Error("Not enough children for Operator");
        }
        if (children.length > maxChildren) {
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
        this._minChildren = minChildren;
        this._maxChildren = maxChildren;
        this._uuid = uuid;
        this._hasMidDisplayOverwrite = hasMidDisplayOverwrite;
        this._midDisplayOverwrite = midDisplayOverwrite;
        this._renderChildren = renderChildren;
    }

    getType() {
        return this._type;
    }

    getUUIDString() {
        return "ref_" + this._uuid;
    }

    manuallySetUUID(uuid: string) {
        this._uuid = uuid;
    }

    private assembleFormulaString(renderHtmlIds: boolean) {
        let formula = "";

        if (renderHtmlIds) {
            formula += `\\htmlId{${this.getUUIDString()}}{`;
        }

        formula += this._startDisplayFormula;
        formula += this._value;

        if (this._renderChildren) {
            this._children.forEach((child, index) => {
                formula += child.assembleFormulaString(renderHtmlIds);
                if (this._children.length > index + 1) {
                    if (this._hasMidDisplayOverwrite) {
                        formula += this._midDisplayOverwrite[index];
                    } else {
                        formula += this._midDisplayFormula;
                    }
                }
            });
        }

        formula += this._endDisplayFormula;

        if (renderHtmlIds) {
            formula += "}"; //closing the second htmlID bracket
        }

        return formula;
    }

    getFormulaString() {
        return this.assembleFormulaString(true);
    }

    exportFormulaString() {
        return this.assembleFormulaString(false);
    }

    getContainedUUIDs() {
        let out = [] as string[];

        out.push(this.getUUIDString());
        this._children.forEach((child) => {
            out.push(...child.getContainedUUIDs());
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

    static generateStructure(input: string): Operator {
        const json: ExportOperatorContent = JSON.parse(input); // unsure if this is possible type-safe (this is too complicated https://dev.to/codeprototype/safely-parsing-json-to-a-typescript-interface-3lkj)

        return Operator.generateStructureRecursive(json);
    }

    private static generateStructureRecursive(input: ExportOperatorContent): Operator {
        let res = new Numerical(0);

        let childrenReconstructed = [] as Operator[];
        input.children.forEach((childJson) => {
            childrenReconstructed.push(Operator.generateStructureRecursive(childJson));
        });

        switch (input.type) {
            case OperatorType.BigSum:
                if (childrenReconstructed.length < MIN_CHILDREN_BigSum || childrenReconstructed.length > MAX_CHILDREN_BigSum) {
                    throw Error(
                        `For BigSum to be reconstructed, it needs between ${MIN_CHILDREN_BigSum} and ${MAX_CHILDREN_BigSum} children!`
                    );
                }
                res = new BigSum(childrenReconstructed[0], childrenReconstructed[1], childrenReconstructed[2]);
                break;
            case OperatorType.Fraction:
                if (
                    childrenReconstructed.length < MIN_CHILDREN_Fraction ||
                    childrenReconstructed.length > MAX_CHILDREN_Fraction
                ) {
                    throw Error(
                        `For Fraction to be reconstructed, it needs between ${MIN_CHILDREN_Fraction} and ${MAX_CHILDREN_Fraction} children!`
                    );
                }
                res = new Fraction(childrenReconstructed[0], childrenReconstructed[1]);
                break;
            case OperatorType.BracketedSum:
                if (
                    childrenReconstructed.length < MIN_CHILDREN_BracketedSum ||
                    childrenReconstructed.length > MAX_CHILDREN_BracketedSum
                ) {
                    throw Error(
                        `For BracketedSum to be reconstructed, it needs between ${MIN_CHILDREN_BracketedSum} and ${MAX_CHILDREN_BracketedSum} children!`
                    );
                }
                res = new BracketedSum(childrenReconstructed);
                break;
            case OperatorType.Numerical:
                if (
                    childrenReconstructed.length < MIN_CHILDREN_Numerical ||
                    childrenReconstructed.length > MAX_CHILDREN_Numerical
                ) {
                    throw Error(
                        `For Number to be reconstructed, it needs between ${MIN_CHILDREN_Numerical} and ${MAX_CHILDREN_Numerical} children!`
                    );
                }
                res = new Numerical(Number(input.value));
                break;
            case OperatorType.Variable:
                if (
                    childrenReconstructed.length < MIN_CHILDREN_Variable ||
                    childrenReconstructed.length > MAX_CHILDREN_Variable
                ) {
                    throw Error(
                        `For Variable to be reconstructed, it needs between ${MIN_CHILDREN_Variable} and ${MAX_CHILDREN_Variable} children!`
                    );
                }
                res = new Variable(input.value);
                break;
            case OperatorType.StructuralVariable:
                if (
                    childrenReconstructed.length < MIN_CHILDREN_StructuralVariable ||
                    childrenReconstructed.length > MAX_CHILDREN_StructuralVariable
                ) {
                    throw Error(
                        `For StructuralVariable to be reconstructed, it needs between ${MIN_CHILDREN_StructuralVariable} and ${MAX_CHILDREN_StructuralVariable} children!`
                    );
                }
                res = new StructuralVariable(input.value, childrenReconstructed[0]);
                break;
            case OperatorType.BigInt:
                if (childrenReconstructed.length < MIN_CHILDREN_BigInt || childrenReconstructed.length > MAX_CHILDREN_BigInt) {
                    throw Error(
                        `For BigInt to be reconstructed, it needs between ${MIN_CHILDREN_BigInt} and ${MAX_CHILDREN_BigInt} children!`
                    );
                }
                res = new BigInt(
                    childrenReconstructed[0],
                    childrenReconstructed[1],
                    childrenReconstructed[2],
                    childrenReconstructed[3]
                );
                break;
            case OperatorType.RawLatex:
                if (
                    childrenReconstructed.length < MIN_CHILDREN_RawLatex ||
                    childrenReconstructed.length > MAX_CHILDREN_RawLatex
                ) {
                    throw Error(
                        `For RawLatex to be reconstructed, it needs between ${MIN_CHILDREN_RawLatex} and ${MAX_CHILDREN_RawLatex} children!`
                    );
                }
                res = new RawLatex(input.value);
                break;
            case OperatorType.BracketedMultiplication:
                if (
                    childrenReconstructed.length < MIN_CHILDREN_BracketedMultiplication ||
                    childrenReconstructed.length > MAX_CHILDREN_BracketedMultiplication
                ) {
                    throw Error(
                        `For BracketedMultiplication to be reconstructed, it needs between ${MIN_CHILDREN_BracketedMultiplication} and ${MAX_CHILDREN_BracketedMultiplication} children!`
                    );
                }
                res = new BracketedMultiplication(childrenReconstructed);
                break;
            default:
                throw Error(`type ${input.type} could not be parsed to an implemented Operator`);
        }

        return res;
    }
}

const MIN_CHILDREN_Numerical = 0;
const MAX_CHILDREN_Numerical = 0;
export class Numerical extends Operator {
    constructor(value: number) {
        super(OperatorType.Numerical, "", "", "", [], String(value), MIN_CHILDREN_Numerical, MAX_CHILDREN_Numerical);
    }
}

const MIN_CHILDREN_BracketedSum = 2;
const MAX_CHILDREN_BracketedSum = MAX_CHILDREN;
export class BracketedSum extends Operator {
    constructor(summands: Operator[]) {
        super(
            OperatorType.BracketedSum,
            "\\left(",
            "+",
            "\\right)",
            summands,
            "",
            MIN_CHILDREN_BracketedSum,
            MAX_CHILDREN_BracketedSum
        );
    }
}

const MIN_CHILDREN_BracketedMultiplication = 2;
const MAX_CHILDREN_BracketedMultiplication = MAX_CHILDREN;
export class BracketedMultiplication extends Operator {
    constructor(multiplicators: Operator[]) {
        super(
            OperatorType.BracketedMultiplication,
            "\\left(",
            " \\cdot ",
            "\\right)",
            multiplicators,
            "",
            MIN_CHILDREN_BracketedMultiplication,
            MAX_CHILDREN_BracketedMultiplication
        );
    }
}

const MIN_CHILDREN_Fraction = 2;
const MAX_CHILDREN_Fraction = 2;
export class Fraction extends Operator {
    constructor(dividend: Operator, divisor: Operator) {
        super(OperatorType.Fraction, "\\frac{", "}{", "}", [dividend, divisor], "", MIN_CHILDREN_Fraction, MAX_CHILDREN_Fraction);
    }
}

const MIN_CHILDREN_BigSum = 3;
const MAX_CHILDREN_BigSum = 3;
export class BigSum extends Operator {
    constructor(lower: Operator, upper: Operator, content: Operator) {
        super(
            OperatorType.BigSum,
            "\\sum\\limits_{",
            "",
            "",
            [lower, upper, content],
            "",
            MIN_CHILDREN_BigSum,
            MAX_CHILDREN_BigSum,
            [" }^{ ", "}"]
        );
    }
}

const MIN_CHILDREN_BigInt = 4;
const MAX_CHILDREN_BigInt = 4;
export class BigInt extends Operator {
    constructor(lower: Operator, upper: Operator, content: Operator, differentialVariable: Operator) {
        super(
            OperatorType.BigInt,
            "\\int\\limits_{",
            "",
            "",
            [lower, upper, content, differentialVariable],
            "",
            MIN_CHILDREN_BigInt,
            MAX_CHILDREN_BigInt,
            ["}^{", "}", "\\mathrm{d}"]
        );
    }
}

const MIN_CHILDREN_Variable = 0;
const MAX_CHILDREN_Variable = 0;
export class Variable extends Operator {
    constructor(name: string) {
        super(OperatorType.Variable, "{", "", "}", [], name, MIN_CHILDREN_Variable, MAX_CHILDREN_Variable);
    }
}

const MIN_CHILDREN_RawLatex = 0;
const MAX_CHILDREN_RawLatex = 0;
export class RawLatex extends Operator {
    constructor(formula: string) {
        super(OperatorType.RawLatex, "{", "", "}", [], formula, MIN_CHILDREN_RawLatex, MAX_CHILDREN_RawLatex);
    }
}

const MIN_CHILDREN_StructuralVariable = 1;
const MAX_CHILDREN_StructuralVariable = 1;
export class StructuralVariable extends Operator {
    constructor(name: string, content: Operator) {
        super(
            OperatorType.StructuralVariable,
            "{",
            "",
            "}",
            [content],
            name,
            MIN_CHILDREN_StructuralVariable,
            MAX_CHILDREN_StructuralVariable,
            [],
            false
        );
    }
}
