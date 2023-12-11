import { Operator, OperatorType, useVariablesStore, OperatorConfig, useMacrosStore, ExportOperatorContent } from "./exporter";

export function operatorConstructorSwitch(
    config: OperatorConfig,
    type: OperatorType,
    value: string,
    childrenReconstructed: Operator[]
): Operator {
    switch (type) {
        case OperatorType.BracketedSum:
        case OperatorType.BracketedMultiplication:
        case OperatorType.StructuralContainer:
            return constructContainerOrFirstChild(config, type, childrenReconstructed);
        case OperatorType.BigSum:
            return new BigSum(config, childrenReconstructed[0], childrenReconstructed[1], childrenReconstructed[2]);
        case OperatorType.Fraction:
            return new Fraction(config, childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.Numerical:
            return new Numerical(config, Number(value));
        case OperatorType.ComplexOperatorConstruct:
            return new ComplexOperatorConstruct(config, childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.Variable:
            return new Variable(config, value);
        case OperatorType.BigInt:
            return new BigInt(
                config,
                childrenReconstructed[0],
                childrenReconstructed[1],
                childrenReconstructed[2],
                childrenReconstructed[3]
            );
        case OperatorType.RawLatex:
            return new RawLatex(config, value);
        case OperatorType.Negation:
            return new Negation(config, childrenReconstructed[0]);
        case OperatorType.PiConstant:
            return new PiConstant(config);
        case OperatorType.EConstant:
            return new EConstant(config);
        case OperatorType.Sqrt2Constant:
            return new Sqrt2Constant(config);
        case OperatorType.ComplexIConstant:
            return new ComplexIConstant(config);
        case OperatorType.Phi:
            return new Phi(config);
        case OperatorType.Psi:
            return new Psi(config);
        case OperatorType.Up:
            return new Up(config);
        case OperatorType.Down:
            return new Down(config);
        case OperatorType.InfinityConstant:
            return new InfinityConstant(config);
        case OperatorType.Exp:
            return new Exp(config, childrenReconstructed[0]);
        case OperatorType.Power:
            return new Power(config, childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.Bra:
            return new Bra(config, childrenReconstructed[0]);
        case OperatorType.Ket:
            return new Ket(config, childrenReconstructed[0]);
        case OperatorType.Braket:
            return new Braket(config, childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.Bracket:
            return new Bracket(config, childrenReconstructed[0], childrenReconstructed[1], childrenReconstructed[2]);
        case OperatorType.FermionicCreationOperator:
            return new FermionicCreationOperator(config, childrenReconstructed[0]);
        case OperatorType.FermionicAnnihilationOperator:
            return new FermionicAnnihilationOperator(config, childrenReconstructed[0]);
        case OperatorType.BosonicCreationOperator:
            return new BosonicCreationOperator(config, childrenReconstructed[0]);
        case OperatorType.BosonicAnnihilationOperator:
            return new BosonicAnnihilationOperator(config, childrenReconstructed[0]);
        case OperatorType.FunctionMathMode:
            return new FunctionMathMode(config, childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.FunctionMathRm:
            return new FunctionMathRm(config, childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.Sin:
            return new Sin(config, childrenReconstructed[0]);
        case OperatorType.Cos:
            return new Cos(config, childrenReconstructed[0]);
        case OperatorType.EmptyArgument:
            return new EmptyArgument(config);
        case OperatorType.Equals:
            return new Equals(config);
        case OperatorType.NotEquals:
            return new NotEquals(config);
        case OperatorType.Iff:
            return new Iff(config);
        case OperatorType.Less:
            return new Less(config);
        case OperatorType.Greater:
            return new Greater(config);
        case OperatorType.LessEquals:
            return new LessEquals(config);
        case OperatorType.GreaterEquals:
            return new GreaterEquals(config);
        case OperatorType.Faculty:
            return new Faculty(config, childrenReconstructed[0]);
        case OperatorType.Percent:
            return new Percent(config, childrenReconstructed[0]);
        case OperatorType.KroneckerDelta:
            return new KroneckerDelta(config, childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.Commutator:
            return new Commutator(config, childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.AntiCommutator:
            return new AntiCommutator(config, childrenReconstructed[0], childrenReconstructed[1]);
        case OperatorType.DefinedMacro:
            return new DefinedMacro(config, value, childrenReconstructed);
        default:
            throw Error(`type ${type} could not be parsed to an implemented Operator`);
    }
}

export function constructContainerOrFirstChild(
    config: OperatorConfig,
    containerType: OperatorType.BracketedMultiplication | OperatorType.BracketedSum | OperatorType.StructuralContainer,
    children: Operator[],
    removeBracketsAllowedByAssociativity: boolean = true
): Operator {
    if (children.length == 0) {
        // canonical replacements for when initialized without inputChildren
        switch (containerType) {
            case OperatorType.BracketedMultiplication:
                return new Numerical(config, 1);
            case OperatorType.BracketedSum:
                return new Numerical(config, 0);
            case OperatorType.StructuralContainer:
                return new EmptyArgument(config);
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
                return new BracketedMultiplication(config, newChildren);
            case OperatorType.BracketedSum:
                if (removeBracketsAllowedByAssociativity) {
                    newChildren = children.flatMap((child) => {
                        if (child instanceof BracketedSum) {
                            return child.getChildren();
                        } else if (child instanceof Negation && child.getChild() instanceof BracketedSum) {
                            // for negated sum directly spread negated arguments
                            const negatedSum = child.getChild() as BracketedSum;
                            return negatedSum.getChildren().map((sumChild) => {
                                return new Negation(config, sumChild);
                            });
                        } else {
                            return child;
                        }
                    });
                }
                return new BracketedSum(config, newChildren);
            case OperatorType.StructuralContainer:
                return new StructuralContainer(config, newChildren);
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

export type PeerAlterationResult = { uuid: string; replacement: Operator }[];

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
    constructor(config: OperatorConfig, value: number) {
        super(config, OperatorType.Numerical, "", "", "", [], String(parseFloat(value.toFixed(4))));
    }

    public getNumericalValue(_onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        return Number(this._value);
    }

    minusCanBePulledOut(): [boolean, Operator] {
        const value = this.getNumericalValue(false) as number;

        if (value < 0) {
            return [false, new Numerical(this.getOwnConfig(), -1 * value)];
        }

        return [true, this];
    }

    PullOutMinusMODIFICATION(): Operator {
        const [evenNumberMinusPulledOut, resultingOperator] = this.minusCanBePulledOut();

        if (evenNumberMinusPulledOut) {
            return resultingOperator;
        }

        return new Negation(this.getOwnConfig(), resultingOperator);
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
    constructor(config: OperatorConfig, realPart: Operator, complexPart: Operator) {
        super(config, OperatorType.ComplexOperatorConstruct, "", "", "", [realPart, complexPart], "");
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
        const [allChildrenPulledOutOddNumber, newOperatorAfterNotPullingOut, newOperatorAfterPullingOut] =
            complexOperatorLikePullOutMinusHandler(this.getOwnConfig(), this.getRealChild(), this.getImaginaryChild());

        if (allChildrenPulledOutOddNumber) {
            return [false, newOperatorAfterPullingOut];
        }
        return [true, newOperatorAfterNotPullingOut];
    }

    PullOutMinusMODIFICATION(): Operator {
        const [_allChildrenPulledOutOddNumber, _newOperatorAfterNotPullingOut, newOperatorAfterPullingOut] =
            complexOperatorLikePullOutMinusHandler(this.getOwnConfig(), this.getRealChild(), this.getImaginaryChild());

        return new Negation(this.getOwnConfig(), newOperatorAfterPullingOut);
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

/**
 * Supports multiplication for exactly two operators.
 * Of whom one or both may be complex
 */
function multiplyOperatorsHandleComplexOperatorConstruct(
    config: OperatorConfig,
    firstOperator: Operator,
    secondOperator: Operator
): Operator {
    let realElementsNormal = [new Numerical(config, 0)] as Operator[];
    let realElementsISquared = [new Numerical(config, 0)] as Operator[];
    let complexElementsRealTimesComplex = [new Numerical(config, 0)] as Operator[];
    let complexElementsComplexTimesReal = [new Numerical(config, 0)] as Operator[];

    if (firstOperator instanceof ComplexOperatorConstruct) {
        if (secondOperator instanceof ComplexOperatorConstruct) {
            // complex times complex
            realElementsNormal = [firstOperator.getRealChild(), secondOperator.getRealChild()];
            realElementsISquared = [firstOperator.getImaginaryChild(), secondOperator.getImaginaryChild()];
            complexElementsRealTimesComplex = [firstOperator.getRealChild(), secondOperator.getImaginaryChild()];
            complexElementsComplexTimesReal = [firstOperator.getImaginaryChild(), secondOperator.getRealChild()];
        } else {
            // complex times not complex
            realElementsNormal = [firstOperator.getRealChild(), secondOperator];
            complexElementsComplexTimesReal = [firstOperator.getImaginaryChild(), secondOperator];
        }
    } else {
        if (secondOperator instanceof ComplexOperatorConstruct) {
            // not complex times complex
            realElementsNormal = [firstOperator, secondOperator.getRealChild()];
            complexElementsComplexTimesReal = [firstOperator, secondOperator.getImaginaryChild()];
        } else {
            // not complex times not complex
            realElementsNormal = [firstOperator, secondOperator];
        }
    }

    // Elements that are generated from constructContainerOrFirstChild can't be a sum, so no trouble of pulling of unwanted (create mor minus than intended by mistake)
    // they must contain 0 or more than two elements (two for exactly two and more if one or both got spread)
    // But they can NOT contain one element. So we are save to execute PullOutMinusMODIFICATION
    // !! PART A
    let realPartMulNormal = constructContainerOrFirstChild(config, OperatorType.BracketedMultiplication, realElementsNormal);
    if (implementsMinusPulloutManagement(realPartMulNormal)) {
        realPartMulNormal = realPartMulNormal.PullOutMinusMODIFICATION();
    }
    // !! PART B
    let realPartISquared = constructContainerOrFirstChild(config, OperatorType.BracketedMultiplication, realElementsISquared);
    // make sure to add the minus from i*i in
    realPartISquared = new Negation(config, realPartISquared).PullOutMinusMODIFICATION();
    // !! PART C
    let complexPartRealTimesComplex = constructContainerOrFirstChild(
        config,
        OperatorType.BracketedMultiplication,
        complexElementsRealTimesComplex
    );
    if (implementsMinusPulloutManagement(complexPartRealTimesComplex)) {
        complexPartRealTimesComplex = complexPartRealTimesComplex.PullOutMinusMODIFICATION();
    }
    // !! PART D
    let complexPartComplexTimesReal = constructContainerOrFirstChild(
        config,
        OperatorType.BracketedMultiplication,
        complexElementsComplexTimesReal
    );
    if (implementsMinusPulloutManagement(complexPartComplexTimesReal)) {
        complexPartComplexTimesReal = complexPartComplexTimesReal.PullOutMinusMODIFICATION();
    }

    // all non touched parts will get filtered, because initialization with [Numerical(0)]
    const filter = (o: Operator) => {
        return !isBasicallyZero(o.getNumericalValue(false) ?? 4);
    };

    const realSum = constructContainerOrFirstChild(
        config,
        OperatorType.BracketedSum,
        [realPartMulNormal, realPartISquared].filter(filter)
    );
    const imaginarySum = constructContainerOrFirstChild(
        config,
        OperatorType.BracketedSum,
        [complexPartRealTimesComplex, complexPartComplexTimesReal].filter(filter)
    );

    return new ComplexOperatorConstruct(config, realSum, imaginarySum).getCopyWithGottenRidOfUnnecessaryTerms();
}

export class ComplexIConstant extends ComplexOperatorConstruct {
    constructor(config: OperatorConfig) {
        // the constant directly generates to superclass. Only for convenient parsing and usage
        super(config, new Numerical(config, 0), new Numerical(config, 1));
    }
}

export class BracketedSum extends Operator implements MinusPulloutManagement {
    constructor(config: OperatorConfig, summands: Operator[]) {
        super(config, OperatorType.BracketedSum, "\\left(", "+", "\\right)", summands, "");
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

    // TODO this could also deal with the special case, that it may be interesting to rearrange elements in the sum (2-3) -> -(3-2)
    minusCanBePulledOut(): [boolean, Operator] {
        const [allChildrenPulledOutOddNumber, newOperatorAfterNotPullingOut, newOperatorAfterPullingOut] =
            sumLikePullOutMinusHandler(this.getOwnConfig(), this.getChildren());

        if (allChildrenPulledOutOddNumber) {
            return [false, newOperatorAfterPullingOut];
        }
        return [true, newOperatorAfterNotPullingOut];
    }

    PullOutMinusMODIFICATION(): Operator {
        const [_allChildrenPulledOutOddNumber, _newOperatorAfterNotPullingOut, newOperatorAfterPullingOut] =
            sumLikePullOutMinusHandler(this.getOwnConfig(), this.getChildren());

        return new Negation(this.getOwnConfig(), newOperatorAfterPullingOut);
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

        return constructContainerOrFirstChild(this.getOwnConfig(), OperatorType.BracketedSum, newChildren);
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
                            new Negation(
                                this.getOwnConfig(),
                                new Negation(this.getOwnConfig(), childA)
                            ).PullOutMinusMODIFICATION(),
                            new Negation(this.getOwnConfig(), childB).PullOutMinusMODIFICATION()
                        )
                    ) {
                        newChildren = newChildren.filter((_el, index) => index != i && index != j);
                        changes = true;
                        break lop;
                    }
                }
            }
        }

        return constructContainerOrFirstChild(this.getOwnConfig(), OperatorType.BracketedSum, newChildren);
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
                this.getOwnConfig(),
                constructContainerOrFirstChild(
                    this.getOwnConfig(),
                    OperatorType.BracketedSum,
                    realParts
                ).getCopyWithNumbersFolded(true),
                constructContainerOrFirstChild(
                    this.getOwnConfig(),
                    OperatorType.BracketedSum,
                    complexParts
                ).getCopyWithNumbersFolded(true)
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

    OrderSummandsMODIFICATION(): Operator {
        let data = this.getChildren().map((a): ExportOperatorContent => {
            return a.getSerializedStructureRecursive(false);
        });

        let sortedChildren = data
            .sort((a, b) => sumSortFunction(a, b, true))
            .map((a): Operator => {
                return Operator.generateStructureRecursive(this.getOwnConfig(), a, false);
            });

        return constructContainerOrFirstChild(this.getOwnConfig(), OperatorType.BracketedSum, sortedChildren, false);
    }

    FactorOutLeftMODIFICATION(): Operator {
        let children = this.getChildren();
        let products = [] as { minus: boolean; multiplicationChildren: Operator[] }[];

        // break summands into products (with or without negation) and single elements (equal to multiplication with one element)
        children.forEach((child) => {
            if (child instanceof Negation) {
                const childOfNegation = child.getChild();
                if (childOfNegation instanceof BracketedMultiplication) {
                    products.push({
                        minus: true,
                        multiplicationChildren: childOfNegation.getChildren(),
                    });
                } else {
                    products.push({
                        minus: true,
                        multiplicationChildren: [childOfNegation],
                    });
                }
            } else {
                if (child instanceof BracketedMultiplication) {
                    products.push({
                        minus: false,
                        multiplicationChildren: child.getChildren(),
                    });
                } else {
                    products.push({
                        minus: false,
                        multiplicationChildren: [child],
                    });
                }
            }
        });

        // find most common pre-factor
        let prefactors = [] as { factor: Operator; count: number }[];
        products.forEach((product) => {
            const firstElem = product.multiplicationChildren[0];
            let found = false;
            for (const prefactor of prefactors) {
                if (Operator.assertOperatorsEquivalent(firstElem, prefactor.factor)) {
                    prefactor.count += 1;
                    found = true;
                    break;
                }
            }
            if (!found) {
                prefactors.push({
                    count: 1,
                    factor: firstElem,
                });
            }
        });
        let largestCount = 0;
        let largestCountPrefactor = null as Operator | null;
        prefactors.forEach((prefactorObject) => {
            if (largestCount < prefactorObject.count) {
                largestCountPrefactor = prefactorObject.factor;
                largestCount = prefactorObject.count;
            }
        });
        if (largestCount <= 1 || largestCountPrefactor == null) {
            return this; // nothing to factor out
        }
        const commonPrefactor = largestCountPrefactor as Operator; // typescript stuff

        // map back into a product
        const mapIntoOperatorConsiderNegation = (
            productObject: {
                minus: boolean;
                multiplicationChildren: Operator[];
            },
            omitFirst: boolean
        ): Operator => {
            let innerChildren = productObject.multiplicationChildren;
            if (omitFirst) {
                innerChildren = innerChildren.slice(1); // omit the commonPrefactor
            }
            const assembledMultiplication = constructContainerOrFirstChild(
                this.getOwnConfig(),
                OperatorType.BracketedMultiplication,
                innerChildren,
                false
            );
            if (productObject.minus) {
                return new Negation(this.getOwnConfig(), assembledMultiplication);
            } else {
                return assembledMultiplication;
            }
        };

        const multiplicationsThatContainPrefactorWithPrefactorStripped = products // or negations thereof
            .filter((productObject) => {
                // filter to the products that start with commonPrefactor
                return Operator.assertOperatorsEquivalent(commonPrefactor, productObject.multiplicationChildren[0]);
            })
            .map((a) => mapIntoOperatorConsiderNegation(a, true));
        const multiplicationsThatDoNotContainPrefactor = products // or negations thereof
            .filter((productObject) => {
                // filter to the products that DON'T start with commonPrefactor
                return !Operator.assertOperatorsEquivalent(commonPrefactor, productObject.multiplicationChildren[0]);
            })
            .map((a) => mapIntoOperatorConsiderNegation(a, false));
        const withFactoredOut = constructContainerOrFirstChild(
            this.getOwnConfig(),
            OperatorType.BracketedMultiplication,
            [
                largestCountPrefactor, // first prefactor, then sum of the products
                constructContainerOrFirstChild(
                    this.getOwnConfig(),
                    OperatorType.BracketedSum,
                    multiplicationsThatContainPrefactorWithPrefactorStripped,
                    false
                ),
            ],
            false
        );

        return constructContainerOrFirstChild(
            this.getOwnConfig(),
            OperatorType.BracketedSum,
            [withFactoredOut, ...multiplicationsThatDoNotContainPrefactor],
            false
        );
    }
}

function sumSortFunction(a: ExportOperatorContent, b: ExportOperatorContent, topLevel: boolean): number {
    let aChildren = a.children;
    let bChildren = b.children;
    let aType = a.type;
    let bType = b.type;
    let aValue = a.value;
    let bValue = b.value;
    let aWasMinus = false;
    let bWasMinus = false;
    // if executed directly on a sum, we expect plus and minus terms to get ordered with the same priority as the "+" before the minus is omitted visually
    if (topLevel) {
        if (a.type == OperatorType.Negation) {
            aWasMinus = true;
            aType = a.children[0].type;
            aValue = a.children[0].value;
            aChildren = a.children[0].children;
        }
        if (b.type == OperatorType.Negation) {
            bWasMinus = true;
            bType = b.children[0].type;
            bValue = b.children[0].value;
            bChildren = b.children[0].children;
        }
    }
    if (aType != bType) {
        return aType.localeCompare(bType);
    }
    if (aValue != bValue) {
        return aValue.localeCompare(bValue);
    }
    const numChildA = aChildren.length;
    const numChildB = bChildren.length;
    for (let i = 0; i < Math.min(numChildA, numChildB); i++) {
        const childA = aChildren[i];
        const childB = bChildren[i];
        const childCompare = sumSortFunction(childA, childB, false);
        if (childCompare == 0) {
            continue;
        } else {
            return childCompare;
        }
    }
    // all children were the same until one ran out
    const number = numChildA - numChildB;
    if (number != 0) {
        return number;
    } else {
        return (aWasMinus ? 1 : 0) - (bWasMinus ? 1 : 0);
    }
}

/**
 * @inheritdoc generalPullOutMinusHandler
 */
function sumLikePullOutMinusHandler(config: OperatorConfig, children: Operator[]): [boolean, Operator, Operator] {
    const [allChildrenPulledOutOddNumber, [newChildrenNotPullingOut], [newChildrenPullingOut]] = generalPullOutMinusHandler(
        config,
        [children]
    );

    return [
        allChildrenPulledOutOddNumber,
        constructContainerOrFirstChild(config, OperatorType.BracketedSum, newChildrenNotPullingOut),
        constructContainerOrFirstChild(config, OperatorType.BracketedSum, newChildrenPullingOut),
    ];
}

/**
 * @inheritdoc generalPullOutMinusHandler
 */
function complexOperatorLikePullOutMinusHandler(
    config: OperatorConfig,
    realChild: Operator,
    imaginaryChild: Operator
): [boolean, Operator, Operator] {
    const [
        allChildrenPulledOutOddNumber,
        [newChildrenRealNotPullingOut, newChildrenImaginaryNotPullingOut],
        [newChildrenRealPullingOut, newChildrenImaginaryPullingOut],
    ] = generalPullOutMinusHandler(config, [[realChild], [imaginaryChild]]);

    return [
        allChildrenPulledOutOddNumber,
        new ComplexOperatorConstruct(
            config,
            constructContainerOrFirstChild(config, OperatorType.BracketedSum, newChildrenRealNotPullingOut),
            constructContainerOrFirstChild(config, OperatorType.BracketedSum, newChildrenImaginaryNotPullingOut)
        ),
        new ComplexOperatorConstruct(
            config,
            constructContainerOrFirstChild(config, OperatorType.BracketedSum, newChildrenRealPullingOut),
            constructContainerOrFirstChild(config, OperatorType.BracketedSum, newChildrenImaginaryPullingOut)
        ),
    ];
}

/**
 * Calculate the two cases, where a total minus was pulled out and where it wasn't
 * @returns [allChildrenPulledOutOddNumber: boolean, newOperatorAfterNotPullingOut: Operator, newOperatorAfterPullingOut: Operator]
 */
function generalPullOutMinusHandler(
    config: OperatorConfig,
    childrenArrayArray: Operator[][]
): [boolean, Operator[][], Operator[][]] {
    let allChildrenPulledOutOddNumber = true;
    let newChildrenNotPullingOut = [] as Operator[][];
    let newChildrenPullingOut = [] as Operator[][];

    childrenArrayArray.forEach((childArray) => {
        let newChildrenNotPullingOutInner = [] as Operator[];
        let newChildrenPullingOutInner = [] as Operator[];

        childArray.forEach((child) => {
            if (implementsMinusPulloutManagement(child)) {
                const [childEvenNumberMinusPulledOut, childResultingOperator] = child.minusCanBePulledOut();

                if (childEvenNumberMinusPulledOut) {
                    allChildrenPulledOutOddNumber = false;
                }

                if (childEvenNumberMinusPulledOut) {
                    newChildrenNotPullingOutInner.push(childResultingOperator);
                    newChildrenPullingOutInner.push(new Negation(config, childResultingOperator));
                } else {
                    newChildrenNotPullingOutInner.push(new Negation(config, childResultingOperator));
                    newChildrenPullingOutInner.push(childResultingOperator);
                }
            } else {
                allChildrenPulledOutOddNumber = false;

                newChildrenNotPullingOutInner.push(child);
                newChildrenPullingOutInner.push(new Negation(config, child));
            }
        });

        newChildrenNotPullingOut.push(newChildrenNotPullingOutInner);
        newChildrenPullingOut.push(newChildrenPullingOutInner);
    });

    return [allChildrenPulledOutOddNumber, newChildrenNotPullingOut, newChildrenPullingOut];
}

export class BracketedMultiplication extends Operator implements MinusPulloutManagement {
    constructor(config: OperatorConfig, multiplicators: Operator[]) {
        super(config, OperatorType.BracketedMultiplication, "\\left(", " \\cdot ", "\\right)", multiplicators, "");
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const res = this.childrenNumericalValues(onlyReturnNumberIfMakesTermSimpler);
        const allNotNull = res[0];
        const childrenValues = res[1];

        // product is 0 if one element is 0
        // TODO theoretically if one element is Infinity, this is not mathematically correct...
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

    // this input previously completely broke everything... (asd+asd+asd+asd+asd+asd)*(asd+asd+asd+asd+asd+asd)*(asd+asd+asd+asd+asd+asd)*(asd+asd+asd+asd+asd+asd)*(asd+asd+asd+asd+asd+asd)*(asd+asd+asd+asd+asd+asd)*(asd+asd+asd+asd+asd+asd)*(asd+asd+asd+asd+asd+asd) -> introduced distribute upper term limit
    DistributeMODIFICATION(): Operator {
        let children = this.getChildren();

        if (children.length >= 2) {
            let numberOfSums = 0;
            let sumElementCount = [] as number[];
            const childSumInstances = children
                // can only distribute into sum. Therefore wrap singular elements into a single sum for ease of use
                .map((child) => {
                    if (child instanceof BracketedSum) {
                        numberOfSums += 1;
                        sumElementCount.push(child.getChildren().length);
                        return child;
                    } else {
                        // because do not use `constructContainerOrFirstChild` here, because we SPECIFICALLY WANT a sum with only one element.
                        return new BracketedSum(this.getOwnConfig(), [child]);
                    }
                })
                .filter((child) => child instanceof BracketedSum) as BracketedSum[];

            if (numberOfSums > 0 && childSumInstances.length === children.length) {
                const willResultInNrTerms = sumElementCount.reduce((a, b) => a * b, 1);
                if (willResultInNrTerms > 400) {
                    console.warn(`Distribute Operation not performed, because this would result in ${willResultInNrTerms} terms`);
                    return this;
                }

                const newSummands = [] as BracketedMultiplication[];

                // do this recursively in order to allow for as many sum-terms in the product as you want
                const generateCombinations = (currentIndex: number, currentProduct: Operator[]) => {
                    if (currentIndex === childSumInstances.length) {
                        // depth has reached number of terms in original multiplication -> one element from each original sum
                        // because of typing do not use `constructContainerOrFirstChild` here. We know there are enough elements because of assertion
                        newSummands.push(new BracketedMultiplication(this.getOwnConfig(), currentProduct));
                    } else {
                        const currentSum = childSumInstances[currentIndex];
                        currentSum.getChildren().forEach((child) => {
                            generateCombinations(currentIndex + 1, currentProduct.concat(child)); // passes array by VALUE!!
                        });
                    }
                };
                // generate the cartesian product of the sum-terms in the product
                generateCombinations(0, []);

                // because of typing do not use `constructContainerOrFirstChild` here. We know there are enough elements because of assertion
                return new BracketedSum(this.getOwnConfig(), newSummands);
            }
        }

        return this;
    }

    MultiplyComplexNumbersMODIFICATION(): Operator {
        let children = this.getChildren();

        if (children.length >= 2) {
            let running = children[0];

            for (let i = 1; i < children.length; i++) {
                const child = children[i];

                running = multiplyOperatorsHandleComplexOperatorConstruct(this.getOwnConfig(), running, child);
            }

            return running;
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

        return [even, constructContainerOrFirstChild(this.getOwnConfig(), OperatorType.BracketedMultiplication, newChildren)];
    }

    PullOutMinusMODIFICATION(): Operator {
        const [evenNumberMinusPulledOut, resultingOperator] = this.minusCanBePulledOut();

        if (evenNumberMinusPulledOut) {
            return resultingOperator;
        }

        return new Negation(this.getOwnConfig(), resultingOperator);
    }

    MergeAndEvaluateBraKetMODIFICATION(): Operator {
        let newChildren = [] as Operator[];

        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];
            const nextChild = this._children[i + 1];

            if (nextChild && nextChild != undefined && nextChild != null) {
                if (child instanceof Bra) {
                    if (nextChild instanceof Ket) {
                        newChildren.push(
                            Operator.MergeBraKet(this.getOwnConfig(), child, nextChild).OrthoNormalEvalMODIFICATION()
                        );
                        i += 1; // skip next
                        continue; // do not push self
                    }
                }
            }

            newChildren.push(child);
        }

        return constructContainerOrFirstChild(this.getOwnConfig(), OperatorType.BracketedMultiplication, newChildren);
    }

    orderOperatorStrings(): Operator {
        let newChildren = [] as Operator[];
        let currentOperatorString = [] as (Operator & OrderableOperator)[];

        const sortAndPush = () => {
            if (currentOperatorString.length > 0) {
                newChildren.push(orderOperatorString(this.getOwnConfig(), currentOperatorString));
            }
            currentOperatorString = [];
        };

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

        return constructContainerOrFirstChild(this.getOwnConfig(), OperatorType.BracketedMultiplication, newChildren);
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
                        newChildren.push(mapReorderResultToOperator(this.getOwnConfig(), child.commute(nextChild)));
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

        return constructContainerOrFirstChild(this.getOwnConfig(), OperatorType.BracketedMultiplication, newChildren);
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

function orderOperatorString(config: OperatorConfig, inString: (Operator & OrderableOperator)[]): Operator {
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

    return mapReorderResultToOperator(config, orderedResult);
}

/**
 * @returns Operator: single Operator or multiple wrapped in a BracketedMultiplication
 * (You can use `constructContainerOrFirstChild` to integrate directly into another multiplication)
 */
function mapReorderResultToOperator(config: OperatorConfig, reorderResult: ReorderResultIntermediate): Operator {
    let aggregatedMultiplications = [] as Operator[];
    reorderResult.forEach(([prodMinus, swappedChildren]) => {
        let inner = constructContainerOrFirstChild(config, OperatorType.BracketedMultiplication, swappedChildren);
        inner = prodMinus ? new Negation(config, inner) : inner; // apply needed minus
        aggregatedMultiplications.push(inner);
    });

    return constructContainerOrFirstChild(config, OperatorType.BracketedSum, aggregatedMultiplications);
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
    constructor(config: OperatorConfig, dividend: Operator, divisor: Operator) {
        super(config, OperatorType.Fraction, "\\frac{", "}{", "}", [dividend, divisor], "");
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

        return [even, new Fraction(this.getOwnConfig(), newChildren[0], newChildren[1])];
    }

    PullOutMinusMODIFICATION(): Operator {
        const [evenNumberMinusPulledOut, resultingOperator] = this.minusCanBePulledOut();

        if (evenNumberMinusPulledOut) {
            return resultingOperator;
        }

        return new Negation(this.getOwnConfig(), resultingOperator);
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
                return new Numerical(this.getOwnConfig(), 1);
            } else {
                // {} / [a] or [a,b,c,...]
                return new Fraction(
                    this.getOwnConfig(),
                    new Numerical(this.getOwnConfig(), 1),
                    constructContainerOrFirstChild(this.getOwnConfig(), OperatorType.BracketedMultiplication, denominatorOutput)
                );
            }
        } else {
            if (denominatorOutput.length == 0) {
                // [x] or [x, y, z] / {}
                return constructContainerOrFirstChild(
                    this.getOwnConfig(),
                    OperatorType.BracketedMultiplication,
                    enumeratorOutput
                );
            } else {
                // [x] or [x, y, z] / [a] or [a,b,c,...]
                return new Fraction(
                    this.getOwnConfig(),
                    constructContainerOrFirstChild(this.getOwnConfig(), OperatorType.BracketedMultiplication, enumeratorOutput),
                    constructContainerOrFirstChild(this.getOwnConfig(), OperatorType.BracketedMultiplication, denominatorOutput)
                );
            }
        }
    }
}

export class BigSum extends Operator {
    constructor(config: OperatorConfig, lower: Operator, upper: Operator, content: Operator) {
        super(config, OperatorType.BigSum, "\\sum\\limits_{", "", "", [lower, upper, content], "", [" }^{ ", "}"]);
    }
}

export class BigInt extends Operator {
    constructor(config: OperatorConfig, lower: Operator, upper: Operator, content: Operator, differentialVariable: Operator) {
        super(config, OperatorType.BigInt, "\\int\\limits_{", "", "", [lower, upper, content, differentialVariable], "", [
            "}^{",
            "}",
            "\\mathrm{d}",
        ]);
    }
}

export class Variable extends Operator implements OrderableOperator {
    constructor(config: OperatorConfig, name: string) {
        useVariablesStore().makeSureVariableAvailable(config, name);

        super(config, OperatorType.Variable, "{", "", "}", [], name);
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const stored = useVariablesStore().getVariableContent(this.getOwnConfig(), this._value);
        if (stored && stored != null) {
            return stored.getNumericalValue(onlyReturnNumberIfMakesTermSimpler);
        }

        return null;
    }

    public setOperatorStoredHere(op: Operator | null) {
        useVariablesStore().setOperatorForVariable(this.getOwnConfig(), this._value, op);
    }

    UnpackMODIFICATION(): Operator {
        const stored = useVariablesStore().getVariableContent(this.getOwnConfig(), this._value);

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

export class DefinedMacro extends Operator {
    private _trigger: string;
    private static ARG_REGEX = /#(\d+)/g;

    constructor(config: OperatorConfig, trigger: string, children: Operator[]) {
        super(config, OperatorType.DefinedMacro, "", "", "", children, trigger);
        this._trigger = trigger;
        useMacrosStore().makeSureMacroAvailable(config, this._trigger);
    }

    protected innerFormulaString(renderChildrenHtmlIds: boolean, renderImpliedSymbols: boolean) {
        const outputString = this.getOwnOutputString();

        if (outputString.trim() == "") {
            return `\\text{\\#Macro ${this._trigger} has no output set\\#}`;
        }

        let res = outputString;

        const neededChildren = DefinedMacro.getNumberOfIntendedChildren(this.getOwnConfig(), this._trigger);
        const hasChildren = this.getChildren().length;

        if (neededChildren != hasChildren) {
            return `\\text{\\#Macro ${this._trigger} needs ${neededChildren} argument(s), but was given ${hasChildren}\\#}`;
        }

        this.getChildren().forEach((child, index) => {
            const replString = `#${String(index)}`;
            if (outputString.includes(replString)) {
                const childRendered = child.assembleFormulaString(renderChildrenHtmlIds, renderImpliedSymbols);

                // direct replaceAll could cause duplicate Ids, so only the first can be interacted with, the rest gets no interactivity.
                res = res.replace(replString, "{" + childRendered + "}");

                if (res.includes(replString)) {
                    const childRenderedNonInteractive = child.assembleFormulaString(false, renderImpliedSymbols);
                    res = res.replaceAll(replString, "{" + childRenderedNonInteractive + "}");
                }
            }
        });

        res = res.replaceAll("#", "\\#");
        return res;
    }

    static getNumberOfIntendedChildren(config: OperatorConfig, trigger: string) {
        let matches = DefinedMacro.getOutputString(config, trigger).matchAll(DefinedMacro.ARG_REGEX) || [];

        const numbers = [];
        for (const match of matches) {
            numbers.push(parseInt(match[1]));
        }

        return Math.max(0, ...numbers.map((a) => a + 1));
    }

    static getOutputString(config: OperatorConfig, trigger: string): string {
        const macroUUID = useMacrosStore().makeSureMacroAvailable(config, trigger);
        return useMacrosStore().getMacroByUUID(config, macroUUID).output;
    }

    getOwnOutputString(): string {
        return DefinedMacro.getOutputString(this.getOwnConfig(), this._trigger);
    }

    getChildren(): Operator[] {
        return this._children;
    }
}

export class RawLatex extends Operator {
    constructor(config: OperatorConfig, formula: string) {
        super(config, OperatorType.RawLatex, "{", "", "}", [], formula);
    }
}

export class Negation extends Operator implements MinusPulloutManagement {
    constructor(config: OperatorConfig, content: Operator) {
        super(config, OperatorType.Negation, "-", "", "", [content], "");
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

        return new Negation(this.getOwnConfig(), resultingOperator);
    }

    getChild() {
        return this._children[0];
    }
}

abstract class Constant extends Operator implements OrderableOperator {
    constructor(config: OperatorConfig, opType: OperatorType, latex: string) {
        super(config, opType, latex, "", "", [], "");
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
    constructor(config: OperatorConfig) {
        super(config, OperatorType.PiConstant, "\\pi");
    }

    public getConstantValue(): number {
        return Math.PI;
    }
}

export class EConstant extends Constant {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.EConstant, "e");
    }

    public getConstantValue(): number {
        return Math.E;
    }
}

export class Sqrt2Constant extends Constant {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.Sqrt2Constant, "\\sqrt{2}");
    }

    public getConstantValue(): number {
        return Math.sqrt(2);
    }
}

export class InfinityConstant extends Constant {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.InfinityConstant, "\\infty");
    }

    public getConstantValue(): number {
        return Infinity;
    }
}

export class Exp extends Operator {
    constructor(config: OperatorConfig, exponent: Operator) {
        super(config, OperatorType.Exp, "\\mathrm{e}^{", "", "}", [exponent], "");
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

    WriteAsSeriesMODIFICATION(): Operator {
        const argument = this._children[0];

        return new BigSum(
            this.getOwnConfig(),
            new StructuralContainer(this.getOwnConfig(), [
                new Variable(this.getOwnConfig(), "n"),
                new Equals(this.getOwnConfig()),
                new Numerical(this.getOwnConfig(), 0),
            ]),
            new InfinityConstant(this.getOwnConfig()),
            new Fraction(
                this.getOwnConfig(),
                new Power(this.getOwnConfig(), argument, new Variable(this.getOwnConfig(), "n")),
                new Faculty(this.getOwnConfig(), new Variable(this.getOwnConfig(), "n"))
            )
        );
    }

    UseEulersFormulaMODIFICATION(): Operator {
        const argument = this._children[0];

        if (argument instanceof ComplexOperatorConstruct) {
            if (!argument.hasRealPart()) {
                if (argument.hasImaginaryPart()) {
                    const imag = argument.getImaginaryChild();

                    return new BracketedSum(this.getOwnConfig(), [
                        new Cos(this.getOwnConfig(), imag),
                        new ComplexOperatorConstruct(
                            this.getOwnConfig(),
                            new Numerical(this.getOwnConfig(), 0),
                            new Sin(this.getOwnConfig(), imag)
                        ),
                    ]);
                }
            }
        }

        return this;
    }
}

export class Power extends Operator {
    constructor(config: OperatorConfig, base: Operator, exponent: Operator) {
        super(config, OperatorType.Power, "{", "}^{", "}", [base, exponent], "");
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
    constructor(config: OperatorConfig) {
        super(config, OperatorType.Psi, "\\Psi", "", "", [], "");
    }
}

export class Phi extends Operator {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.Phi, "\\Phi", "", "", [], "");
    }
}

export class Up extends Operator {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.Up, "\\uparrow", "", "", [], "");
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        if (onlyReturnNumberIfMakesTermSimpler) {
            return null;
        } else {
            return 1;
        }
    }
}

export class Down extends Operator {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.Down, "\\downarrow", "", "", [], "");
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        if (onlyReturnNumberIfMakesTermSimpler) {
            return null;
        } else {
            return -1;
        }
    }
}

export class Bra extends Operator {
    constructor(config: OperatorConfig, content: Operator) {
        super(config, OperatorType.Bra, "\\left\\lang", "", "\\right\\vert", [content], "");
    }
}

export class Ket extends Operator {
    constructor(config: OperatorConfig, content: Operator) {
        super(config, OperatorType.Ket, "\\left\\vert", "", "\\right\\rang", [content], "");
    }
}

export class Braket extends Operator {
    constructor(config: OperatorConfig, bra: Operator, ket: Operator) {
        super(config, OperatorType.Braket, "\\left\\lang", "\\middle\\vert", "\\right\\rang", [bra, ket], "");
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
            const [allNotNull, _] = new Braket(this.getOwnConfig(), braChild, ketChild).childrenNumericalValues(false);

            if (equivalent) {
                // this is fine, still overlaps
            } else {
                if (allNotNull) {
                    // no equivalence, but could be parsed to number -> definitely different
                    return new Numerical(this.getOwnConfig(), 0);
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
            return new Numerical(this.getOwnConfig(), 1);
        }
    }
}

export class Bracket extends Operator {
    constructor(config: OperatorConfig, bra: Operator, operator: Operator, ket: Operator) {
        super(config, OperatorType.Bracket, "\\left\\lang", "\\middle\\vert", "\\right\\rang", [bra, operator, ket], "");
    }
}

abstract class QMOperatorWithOneArgument extends Operator implements OrderableOperator {
    constructor(config: OperatorConfig, opType: OperatorType, latex: string, argument: Operator) {
        super(config, opType, latex + "_{", "", "}", [argument], "");
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
    constructor(config: OperatorConfig, index: Operator) {
        super(config, OperatorType.FermionicCreationOperator, "\\mathrm{c}^\\dagger", index);
    }

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        if (commuteWith instanceof FermionicAnnihilationOperator) {
            return [
                [true, [commuteWith, this]],
                [false, [new KroneckerDelta(this.getOwnConfig(), this.getChild(), commuteWith.getChild())]],
            ];
        }
        if (commuteWith instanceof FermionicCreationOperator) {
            return [[true, [commuteWith, this]]];
        }

        return [[false, [commuteWith, this]]];
    }
}

export class FermionicAnnihilationOperator extends QMOperatorWithOneArgument {
    constructor(config: OperatorConfig, index: Operator) {
        super(config, OperatorType.FermionicAnnihilationOperator, "\\mathrm{c}", index);
    }

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        if (commuteWith instanceof FermionicCreationOperator) {
            return [
                [true, [commuteWith, this]],
                [false, [new KroneckerDelta(this.getOwnConfig(), this.getChild(), commuteWith.getChild())]],
            ];
        }
        if (commuteWith instanceof FermionicAnnihilationOperator) {
            return [[true, [commuteWith, this]]];
        }

        return [[false, [commuteWith, this]]];
    }
}

export class BosonicCreationOperator extends QMOperatorWithOneArgument {
    constructor(config: OperatorConfig, index: Operator) {
        super(config, OperatorType.BosonicCreationOperator, "\\mathrm{b}^\\dagger", index);
    }

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        if (commuteWith instanceof BosonicAnnihilationOperator) {
            return [
                [false, [commuteWith, this]],
                [false, [new KroneckerDelta(this.getOwnConfig(), this.getChild(), commuteWith.getChild())]],
            ];
        }

        return [[false, [commuteWith, this]]];
    }
}

export class BosonicAnnihilationOperator extends QMOperatorWithOneArgument {
    constructor(config: OperatorConfig, index: Operator) {
        super(config, OperatorType.BosonicAnnihilationOperator, "\\mathrm{b}", index);
    }

    commute(commuteWith: Operator & OrderableOperator): ReorderResultIntermediate {
        if (commuteWith instanceof BosonicCreationOperator) {
            return [
                [false, [commuteWith, this]],
                [false, [new KroneckerDelta(this.getOwnConfig(), this.getChild(), commuteWith.getChild())]],
            ];
        }

        return [[false, [commuteWith, this]]];
    }
}

export class FunctionMathMode extends Operator {
    constructor(config: OperatorConfig, name: Operator, content: Operator) {
        super(config, OperatorType.FunctionMathMode, "{", "}\\left(", "\\right)", [name, content], "");
    }
}

export class FunctionMathRm extends Operator {
    constructor(config: OperatorConfig, name: Operator, content: Operator) {
        super(config, OperatorType.FunctionMathRm, "\\mathrm{", "}\\left(", "\\right)", [name, content], "");
    }
}

export class Sin extends Operator {
    constructor(config: OperatorConfig, content: Operator) {
        super(config, OperatorType.Sin, "\\mathrm{sin}\\left(", "", "\\right)", [content], "");
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
    constructor(config: OperatorConfig, content: Operator) {
        super(config, OperatorType.Cos, "\\mathrm{cos}\\left(", "", "\\right)", [content], "");
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
    constructor(config: OperatorConfig, children: Operator[]) {
        super(config, OperatorType.StructuralContainer, "", "\\,\\,", "", children, "");
    }

    getChildren(): Operator[] {
        return this._children;
    }
}

export class EmptyArgument extends Operator {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.EmptyArgument, "{", "", "}", [], "");
    }
}

export class Equals extends Operator {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.Equals, "\\eq", "", "", [], ""); // custom macro check
    }
}

export class NotEquals extends Operator {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.NotEquals, "\\neq", "", "", [], "");
    }
}

export class Iff extends Operator {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.Iff, "\\iff", "", "", [], "");
    }
}

export class Less extends Operator {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.Less, "\\less", "", "", [], "");
    }
}

export class Greater extends Operator {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.Greater, "\\greater", "", "", [], "");
    }
}

export class LessEquals extends Operator {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.LessEquals, "\\leq", "", "", [], "");
    }
}

export class GreaterEquals extends Operator {
    constructor(config: OperatorConfig) {
        super(config, OperatorType.GreaterEquals, "\\geq", "", "", [], "");
    }
}

export class KroneckerDelta extends Operator implements OrderableOperator {
    constructor(config: OperatorConfig, firstArg: Operator, secondArg: Operator) {
        super(config, OperatorType.KroneckerDelta, "\\delta_{", ",", "}", [firstArg, secondArg], "");
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

    SumOverFirstArgumentPEERALTERATION(additionalSelectedOperators: Operator[]): PeerAlterationResult {
        return this.sumOverArgumentImplementation(this._children[0], this._children[1], additionalSelectedOperators);
    }

    SumOverSecondArgumentPEERALTERATION(additionalSelectedOperators: Operator[]): PeerAlterationResult {
        return this.sumOverArgumentImplementation(this._children[1], this._children[0], additionalSelectedOperators);
    }

    private sumOverArgumentImplementation(
        argument: Operator,
        replacement: Operator,
        additionalSelectedOperators: Operator[]
    ): PeerAlterationResult {
        let res: PeerAlterationResult = [
            {
                // replacing the kronecker-delta with a 1 is currently the cleanest solution I can think of
                uuid: this.getUUID(),
                replacement: new Numerical(this.getOwnConfig(), 1),
            },
        ];

        additionalSelectedOperators.forEach((selectedOperator) => {
            res.push({
                uuid: selectedOperator.getUUID(),
                replacement: selectedOperator.getCopyWithEquivalentOperatorsReplaced(argument, replacement),
            });
        });

        return res;
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

export class Commutator extends Operator {
    constructor(config: OperatorConfig, first: Operator, second: Operator) {
        super(config, OperatorType.Commutator, "\\left[", ",", "\\right]", [first, second], "");
    }

    WriteOutCommutatorMODIFICATION(): Operator {
        const first = this._children[0];
        const second = this._children[1];

        return new BracketedSum(this.getOwnConfig(), [
            new BracketedMultiplication(this.getOwnConfig(), [first, second]),
            new Negation(this.getOwnConfig(), new BracketedMultiplication(this.getOwnConfig(), [second, first])),
        ]);
    }
}

export class AntiCommutator extends Operator {
    constructor(config: OperatorConfig, first: Operator, second: Operator) {
        super(config, OperatorType.AntiCommutator, "\\left\\{", ",", "\\right\\}", [first, second], "");
    }

    WriteOutAntiCommutatorMODIFICATION(): Operator {
        const first = this._children[0];
        const second = this._children[1];

        return new BracketedSum(this.getOwnConfig(), [
            new BracketedMultiplication(this.getOwnConfig(), [first, second]),
            new BracketedMultiplication(this.getOwnConfig(), [second, first]),
        ]);
    }
}

export class Faculty extends Operator {
    constructor(config: OperatorConfig, argument: Operator) {
        super(config, OperatorType.Faculty, "", "", "!", [argument], "");
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const childNumericalValue = this._children[0].getNumericalValue(true);

        if (!onlyReturnNumberIfMakesTermSimpler) {
            if (childNumericalValue != null) {
                if (isBasicallyZero(Math.round(childNumericalValue) - childNumericalValue)) {
                    const num = Math.round(childNumericalValue);

                    if (num >= 0) {
                        if (num < 171) {
                            return calculateFactorial(num);
                        } else {
                            return Infinity; // will get evaluated to infinity anyway by js...
                        }
                    }
                }
            }
        }

        return null;
    }
}

function calculateFactorial(num: number) {
    if (num === 0 || num === 1) {
        return 1;
    } else {
        let factorial = 1;
        for (let i = 2; i <= num; i++) {
            factorial *= i;
        }
        return factorial;
    }
}

export class Percent extends Operator {
    constructor(config: OperatorConfig, argument: Operator) {
        super(config, OperatorType.Percent, "", "", "\\%", [argument], "");
    }

    public getNumericalValue(onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        const childNumericalValue = this._children[0].getNumericalValue(true);

        if (!onlyReturnNumberIfMakesTermSimpler) {
            if (childNumericalValue != null) {
                return childNumericalValue * 0.01;
            }
        }

        return null;
    }
}
