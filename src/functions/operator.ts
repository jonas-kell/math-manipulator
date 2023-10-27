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
}

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

    static generateStructure(input: string, keepUUIDs: boolean = false): Operator {
        const json: ExportOperatorContent = JSON.parse(input); // unsure if this is possible type-safe (this is too complicated https://dev.to/codeprototype/safely-parsing-json-to-a-typescript-interface-3lkj)

        return Operator.generateStructureRecursive(json, keepUUIDs);
    }

    private static generateStructureRecursive(input: ExportOperatorContent, keepUUIDs: boolean): Operator {
        let res = new Numerical(0);

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
                break;
            case OperatorType.Negation:
                res = new Negation(childrenReconstructed[0]);
                break;
            default:
                throw Error(`type ${input.type} could not be parsed to an implemented Operator`);
        }

        if (keepUUIDs) {
            res.manuallySetUUID(input.uuid);
        }

        return res;
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
};

export class Numerical extends Operator {
    constructor(value: number) {
        super(OperatorType.Numerical, "", "", "", [], String(value));
    }
}

export class BracketedSum extends Operator {
    constructor(summands: Operator[]) {
        super(OperatorType.BracketedSum, "\\left(", "+", "\\right)", summands, "");
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
}
