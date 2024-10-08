import { v4 as uuidv4 } from "uuid";
import {
    OperatorType,
    MIN_CHILDREN_SPECIFICATIONS,
    MAX_CHILDREN_SPECIFICATIONS,
    Numerical,
    operatorConstructorSwitch,
    implementsMinusPulloutManagement,
    Negation,
    BracketedSum,
    Variable,
    ComplexOperatorConstruct,
    OperatorConfig,
    PeerAlterationResult,
    EmptyArgument,
} from "./exporter";

export interface ExportOperatorContent {
    type: OperatorType;
    children: ExportOperatorContent[];
    value: string;
    uuid: string;
}

export abstract class Operator {
    private _config: OperatorConfig;
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
    protected _renderValue: boolean = true;

    constructor(
        config: OperatorConfig,
        type: OperatorType,
        startDisplayFormula: string,
        midDisplayFormula: string,
        endDisplayFormula: string,
        children: Operator[],
        value: string,
        midDisplayOverwrite: string[] = [],
        renderChildren: boolean = true,
        renderValue: boolean = true
    ) {
        this._config = config;

        if (children.length < MIN_CHILDREN_SPECIFICATIONS[type]) {
            throw Error("Not enough children for Operator");
        }
        /* c8 ignore next */ if (children.length > MAX_CHILDREN_SPECIFICATIONS[type]) {
            /* c8 ignore next */
            throw Error("Too many children for Operator");
            /* c8 ignore next */
        }
        let hasMidDisplayOverwrite = false;
        if (midDisplayOverwrite.length != 0) {
            if (midDisplayOverwrite.length == children.length - 1) {
                hasMidDisplayOverwrite = true;
            } /* c8 ignore next */ else {
                /* c8 ignore next */
                throw Error("Mid display overwrite needs to contain exactly #children-1 elements");
                /* c8 ignore next */
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
        this._renderValue = renderValue;
    }

    getOwnConfig(): OperatorConfig {
        return this._config;
    }

    getType() {
        return this._type;
    }

    getUUIDRef() {
        return Operator.UUIDRefFromUUID(this.getUUID());
    }

    getUUID() {
        return this._uuid;
    }

    // I would love if this were protected, so that only the intended operators expose their children.
    // But this makes it impossible to get some children for recursive iterators that are needed for peer alteration functions
    childrenAccessForPeerAlterationRecursion() {
        return this._children;
    }

    static UUIDFromUUIDRef(UUIDRef: string) {
        return UUIDRef.substring(4);
    }

    static UUIDRefFromUUID(UUID: string) {
        return "ref_" + UUID;
    }

    manuallySetUUID(uuid: string) {
        this._uuid = uuid;
    }

    /**
     * THIS SHOULD ONLY BE CALLED FOR OPERATOR IMPLEMENTATIONS
     *
     * Use getExportFormulaString or getFormulaString instead of using this directly
     *
     * @param renderHtmlIds
     * @param renderImpliedSymbols
     */
    public assembleFormulaString(renderHtmlIds: boolean, renderImpliedSymbols: boolean) {
        let formula = "";

        if (renderHtmlIds) {
            formula += `\\htmlId{${this.getUUIDRef()}}{`;
        }

        formula += this.innerFormulaString(renderHtmlIds, renderImpliedSymbols);

        if (renderHtmlIds) {
            formula += "}"; //closing the second htmlID bracket
        }

        return formula;
    }

    protected innerFormulaString(renderChildrenHtmlIds: boolean, renderImpliedSymbols: boolean) {
        let formula = "";

        let value = this._renderValue ? this._value : "";

        let anyMiddleDisplayRendered = false;
        let middleFormula = "";
        if (this._renderChildren) {
            this._children.forEach((child, index) => {
                middleFormula += child.assembleFormulaString(renderChildrenHtmlIds, renderImpliedSymbols);

                // Special Cases: skipping middle display stuff
                if (!renderImpliedSymbols) {
                    const nextChild = this._children[index + 1];
                    if (nextChild && nextChild != undefined) {
                        if (this.midDisplayFormulaIsImplied(child, nextChild)) {
                            return;
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
                formula += value;
                formula += middleFormula;
            } else {
                // do not render stuff that can be implied, however no suitable implication-situation was met, so render everything
                formula += this._startDisplayFormula;
                formula += value;
                formula += middleFormula;
                formula += this._endDisplayFormula;
            }
        } else {
            // default situation, render all parts of the equation
            formula += this._startDisplayFormula;
            formula += value;
            formula += middleFormula;
            formula += this._endDisplayFormula;
        }

        return formula;
    }

    protected midDisplayFormulaIsImplied(_firstChild: Operator, _secondChild: Operator): boolean {
        return false;
    }

    getFormulaString(renderImpliedSymbols: boolean = false) {
        return this.assembleFormulaString(true, renderImpliedSymbols);
    }

    getExportFormulaString(renderImpliedSymbols: boolean = false) {
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

    getSerializedStructure(includeUUIDs: boolean = true) {
        return JSON.stringify(this.getSerializedStructureRecursive(includeUUIDs));
    }

    /**
     * Only use for internal operator implementations. For extern use, use @see getSerializedStructure
     */
    getSerializedStructureRecursive(includeUUIDs: boolean = true) {
        let children = [] as ExportOperatorContent[];

        this._children.forEach((child) => {
            children.push(child.getSerializedStructureRecursive(includeUUIDs));
        });

        // not totally type-save cool, but whatever. It is not worth making extra functions and Export types only for the non-inclusion of uuids for the display
        let res: any = {
            type: this._type,
            value: this._value,
            children: children,
        };

        if (includeUUIDs) {
            res.uuid = this._uuid;
        }

        return res as ExportOperatorContent;
    }

    static generateStructure(config: OperatorConfig, input: string, keepUUIDs: boolean = false): Operator {
        const json: ExportOperatorContent = JSON.parse(input); // unsure if this is possible type-safe (this is too complicated https://dev.to/codeprototype/safely-parsing-json-to-a-typescript-interface-3lkj)

        return Operator.generateStructureRecursive(config, json, keepUUIDs);
    }

    /**
     * Only use for internal operator implementations. For extern use, use @see Operator.generateStructure
     */
    static generateStructureRecursive(config: OperatorConfig, input: ExportOperatorContent, keepUUIDs: boolean): Operator {
        let res = new Numerical(config, 0) as Operator;

        let childrenReconstructed = [] as Operator[];
        (input.children ?? []).forEach((childJson) => {
            childrenReconstructed.push(Operator.generateStructureRecursive(config, childJson, keepUUIDs));
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

        res = operatorConstructorSwitch(config, input.type, input.value, childrenReconstructed);

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

    /**
     * [boolean: all not null, (number | null)[]: number if calculable or null]
     */
    protected childrenNumericalValues(onlyReturnNumberIfMakesTermSimpler: boolean): [boolean, (number | null)[]] {
        let res = [] as (number | null)[];
        let allNull = true;
        this._children.forEach((child) => {
            const val = child.getNumericalValue(onlyReturnNumberIfMakesTermSimpler);
            if (val == null) {
                allNull = false;
            }
            res.push(val);
        });

        return [allNull, res];
    }

    public getNumericalValue(_onlyReturnNumberIfMakesTermSimpler: boolean): number | null {
        return null;
    }

    protected numberFoldingInternalImplementation(
        dropElementsThatAreNotNull: boolean,
        insertExtraAtStart: number | null,
        onlyFoldIfMakesTermSimpler: boolean = false
    ): Operator {
        let newChildren = [] as ExportOperatorContent[];
        // for folding of parts of the structure (custom implementations only)
        if (insertExtraAtStart != null) {
            newChildren.push({
                children: [],
                type: OperatorType.Numerical,
                uuid: uuidv4(),
                value: String(insertExtraAtStart),
            } as ExportOperatorContent);
        }

        const ownNumericalValueOrNull = this.getNumericalValue(onlyFoldIfMakesTermSimpler);
        if (ownNumericalValueOrNull == null) {
            // create a copy and fold the contained children one for one if possible without changing the amount or position
            this._children.forEach((child) => {
                const childNumericalOrNullValue = child.getNumericalValue(onlyFoldIfMakesTermSimpler);

                if (childNumericalOrNullValue == null) {
                    // no defined numerical value, just put the child
                    newChildren.push(
                        child.getCopyWithNumbersFolded(onlyFoldIfMakesTermSimpler).getSerializedStructureRecursive()
                    );
                } else {
                    // Omit if only parts of the structure should be folded
                    if (!dropElementsThatAreNotNull) {
                        // child has a pure number value
                        newChildren.push({
                            children: [],
                            type: OperatorType.Numerical,
                            uuid: uuidv4(),
                            value: String(childNumericalOrNullValue),
                        } as ExportOperatorContent);
                    }
                }
            });
            let copy = Operator.generateStructureRecursive(
                this.getOwnConfig(),
                {
                    children: newChildren,
                    type: this._type,
                    uuid: uuidv4(),
                    value: this._value,
                } as ExportOperatorContent,
                false
            );
            return copy;
        } else {
            return new Numerical(this.getOwnConfig(), ownNumericalValueOrNull);
        }
    }

    getCopyWithNumbersFolded(onlyFoldIfMakesTermSimpler: boolean = false): Operator {
        return this.numberFoldingInternalImplementation(false, null, onlyFoldIfMakesTermSimpler);
    }

    getCopyWithReplaced(uuid: string, replacement: Operator, keepUUIDs: boolean = false) {
        let copy = this.getSerializedStructureRecursive();
        const replacementValue = replacement.getSerializedStructureRecursive();
        copy = Operator.replaceRecursive(copy, uuid, (_a) => replacementValue);

        return Operator.generateStructureRecursive(this.getOwnConfig(), copy, keepUUIDs);
    }

    getCopyWithPackedIntoVariable(name: string, uuid: string, keepUUIDs: boolean = false) {
        let copy = this.getSerializedStructureRecursive();
        copy = Operator.replaceRecursive(copy, uuid, (a) => {
            const variable = new Variable(this.getOwnConfig(), name);
            // store the replaced values
            variable.setOperatorStoredHere(Operator.generateStructureRecursive(this.getOwnConfig(), a, false));

            return variable.getSerializedStructureRecursive();
        });

        return Operator.generateStructureRecursive(this.getOwnConfig(), copy, keepUUIDs);
    }

    private static replaceRecursive(
        structure: ExportOperatorContent,
        uuid: string,
        replacementCallback: (whatIsReplaced: ExportOperatorContent) => ExportOperatorContent
    ): ExportOperatorContent {
        if (structure.uuid == uuid) {
            return replacementCallback(structure);
        } else {
            let newChildren = [] as ExportOperatorContent[];

            structure.children.forEach((child) => {
                newChildren.push(Operator.replaceRecursive(child, uuid, replacementCallback));
            });

            structure.children = newChildren;
            return structure;
        }
    }

    getCopyWithEquivalentOperatorsReplaced(
        find: Operator,
        replacement: Operator,
        skipUUID: string | null = null,
        keepUUIDs: boolean = false
    ) {
        let copy = Operator.generateStructureRecursive(this.getOwnConfig(), this.getSerializedStructureRecursive(), keepUUIDs);
        copy = copy.replaceEquivalentOperatorRecursive(find, replacement, skipUUID, keepUUIDs);
        return copy;
    }

    // ! modifies this._children !! Only call on sacrificial copies !!
    private replaceEquivalentOperatorRecursive(
        find: Operator,
        replacement: Operator,
        skipUUID: string | null,
        keepUUIDs: boolean = false
    ): Operator {
        if (skipUUID != null && this.getUUID() == skipUUID) {
            return this;
        }

        if (Operator.assertOperatorsEquivalent(this, find)) {
            return Operator.generateStructureRecursive(
                this.getOwnConfig(),
                replacement.getSerializedStructureRecursive(),
                keepUUIDs
            );
        } else {
            for (let i = 0; i < this._children.length; i++) {
                const child = this._children[i];
                const moddedChild = child.replaceEquivalentOperatorRecursive(find, replacement, skipUUID, keepUUIDs);

                this._children[i] = moddedChild;
            }

            return this;
        }
    }

    static assertOperatorsEquivalent(
        a: Operator,
        b: Operator,
        treatSameNumericalValueAsEquivalent: boolean = true,
        allowSymmetricalSwapping: boolean = true
    ): boolean {
        if (treatSameNumericalValueAsEquivalent) {
            const valA = a.getNumericalValue(false);
            const valB = b.getNumericalValue(false);

            if (valA != null) {
                if (valB != null) {
                    return valA > valB - 1e-6 && valA < valB + 1e-6;
                } else {
                    return false; // one can be parsed to number, other not -> not equivalent
                }
            }
        }

        return Operator.assertEquivalenceRecursive(
            a.getSerializedStructureRecursive(),
            b.getSerializedStructureRecursive(),
            allowSymmetricalSwapping
        );
    }

    private static assertEquivalenceRecursive(
        a: ExportOperatorContent,
        b: ExportOperatorContent,
        allowSymmetricalSwapping: boolean = true
    ): boolean {
        if (a.type != b.type) {
            return false;
        }
        if (a.value != b.value) {
            return false;
        }
        if (a.children.length != b.children.length) {
            return false;
        }
        if (allowSymmetricalSwapping) {
            if (a.type == OperatorType.KroneckerDelta) {
                // type is already equal for b
                if (a.children.length == 2) {
                    // length is already equal for b
                    const childAA = a.children[0];
                    const childAB = a.children[1];
                    const childBA = b.children[0];
                    const childBB = b.children[1];
                    if (
                        Operator.assertEquivalenceRecursive(childAA, childBB) &&
                        Operator.assertEquivalenceRecursive(childBA, childAB)
                    ) {
                        // special case, deltas are also equivalent if their children match cross-wise
                        return true;
                    }
                }
            }
        }
        for (let i = 0; i < a.children.length; i++) {
            const childA = a.children[i];
            const childB = b.children[i];

            if (!Operator.assertEquivalenceRecursive(childA, childB)) {
                return false;
            }
        }

        return true;
    }

    public findParentOperator(uuid: string): Operator | null {
        // search first in own children
        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];
            if (child._uuid == uuid) {
                return this;
            }
        }

        // then go recursive
        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];
            const childRes = child.findParentOperator(uuid);
            if (childRes != null) {
                return childRes;
            }
        }

        return null;
    }

    public findFirstChildOperator(uuid: string): Operator | null {
        // check self
        if (this._uuid == uuid) {
            if (this._children.length > 0) {
                return this._children[0];
            } else {
                return null;
            }
        }

        // then go recursive
        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];
            const childRes = child.findFirstChildOperator(uuid);
            if (childRes != null) {
                return childRes;
            }
        }

        return null;
    }

    public findNextSiblingOperator(uuid: string): Operator | null {
        // search first in own children
        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];
            if (child._uuid == uuid) {
                if (i + 1 < this._children.length) {
                    return this._children[i + 1];
                } else {
                    return null;
                }
            }
        }

        // then go recursive
        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];
            const childRes = child.findNextSiblingOperator(uuid);
            if (childRes != null) {
                return childRes;
            }
        }

        return null;
    }

    public findPrevSiblingOperator(uuid: string): Operator | null {
        // search first in own children
        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];
            if (child._uuid == uuid) {
                if (i - 1 >= 0) {
                    return this._children[i - 1];
                } else {
                    return null;
                }
            }
        }

        // then go recursive
        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];
            const childRes = child.findPrevSiblingOperator(uuid);
            if (childRes != null) {
                return childRes;
            }
        }

        return null;
    }

    getCopyWithGottenRidOfUnnecessaryTerms() {
        let copy = this.getCopyWithNumbersFolded(true); // directly eliminate all unnecessary delta, 0, 1, etc.
        copy = Operator.handleChildrenWithGottenRidOfUnnecessaryTermsRecursive(this.getOwnConfig(), copy);
        return copy;
    }

    private static handleChildrenWithGottenRidOfUnnecessaryTermsRecursive(config: OperatorConfig, op: Operator): Operator {
        // go into structures to treat their children
        op._children = op._children.map((child) =>
            Operator.handleChildrenWithGottenRidOfUnnecessaryTermsRecursive(config, child)
        );

        // make sure to pull out the minus if it was just included into a number
        // also eliminates Negation(Negation(stuff))
        if (implementsMinusPulloutManagement(op)) {
            const [evenNumberMinusPulledOut, resOp] = op.minusCanBePulledOut();
            op = evenNumberMinusPulledOut ? resOp : new Negation(config, resOp);
        }

        // Make sure to get rid of cancelling terms
        if (op instanceof BracketedSum) {
            op = op.EliminateCancelingTermsMODIFICATION();
        }

        // combine unnecessary ComplexOperatorConstructs
        if (op instanceof BracketedSum) {
            op = op.CombineComplexNumbersMODIFICATION();
        }

        // if complex without imaginary part, return only real part
        if (op instanceof ComplexOperatorConstruct) {
            if (!op.hasImaginaryPart()) {
                op = op.getRealChild();
            }
        }

        return op;
    }

    /**
     * General PEERALTERATION for all operators
     *
     * @param additionalSelectedOperators
     */
    renameSwapImplementation(additionalSelectedOperators: Operator[]): PeerAlterationResult {
        if (additionalSelectedOperators.length != 2) {
            return [];
        }

        const swapOne = additionalSelectedOperators[0];
        const swapTwo = additionalSelectedOperators[1];

        // getClone of Self to be able to modify _children
        let workOp = Operator.generateStructureRecursive(this.getOwnConfig(), this.getSerializedStructureRecursive(), false);

        workOp.renameSwapImplementationRecursive(swapOne, swapTwo);

        if (Operator.assertOperatorsEquivalent(workOp, this, false)) {
            return [];
        } else {
            return [
                {
                    replacement: workOp,
                    uuid: this.getUUID(),
                },
            ];
        }
    }

    /**
     * MODIFIES _children!!! only call on sacrificial copies!!
     */
    private renameSwapImplementationRecursive(a: Operator, b: Operator) {
        let children = this._children;

        for (let i = 0; i < children.length; i++) {
            const compareChild = children[i];

            if (Operator.assertOperatorsEquivalent(compareChild, a, false)) {
                children[i] = b;
            } else if (Operator.assertOperatorsEquivalent(compareChild, b, false)) {
                children[i] = a;
            } else {
                children[i].renameSwapImplementationRecursive(a, b);
            }
        }
    }

    /**
     * General PEERALTERATION for all operators
     *
     * @param additionalSelectedOperators
     */
    variableAllEqualImplementation(additionalSelectedOperators: Operator[]): PeerAlterationResult {
        if (additionalSelectedOperators.length != 1) {
            return [];
        }

        const variable = additionalSelectedOperators[0];

        if (!(variable instanceof Variable)) {
            return [];
        }

        const variableContent = variable.getVariableContent();

        return this.replaceAllEqualImplementation([variableContent, variable]);
    }

    /**
     * General PEERALTERATION for all operators
     *
     * @param additionalSelectedOperators
     */
    replaceAllEqualImplementation(additionalSelectedOperators: Operator[]): PeerAlterationResult {
        if (additionalSelectedOperators.length != 2) {
            return [];
        }

        const search = additionalSelectedOperators[0];
        const replace = additionalSelectedOperators[1];

        // getClone of Self to be able to modify _children
        let workOp = Operator.generateStructureRecursive(this.getOwnConfig(), this.getSerializedStructureRecursive(), false);

        workOp = workOp.getCopyWithEquivalentOperatorsReplaced(search, replace, null, false);

        if (Operator.assertOperatorsEquivalent(workOp, this, false)) {
            return [];
        } else {
            return [
                {
                    replacement: workOp,
                    uuid: this.getUUID(),
                },
            ];
        }
    }

    public containsRawLatex(): boolean {
        if (this._type == OperatorType.RawLatex) {
            return true;
        }

        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];
            if (child.containsRawLatex()) {
                return true;
            }
        }

        return false;
    }

    static processPeerAlterationResult(mainOperator: Operator, peerAlteration: PeerAlterationResult): Operator {
        let iterator: Operator = mainOperator.getCopyWithReplaced("", new EmptyArgument(mainOperator.getOwnConfig()), true); // just get a copy. Nothing replaced
        peerAlteration.forEach((res) => {
            iterator = iterator.getCopyWithReplaced(res.uuid, res.replacement, true);
        });

        // make sure it changes uuids for the next step
        iterator = iterator.getCopyWithReplaced("", new EmptyArgument(mainOperator.getOwnConfig()), false); // just get a copy. Nothing replaced

        return iterator;
    }
}
