import {
    Operator,
    ExportOperatorContent,
    OperatorType,
    MAX_CHILDREN_SPECIFICATIONS,
    MIN_CHILDREN_SPECIFICATIONS,
    OperatorConfig,
} from "./exporter";

/**
 * @throws Error on failing to tokenize/parse
 */
export function operatorFromString(config: OperatorConfig, input: string): Operator {
    const parsedExport = parseStringToExportOperatorContent(input);
    const generatedStructure = Operator.generateStructure(config, JSON.stringify(parsedExport), false);

    return generatedStructure;
}

function parseStringToExportOperatorContent(input: string): ExportOperatorContent {
    if (input == "") {
        return {
            type: OperatorType.Numerical,
            value: "0",
            children: [],
            uuid: "",
        };
    }

    const countOpen = (input.match(/{/g) || []).length - (input.match(/\\{/g) || []).length;
    const countClose = (input.match(/}/g) || []).length - (input.match(/\\}/g) || []).length;
    if (countOpen != countClose) {
        throw Error(
            `Imbalance of unescaped { (${countOpen}) characters and } (${countClose}) characters. Will not be possible to compile.`
        );
    }

    const tokens = tokenize(input);
    const grouped = groupTokenStream(tokens);
    const exportOperators = infixTokenGroupTreeToExportOperatorTreeRecursive(grouped);

    return exportOperators;
}

enum TokenType {
    Structural = "Structural",
    StructuralSeparation = "StructuralSeparation",
    Plus = "Plus",
    Minus = "Minus",
    OpenParen = "OpenParen",
    CloseParen = "CloseParen",
    Multiplicate = "Multiplicate",
    Power = "Power",
    Divide = "Divide",
    Function = "Function",
    Constant = "Constant",
    Number = "Number",
    Other = "Other",
    Faculty = "Faculty",
    Percent = "Percent",
}

// ! Reserved Symbols with own token
const PowerSignSymbol = "$POWERSIGN$";
const AllowedReservedSymbolsMapping = {
    ";": TokenType.StructuralSeparation,
    "+": TokenType.Plus,
    "-": TokenType.Minus,
    "*": TokenType.Multiplicate,
    [PowerSignSymbol]: TokenType.Power, // actually ** is used, but this doesn't work, because * is already a reserved word. Therefore special pre-processing with WordPreProcessingMap
    "/": TokenType.Divide,
    ":": TokenType.Divide,
    "(": TokenType.OpenParen,
    ")": TokenType.CloseParen,
    "!": TokenType.Faculty,
    "%": TokenType.Percent,
} as { [key: string]: TokenType };
const AllowedReservedSymbols = Object.keys(AllowedReservedSymbolsMapping);

// ! Structural Operators
const NotEqualsSignSymbol = "$NEQSIGN$";
const LessEqualsSignSymbol = "$LESSEQUALSIGN$";
const GreaterEqualsSignSymbol = "$GREATEREQUALSIGN$";
const IffSignSymbol = "$IFFSIGN$";
const AllowedStructuralKeywordMapping = {
    "{}": OperatorType.EmptyArgument,
    "=": OperatorType.Equals,
    "<": OperatorType.Less,
    ">": OperatorType.Greater,
    [NotEqualsSignSymbol]: OperatorType.NotEquals, // actually != is used, but this doesn't work, because ! and = is already a reserved word. Therefore special pre-processing with WordPreProcessingMap
    [LessEqualsSignSymbol]: OperatorType.LessEquals, // actually <= is used, but this doesn't work, because = and < is already a reserved word. Therefore special pre-processing with WordPreProcessingMap
    [GreaterEqualsSignSymbol]: OperatorType.GreaterEquals, // actually >= is used, but this doesn't work, because = and > is already a reserved word. Therefore special pre-processing with WordPreProcessingMap
    [IffSignSymbol]: OperatorType.Iff, // actually <=> is used, but this doesn't work, because = and <= is already a reserved word. Therefore special pre-processing with WordPreProcessingMap
} as { [key: string]: OperatorType };
const AllowedStructuralKeywords = Object.keys(AllowedStructuralKeywordMapping);

// ! Pre-defined Functions
const AllowedFunctionKeywordMapping = {
    sum: OperatorType.BigSum,
    int: OperatorType.BigInt,
    exp: OperatorType.Exp,
    bra: OperatorType.Bra,
    ket: OperatorType.Ket,
    braket: OperatorType.Braket,
    bracket: OperatorType.Bracket,
    "c#": OperatorType.FermionicCreationOperator,
    c: OperatorType.FermionicAnnihilationOperator,
    "b#": OperatorType.BosonicCreationOperator,
    b: OperatorType.BosonicAnnihilationOperator,
    func: OperatorType.FunctionMathMode,
    funcrm: OperatorType.FunctionMathRm,
    sin: OperatorType.Sin,
    cos: OperatorType.Cos,
    delta: OperatorType.KroneckerDelta,
    complex: OperatorType.ComplexOperatorConstruct,
    comm: OperatorType.Commutator,
    acomm: OperatorType.AntiCommutator,
} as { [key: string]: OperatorType };
const functionsWithArgumentsConsideredStructural = [
    // only makes a difference for functions that take more than exactly one argument
    OperatorType.Bra,
    OperatorType.Ket,
] as OperatorType[];
const AllowedFunctionKeywords = Object.keys(AllowedFunctionKeywordMapping);

// ! Pre-defined Constants
const AllowedConstantKeywordMapping = {
    pi: OperatorType.PiConstant,
    inf: OperatorType.InfinityConstant,
    e: OperatorType.EConstant,
    i: OperatorType.ComplexIConstant,
    sqrt2: OperatorType.Sqrt2Constant,
    psi: OperatorType.Psi,
    phi: OperatorType.Phi,
    up: OperatorType.Up,
    down: OperatorType.Down,
} as { [key: string]: OperatorType };
const AllowedConstantKeywords = Object.keys(AllowedConstantKeywordMapping);

// ! Pre-Processing Section (order is important)
const WordPreProcessingMap = {
    "**": [PowerSignSymbol],
    "!=": [NotEqualsSignSymbol],
    "<=>": [IffSignSymbol],
    "<=": [LessEqualsSignSymbol],
    ">=": [GreaterEqualsSignSymbol],
};
const WordsThatNeedPreProcessing = Object.keys(WordPreProcessingMap);

// ! Exports of reserved Words
export const wordsParserConsidersReserved: string[] = [
    ...AllowedReservedSymbols,
    ...AllowedStructuralKeywords,
    ...WordsThatNeedPreProcessing,
];
export const wordsParserConsidersReservedIfWhitespaceSurrounded: string[] = [
    ...AllowedFunctionKeywords,
    ...AllowedConstantKeywords,
];

interface Token {
    type: TokenType;
    content: string;
}

export function preProcessInputString(inp: string): string {
    // make sure, that before all reserved words is at least one space
    // ! Functions are exempt from this. To not split longer words/latex commands by mistake
    let spacesIntroduced = inp;
    // special pre-processing, because e.g. * is already a reserved word, which disallows **
    WordsThatNeedPreProcessing.forEach((word) => {
        spacesIntroduced = spacesIntroduced.replaceAll(word, " " + (WordPreProcessingMap as any)[word] + " ");
    });
    // surround the reserved words with spaces where intended
    wordsParserConsidersReserved.forEach((word) => {
        spacesIntroduced = spacesIntroduced.replaceAll(word, " " + word + " ");
    });
    spacesIntroduced = " " + spacesIntroduced + " "; // make sure to start and terminate with space

    // remove all multiple spaces, newlines and so on
    const whitespaceSanitized = spacesIntroduced.replaceAll(/\s+/g, " ");

    return whitespaceSanitized;
}

function tokenize(input: string): Token[] {
    const stringToProcess = preProcessInputString(input);
    const length = stringToProcess.length;

    let tokens = [] as Token[];

    // cut into typed token stream
    let currentBuf = "";
    let startIndex = 0;
    let endIndex = 1;
    while (true) {
        currentBuf = stringToProcess.substring(startIndex, endIndex).trimStart();

        // test if is reserved word
        let wordFound = false;

        // only attempt to parse if substring is finished
        if (currentBuf.endsWith(" ")) {
            const currentBufWord = currentBuf.substring(0, currentBuf.length - 1); // remove space at the end

            for (let i = 0; i < AllowedReservedSymbols.length; i++) {
                if (currentBufWord == AllowedReservedSymbols[i]) {
                    tokens.push({
                        type: AllowedReservedSymbolsMapping[AllowedReservedSymbols[i]],
                        content: "",
                    });
                    wordFound = true;
                    break;
                }
            }
            for (let i = 0; i < AllowedFunctionKeywords.length; i++) {
                if (currentBufWord == AllowedFunctionKeywords[i]) {
                    tokens.push({
                        type: TokenType.Function,
                        content: AllowedFunctionKeywordMapping[AllowedFunctionKeywords[i]],
                    });
                    wordFound = true;
                    break;
                }
            }
            for (let i = 0; i < AllowedConstantKeywords.length; i++) {
                if (currentBufWord == AllowedConstantKeywords[i]) {
                    tokens.push({
                        type: TokenType.Constant,
                        content: AllowedConstantKeywordMapping[AllowedConstantKeywords[i]],
                    });
                    wordFound = true;
                    break;
                }
            }
            for (let i = 0; i < AllowedStructuralKeywords.length; i++) {
                if (currentBufWord == AllowedStructuralKeywords[i]) {
                    tokens.push({
                        type: TokenType.Structural,
                        content: currentBufWord,
                    });
                    wordFound = true;
                    break;
                }
            }

            // try parsing as number
            if (!wordFound) {
                // only if can be parsed as number
                if (!isNaN(Number(currentBufWord))) {
                    tokens.push({ type: TokenType.Number, content: String(Number(currentBufWord)) });
                    wordFound = true;
                }
            }

            // rest
            if (!wordFound) {
                const likelyLatex =
                    currentBufWord.includes("\\") ||
                    currentBufWord.includes("^") ||
                    currentBufWord.includes("_") ||
                    currentBufWord.includes("{") ||
                    currentBufWord.includes("}");
                tokens.push({ type: likelyLatex ? TokenType.Structural : TokenType.Other, content: currentBufWord });
                wordFound = true;
            }
        }

        // update search borders
        if (wordFound) {
            startIndex = endIndex;
        }
        endIndex = Math.max(startIndex + 1, endIndex + 1);

        // overflow check
        if (endIndex > length) {
            // additional checks on `currentBuf` avoid +1 errors, sorry :-)
            if (!wordFound && currentBuf != "" && currentBuf != " ") {
                throw Error(`Should not be possible, token #${currentBuf}# could not be tokenized.`);
            }
            break;
        }
    }

    return tokens;
}

abstract class TokenGroup {
    constructor() {}
}
class TokenGroupLeaf extends TokenGroup {
    constructor(private token: Token) {
        super();
    }

    getToken() {
        return this.token;
    }
}
class TokenGroupKnot extends TokenGroup {
    constructor(private children: TokenGroup[]) {
        super();
    }

    getChildren() {
        return this.children;
    }
}

function groupTokenStream(tokens: Token[]): TokenGroup {
    const countOpen = tokens.filter((tok) => {
        return tok.type == TokenType.OpenParen;
    }).length;
    const countClose = tokens.filter((tok) => {
        return tok.type == TokenType.CloseParen;
    }).length;
    if (countOpen != countClose) {
        throw Error(`Found ${countOpen} opening brackets, which doesn't match ${countClose} closing brackets`);
    }

    let res = groupTokenStreamRecursive(tokens, 0);

    if (res[1] < tokens.length) {
        throw Error("Should not be possible, not all tokens have been processed in the grouping stage");
    }
    const trimmed = trimTokenGroupRecursive(res[0]);
    const implicitOperationsInserted = insertImpliedOperationsRecursive(trimmed);
    const precedenceFixed = fixOperatorPrecedenceGrouping(implicitOperationsInserted);

    return precedenceFixed;
}

function groupTokenStreamRecursive(tokens: Token[], index: number): [TokenGroup, number] {
    let newChildren = [] as TokenGroup[];

    let i = index;
    while (true) {
        if (i >= tokens.length) {
            break;
        }
        const currToken = tokens[i];

        if (currToken.type == TokenType.CloseParen) {
            break;
        } else if (currToken.type == TokenType.OpenParen) {
            let res = groupTokenStreamRecursive(tokens, i + 1);
            i = res[1]; // skip elements that have been cared of in sub-call
            newChildren.push(res[0]);
        } else {
            newChildren.push(new TokenGroupLeaf(currToken));
        }

        // not on break
        i++;
    }

    let grp = new TokenGroupKnot(newChildren);
    return [grp, i];
}

function trimTokenGroupRecursive(tokenGroup: TokenGroup): TokenGroup {
    if (tokenGroup instanceof TokenGroupKnot) {
        let children = tokenGroup.getChildren();

        if (children.length == 0) {
            throw Error("Empty Token Group ()");
        }

        if (children.length == 1) {
            // cut out one group instance
            return trimTokenGroupRecursive(tokenGroup.getChildren()[0]);
        } else {
            // recursion for every child
            let newChildren = [] as TokenGroup[];

            children.forEach((child) => {
                newChildren.push(trimTokenGroupRecursive(child));
            });

            return new TokenGroupKnot(newChildren);
        }
    }
    // leaf
    return tokenGroup;
}

const implyStructuralSeparationBehind = [TokenType.Other, TokenType.Number, TokenType.Constant, TokenType.Structural]; // Plus groups aka most of the time brackets
const implyStructuralSeparationInFront = [
    TokenType.Other,
    TokenType.Number,
    TokenType.Function,
    TokenType.Constant,
    TokenType.Structural,
]; // Plus groups aka most of the time brackets
const implyMultiplicationBehind = [TokenType.Other, TokenType.Number, TokenType.Constant]; // Plus groups aka most of the time brackets
const implyMultiplicationInFront = [TokenType.Other, TokenType.Number, TokenType.Function, TokenType.Constant]; // Plus groups aka most of the time brackets
const implyAdditionBehind = [TokenType.Other, TokenType.Number, TokenType.Constant, TokenType.Function]; // Plus groups aka most of the time brackets
const implyAdditionInFront = [TokenType.Minus]; // ! here NOT groups

function insertImpliedOperationsRecursive(tokenGroup: TokenGroup, insertStructuralSeparation: boolean = false): TokenGroup {
    if (tokenGroup instanceof TokenGroupKnot) {
        let children = tokenGroup.getChildren();

        let newChildren = [] as TokenGroup[];

        for (let i = 0; i < children.length; i++) {
            let firstNeedsStructuralSeparation = false;
            let secondNeedsStructuralSeparation = false;
            let firstNeedsMultiplication = false;
            let secondNeedsMultiplication = false;
            let firstNeedsAddition = false;
            let secondNeedsAddition = false;
            const first = children[i - 1];
            const second = children[i];

            // update structural separation logic
            if (
                first &&
                first != undefined &&
                (first instanceof TokenGroupKnot ||
                    (first instanceof TokenGroupLeaf && implyStructuralSeparationBehind.includes(first.getToken().type)))
            ) {
                firstNeedsStructuralSeparation = true;
            }
            if (
                second instanceof TokenGroupKnot ||
                (second instanceof TokenGroupLeaf && implyStructuralSeparationInFront.includes(second.getToken().type))
            ) {
                secondNeedsStructuralSeparation = true;
            }
            // update multiplication logic
            if (
                first &&
                first != undefined &&
                (first instanceof TokenGroupKnot ||
                    (first instanceof TokenGroupLeaf && implyMultiplicationBehind.includes(first.getToken().type)))
            ) {
                firstNeedsMultiplication = true;
            }
            if (
                second instanceof TokenGroupKnot ||
                (second instanceof TokenGroupLeaf && implyMultiplicationInFront.includes(second.getToken().type))
            ) {
                secondNeedsMultiplication = true;
            }
            // update addition logic
            if (
                first &&
                first != undefined &&
                (first instanceof TokenGroupKnot ||
                    (first instanceof TokenGroupLeaf && implyAdditionBehind.includes(first.getToken().type)))
            ) {
                firstNeedsAddition = true;
            }
            if (
                // ! here NOT groups
                second instanceof TokenGroupLeaf &&
                implyAdditionInFront.includes(second.getToken().type)
            ) {
                secondNeedsAddition = true;
            }

            // case: we are in a default mode. Here default assumption takes place
            if (
                first &&
                first != undefined &&
                first instanceof TokenGroupLeaf &&
                first.getToken().type == TokenType.Function &&
                ((MAX_CHILDREN_SPECIFICATIONS[first.getToken().content as OperatorType] != 1 &&
                    MIN_CHILDREN_SPECIFICATIONS[first.getToken().content as OperatorType] != 1) ||
                    functionsWithArgumentsConsideredStructural.includes(first.getToken().content as OperatorType))
            ) {
                // Special case: the element after a function is the argument (bracket)
                // NEVER insert operations before
                // ONLY insert operations in between, when the function takes more than one argument
                if (second instanceof TokenGroupLeaf) {
                    // insert single argument wrapped in a group
                    newChildren.push(new TokenGroupKnot([second]));
                } else {
                    if (second instanceof TokenGroupKnot) {
                        // recursive call that makes sure
                        newChildren.push(insertImpliedOperationsRecursive(second, true));
                    } else {
                        throw Error("Unreachable. At this point there should only exist TokenGroupLeaves and TokenGroupKnots.");
                    }
                }
            } else {
                if (insertStructuralSeparation) {
                    // case: we are inside of a function arguments bracket. Here only possible insertion can be structural delimiters
                    if (firstNeedsStructuralSeparation && secondNeedsStructuralSeparation) {
                        newChildren.push(
                            // insert implicit structural separation
                            new TokenGroupLeaf({
                                type: TokenType.StructuralSeparation,
                                content: "",
                            })
                        );
                    }
                } else {
                    // check if need insert multiplication
                    if (firstNeedsMultiplication && secondNeedsMultiplication) {
                        newChildren.push(
                            // insert implicit multiplication
                            new TokenGroupLeaf({
                                type: TokenType.Multiplicate,
                                content: "",
                            })
                        );
                    } else {
                        // check if need insert addition
                        if (firstNeedsAddition && secondNeedsAddition) {
                            newChildren.push(
                                // insert implicit addition
                                new TokenGroupLeaf({
                                    type: TokenType.Plus,
                                    content: "",
                                })
                            );
                        }
                    }
                }
                // insert self
                newChildren.push(insertImpliedOperationsRecursive(second));
            }
        }

        return new TokenGroupKnot(newChildren);
    }
    // leaf
    return tokenGroup;
}

interface OperatorCharacter {
    precedence: number; // higher is higher precedence
    takesNrArgumentsBefore: number;
    takesNrArgumentsAfter: number;
}

type tokenTypesWithOperatorCharacterType =
    | TokenType.Plus
    | TokenType.Minus
    | TokenType.Multiplicate
    | TokenType.Faculty
    | TokenType.Percent
    | TokenType.Divide
    | TokenType.Power
    | TokenType.Function
    | TokenType.StructuralSeparation;

const tokenTypesWithOperatorCharacterDefinitions: { [key in tokenTypesWithOperatorCharacterType]: OperatorCharacter } = {
    [TokenType.StructuralSeparation]: {
        precedence: 1,
        takesNrArgumentsBefore: 1,
        takesNrArgumentsAfter: 1,
    },
    [TokenType.Plus]: {
        precedence: 50,
        takesNrArgumentsBefore: 1,
        takesNrArgumentsAfter: 1,
    },
    [TokenType.Multiplicate]: {
        precedence: 90,
        takesNrArgumentsAfter: 1,
        takesNrArgumentsBefore: 1,
    },
    [TokenType.Power]: {
        precedence: 100,
        takesNrArgumentsAfter: 1,
        takesNrArgumentsBefore: 1,
    },
    [TokenType.Divide]: {
        precedence: 110,
        takesNrArgumentsAfter: 1,
        takesNrArgumentsBefore: 1,
    },
    [TokenType.Minus]: {
        // only one-after-it type of minus
        precedence: 500,
        takesNrArgumentsBefore: 0,
        takesNrArgumentsAfter: 1,
    },
    [TokenType.Faculty]: {
        precedence: 550,
        takesNrArgumentsBefore: 1,
        takesNrArgumentsAfter: 0,
    },
    [TokenType.Percent]: {
        precedence: 555,
        takesNrArgumentsBefore: 1,
        takesNrArgumentsAfter: 0,
    },
    [TokenType.Function]: {
        precedence: 1000,
        takesNrArgumentsAfter: 1,
        takesNrArgumentsBefore: 0,
    },
};
const tokenTypesWithOperatorCharacter = Object.keys(tokenTypesWithOperatorCharacterDefinitions);
const repeatableTokenTypesWithOperatorCharacter = [TokenType.Plus, TokenType.Multiplicate, TokenType.StructuralSeparation];

class TokenGroupKnotInfix extends TokenGroup {
    constructor(private operator: TokenGroupLeaf, private children: TokenGroup[]) {
        super();
    }

    getOperator() {
        return this.operator;
    }

    getChildren() {
        return this.children;
    }
}

class TokenGroupKnotInfixStructural extends TokenGroupKnotInfix {
    constructor(children: TokenGroup[]) {
        super(new TokenGroupLeaf({ type: TokenType.Structural, content: "" }), children);
    }
}

/**
 * Previously flat operation groupings proper depth via priority
 *
 * Converts all TokenGroupKnot into TokenGroupKnotInfix!!
 *
 * e.g. 1+2*3 => fixOperatorPrecedenceGroupingRecursive => {+;1;{*;2;3}}
 *
 * caution: expects for functions that they are followed by one group only. The group was translated typically to be interweaved with * by insertMultiplicationsIntoForbiddenFollowingsRecursive
 * sum 1 2 3 => insertMultiplicationsIntoForbiddenFollowingsRecursive => sum 1 * 2 * 3 => fixOperatorPrecedenceGroupingRecursive => {sum; 1; {*; 2; 3}}
 * If multiple arguments are needed for a function, grouping beforehand is needed. This however makes the syntax quite neat actually
 * sum(1 2 3) => insertMultiplicationsIntoForbiddenFollowingsRecursive => sum(1 * 2 * 3) => fixOperatorPrecedenceGroupingRecursive => {sum; 1; {*; 2; 3}}
 */
function fixOperatorPrecedenceGrouping(tokenGroup: TokenGroup): TokenGroup {
    if (tokenGroup instanceof TokenGroupLeaf && tokenTypesWithOperatorCharacter.includes(tokenGroup.getToken().type)) {
        const type = tokenGroup.getToken().type;
        // Constants do not take any arguments!
        if (!(type == TokenType.Constant)) {
            throw Error(
                `Operator ${tokenGroup.getToken().type}:${
                    tokenGroup.getToken().content
                } alone on top level, which is not possible`
            );
        }
    }

    return fixOperatorPrecedenceGroupingRecursive(tokenGroup);
}

/**
 * Documentation @see fixOperatorPrecedenceGrouping
 */
function fixOperatorPrecedenceGroupingRecursive(tokenGroup: TokenGroup): TokenGroup {
    if (tokenGroup instanceof TokenGroupKnot) {
        let children = tokenGroup.getChildren();

        while (true) {
            // find operator with highest precedence
            let highestIndex = -1;
            let currentPrecedence = -1;
            children.forEach((child, index) => {
                if (child instanceof TokenGroupLeaf && tokenTypesWithOperatorCharacter.includes(child.getToken().type)) {
                    const controlStruct =
                        tokenTypesWithOperatorCharacterDefinitions[child.getToken().type as tokenTypesWithOperatorCharacterType];
                    // either the precedence is higher, or the function only takes to the right and it is the same
                    // this is important, because reading direction is left to right, if it doesn't take before it, it is important, that the rightmost one is taken
                    if (
                        currentPrecedence < controlStruct.precedence ||
                        (controlStruct.takesNrArgumentsBefore == 0 && currentPrecedence <= controlStruct.precedence)
                    ) {
                        highestIndex = index;
                        currentPrecedence = controlStruct.precedence;
                    }
                }
            });

            // no more operator to process
            if (highestIndex == -1) {
                break;
            }

            // process the operator with highest precedence
            const beginningPortion = children.slice(0, highestIndex);
            const currentOperator = children[highestIndex];
            const afterPortion = children.slice(highestIndex + 1);

            if (currentOperator instanceof TokenGroupLeaf) {
                const type = currentOperator.getToken().type;
                const content = currentOperator.getToken().content;
                const controlStruct = tokenTypesWithOperatorCharacterDefinitions[type as tokenTypesWithOperatorCharacterType];

                // extract elements from before the operator
                let beforeBuffer = [] as TokenGroup[];
                let skippedBefore = 0;
                for (let i = beginningPortion.length - controlStruct.takesNrArgumentsBefore; i < beginningPortion.length; i++) {
                    const elementToTakeFromBefore = beginningPortion[i];

                    // can take the next tokens if:
                    //        - they are a knot,
                    //        - they are a "logical" Leaf (here == not included in OperatorType leaves)
                    if (
                        elementToTakeFromBefore instanceof TokenGroupKnot ||
                        elementToTakeFromBefore instanceof TokenGroupKnotInfix ||
                        (elementToTakeFromBefore instanceof TokenGroupLeaf &&
                            !tokenTypesWithOperatorCharacter.includes(elementToTakeFromBefore.getToken().type))
                    ) {
                        skippedBefore += 1;
                        beforeBuffer.push(elementToTakeFromBefore);
                    }
                }
                if (beforeBuffer.length != controlStruct.takesNrArgumentsBefore) {
                    throw Error(
                        `Operator ${type}:${content} takes ${controlStruct.takesNrArgumentsBefore} arguments before it, but ${beforeBuffer.length} were supplied`
                    );
                }

                // extract elements from after the operator
                const canTakeRepeated = repeatableTokenTypesWithOperatorCharacter.includes(type);
                const takeMax = canTakeRepeated
                    ? controlStruct.takesNrArgumentsAfter + (controlStruct.takesNrArgumentsAfter + 1) * 99999
                    : controlStruct.takesNrArgumentsAfter;
                let afterBuffer = [] as TokenGroup[];
                let skippedAfter = 0;
                let stillNeeded = controlStruct.takesNrArgumentsAfter;
                for (let j = 0; j < afterPortion.length && j < takeMax; j++) {
                    const elementToTakeFromAfter = afterPortion[j];

                    // can take the next tokens if:
                    //        - they are a knot,
                    //        - they are a "logical" Leaf
                    //                  - not included in OperatorType leaves
                    //                  - not a Structural leaf
                    //        - its the empty argument which is allowed
                    if (
                        elementToTakeFromAfter instanceof TokenGroupKnot ||
                        elementToTakeFromAfter instanceof TokenGroupKnotInfix ||
                        (elementToTakeFromAfter instanceof TokenGroupLeaf &&
                            !tokenTypesWithOperatorCharacter.includes(elementToTakeFromAfter.getToken().type) &&
                            elementToTakeFromAfter.getToken().type != TokenType.Structural) ||
                        (elementToTakeFromAfter instanceof TokenGroupLeaf &&
                            elementToTakeFromAfter.getToken().type == TokenType.Structural &&
                            AllowedStructuralKeywordMapping[elementToTakeFromAfter.getToken().content] ==
                                OperatorType.EmptyArgument)
                    ) {
                        if (stillNeeded == 0) {
                            throw Error(
                                `Operator ${type}:${content} takes ${controlStruct.takesNrArgumentsAfter} afterwards but they have already been found and there are still some left`
                            );
                        }

                        skippedAfter += 1;
                        stillNeeded -= 1;
                        afterBuffer.push(elementToTakeFromAfter);
                    }
                    // can try to continue to take the next tokens if:
                    //        - We are in repeatable mode
                    //        - AND this operator is the same as the one currently processed
                    else if (
                        canTakeRepeated &&
                        elementToTakeFromAfter instanceof TokenGroupLeaf &&
                        elementToTakeFromAfter.getToken().type == type
                    ) {
                        if (stillNeeded != 0) {
                            // Currently impossible to trigger, because all repeatable operations only take one argument afterwards
                            throw Error(
                                `Repeat of Operator ${type}:${content} takes ${
                                    controlStruct.takesNrArgumentsAfter
                                } afterwards but only ${
                                    controlStruct.takesNrArgumentsAfter - stillNeeded
                                } have been processed until the end`
                            );
                        }

                        // only skip, do not want to push operator into infix-children
                        skippedAfter += 1;
                        // set repeated tracking
                        stillNeeded = controlStruct.takesNrArgumentsAfter;
                    } else {
                        break;
                    }
                }
                if (stillNeeded != 0) {
                    throw Error(
                        `Operator ${type}:${content} takes ${controlStruct.takesNrArgumentsAfter} afterwards but only ${
                            controlStruct.takesNrArgumentsAfter - stillNeeded
                        } have been processed until the end`
                    );
                }

                const recBeforeBuffer = beforeBuffer.map((child) => fixOperatorPrecedenceGroupingRecursive(child));
                let recAfterBuffer = [];
                recAfterBuffer = afterBuffer.map((child) => fixOperatorPrecedenceGroupingRecursive(child));
                // group into new element and update-remove the used stuff for the next iteration
                const newExtraGroup = new TokenGroupKnotInfix(currentOperator, [...recBeforeBuffer, ...recAfterBuffer]);

                children = [
                    ...beginningPortion.splice(0, beginningPortion.length - skippedBefore),
                    newExtraGroup,
                    ...afterPortion.splice(skippedAfter),
                ];
            } else {
                throw Error("Unreachable, or else the highest precedence search failed");
            }
        }

        if (children.length == 1) {
            return children[0]; // do not add an unnecessary group for one element
        } else {
            // multiple elements left: must have something to do with structural elements (=, !=, \iff) or raw Latex
            // as the children here lay flat, they will not have been processed yet when being integrated into a group like above
            return new TokenGroupKnotInfixStructural(children.map((child) => fixOperatorPrecedenceGroupingRecursive(child)));
        }
    }
    // leaf
    return tokenGroup;
}

function infixTokenGroupTreeToExportOperatorTreeRecursive(tokenGroup: TokenGroup): ExportOperatorContent {
    if (tokenGroup instanceof TokenGroupLeaf) {
        const token = tokenGroup.getToken();

        switch (token.type) {
            case TokenType.Number:
                return {
                    type: OperatorType.Numerical,
                    value: token.content,
                    children: [],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Other:
                return {
                    type: OperatorType.Variable,
                    value: token.content,
                    children: [],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Structural:
                // structural if not in predefined list, render as raw latex
                for (let i = 0; i < AllowedStructuralKeywords.length; i++) {
                    if (token.content == AllowedStructuralKeywords[i]) {
                        return {
                            type: AllowedStructuralKeywordMapping[AllowedStructuralKeywords[i]],
                            value: "",
                            children: [],
                            uuid: "",
                        } as ExportOperatorContent;
                    }
                }

                return {
                    type: OperatorType.RawLatex,
                    value: token.content,
                    children: [],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Constant:
                const operatorToken = tokenGroup.getToken();
                return {
                    type: operatorToken.content,
                    value: "",
                    children: [],
                    uuid: "",
                } as ExportOperatorContent;

            default:
                throw Error(`Singular token without implemented Export target type ${token.type} `);
        }
    } else if (tokenGroup instanceof TokenGroupKnotInfixStructural) {
        // catch this before the next switch, because all TokenGroupKnotInfixStructural are also TokenGroupKnotInfix
        const children = tokenGroup.getChildren().map((child) => infixTokenGroupTreeToExportOperatorTreeRecursive(child));

        return {
            type: OperatorType.StructuralContainer,
            value: "",
            children: children,
            uuid: "",
        } as ExportOperatorContent;
    } else if (tokenGroup instanceof TokenGroupKnotInfix) {
        const operatorToken = tokenGroup.getOperator().getToken();
        const children = tokenGroup.getChildren().map((child) => infixTokenGroupTreeToExportOperatorTreeRecursive(child));

        switch (operatorToken.type) {
            case TokenType.StructuralSeparation:
                return {
                    type: OperatorType.StructuralContainer,
                    value: "",
                    children: children,
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Plus:
                return {
                    type: OperatorType.BracketedSum,
                    value: "",
                    children: children,
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Multiplicate:
                return {
                    type: OperatorType.BracketedMultiplication,
                    value: "",
                    children: children,
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Minus:
                return {
                    type: OperatorType.Negation,
                    value: "",
                    children: [children[0]],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Divide:
                return {
                    type: OperatorType.Fraction,
                    value: "",
                    children: [children[0], children[1]],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Power:
                return {
                    type: OperatorType.Power,
                    value: "",
                    children: [children[0], children[1]],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Faculty:
                return {
                    type: OperatorType.Faculty,
                    value: "",
                    children: [children[0]],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Percent:
                return {
                    type: OperatorType.Percent,
                    value: "",
                    children: [children[0]],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Function:
                let childrenForFunctionOperator = [children[0]];

                // extract if arguments are from group
                if (
                    tokenGroup.getChildren()[0] instanceof TokenGroupKnotInfix &&
                    // Convenience feature: keep the group for functions that only take one argument (= the group)
                    // With this exp(1 2 3) works, even though exp doesn't take 3 arguments
                    // also kind of required, because manual exp((1 2 3)) would remove unnecessary brackets beforehand, so the exception would need to be implemented there
                    !(
                        MIN_CHILDREN_SPECIFICATIONS[operatorToken.content as OperatorType] == 1 &&
                        MAX_CHILDREN_SPECIFICATIONS[operatorToken.content as OperatorType] == 1
                    )
                ) {
                    childrenForFunctionOperator = children[0].children; // because has already been processed above
                }

                if (
                    childrenForFunctionOperator.length < MIN_CHILDREN_SPECIFICATIONS[operatorToken.content as OperatorType] ||
                    childrenForFunctionOperator.length > MAX_CHILDREN_SPECIFICATIONS[operatorToken.content as OperatorType]
                ) {
                    throw Error(
                        `Function of subtype ${operatorToken.content} requires between ${
                            MIN_CHILDREN_SPECIFICATIONS[operatorToken.content as OperatorType]
                        } and ${
                            MAX_CHILDREN_SPECIFICATIONS[operatorToken.content as OperatorType]
                        } arguments in its arguments, but ${
                            childrenForFunctionOperator.length
                        } were provided. Arguments need to be supplied as a group with ; as argument delimiter. e.g. sum(n=1; \\infty; n)`
                    );
                }

                return {
                    type: operatorToken.content,
                    value: "",
                    children: childrenForFunctionOperator,
                    uuid: "",
                } as ExportOperatorContent;

            default:
                throw Error(`Group translation not implemented for operator ${operatorToken.type}`);
        }
    } else {
        throw Error(
            `Only the types TokenGroupKnotInfix, TokenGroupKnotInfixStructural and TokenGroupLeaf should exist... TokenGroupKnot should have been converted to TokenGroupKnotInfix`
        );
    }
}
