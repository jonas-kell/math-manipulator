import { Operator, OperatorType } from "./exporter";

export function operatorConstructorSwitch(type: OperatorType, value: string, childrenReconstructed: Operator[]): Operator {
    switch (type) {
        case OperatorType.BracketedSum:
        case OperatorType.BracketedMultiplication:
        case OperatorType.StructuralContainer:
            return constructContainerOrFirstChild(type, childrenReconstructed);
        case OperatorType.BigSum:
            return new BigSum(childrenReconstructed[0], childrenReconstructed[1], childrenReconstructed[2]);
        case OperatorType.Fraction:
            return new Fraction(childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.Numerical:
            return new Numerical(Number(value));
        case OperatorType.Variable:
            return new Variable(value);
        case OperatorType.StructuralVariable:
            return new StructuralVariable(value, childrenReconstructed[0]);
        case OperatorType.BigInt:
            return new BigInt(
                childrenReconstructed[0],
                childrenReconstructed[1],
                childrenReconstructed[2],
                childrenReconstructed[3]
            );
        case OperatorType.RawLatex:
            return new RawLatex(value);
        case OperatorType.Negation:
            return new Negation(childrenReconstructed[0]);
        case OperatorType.Pi:
            return new Pi();
        case OperatorType.Phi:
            return new Phi();
        case OperatorType.Psi:
            return new Psi();
        case OperatorType.InfinityConstant:
            return new InfinityConstant();
        case OperatorType.Exp:
            return new Exp(childrenReconstructed[0]);
        case OperatorType.Power:
            return new Power(childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.Bra:
            return new Bra(childrenReconstructed[0]);
        case OperatorType.Ket:
            return new Ket(childrenReconstructed[0]);
        case OperatorType.Braket:
            return new Braket(childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.Bracket:
            return new Bracket(childrenReconstructed[0], childrenReconstructed[1], childrenReconstructed[2]);
        case OperatorType.FermionicCreationOperator:
            return new FermionicCreationOperator(childrenReconstructed[0]);
        case OperatorType.FermionicAnnihilationOperator:
            return new FermionicAnnihilationOperator(childrenReconstructed[0]);
        case OperatorType.BosonicCreationOperator:
            return new BosonicCreationOperator(childrenReconstructed[0]);
        case OperatorType.BosonicAnnihilationOperator:
            return new BosonicAnnihilationOperator(childrenReconstructed[0]);
        case OperatorType.FunctionMathMode:
            return new FunctionMathMode(childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.FunctionMathRm:
            return new FunctionMathRm(childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.Sin:
            return new Sin(childrenReconstructed[0]);
        case OperatorType.Cos:
            return new Cos(childrenReconstructed[0]);
        case OperatorType.EmptyArgument:
            return new EmptyArgument();
        case OperatorType.Equals:
            return new Equals();
        case OperatorType.NotEquals:
            return new NotEquals();
        case OperatorType.Iff:
            return new Iff();
        case OperatorType.KroneckerDelta:
            return new KroneckerDelta(childrenReconstructed[0], childrenReconstructed[1]);
        default:
            throw Error(`type ${type} could not be parsed to an implemented Operator`);
    }
}

function constructContainerOrFirstChild(
    containerType: OperatorType.BracketedMultiplication | OperatorType.BracketedSum | OperatorType.StructuralContainer,
    children: Operator[]
): Operator {
    if (children.length == 1) {
        return children[0]; // special case: no container needed for only one child.
    } else {
        switch (containerType) {
            case OperatorType.BracketedMultiplication:
                return new BracketedMultiplication(children);
            case OperatorType.BracketedSum:
                return new BracketedSum(children);
            case OperatorType.StructuralContainer:
                return new StructuralContainer(children);
            default:
                throw Error(`type ${containerType} Is not a container type`);
        }
    }
}

interface MinusPulloutManagement {
    /**
     * @returns [evenNumberMinusPulledOut: boolean, resultingOperator: Operator]
     */
    minusCanBePulledOut(): [boolean, Operator];
}
function implementsMinusPulloutManagement(object: any): object is MinusPulloutManagement {
    return "minusCanBePulledOut" in object;
}

interface OrderableOperator {
    /**
     * @returns a string computable purely from the instance of the Operator that allows for sorting via local compare
     */
    orderPriorityString(): string;

    /**
     * Performs the swapping of two OrderableOperators (this <-> commuteWith)
     *
     * The elements of the inner OrderableOperator[] need to be concatenated with multiplication
     * If more than one inner OrderableOperator[] is returned (outer array more than one element), the inner multiplications need to be concatenated with addition
     *
     * @returns the result after swapping (if the operators commute, this returns [[commuteWith, this]])
     */
    commute(commuteWith: Operator & OrderableOperator): (Operator & OrderableOperator)[][];
}
function implementsOrderableOperator(object: any): object is OrderableOperator & Operator {
    return object instanceof Operator && "orderPriorityString" in object && "commute" in object;
}
function compareOperatorOrder(a: OrderableOperator & Operator, b: OrderableOperator & Operator): number {
    const orderClasses = [Numerical, Constant, Variable, Operator];
    let indexA = -1;
    let indexB = -1;
    for (let i = 0; i < orderClasses.length; i++) {
        const className = orderClasses[i];

        if (a instanceof className) {
            indexA = i;
        }
        if (b instanceof className) {
            indexB = i;
        }
        if (indexA >= 0 && indexB >= 0) {
            break;
        }
    }

    if (indexA != indexB) {
        // different class
        return indexA - indexB;
    } else {
        // same class
        return a.orderPriorityString().localeCompare(b.orderPriorityString());
    }
}

export class Numerical extends Operator implements MinusPulloutManagement, OrderableOperator {
    constructor(value: number) {
        super(OperatorType.Numerical, "", "", "", [], String(parseFloat(value.toFixed(4))));
    }

    protected getNumericalValue(): number | null {
        return Number(this._value);
    }

    minusCanBePulledOut(): [boolean, Operator] {
        const value = this.getNumericalValue() as number;

        if (value < 0) {
            return [false, new Numerical(-1 * value)];
        }

        return [true, this];
    }

    PullOutMinusMODIFICATION(): Operator {
        const [evenNumberMinusPulledOut, resultingOperator] = this.minusCanBePulledOut();

        if (evenNumberMinusPulledOut) {
            return resultingOperator;
        }

        return new Negation(resultingOperator);
    }

    orderPriorityString() {
        return this._value;
    }

    commute(commuteWith: Operator & OrderableOperator): (Operator & OrderableOperator)[][] {
        return [[commuteWith, this]];
    }
}

export class BracketedSum extends Operator implements MinusPulloutManagement {
    constructor(summands: Operator[]) {
        super(OperatorType.BracketedSum, "\\left(", "+", "\\right)", summands, "");
    }

    protected getNumericalValue(): number | null {
        const res = this.childrenNumericalValues();
        const allNotNull = res[0];
        const childrenValues = res[1];

        if (allNotNull) {
            return childrenValues.reduce((acc, current) => (acc as number) + (current as number), 0);
        } else {
            return null;
        }
    }

    // special implementation to allow for partial folding
    getCopyWithNumbersFolded(): Operator {
        const res = this.childrenNumericalValues();
        const allNotNull = res[0];
        const childrenValues = res[1];

        const partialSum = childrenValues
            .filter((elem) => elem != null)
            .reduce((acc, current) => (acc as number) + (current as number), 0) as number;
        const basicallyZero = partialSum < 1e-6 && partialSum > -1e-6;

        if (allNotNull) {
            return super.getCopyWithNumbersFolded();
        } else {
            if (basicallyZero) {
                return super.numberFoldingInternalImplementation(true, null);
            } else {
                return super.numberFoldingInternalImplementation(true, partialSum);
            }
        }
    }

    getChildren(): Operator[] {
        return this._children;
    }

    /**
     * Calculate the two cases, where a total minus was pulled out and where it wasn't
     * @returns [allChildrenPulledOutOddNumber: boolean, newOperatorAfterNotPullingOut: Operator, newOperatorAfterPullingOut: Operator]
     */
    pullOutMinusHandler(): [boolean, Operator, Operator] {
        let allChildrenPulledOutOddNumber = true;
        let newChildrenNotPullingOut = [] as Operator[];
        let newChildrenPullingOut = [] as Operator[];

        this._children.forEach((child) => {
            if (implementsMinusPulloutManagement(child)) {
                const [childEvenNumberMinusPulledOut, childResultingOperator] = child.minusCanBePulledOut();

                if (childEvenNumberMinusPulledOut) {
                    allChildrenPulledOutOddNumber = false;
                }

                if (childEvenNumberMinusPulledOut) {
                    newChildrenNotPullingOut.push(childResultingOperator);
                    newChildrenPullingOut.push(new Negation(childResultingOperator));
                } else {
                    newChildrenNotPullingOut.push(new Negation(childResultingOperator));
                    newChildrenPullingOut.push(childResultingOperator);
                }
            } else {
                allChildrenPulledOutOddNumber = false;

                newChildrenNotPullingOut.push(child);
                newChildrenPullingOut.push(new Negation(child));
            }
        });

        return [
            allChildrenPulledOutOddNumber,
            constructContainerOrFirstChild(OperatorType.BracketedSum, newChildrenNotPullingOut),
            constructContainerOrFirstChild(OperatorType.BracketedSum, newChildrenPullingOut),
        ];
    }

    // TODO this could also deal with the special case, that it may be interesting to rearrange elements in the sum (2-3) -> -(3-2)
    minusCanBePulledOut(): [boolean, Operator] {
        const [allChildrenPulledOutOddNumber, newOperatorAfterNotPullingOut, newOperatorAfterPullingOut] =
            this.pullOutMinusHandler();

        if (allChildrenPulledOutOddNumber) {
            return [false, newOperatorAfterPullingOut];
        }
        return [true, newOperatorAfterNotPullingOut];
    }

    PullOutMinusMODIFICATION(): Operator {
        const [_allChildrenPulledOutOddNumber, _newOperatorAfterNotPullingOut, newOperatorAfterPullingOut] =
            this.pullOutMinusHandler();

        return new Negation(newOperatorAfterPullingOut);
    }

    commuteChildAndSubsequent(childUUID: string): Operator {
        const children = this.getChildren();
        let newChildren = [] as Operator[];

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.getUUID() == childUUID) {
                const nextChild = children[i + 1];
                if (nextChild && nextChild != null && nextChild != undefined) {
                    newChildren.push(nextChild, child);
                    i += 1; // skip next;
                    continue;
                }
            }
            // push self
            newChildren.push(child);
        }

        return constructContainerOrFirstChild(OperatorType.BracketedSum, newChildren);
    }
}

export class BracketedMultiplication extends Operator implements MinusPulloutManagement {
    constructor(multiplicators: Operator[]) {
        super(OperatorType.BracketedMultiplication, "\\left(", " \\cdot ", "\\right)", multiplicators, "");
    }

    protected getNumericalValue(): number | null {
        const res = this.childrenNumericalValues();
        const allNotNull = res[0];
        const childrenValues = res[1];

        if (allNotNull) {
            return childrenValues.reduce((acc, current) => (acc as number) * (current as number), 1);
        } else {
            return null;
        }
    }

    // special implementation to allow for partial folding
    getCopyWithNumbersFolded(): Operator {
        const res = this.childrenNumericalValues();
        const allNotNull = res[0];
        const childrenValues = res[1];

        const partialProduct = childrenValues
            .filter((elem) => elem != null)
            .reduce((acc, current) => (acc as number) * (current as number), 1) as number;
        const basicallyOne = partialProduct - 1 < 1e-6 && partialProduct - 1 > -1e-6;

        if (allNotNull) {
            return super.getCopyWithNumbersFolded();
        } else {
            if (basicallyOne) {
                return super.numberFoldingInternalImplementation(true, null);
            } else {
                return super.numberFoldingInternalImplementation(true, partialProduct);
            }
        }
    }

    DistributeMODIFICATION(): Operator {
        let children = this.getChildren();

        if (children.length >= 2) {
            let numberOfSums = 0;
            const childSumInstances = children
                // can only distribute into sum. Therefore wrap singular elements into a single sum for ease of use
                .map((child) => {
                    if (child instanceof BracketedSum) {
                        numberOfSums += 1;
                        return child;
                    } else {
                        // because do not use `constructContainerOrFirstChild` here, because we SPECIFICALLY WANT a sum with only one element.
                        return new BracketedSum([child]);
                    }
                })
                .filter((child) => child instanceof BracketedSum) as BracketedSum[];

            if (numberOfSums > 0 && childSumInstances.length === children.length) {
                const newSummands = [] as BracketedMultiplication[];

                // do this recursively in order to allow for as many sum-terms in the product as you want
                function generateCombinations(currentIndex: number, currentProduct: Operator[]) {
                    if (currentIndex === childSumInstances.length) {
                        // depth has reached number of terms in original multiplication -> one element from each original sum
                        // because of typing do not use `constructContainerOrFirstChild` here. We know there are enough elements because of assertion
                        newSummands.push(new BracketedMultiplication(currentProduct));
                    } else {
                        const currentSum = childSumInstances[currentIndex];
                        currentSum.getChildren().forEach((child) => {
                            generateCombinations(currentIndex + 1, currentProduct.concat(child)); // passes array by VALUE!!
                        });
                    }
                }
                // generate the cartesian product of the sum-terms in the product
                generateCombinations(0, []);

                // because of typing do not use `constructContainerOrFirstChild` here. We know there are enough elements because of assertion
                return new BracketedSum(newSummands);
            }
        }

        return this;
    }

    getChildren(): Operator[] {
        return this._children;
    }

    minusCanBePulledOut(): [boolean, Operator] {
        const children = this._children;
        const newChildren = [] as Operator[];
        let even = true;

        children.forEach((child) => {
            if (implementsMinusPulloutManagement(child)) {
                const [childEvenNumberMinusPulledOut, childResultingOperator] = child.minusCanBePulledOut();

                even = childEvenNumberMinusPulledOut ? even : !even;
                newChildren.push(childResultingOperator);
            } else {
                newChildren.push(child);
            }
        });

        return [even, constructContainerOrFirstChild(OperatorType.BracketedMultiplication, newChildren)];
    }

    PullOutMinusMODIFICATION(): Operator {
        const [evenNumberMinusPulledOut, resultingOperator] = this.minusCanBePulledOut();

        if (evenNumberMinusPulledOut) {
            return resultingOperator;
        }

        return new Negation(resultingOperator);
    }

    MergeAndEvaluateBraKetMODIFICATION(): Operator {
        let newChildren = [] as Operator[];

        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];
            const nextChild = this._children[i + 1];

            if (nextChild && nextChild != undefined && nextChild != null) {
                if (child instanceof Bra) {
                    if (nextChild instanceof Ket) {
                        newChildren.push(Operator.MergeBraKet(child, nextChild).OrthoNormalEvalMODIFICATION());
                        i += 1; // skip next
                        continue; // do not push self
                    }
                }
            }

            newChildren.push(child);
        }

        return constructContainerOrFirstChild(OperatorType.BracketedMultiplication, newChildren);
    }

    OrderOperatorStringsMODIFICATION(): Operator {
        let newChildren = [] as Operator[];
        let currentOperatorString = [] as (Operator & OrderableOperator)[];

        function sortAndPush() {
            newChildren.push(...BracketedMultiplication.orderOperatorString(currentOperatorString));
            currentOperatorString = [];
        }

        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];

            if (implementsOrderableOperator(child)) {
                currentOperatorString.push(child);
            } else {
                sortAndPush();
                newChildren.push(child);
            }
        }
        sortAndPush();

        return constructContainerOrFirstChild(OperatorType.BracketedMultiplication, newChildren);
    }

    static orderOperatorString(inString: (Operator & OrderableOperator)[]): (Operator & OrderableOperator)[] {
        return inString.sort((a, b) => compareOperatorOrder(a, b));
    }

    commuteChildAndSubsequent(childUUID: string): Operator {
        const children = this.getChildren();
        let newChildren = [] as Operator[];

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.getUUID() == childUUID) {
                const nextChild = children[i + 1];
                if (nextChild && nextChild != null && nextChild != undefined) {
                    if (implementsOrderableOperator(child) && implementsOrderableOperator(nextChild)) {
                        // use the inherit commutation actions of the OrderableOperatorsInterface
                        const commutedResult = child.commute(nextChild);
                        let aggregatedMultiplications = [] as Operator[];
                        commutedResult.forEach((array) => {
                            aggregatedMultiplications.push(
                                constructContainerOrFirstChild(OperatorType.BracketedMultiplication, array)
                            );
                        });
                        newChildren.push(constructContainerOrFirstChild(OperatorType.BracketedSum, aggregatedMultiplications));
                    } else {
                        // no special logic, just swap them forcefully
                        newChildren.push(nextChild, child);
                    }

                    i += 1; // skip next;
                    continue;
                }
            }
            // push self
            newChildren.push(child);
        }

        return constructContainerOrFirstChild(OperatorType.BracketedMultiplication, newChildren);
    }
}

export class Fraction extends Operator implements MinusPulloutManagement {
    constructor(dividend: Operator, divisor: Operator) {
        super(OperatorType.Fraction, "\\frac{", "}{", "}", [dividend, divisor], "");
    }

    protected getNumericalValue(): number | null {
        const res = this.childrenNumericalValues();
        const allNotNull = res[0];
        const childrenValues = res[1];
        const enumerator = childrenValues[0] as number;
        const denominator = childrenValues[1] as number;

        if (allNotNull) {
            return enumerator / denominator;
        } else {
            return null;
        }
    }

    minusCanBePulledOut(): [boolean, Operator] {
        const enumerator = this._children[0];
        const denominator = this._children[1];
        const newChildren = [] as Operator[];
        let even = true;

        [enumerator, denominator].forEach((child) => {
            if (implementsMinusPulloutManagement(child)) {
                const [childEvenNumberMinusPulledOut, childResultingOperator] = child.minusCanBePulledOut();

                even = childEvenNumberMinusPulledOut ? even : !even;
                newChildren.push(childResultingOperator);
            } else {
                newChildren.push(child);
            }
        });

        return [even, new Fraction(newChildren[0], newChildren[1])];
    }

    PullOutMinusMODIFICATION(): Operator {
        const [evenNumberMinusPulledOut, resultingOperator] = this.minusCanBePulledOut();

        if (evenNumberMinusPulledOut) {
            return resultingOperator;
        }

        return new Negation(resultingOperator);
    }

    ReduceMODIFICATION(): Operator {
        const enumerator = this._children[0];
        const denominator = this._children[1];
        let enumeratorInputs = [] as Operator[];
        let denominatorInputs = [] as Operator[];

        if (enumerator instanceof BracketedMultiplication) {
            enumeratorInputs = enumerator.getChildren();
        } else {
            enumeratorInputs = [enumerator];
        }

        if (denominator instanceof BracketedMultiplication) {
            denominatorInputs = denominator.getChildren();
        } else {
            denominatorInputs = [denominator];
        }

        let enumeratorInputsKeep = Array(enumeratorInputs.length).fill(true);
        let denominatorInputsKeep = Array(denominatorInputs.length).fill(true);

        for (let enumIndex = 0; enumIndex < enumeratorInputs.length; enumIndex++) {
            const enumeratorChild = enumeratorInputs[enumIndex];
            for (let denomIndex = 0; denomIndex < denominatorInputs.length; denomIndex++) {
                if (denominatorInputsKeep[denomIndex]) {
                    const denominatorChild = denominatorInputs[denomIndex];

                    if (Operator.assertOperatorsEquivalent(enumeratorChild, denominatorChild)) {
                        enumeratorInputsKeep[enumIndex] = false;
                        denominatorInputsKeep[denomIndex] = false;
                        break; // break the denominator loop
                    }
                }
            }
        }

        const enumeratorOutput = enumeratorInputs.filter((_elem, index) => enumeratorInputsKeep[index]);
        const denominatorOutput = denominatorInputs.filter((_elem, index) => denominatorInputsKeep[index]);

        if (enumeratorOutput.length == 0) {
            if (denominatorOutput.length == 0) {
                // {} / {}
                return new Numerical(1);
            } else {
                // {} / [a] or [a,b,c,...]
                return new Fraction(
                    new Numerical(1),
                    constructContainerOrFirstChild(OperatorType.BracketedMultiplication, denominatorOutput)
                );
            }
        } else {
            if (denominatorOutput.length == 0) {
                // [x] or [x, y, z] / {}
                return constructContainerOrFirstChild(OperatorType.BracketedMultiplication, enumeratorOutput);
            } else {
                // [x] or [x, y, z] / [a] or [a,b,c,...]
                return new Fraction(
                    constructContainerOrFirstChild(OperatorType.BracketedMultiplication, enumeratorOutput),
                    constructContainerOrFirstChild(OperatorType.BracketedMultiplication, denominatorOutput)
                );
            }
        }
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

export class Variable extends Operator implements OrderableOperator {
    constructor(name: string) {
        super(OperatorType.Variable, "{", "", "}", [], name);
    }

    orderPriorityString() {
        return this._value;
    }

    commute(commuteWith: Operator & OrderableOperator): (Operator & OrderableOperator)[][] {
        return [[commuteWith, this]];
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

    protected getNumericalValue(): number | null {
        const res = this.childrenNumericalValues();
        const allNotNull = res[0];
        const childrenValues = res[1];

        if (allNotNull) {
            return childrenValues[0]; // no more content needed, if it can be folded into number
        } else {
            return null;
        }
    }

    UnpackMODIFICATION(): Operator {
        return this._children[0];
    }
}

export class Negation extends Operator implements MinusPulloutManagement {
    constructor(content: Operator) {
        super(OperatorType.Negation, "-", "", "", [content], "");
    }

    protected getNumericalValue(): number | null {
        const res = this.childrenNumericalValues();
        const allNotNull = res[0];
        const childrenValues = res[1];

        if (allNotNull) {
            return -1 * (childrenValues[0] as number);
        } else {
            return null;
        }
    }

    minusCanBePulledOut(): [boolean, Operator] {
        const child = this._children[0];

        if (implementsMinusPulloutManagement(child)) {
            const [childEvenNumberMinusPulledOut, childResultingOperator] = child.minusCanBePulledOut();

            return [childEvenNumberMinusPulledOut !== true, childResultingOperator];
        } else {
            return [false, child];
        }
    }

    PullOutMinusMODIFICATION(): Operator {
        const [evenNumberMinusPulledOut, resultingOperator] = this.minusCanBePulledOut();

        if (evenNumberMinusPulledOut) {
            return resultingOperator;
        }

        return new Negation(resultingOperator);
    }
}

abstract class Constant extends Operator implements OrderableOperator {
    constructor(opType: OperatorType, latex: string) {
        super(opType, latex, "", "", [], "");
    }

    orderPriorityString() {
        return this._startDisplayFormula;
    }

    commute(commuteWith: Operator & OrderableOperator): (Operator & OrderableOperator)[][] {
        return [[commuteWith, this]];
    }
}

export class Pi extends Constant {
    constructor() {
        super(OperatorType.Pi, "\\pi");
    }

    protected getNumericalValue(): number | null {
        return Math.PI;
    }
}

export class InfinityConstant extends Constant {
    constructor() {
        super(OperatorType.InfinityConstant, "\\infty");
    }

    protected getNumericalValue(): number | null {
        return Infinity;
    }
}

export class Exp extends Operator {
    constructor(exponent: Operator) {
        super(OperatorType.Exp, "\\mathrm{e}^{", "", "}", [exponent], "");
    }

    protected getNumericalValue(): number | null {
        const res = this.childrenNumericalValues();
        const allNotNull = res[0];
        const childrenValues = res[1];

        if (allNotNull) {
            return Math.exp(childrenValues[0] as number);
        } else {
            return null;
        }
    }
}

export class Power extends Operator {
    constructor(base: Operator, exponent: Operator) {
        super(OperatorType.Power, "{", "}^{", "}", [base, exponent], "");
    }

    protected getNumericalValue(): number | null {
        const res = this.childrenNumericalValues();
        const allNotNull = res[0];
        const childrenValues = res[1];
        const base = childrenValues[0] as number;
        const exponent = childrenValues[1] as number;

        if (allNotNull) {
            return Math.pow(base, exponent);
        } else {
            return null;
        }
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

    OrthoNormalEvalMODIFICATION(): Operator {
        const bra = this._children[0];
        const ket = this._children[1];

        let braChildren = [] as Operator[];
        if (bra instanceof StructuralContainer) {
            braChildren = bra.getChildren();
        } else {
            braChildren = [bra];
        }
        let ketChildren = [] as Operator[];
        if (ket instanceof StructuralContainer) {
            ketChildren = ket.getChildren();
        } else {
            ketChildren = [ket];
        }

        if (braChildren.length != ketChildren.length) {
            // uneven length, not comparable
            return this;
        }

        let oneCouldNotBeParsedYet = false;

        for (let i = 0; i < braChildren.length; i++) {
            const braChild = braChildren[i];
            const ketChild = ketChildren[i];

            const equivalent = Operator.assertOperatorsEquivalent(braChild, ketChild);

            // helper instance to access getNumericalValue
            const [allNotNull, _] = new Braket(braChild, ketChild).childrenNumericalValues();

            if (equivalent) {
                // this is fine, still overlaps
            } else {
                if (allNotNull) {
                    // no equivalence, but could be parsed to number -> definitely different
                    return new Numerical(0);
                } else {
                    // if NOT equal AND one of them could not be parsed to a number ->
                    oneCouldNotBeParsedYet = true;
                }
            }
        }

        if (oneCouldNotBeParsedYet) {
            // after all checks we could still evaluate to true with further more complex changes
            return this;
        } else {
            // no check exited, we have 100% overlap
            return new Numerical(1);
        }
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

    protected getNumericalValue(): number | null {
        const res = this.childrenNumericalValues();
        const allNotNull = res[0];
        const childrenValues = res[1];

        if (allNotNull) {
            return Math.sin(childrenValues[0] as number);
        } else {
            return null;
        }
    }
}

export class Cos extends Operator {
    constructor(content: Operator) {
        super(OperatorType.Cos, "\\mathrm{cos}\\left(", "", "\\right)", [content], "");
    }

    protected getNumericalValue(): number | null {
        const res = this.childrenNumericalValues();
        const allNotNull = res[0];
        const childrenValues = res[1];

        if (allNotNull) {
            return Math.cos(childrenValues[0] as number);
        } else {
            return null;
        }
    }
}

export class StructuralContainer extends Operator {
    constructor(children: Operator[]) {
        super(OperatorType.StructuralContainer, "", "\\,\\,", "", children, "");
    }

    getChildren(): Operator[] {
        return this._children;
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

export class KroneckerDelta extends Operator {
    constructor(firstArg: Operator, secondArg: Operator) {
        super(OperatorType.KroneckerDelta, "\\delta_{", ",", "}", [firstArg, secondArg], "");
    }

    protected getNumericalValue(): number | null {
        const res = this.childrenNumericalValues();
        const allNotNull = res[0];
        const equivalent = Operator.assertOperatorsEquivalent(this._children[0], this._children[1]);

        if (equivalent) {
            return 1;
        } else {
            // not equivalent.
            if (allNotNull) {
                // If everything could be parsed into a number, we are sure the arguments are different and we return 0 as the value for the delta
                return 0;
            } else {
                // some structure could not be parsed, but still the values may be equivalent after modification that is too complex for the program to handle on its own
                // keep the delta as a formula
                return null;
            }
        }
    }
}
