import { v4 as uuidv4 } from "uuid";

const MAX_CHILDREN = 99999999;
enum OperatorType {
    Fraction = "fraction",
    BracketedSum = "bracketed_sum",
    Number = "number",
    Variable = "variable",
    StructuralVariable = "structural_variable",
    BigSum = "big_sum",
    BigInt = "big_int",
    RawLatex = "raw_latex",
    BracketedMultiplication = "bracketed_multiplication",
}

abstract class Operator {
    private _type: OperatorType;
    private _startDisplayFormula: string;
    private _endDisplayFormula: string;
    private _midDisplayFormula: string;
    private _midDisplayOverwrite: string[] = [];
    private _hasMidDisplayOverwrite: boolean = false;
    private _children: Operator[];
    private _value: string;
    private _minChildren: number;
    private _maxChildren: number;
    private _uuid: string;
    private _renderChildren: boolean = true;

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
        this._type = type;
        this._startDisplayFormula = startDisplayFormula;
        this._endDisplayFormula = endDisplayFormula;
        this._midDisplayFormula = midDisplayFormula;
        this._children = children;
        this._value = value;
        this._minChildren = minChildren;
        this._maxChildren = maxChildren;
        this._renderChildren = renderChildren;

        if (this._children.length < this._minChildren) {
            throw Error("Not enough children for Operator");
        }
        if (this._children.length > this._maxChildren) {
            throw Error("Too many children for Operator");
        }

        if (midDisplayOverwrite.length != 0) {
            if (midDisplayOverwrite.length == children.length - 1) {
                this._hasMidDisplayOverwrite = true;
                this._midDisplayOverwrite = midDisplayOverwrite;
            } else {
                throw Error("Mid display overwrite needs to contain exactly #children-1 elements");
            }
        }

        this._uuid = uuidv4();
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
}

export class Number extends Operator {
    constructor(value: number) {
        super(OperatorType.Number, "", "", "", [], String(value), 0, 0);
    }
}

export class BracketedSum extends Operator {
    constructor(summands: Operator[]) {
        super(OperatorType.BracketedSum, "\\left(", "+", "\\right)", summands, "", 2, MAX_CHILDREN);
    }
}

export class BracketedMultiplication extends Operator {
    constructor(multiplicators: Operator[]) {
        super(OperatorType.BracketedMultiplication, "\\left(", " \\cdot ", "\\right)", multiplicators, "", 2, MAX_CHILDREN);
    }
}

export class Fraction extends Operator {
    constructor(dividend: Operator, divisor: Operator) {
        super(OperatorType.Fraction, "\\frac{", "}{", "}", [dividend, divisor], "", 2, 2);
    }
}

export class BigSum extends Operator {
    constructor(lower: Operator, upper: Operator, content: Operator) {
        super(OperatorType.BigSum, "\\sum\\limits_{", "", "", [lower, upper, content], "", 3, 3, [" }^{ ", "}"]);
    }
}

export class BigInt extends Operator {
    constructor(lower: Operator, upper: Operator, content: Operator, differentialVariable: Operator) {
        super(OperatorType.BigInt, "\\int\\limits_{", "", "", [lower, upper, content, differentialVariable], "", 4, 4, [
            "}^{",
            "}",
            "\\mathrm{d}",
        ]);
    }
}

export class Variable extends Operator {
    constructor(name: string) {
        super(OperatorType.Variable, "{", "", "}", [], name, 0, 0);
    }
}

export class RawLatex extends Operator {
    constructor(formula: string) {
        super(OperatorType.RawLatex, "{", "", "}", [], formula, 0, 0);
    }
}

export class StructuralVariable extends Operator {
    constructor(name: string, content: Operator) {
        super(OperatorType.StructuralVariable, "{", "", "}", [content], name, 1, 1, [], false);
    }
}
