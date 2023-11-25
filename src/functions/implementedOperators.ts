import { Operator, OperatorType, useVariablesStore } from "./exporter";

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
        case OperatorType.ComplexOperatorConstruct:
            return new ComplexOperatorConstruct(childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.Variable:
            return new Variable(value);
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
        case OperatorType.PiConstant:
            return new PiConstant();
        case OperatorType.EConstant:
            return new EConstant();
        case OperatorType.Sqrt2Constant:
            return new Sqrt2Constant();
        case OperatorType.ComplexIConstant:
            return new ComplexIConstant();
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

export function constructContainerOrFirstChild(
    containerType: OperatorType.BracketedMultiplication | OperatorType.BracketedSum | OperatorType.StructuralContainer,
    children: Operator[],
    removeBracketsAllowedByAssociativity: boolean = true
): Operator {
    if (children.length == 0) {
        // canonical replacements for when initialized without inputChildren
        switch (containerType) {
            case OperatorType.BracketedMultiplication:
                return new Numerical(1);
            case OperatorType.BracketedSum:
                return new Numerical(0);
            case OperatorType.StructuralContainer:
                return new EmptyArgument();
            default:
                throw Error(`type ${containerType} Is not a container type`);
        }
    } else if (children.length == 1) {
        return children[0]; // special case: no container needed for only one child.
    } else {
        let newChildren = children;

        switch (containerType) {
            case OperatorType.BracketedMultiplication:
                if (removeBracketsAllowedByAssociativity) {
                    newChildren = children.flatMap((child) => {
                        if (child instanceof BracketedMultiplication) {
                            return child.getChildren();
                        } else {
                            return child;
                        }
                    });
                }
                return new BracketedMultiplication(newChildren);
            case OperatorType.BracketedSum:
                if (removeBracketsAllowedByAssociativity) {
                    newChildren = children.flatMap((child) => {
                        if (child instanceof BracketedSum) {
                            return child.getChildren();
                        } else if (child instanceof Negation && child.getChild() instanceof BracketedSum) {
                            // for negated sum directly spread negated arguments
                            const negatedSum = child.getChild() as BracketedSum;
                            return negatedSum.getChildren().map((sumChild) => {
                                return new Negation(sumChild);
                            });
                        } else {
                            return child;
                        }
                    });
                }
                return new BracketedSum(newChildren);
            case OperatorType.StructuralContainer:
                return new StructuralContainer(newChildren);
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

    PullOutMinusMODIFICATION(): Operator;
}
export function implementsMinusPulloutManagement(object: any): object is MinusPulloutManagement {
    return "minusCanBePulledOut" in object && "PullOutMinusMODIFICATION" in object;
}

/**
 * The boolean states if an additional minus (-) was introduced
 *
 * The elements of the inner (Operator & OrderableOperator)[] need to be concatenated with multiplication. The boolean instructs if they need to be wrapped in minus
 * If more than one inner [boolean, (Operator & OrderableOperator)[]] is returned (outer array more than one element), the inner multiplications need to be concatenated with addition
 */
type ReorderResultIntermediate = [boolean, (Operator & OrderableOperator)[]][];
interface OrderableOperator {
    /**
     * @returns a string computable purely from the instance of the Operator that allows for sorting via local compare
     */
    orderPriorityString(): string;

    /**
     * Performs the swapping of two OrderableOperators (this <-> commuteWith)
     *
     * THE FIRST ELEMENT MUST BE THE ONE WHERE THE ELEMENTS SWAPPED (for efficiency reasons).
     * This IS Assumed and will break stuff if not properly implemented!
     *
     * @returns the result after swapping (if the operators commute, this returns [[false, [commuteWith, this]]]
     */
    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate;
}
function implementsOrderableOperator(object: any): object is OrderableOperator & Operator {
    return object instanceof Operator && "orderPriorityString" in object && "commute" in object;
}
function compareOperatorOrder(a: OrderableOperator & Operator, b: OrderableOperator & Operator): number {
    const orderClasses = [
        Numerical,
        ComplexOperatorConstruct,
        Constant,
        Variable,
        FermionicAnnihilationOperator,
        FermionicCreationOperator,
        BosonicAnnihilationOperator,
        BosonicCreationOperator,
        KroneckerDelta,
        Operator,
    ];
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

    public getNumericalValue(_onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        return Number(this._value);
    }

    minusCanBePulledOut(): [boolean, Operator] {
        const value = this.getNumericalValue(false) as number;

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

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        return [[false, [commuteWith, this]]];
    }

    protected innerFormulaString(_renderChildrenHtmlIds: boolean, _renderImpliedSymbols: boolean) {
        // Bugfix: still render Infinity as \infty, even after it has been converted to Infinity by foldNumbers
        // Only visual, the _value must stay to allow calculations to be working properly
        return this._value.replace("Infinity", "\\infty");
    }
}

export class ComplexOperatorConstruct extends Operator implements MinusPulloutManagement, OrderableOperator {
    constructor(realPart: Operator, complexPart: Operator) {
        super(OperatorType.ComplexOperatorConstruct, "", "", "", [realPart, complexPart], "");
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const res = this.childrenNumericalValues(onlyReturnNumberIfMakesTermSimpler);
        const realChildValue = res[1][0];
        const complexChildValue = res[1][1];

        if (complexChildValue != null && isBasicallyZero(complexChildValue)) {
            return realChildValue;
        }

        return null;
    }

    public getRealChild() {
        return this._children[0];
    }

    public getImaginaryChild() {
        return this._children[1];
    }

    minusCanBePulledOut(): [boolean, Operator] {
        // must be BracketedSum and not the constructContainerOrFirstChild, because we need access to BracketedSum-specific behavior
        const helperSum = new BracketedSum([this._children[0], this._children[1]]);

        const temp = helperSum.minusCanBePulledOut();
        const boolRes = temp[0];
        // We are sure, this stays a BracketedSum, so this is fine even though it uses constructContainerOrFirstChild
        const newChildren = (temp[1] as BracketedSum).getChildren();

        return [boolRes, new ComplexOperatorConstruct(newChildren[0], newChildren[1])];
    }

    PullOutMinusMODIFICATION(): Operator {
        const [evenNumberMinusPulledOut, resultingOperator] = this.minusCanBePulledOut();

        if (evenNumberMinusPulledOut) {
            return resultingOperator;
        }

        return new Negation(resultingOperator);
    }

    orderPriorityString() {
        return this._children[0].getSerializedStructure(false) + this._children[1].getSerializedStructure(false);
    }

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        return [[false, [commuteWith, this]]];
    }

    public hasRealPart(): boolean {
        const res = this.childrenNumericalValues(false);
        const realChildValue = res[1][0];

        const realChild = this.getRealChild();
        return !(realChild instanceof Numerical && realChildValue != null && isBasicallyZero(realChildValue));
    }

    public hasImaginaryPart(): boolean {
        const res = this.childrenNumericalValues(false);
        const complexChildValue = res[1][1];

        const imaginaryChild = this.getImaginaryChild();
        return !(imaginaryChild instanceof Numerical && complexChildValue != null && isBasicallyZero(complexChildValue));
    }

    public imaginaryPartIsOne(): boolean {
        const res = this.childrenNumericalValues(false);
        const complexChildValue = res[1][1];

        const imaginaryChild = this.getImaginaryChild();
        return imaginaryChild instanceof Numerical && complexChildValue != null && isBasicallyOne(complexChildValue);
    }

    protected innerFormulaString(renderChildrenHtmlIds: boolean, renderImpliedSymbols: boolean) {
        const realChild = this.getRealChild();
        const imaginaryChild = this.getImaginaryChild();

        let formula = "";

        const renderReal = this.hasRealPart();
        const doNotRenderReal = !renderReal;
        const renderImaginary = this.hasImaginaryPart();
        const doNotRenderImaginary = !renderImaginary;
        const imaginaryPartIsOne = this.imaginaryPartIsOne();

        const needsPlusAndBrackets = renderReal && renderImaginary;

        // TODO Negations and negative Numerical render ugly: "complex(2 -3)"

        if (needsPlusAndBrackets) {
            formula += "\\left(";
        }

        if (renderReal) {
            formula += realChild.assembleFormulaString(renderChildrenHtmlIds, renderImpliedSymbols);
        }

        if (needsPlusAndBrackets) {
            formula += "+";
        }

        if (renderImaginary) {
            const imaginaryChildFormula = imaginaryChild.assembleFormulaString(renderChildrenHtmlIds, renderImpliedSymbols);
            if (imaginaryChild instanceof Numerical) {
                if (!imaginaryPartIsOne) {
                    formula += imaginaryChildFormula;
                }
                formula += "i";
            } else {
                formula += "i\\cdot ";
                formula += imaginaryChildFormula;
            }
        }

        if (needsPlusAndBrackets) {
            formula += "\\right)";
        }

        if (doNotRenderReal && doNotRenderImaginary) {
            formula += "0";
        }

        return formula;
    }
}

export class ComplexIConstant extends ComplexOperatorConstruct {
    constructor() {
        // the constant directly generates to superclass. Only for convenient parsing and usage
        super(new Numerical(0), new Numerical(1));
    }
}

export class BracketedSum extends Operator implements MinusPulloutManagement {
    constructor(summands: Operator[]) {
        super(OperatorType.BracketedSum, "\\left(", "+", "\\right)", summands, "");
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const res = this.childrenNumericalValues(onlyReturnNumberIfMakesTermSimpler);
        const allNotNull = res[0];
        const childrenValues = res[1];

        if (allNotNull) {
            return childrenValues.reduce((acc, current) => (acc as number) + (current as number), 0);
        } else {
            return null;
        }
    }

    // special implementation to allow for partial folding
    getCopyWithNumbersFolded(onlyFoldIfMakesTermSimpler: boolean): Operator {
        const res = this.childrenNumericalValues(onlyFoldIfMakesTermSimpler);
        const allNotNull = res[0];
        const childrenValues = res[1];

        const partialSum = childrenValues
            .filter((elem) => elem != null)
            .reduce((acc, current) => (acc as number) + (current as number), 0) as number;

        if (allNotNull) {
            return super.getCopyWithNumbersFolded(onlyFoldIfMakesTermSimpler);
        } else {
            if (isBasicallyZero(partialSum)) {
                return super.numberFoldingInternalImplementation(true, null, onlyFoldIfMakesTermSimpler);
            } else {
                return super.numberFoldingInternalImplementation(true, partialSum, onlyFoldIfMakesTermSimpler);
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

    EliminateCancelingTermsMODIFICATION(): Operator {
        let newChildren = this.getChildren();
        let changes = true;
        while (changes) {
            changes = false;

            lop: for (let i = 0; i < newChildren.length; i++) {
                const childA = newChildren[i];
                for (let j = i + 1; j < newChildren.length; j++) {
                    const childB = newChildren[j];

                    if (
                        Operator.assertOperatorsEquivalent(
                            new Negation(new Negation(childA)).PullOutMinusMODIFICATION(),
                            new Negation(childB).PullOutMinusMODIFICATION()
                        )
                    ) {
                        newChildren = newChildren.filter((_el, index) => index != i && index != j);
                        changes = true;
                        break lop;
                    }
                }
            }
        }

        return constructContainerOrFirstChild(OperatorType.BracketedSum, newChildren);
    }

    CombineComplexNumbersMODIFICATION(): Operator {
        let realParts = [] as Operator[];
        let complexParts = [] as Operator[];

        let encounteredComplex = false;
        this.getChildren().forEach((child) => {
            if (child instanceof ComplexOperatorConstruct) {
                encounteredComplex = true;
                if (child.hasRealPart()) {
                    realParts.push(child.getRealChild());
                }
                if (child.hasImaginaryPart()) {
                    complexParts.push(child.getImaginaryChild());
                }
            } else {
                realParts.push(child);
            }
        });

        if (encounteredComplex) {
            return new ComplexOperatorConstruct(
                constructContainerOrFirstChild(OperatorType.BracketedSum, realParts).getCopyWithNumbersFolded(true),
                constructContainerOrFirstChild(OperatorType.BracketedSum, complexParts).getCopyWithNumbersFolded(true)
            );
        }

        return this;
    }

    protected midDisplayFormulaIsImplied(_firstChild: Operator, secondChild: Operator): boolean {
        // 4 + -(1) ==> 4-1
        if (secondChild instanceof Negation) {
            return true;
        }

        return false;
    }
}

export class BracketedMultiplication extends Operator implements MinusPulloutManagement {
    constructor(multiplicators: Operator[]) {
        super(OperatorType.BracketedMultiplication, "\\left(", " \\cdot ", "\\right)", multiplicators, "");
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const res = this.childrenNumericalValues(onlyReturnNumberIfMakesTermSimpler);
        const allNotNull = res[0];
        const childrenValues = res[1];

        // product is 0 if one element is 0
        // TODO theoretically if one element is Infinity, this fails...
        for (let i = 0; i < childrenValues.length; i++) {
            const value = childrenValues[i];

            if (value != null) {
                if (isBasicallyZero(value)) {
                    return 0;
                }
            }
        }

        if (allNotNull) {
            return childrenValues.reduce((acc, current) => (acc as number) * (current as number), 1);
        } else {
            return null;
        }
    }

    // special implementation to allow for partial folding
    getCopyWithNumbersFolded(onlyFoldIfMakesTermSimpler: boolean): Operator {
        const res = this.childrenNumericalValues(onlyFoldIfMakesTermSimpler);
        const allNotNull = res[0];
        const childrenValues = res[1];

        const partialProduct = childrenValues
            .filter((elem) => elem != null)
            .reduce((acc, current) => (acc as number) * (current as number), 1) as number;

        if (allNotNull) {
            return super.getCopyWithNumbersFolded(onlyFoldIfMakesTermSimpler);
        } else {
            if (isBasicallyOne(partialProduct)) {
                return super.numberFoldingInternalImplementation(true, null, onlyFoldIfMakesTermSimpler);
            } else {
                return super.numberFoldingInternalImplementation(true, partialProduct, onlyFoldIfMakesTermSimpler);
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

    orderOperatorStrings(): Operator {
        let newChildren = [] as Operator[];
        let currentOperatorString = [] as (Operator & OrderableOperator)[];

        function sortAndPush() {
            if (currentOperatorString.length > 0) {
                newChildren.push(orderOperatorString(currentOperatorString));
            }
            currentOperatorString = [];
        }

        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];

            if (implementsOrderableOperator(child)) {
                currentOperatorString.push(child);
            } else {
                sortAndPush(); // handle all sortable operators up to this point
                newChildren.push(child);
            }
        }
        sortAndPush(); // handle possible rest of operators

        return constructContainerOrFirstChild(OperatorType.BracketedMultiplication, newChildren);
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
                        newChildren.push(mapReorderResultToOperator(child.commute(nextChild)));
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

    protected midDisplayFormulaIsImplied(firstChild: Operator, secondChild: Operator): boolean {
        // between fermionic/bosonic operators
        if (
            firstChild instanceof BosonicCreationOperator ||
            firstChild instanceof BosonicAnnihilationOperator ||
            firstChild instanceof FermionicCreationOperator ||
            firstChild instanceof FermionicAnnihilationOperator
        ) {
            if (
                secondChild instanceof BosonicCreationOperator ||
                secondChild instanceof BosonicAnnihilationOperator ||
                secondChild instanceof FermionicCreationOperator ||
                secondChild instanceof FermionicAnnihilationOperator
            ) {
                return true;
            }
        }
        // next to bra/ket
        if (
            firstChild instanceof Bra ||
            firstChild instanceof Ket ||
            firstChild instanceof Braket ||
            firstChild instanceof Bracket ||
            secondChild instanceof Bra ||
            secondChild instanceof Ket ||
            secondChild instanceof Braket ||
            secondChild instanceof Bracket
        ) {
            return true;
        }

        return false;
    }
}

function orderOperatorString(inString: (Operator & OrderableOperator)[]): Operator {
    if (inString.length == 0) {
        throw Error("Cannot reorder empty String of arguments");
    }

    if (inString.length == 1) {
        return inString[0];
    }

    let orderedResult = orderOperatorStringRecursive([[false, inString]]);

    // sort the summands here we do not need to consider commutation relations)
    orderedResult = orderedResult.sort((a, b) => {
        if (a[1].length != b[1].length) {
            return a[1].length - b[1].length;
        }

        if (a[0] != b[0]) {
            return a[0] ? 1 : -1;
        }

        return a[1]
            .map((a) => a.orderPriorityString())
            .join("")
            .localeCompare(b[1].map((b) => b.orderPriorityString()).join(""));
    });

    return mapReorderResultToOperator(orderedResult);
}

/**
 * @returns Operator: single Operator or multiple wrapped in a BracketedMultiplication
 * (You can use `constructContainerOrFirstChild` to integrate directly into another multiplication)
 */
function mapReorderResultToOperator(reorderResult: ReorderResultIntermediate): Operator {
    let aggregatedMultiplications = [] as Operator[];
    reorderResult.forEach(([prodMinus, swappedChildren]) => {
        let inner = constructContainerOrFirstChild(OperatorType.BracketedMultiplication, swappedChildren);
        inner = prodMinus ? new Negation(inner) : inner; // apply needed minus
        aggregatedMultiplications.push(inner);
    });

    return constructContainerOrFirstChild(OperatorType.BracketedSum, aggregatedMultiplications);
}

/**
 * This implements the Odd-even-sort https://en.wikipedia.org/wiki/Odd%E2%80%93even_sort
 *
 * This is a O(n^2) algorithm, that allows for the restriction that only adjacent elements can be compared/swapped
 *
 * If the swap-operation returns additional sum-elements, the rest of the elements are appended left and right and sorted recursively
 * TODO This can be made more efficient. Because if we know that the extra elements (currently only KroneckerDelta) always commute, we can save on sorting multiple times, however this is too hard for my brain currently
 *
 * @param inString -> at least two elements
 *
 * @returns Operator: single Operator or multiple wrapped in a BracketedMultiplication
 * (You can use `constructContainerOrFirstChild` to integrate directly into another multiplication)
 */
function orderOperatorStringRecursive(inString: ReorderResultIntermediate): ReorderResultIntermediate {
    let outerAllocator = [] as ReorderResultIntermediate;

    // all outer brackets are terms of the final outermost sum. They always all have to be executed
    for (let i = 0; i < inString.length; i++) {
        const currentString = inString[i];
        let elements = currentString[1];
        const n = elements.length;
        let minus = currentString[0];

        let sorted = false;
        function compareAndSwap(i: number) {
            if (compareOperatorOrder(elements[i], elements[i + 1]) > 0) {
                const commutedResult = elements[i].commute(elements[i + 1]);

                // ! Deal with potential additional elements
                const emergingElements = commutedResult.slice(1);
                const paddedEmergentElements = emergingElements.map(
                    (emergingElementCollection): [boolean, (Operator & OrderableOperator)[]] => {
                        return [
                            emergingElementCollection[0] ? !minus : minus,
                            [...elements.slice(0, i), ...emergingElementCollection[1], ...elements.slice(i + 2)],
                        ];
                    }
                );
                // this is a very scary recursive call... But it SHOULD terminate... I think.
                outerAllocator.push(...orderOperatorStringRecursive(paddedEmergentElements));

                // ! Deal with the first element, this one must contain the swapped elements as per convention
                const first = commutedResult[0];
                const minusFromNew = first[0];
                const swappedElements = first[1];

                // generate minus state for new element
                minus = minusFromNew ? !minus : minus;

                // assumes a swap only generates exactly two elements. If this changes a overhaul is needed!
                elements[i] = swappedElements[0];
                elements[i + 1] = swappedElements[1];

                // modification means list not sorted
                sorted = false;
            }
        }
        while (!sorted) {
            sorted = true;
            // Odd phase (comparing and swapping elements starting at odd indices)
            for (let i = 1; i < n - 1; i += 2) {
                compareAndSwap(i);
            }

            // Even phase (comparing and swapping elements starting at even indices)
            for (let i = 0; i < n - 1; i += 2) {
                compareAndSwap(i);
            }
        }
        outerAllocator.push([minus, elements]);
    }

    return outerAllocator;
}

export class Fraction extends Operator implements MinusPulloutManagement {
    constructor(dividend: Operator, divisor: Operator) {
        super(OperatorType.Fraction, "\\frac{", "}{", "}", [dividend, divisor], "");
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const res = this.childrenNumericalValues(onlyReturnNumberIfMakesTermSimpler);
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
        useVariablesStore().makeSureVariableAvailable(name);

        super(OperatorType.Variable, "{", "", "}", [], name);
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const stored = useVariablesStore().getVariableContent(this._value);
        if (stored && stored != null) {
            return stored.getNumericalValue(onlyReturnNumberIfMakesTermSimpler);
        }

        return null;
    }

    public setOperatorStoredHere(op: Operator | null) {
        useVariablesStore().setOperatorForVariable(this._value, op);
    }

    UnpackMODIFICATION(): Operator {
        const stored = useVariablesStore().getVariableContent(this._value);

        if (stored && stored != null) {
            return stored;
        }

        return this;
    }

    orderPriorityString() {
        return this._value;
    }

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        return [[false, [commuteWith, this]]];
    }
}

export class RawLatex extends Operator {
    constructor(formula: string) {
        super(OperatorType.RawLatex, "{", "", "}", [], formula);
    }
}

export class Negation extends Operator implements MinusPulloutManagement {
    constructor(content: Operator) {
        super(OperatorType.Negation, "-", "", "", [content], "");
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const res = this.childrenNumericalValues(onlyReturnNumberIfMakesTermSimpler);
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

    getChild() {
        return this._children[0];
    }
}

abstract class Constant extends Operator implements OrderableOperator {
    constructor(opType: OperatorType, latex: string) {
        super(opType, latex, "", "", [], "");
    }

    orderPriorityString() {
        return this._startDisplayFormula;
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        if (onlyReturnNumberIfMakesTermSimpler) {
            return null;
        } else {
            return this.getConstantValue();
        }
    }

    public abstract getConstantValue(): number;

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        return [[false, [commuteWith, this]]];
    }
}

export class PiConstant extends Constant {
    constructor() {
        super(OperatorType.PiConstant, "\\pi");
    }

    public getConstantValue(): number {
        return Math.PI;
    }
}

export class EConstant extends Constant {
    constructor() {
        super(OperatorType.EConstant, "e");
    }

    public getConstantValue(): number {
        return Math.E;
    }
}

export class Sqrt2Constant extends Constant {
    constructor() {
        super(OperatorType.Sqrt2Constant, "\\sqrt{2}");
    }

    public getConstantValue(): number {
        return Math.sqrt(2);
    }
}

export class InfinityConstant extends Constant {
    constructor() {
        super(OperatorType.InfinityConstant, "\\infty");
    }

    public getConstantValue(): number {
        return Infinity;
    }
}

export class Exp extends Operator {
    constructor(exponent: Operator) {
        super(OperatorType.Exp, "\\mathrm{e}^{", "", "}", [exponent], "");
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const res = this.childrenNumericalValues(onlyReturnNumberIfMakesTermSimpler);
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

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const res = this.childrenNumericalValues(onlyReturnNumberIfMakesTermSimpler);
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
            const [allNotNull, _] = new Braket(braChild, ketChild).childrenNumericalValues(false);

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

abstract class QMOperatorWithOneArgument extends Operator implements OrderableOperator {
    constructor(opType: OperatorType, latex: string, argument: Operator) {
        super(opType, latex + "_{", "", "}", [argument], "");
    }

    orderPriorityString() {
        return this.getChild().getSerializedStructure(false);
    }

    getChild() {
        return this._children[0];
    }

    abstract commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate;
}

export class FermionicCreationOperator extends QMOperatorWithOneArgument {
    constructor(index: Operator) {
        super(OperatorType.FermionicCreationOperator, "\\mathrm{c}^\\dagger", index);
    }

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        if (commuteWith instanceof FermionicAnnihilationOperator) {
            return [
                [true, [commuteWith, this]],
                [false, [new KroneckerDelta(this.getChild(), commuteWith.getChild())]],
            ];
        }
        if (commuteWith instanceof FermionicCreationOperator) {
            return [[true, [commuteWith, this]]];
        }

        return [[false, [commuteWith, this]]];
    }
}

export class FermionicAnnihilationOperator extends QMOperatorWithOneArgument {
    constructor(index: Operator) {
        super(OperatorType.FermionicAnnihilationOperator, "\\mathrm{c}", index);
    }

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        if (commuteWith instanceof FermionicCreationOperator) {
            return [
                [true, [commuteWith, this]],
                [false, [new KroneckerDelta(this.getChild(), commuteWith.getChild())]],
            ];
        }
        if (commuteWith instanceof FermionicAnnihilationOperator) {
            return [[true, [commuteWith, this]]];
        }

        return [[false, [commuteWith, this]]];
    }
}

export class BosonicCreationOperator extends QMOperatorWithOneArgument {
    constructor(index: Operator) {
        super(OperatorType.BosonicCreationOperator, "\\mathrm{b}^\\dagger", index);
    }

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        if (commuteWith instanceof BosonicAnnihilationOperator) {
            return [
                [false, [commuteWith, this]],
                [false, [new KroneckerDelta(this.getChild(), commuteWith.getChild())]],
            ];
        }

        return [[false, [commuteWith, this]]];
    }
}

export class BosonicAnnihilationOperator extends QMOperatorWithOneArgument {
    constructor(index: Operator) {
        super(OperatorType.BosonicAnnihilationOperator, "\\mathrm{b}", index);
    }

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        if (commuteWith instanceof BosonicCreationOperator) {
            return [
                [false, [commuteWith, this]],
                [false, [new KroneckerDelta(this.getChild(), commuteWith.getChild())]],
            ];
        }

        return [[false, [commuteWith, this]]];
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

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const res = this.childrenNumericalValues(onlyReturnNumberIfMakesTermSimpler);
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

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const res = this.childrenNumericalValues(onlyReturnNumberIfMakesTermSimpler);
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

export class KroneckerDelta extends Operator implements OrderableOperator {
    constructor(firstArg: Operator, secondArg: Operator) {
        super(OperatorType.KroneckerDelta, "\\delta_{", ",", "}", [firstArg, secondArg], "");
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const res = this.childrenNumericalValues(onlyReturnNumberIfMakesTermSimpler);
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

    orderPriorityString() {
        return this._children[0].getSerializedStructure(false) + this._children[1].getSerializedStructure(false);
    }

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        return [[false, [commuteWith, this]]];
    }
}

function isBasicallyZero(num: number): boolean {
    const basicallyZero = num < 1e-6 && num > -1e-6;
    return basicallyZero;
}

function isBasicallyOne(num: number): boolean {
    const basicallyOne = num - 1 < 1e-6 && num - 1 > -1e-6;
    return basicallyOne;
}
