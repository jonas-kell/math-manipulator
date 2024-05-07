import {
    Operator,
    ExportOperatorContent,
    OperatorType,
    MAX_CHILDREN_SPECIFICATIONS,
    MIN_CHILDREN_SPECIFICATIONS,
    OperatorConfig,
    useMacrosStore,
    DefinedMacro,
    DefinedMacroArgument,
} from "./exporter";

/**
 * @throws Error on failing to tokenize/parse
 */
export function operatorFromString(config: OperatorConfig, input: string): Operator {
    const parsedExport = parseStringToExportOperatorContent(config, input);
    const generatedStructure = Operator.generateStructure(config, JSON.stringify(parsedExport), false);

    return generatedStructure;
}

function parseStringToExportOperatorContent(config: OperatorConfig, input: string): ExportOperatorContent {
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

    const tokens = tokenize(config, input);
    const grouped = groupTokenStream(config, tokens);
    const exportOperators = infixTokenGroupTreeToExportOperatorTreeRecursive(config, grouped);

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
    Macro = "Macro",
    BeforeFunction = "BeforeFunction",
    String = "String",
    RawLatex = "RawLatex",
}

// ! Reserved Symbols with own token
const PowerSignSymbol = "$POWERSIGN$";
const StringDelimiterSymbol = '"';
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
} as { [key: string]: TokenType };
const AllowedReservedSymbols = [...Object.keys(AllowedReservedSymbolsMapping), StringDelimiterSymbol];

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

// ! Pre-defined BeforeFunctions (that stand after their argument)
// Caution, these and all above count as completely reserved, not only if whitespace surrounded, like below (will break up other arguments if contained in them)
const AllowedBeforeFunctionKeywordMapping = {
    "!": OperatorType.Faculty,
    "%": OperatorType.Percent,
} as { [key: string]: OperatorType };
const AllowedBeforeFunctionKeywords = Object.keys(AllowedBeforeFunctionKeywordMapping);

// ! Pre-defined Functions
const AllowedFunctionKeywordMapping = {
    sum: OperatorType.BigSum,
    int: OperatorType.BigInt,
    exp: OperatorType.Exp,
    bra: OperatorType.Bra,
    ket: OperatorType.Ket,
    braket: OperatorType.Braket,
    bracket: OperatorType.Bracket,
    fc: OperatorType.FermionicCreationOperator,
    "f#": OperatorType.FermionicCreationOperator,
    fa: OperatorType.FermionicAnnihilationOperator,
    bc: OperatorType.BosonicCreationOperator,
    "b#": OperatorType.BosonicCreationOperator,
    ba: OperatorType.BosonicAnnihilationOperator,
    func: OperatorType.FunctionMathMode,
    funcrm: OperatorType.FunctionMathRm,
    sin: OperatorType.Sin,
    cos: OperatorType.Cos,
    sqrt: OperatorType.Sqrt,
    delta: OperatorType.KroneckerDelta,
    complex: OperatorType.ComplexOperatorConstruct,
    comm: OperatorType.Commutator,
    acomm: OperatorType.AntiCommutator,
    [DefinedMacroArgument.DEFINED_MACRO_ARGUMENT_SIGN_SYMBOL]: OperatorType.DefinedMacroArgument,
    dist: OperatorType.Distinct,
} as { [key: string]: OperatorType };
const functionsWithArgumentsConsideredStructural = [
    // only makes a difference for functions that take more than exactly one argument
    OperatorType.Bra,
    OperatorType.Ket,
] as OperatorType[];
const AllowedFunctionKeywords = Object.keys(AllowedFunctionKeywordMapping);

// ! Pre-defined Constants (=Functions without arguments)
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
    ...AllowedBeforeFunctionKeywords,
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

function tokenize(config: OperatorConfig, input: string): Token[] {
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

        if (currentBuf.startsWith(StringDelimiterSymbol)) {
            const restOfString = stringToProcess
                .substring(startIndex)
                .trimStart()
                .substring(StringDelimiterSymbol.length)
                .trimStart();
            const nextStringDelimIndex = restOfString.indexOf(StringDelimiterSymbol);

            if (nextStringDelimIndex == -1) {
                throw Error("Start string delimiter without corresponding end delimiter");
            }

            const stringValue = restOfString.substring(0, nextStringDelimIndex).trim();
            tokens.push({
                type: TokenType.String,
                content: stringValue,
            });

            wordFound = true;
            endIndex =
                stringToProcess.indexOf(
                    StringDelimiterSymbol,
                    stringToProcess.indexOf(StringDelimiterSymbol, startIndex) + StringDelimiterSymbol.length
                ) + StringDelimiterSymbol.length;
        }

        // only attempt to parse if substring is finished
        if (!wordFound && currentBuf.endsWith(" ")) {
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
            for (let i = 0; i < AllowedBeforeFunctionKeywords.length; i++) {
                if (currentBufWord == AllowedBeforeFunctionKeywords[i]) {
                    tokens.push({
                        type: TokenType.BeforeFunction,
                        content: AllowedBeforeFunctionKeywordMapping[AllowedBeforeFunctionKeywords[i]],
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

            // try parsing as macro
            const MacroTriggers = useMacrosStore().availableAllowedMacroTriggers(config);
            for (let i = 0; i < MacroTriggers.length; i++) {
                if (currentBufWord == MacroTriggers[i]) {
                    tokens.push({
                        type: TokenType.Macro,
                        content: MacroTriggers[i],
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
                    currentBufWord.includes("}") ||
                    currentBufWord.includes("$");
                tokens.push({ type: likelyLatex ? TokenType.RawLatex : TokenType.Other, content: currentBufWord });
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
            if (!wordFound && currentBuf != "" && /* c8 ignore next */ currentBuf != " ") {
                /* c8 ignore next */
                throw Error(`Should not be possible, token #${currentBuf}# could not be tokenized.`);
                /* c8 ignore next */
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

function groupTokenStream(config: OperatorConfig, tokens: Token[]): TokenGroup {
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

    /* c8 ignore next */ if (res[1] < tokens.length) {
        /* c8 ignore next */
        throw Error("Should not be possible, not all tokens have been processed in the grouping stage");
        /* c8 ignore next */
    }
    const trimmed = trimTokenGroupRecursive(res[0]);
    const implicitOperationsInserted = insertImpliedOperationsRecursive(config, trimmed);
    const precedenceFixed = fixOperatorPrecedenceGrouping(config, implicitOperationsInserted);

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

const implyStructuralSeparationBehind = [
    TokenType.Other,
    TokenType.Number,
    TokenType.Constant,
    TokenType.Structural,
    TokenType.BeforeFunction,
    TokenType.String,
    TokenType.RawLatex,
]; // Plus groups aka most of the time brackets // Plus Macros WITHOUT Arguments
const implyStructuralSeparationInFront = [
    TokenType.Other,
    TokenType.Number,
    TokenType.Function,
    TokenType.Constant,
    TokenType.Structural,
    TokenType.Macro,
    TokenType.String,
    TokenType.RawLatex,
]; // Plus groups aka most of the time brackets
const structuralSeparationCanBeInsertedOutsideOfFunctionArguments = [
    TokenType.String,
    TokenType.RawLatex,
    TokenType.Macro,
    TokenType.Structural,
];
const implyMultiplicationBehind = [TokenType.Other, TokenType.Number, TokenType.Constant, TokenType.BeforeFunction]; // Plus groups aka most of the time brackets // Plus Macros WITHOUT Arguments
const implyMultiplicationInFront = [TokenType.Other, TokenType.Number, TokenType.Function, TokenType.Constant, TokenType.Macro]; // Plus groups aka most of the time brackets
const implyAdditionBehind = [TokenType.Other, TokenType.Number, TokenType.Constant, TokenType.BeforeFunction]; // Plus groups aka most of the time brackets // Plus Macros WITHOUT Arguments
const implyAdditionInFront = [TokenType.Minus]; // ! here NOT groups

function insertImpliedOperationsRecursive(
    config: OperatorConfig,
    tokenGroup: TokenGroup,
    insertStructuralSeparation: boolean = false
): TokenGroup {
    if (tokenGroup instanceof TokenGroupKnot) {
        let children = tokenGroup.getChildren();

        let newChildren = [] as TokenGroup[];

        for (let i = 0; i < children.length; i++) {
            let firstNeedsStructuralSeparation = false;
            let secondNeedsStructuralSeparation = false;
            let oneAllowsStructuralOutsideArguments = false;
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
                    (first instanceof TokenGroupLeaf &&
                        (implyStructuralSeparationBehind.includes(first.getToken().type) ||
                            (first.getToken().type == TokenType.Macro &&
                                calculateNecessaryNumberOfArgumentsForMacro(config, first.getToken()) == 0))))
            ) {
                firstNeedsStructuralSeparation = true;
            }
            if (
                second instanceof TokenGroupKnot ||
                (second instanceof TokenGroupLeaf && implyStructuralSeparationInFront.includes(second.getToken().type))
            ) {
                secondNeedsStructuralSeparation = true;
            }
            if (
                first &&
                first != undefined &&
                first instanceof TokenGroupLeaf &&
                structuralSeparationCanBeInsertedOutsideOfFunctionArguments.includes(first.getToken().type)
            ) {
                oneAllowsStructuralOutsideArguments = true;
            }
            if (
                second instanceof TokenGroupLeaf &&
                structuralSeparationCanBeInsertedOutsideOfFunctionArguments.includes(second.getToken().type)
            ) {
                oneAllowsStructuralOutsideArguments = true;
            }
            // update multiplication logic
            if (
                first &&
                first != undefined &&
                (first instanceof TokenGroupKnot ||
                    (first instanceof TokenGroupLeaf &&
                        (implyMultiplicationBehind.includes(first.getToken().type) ||
                            (first.getToken().type == TokenType.Macro &&
                                calculateNecessaryNumberOfArgumentsForMacro(config, first.getToken()) == 0))))
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
                    (first instanceof TokenGroupLeaf &&
                        (implyAdditionBehind.includes(first.getToken().type) ||
                            (first.getToken().type == TokenType.Macro &&
                                calculateNecessaryNumberOfArgumentsForMacro(config, first.getToken()) == 0))))
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

            // TODO f#("" n-1) doesn't work, because this requires insertion of ; and + (do not know if it is worth fixing this) --- f#("" (n-1)) and f#("" n+-1) work ----
            // Precedence must stay structural before multiplication and multiplication before addition. But in structural allowed mode, we may do addition before strucutral (I think it doesn't break stuff)

            // case: we are in a default mode. Here default assumption takes place
            if (
                first &&
                first != undefined &&
                first instanceof TokenGroupLeaf &&
                ((first.getToken().type == TokenType.Function &&
                    ((maxNumChildrenParser(first.getToken().content as OperatorType) > 1 && // ONLY IF ONE OR MORE ARGUMENTS
                        minNumChildrenParser(first.getToken().content as OperatorType) > 1) ||
                        functionsWithArgumentsConsideredStructural.includes(first.getToken().content as OperatorType))) ||
                    (first.getToken().type == TokenType.Macro &&
                        calculateNecessaryNumberOfArgumentsForMacro(config, first.getToken()) > 1))
            ) {
                // Special case: the element after a function/macro(that takes arguments) is the argument (bracket)
                // NEVER insert operations before
                // ONLY insert operations in between, when the function takes more than one argument
                if (second instanceof TokenGroupLeaf) {
                    // insert single argument wrapped in a group
                    newChildren.push(new TokenGroupKnot([second]));
                } else {
                    if (second instanceof TokenGroupKnot) {
                        // recursive call that makes sure
                        newChildren.push(insertImpliedOperationsRecursive(config, second, true));
                    } /* c8 ignore next */ else {
                        /* c8 ignore next */
                        throw Error("Unreachable. At this point there should only exist TokenGroupLeaves and TokenGroupKnots.");
                        /* c8 ignore next */
                    }
                }
            } else {
                let inserted = false;
                // case: if we are inside of a function arguments bracket, force insertion of structural delimiters
                if (!insertStructuralSeparation) {
                    // check if need insert multiplication
                    if (!inserted && firstNeedsMultiplication && secondNeedsMultiplication) {
                        inserted = true;
                        newChildren.push(
                            // insert implicit multiplication
                            new TokenGroupLeaf({
                                type: TokenType.Multiplicate,
                                content: "",
                            })
                        );
                    }
                    // check if need insert addition
                    if (!inserted && firstNeedsAddition && secondNeedsAddition) {
                        newChildren.push(
                            // insert implicit addition
                            new TokenGroupLeaf({
                                type: TokenType.Plus,
                                content: "",
                            })
                        );
                    }
                }
                // no multiplication or addition was chosen (or their influence was blocked)
                if (insertStructuralSeparation || oneAllowsStructuralOutsideArguments) {
                    if (!inserted && firstNeedsStructuralSeparation && secondNeedsStructuralSeparation) {
                        newChildren.push(
                            // insert implicit structural separation
                            new TokenGroupLeaf({
                                type: TokenType.StructuralSeparation,
                                content: "",
                            })
                        );
                    }
                }

                // insert self
                newChildren.push(insertImpliedOperationsRecursive(config, second));
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
    | TokenType.Divide
    | TokenType.Power
    | TokenType.BeforeFunction
    | TokenType.Function
    | TokenType.Macro
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
    // Minus, Function and Macro(for more than 0 parameters) work exactly the same, therefore same precedence!!
    // Macro for 0 parameters takes 0 parameters, so no sweat and this works generally
    [TokenType.Minus]: {
        // only one-after-it type of minus (THEREFORE same as function)
        precedence: 1000,
        takesNrArgumentsAfter: 1,
        takesNrArgumentsBefore: 0,
    },
    [TokenType.Function]: {
        precedence: 1000,
        takesNrArgumentsAfter: 1,
        takesNrArgumentsBefore: 0,
    },
    [TokenType.Macro]: {
        precedence: 1000,
        takesNrArgumentsAfter: -1, // will get overwritten, depends on the macro
        takesNrArgumentsBefore: 0,
    },
    [TokenType.BeforeFunction]: {
        precedence: 3000,
        takesNrArgumentsBefore: 1,
        takesNrArgumentsAfter: 0,
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
function fixOperatorPrecedenceGrouping(config: OperatorConfig, tokenGroup: TokenGroup): TokenGroup {
    if (tokenGroup instanceof TokenGroupLeaf && tokenTypesWithOperatorCharacter.includes(tokenGroup.getToken().type)) {
        const token = tokenGroup.getToken();
        const type = token.type;
        // Constants do not take any arguments!
        // Macros WITH arguments must also be filtered here
        if (
            !(type == TokenType.Constant) &&
            !(type == TokenType.Macro && calculateNecessaryNumberOfArgumentsForMacro(config, token) == 0)
        ) {
            throw Error(
                `Operator ${tokenGroup.getToken().type}:${
                    tokenGroup.getToken().content
                } alone on top level, which is not possible`
            );
        }
    }

    return fixOperatorPrecedenceGroupingRecursive(config, tokenGroup);
}

/**
 * Documentation @see fixOperatorPrecedenceGrouping
 */
function fixOperatorPrecedenceGroupingRecursive(config: OperatorConfig, tokenGroup: TokenGroup): TokenGroup {
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
                const token = currentOperator.getToken();
                const type = token.type;
                const content = token.content;
                const controlStruct = tokenTypesWithOperatorCharacterDefinitions[type as tokenTypesWithOperatorCharacterType];
                let takesNrArgumentsAfter = controlStruct.takesNrArgumentsAfter;
                const takesNrArgumentsBefore = controlStruct.takesNrArgumentsBefore;
                // takesNrArgumentsAfter for macros not defined by the control struct
                if (type == TokenType.Macro) {
                    if (calculateNecessaryNumberOfArgumentsForMacro(config, token) > 0) {
                        takesNrArgumentsAfter = 1;
                    } else {
                        takesNrArgumentsAfter = 0;
                    }
                }

                // extract elements from before the operator
                let beforeBuffer = [] as TokenGroup[];
                let skippedBefore = 0;
                for (let i = beginningPortion.length - takesNrArgumentsBefore; i < beginningPortion.length; i++) {
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
                if (beforeBuffer.length != takesNrArgumentsBefore) {
                    throw Error(
                        `Operator ${type}:${content} takes ${takesNrArgumentsBefore} arguments before it, but ${beforeBuffer.length} were supplied`
                    );
                }

                // extract elements from after the operator
                const canTakeRepeated = repeatableTokenTypesWithOperatorCharacter.includes(type);
                const takeMax = canTakeRepeated
                    ? takesNrArgumentsAfter + (takesNrArgumentsAfter + 1) * 99999
                    : takesNrArgumentsAfter;
                let afterBuffer = [] as TokenGroup[];
                let skippedAfter = 0;
                let stillNeeded = takesNrArgumentsAfter;
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
                            !tokenTypesWithOperatorCharacter.includes(elementToTakeFromAfter.getToken().type))
                    ) {
                        /* c8 ignore next */ // !! I THINK this is impossible now. But no guarantee
                        if (stillNeeded == 0) {
                            /* c8 ignore next */
                            throw Error(
                                /* c8 ignore next */
                                `Operator ${type}:${content} takes ${takesNrArgumentsAfter} afterwards but they have already been found and there are still some left`
                                /* c8 ignore next */
                            );
                            /* c8 ignore next */
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
                        // !! Currently impossible to trigger, because all repeatable operations only take one argument afterwards
                        /* c8 ignore next */ if (stillNeeded != 0) {
                            /* c8 ignore next */
                            throw Error(
                                /* c8 ignore next */
                                `Repeat of Operator ${type}:${content} takes ${takesNrArgumentsAfter} afterwards but only ${
                                    /* c8 ignore next */
                                    takesNrArgumentsAfter - stillNeeded
                                    /* c8 ignore next */
                                } have been processed until the end`
                                /* c8 ignore next */
                            );
                            /* c8 ignore next */
                        }

                        // only skip, do not want to push operator into infix-children
                        skippedAfter += 1;
                        // set repeated tracking
                        stillNeeded = takesNrArgumentsAfter;
                    } else {
                        break;
                    }
                }
                if (stillNeeded != 0) {
                    throw Error(
                        `Operator ${type}:${content} takes ${takesNrArgumentsAfter} afterwards but only ${
                            takesNrArgumentsAfter - stillNeeded
                        } have been processed until the end`
                    );
                }

                const recBeforeBuffer = beforeBuffer.map((child) => fixOperatorPrecedenceGroupingRecursive(config, child));
                let recAfterBuffer = [];
                recAfterBuffer = afterBuffer.map((child) => fixOperatorPrecedenceGroupingRecursive(config, child));
                // group into new element and update-remove the used stuff for the next iteration
                const newExtraGroup = new TokenGroupKnotInfix(currentOperator, [...recBeforeBuffer, ...recAfterBuffer]);

                children = [
                    ...beginningPortion.slice(0, beginningPortion.length - skippedBefore),
                    newExtraGroup,
                    ...afterPortion.slice(skippedAfter),
                ];
            } /* c8 ignore next */ else {
                /* c8 ignore next */
                throw Error("Unreachable, or else the highest precedence search failed");
                /* c8 ignore next */
            }
        }

        if (children.length == 1) {
            return children[0]; // do not add an unnecessary group for one element
        } else {
            // multiple elements left: must have something to do with structural elements (=, !=, \iff) or raw Latex
            // as the children here lay flat, they will not have been processed yet when being integrated into a group like above
            return new TokenGroupKnotInfixStructural(
                children.map((child) => fixOperatorPrecedenceGroupingRecursive(config, child))
            );
        }
    }
    // leaf
    return tokenGroup;
}

function infixTokenGroupTreeToExportOperatorTreeRecursive(config: OperatorConfig, tokenGroup: TokenGroup): ExportOperatorContent {
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
            case TokenType.RawLatex:
                return {
                    type: OperatorType.RawLatex,
                    value: token.content,
                    children: [],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Structural:
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
                /* c8 ignore next */
                throw Error(`Unreachable, no structural target found for type ${token.content}`);
            case TokenType.Constant:
                const operatorTokenConstant = tokenGroup.getToken();
                return {
                    type: operatorTokenConstant.content,
                    value: "",
                    children: [],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Macro:
                const operatorTokenMacro = tokenGroup.getToken();
                return {
                    type: OperatorType.DefinedMacro,
                    value: operatorTokenMacro.content, // trigger
                    children: [],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.String:
                return {
                    type: OperatorType.String,
                    value: token.content,
                    children: [],
                    uuid: "",
                } as ExportOperatorContent;
            /* c8 ignore next */ //!! Will probably fail every time a new operator is implemented, but not on working runtime
            default:
                /* c8 ignore next */
                throw Error(`Singular token without implemented Export target type ${token.type} `);
            /* c8 ignore next */
        }
        /* c8 ignore next */
    } else if (tokenGroup instanceof TokenGroupKnotInfixStructural) {
        // catch this before the next switch, because all TokenGroupKnotInfixStructural are also TokenGroupKnotInfix
        const children = tokenGroup.getChildren().map((child) => infixTokenGroupTreeToExportOperatorTreeRecursive(config, child));

        return {
            type: OperatorType.StructuralContainer,
            value: "",
            children: children,
            uuid: "",
        } as ExportOperatorContent;
    } else if (tokenGroup instanceof TokenGroupKnotInfix) {
        const operatorToken = tokenGroup.getOperator().getToken();
        const children = tokenGroup.getChildren().map((child) => infixTokenGroupTreeToExportOperatorTreeRecursive(config, child));

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
            case TokenType.BeforeFunction:
            case TokenType.Function:
                let childrenForFunctionOperator = [children[0]];

                // extract if arguments are from group
                if (
                    tokenGroup.getChildren()[0] instanceof TokenGroupKnotInfix &&
                    // Convenience feature: keep the group for functions that only take one argument (= the group)
                    // With this exp(1 2 3) works, even though exp doesn't take 3 arguments
                    // also kind of required, because manual exp((1 2 3)) would remove unnecessary brackets beforehand, so the exception would need to be implemented there
                    !(
                        minNumChildrenParser(operatorToken.content as OperatorType) == 1 &&
                        maxNumChildrenParser(operatorToken.content as OperatorType) == 1
                    )
                ) {
                    childrenForFunctionOperator = children[0].children; // because has already been processed above
                }

                if (
                    childrenForFunctionOperator.length < minNumChildrenParser(operatorToken.content as OperatorType) ||
                    childrenForFunctionOperator.length > maxNumChildrenParser(operatorToken.content as OperatorType)
                ) {
                    throw Error(
                        `Function of subtype ${operatorToken.content} requires between ${minNumChildrenParser(
                            operatorToken.content as OperatorType
                        )} and ${maxNumChildrenParser(operatorToken.content as OperatorType)} arguments in its arguments, but ${
                            childrenForFunctionOperator.length
                        } were provided. Arguments need to be supplied as a group with ; as argument delimiter. e.g. sum(n=1; \\infty; n)`
                    );
                }

                if (takesAdditionalStringFirstArgument(operatorToken.content as OperatorType)) {
                    const childrenWithoutFirstString = childrenForFunctionOperator.slice(1);
                    const stringArg = childrenForFunctionOperator[0];

                    if (stringArg.type != OperatorType.String) {
                        throw Error(`First Argument of the function type:${operatorToken.content} needs to be a string ("...")`);
                    }

                    return {
                        type: operatorToken.content,
                        value: stringArg.value,
                        children: childrenWithoutFirstString,
                        uuid: "",
                    } as ExportOperatorContent;
                } else {
                    return {
                        type: operatorToken.content,
                        value: "",
                        children: childrenForFunctionOperator,
                        uuid: "",
                    } as ExportOperatorContent;
                }

            case TokenType.Macro:
                let childrenForMacro = [] as ExportOperatorContent[];
                if (children[0] && children[0] != undefined) {
                    childrenForMacro = [children[0]];
                }

                const numberChildrenMacro = calculateNecessaryNumberOfArgumentsForMacro(config, operatorToken);

                // extract if arguments are from group
                if (
                    tokenGroup.getChildren()[0] instanceof TokenGroupKnotInfix &&
                    // Convenience feature: keep the group for functions that only take one argument (= the group)
                    // With this exp(1 2 3) works, even though exp doesn't take 3 arguments
                    // also kind of required, because manual exp((1 2 3)) would remove unnecessary brackets beforehand, so the exception would need to be implemented there
                    !(numberChildrenMacro == 1)
                ) {
                    childrenForMacro = children[0].children; // because has already been processed above
                }

                if (childrenForMacro.length != numberChildrenMacro) {
                    throw Error(
                        `Macro ${operatorToken.content} requires ${numberChildrenMacro} arguments, but ${childrenForMacro.length} were provided. Arguments need to be supplied as a group with ; as argument delimiter. e.g. examplemacro(n=1; \\infty; n)`
                    );
                }

                return {
                    type: OperatorType.DefinedMacro,
                    value: operatorToken.content,
                    children: childrenForMacro,
                    uuid: "",
                } as ExportOperatorContent;

            /* c8 ignore next */ //!! Will probably fail every time a new operator is implemented, but not on working runtime
            default:
                /* c8 ignore next */
                throw Error(`Group translation not implemented for operator ${operatorToken.type}`);
        }
        /* c8 ignore next */
    } else {
        /* c8 ignore next */
        throw Error(
            /* c8 ignore next */
            `Only the types TokenGroupKnotInfix, TokenGroupKnotInfixStructural and TokenGroupLeaf should exist... TokenGroupKnot should have been converted to TokenGroupKnotInfix`
            /* c8 ignore next */
        );
        /* c8 ignore next */
    }
}

function calculateNecessaryNumberOfArgumentsForMacro(config: OperatorConfig, token: Token): number {
    /* c8 ignore next */
    if (token.type != TokenType.Macro) {
        /* c8 ignore next */
        throw Error("Unreachable, this should not happen: Only TokenType.Macro may be used here");
        /* c8 ignore next */
    }

    return DefinedMacro.getNumberOfIntendedChildren(config, token.content);
}

function takesAdditionalStringFirstArgument(type: OperatorType): boolean {
    const functionConvertsFirstStringArgumentToValue = [
        OperatorType.FermionicCreationOperator,
        OperatorType.FermionicAnnihilationOperator,
        OperatorType.BosonicAnnihilationOperator,
        OperatorType.BosonicCreationOperator,
        OperatorType.FunctionMathMode,
        OperatorType.FunctionMathRm,
    ];

    return functionConvertsFirstStringArgumentToValue.includes(type);
}

function minNumChildrenParser(type: OperatorType): number {
    let base = MIN_CHILDREN_SPECIFICATIONS[type];

    if (takesAdditionalStringFirstArgument(type)) {
        base += 1;
    }

    return base;
}

function maxNumChildrenParser(type: OperatorType): number {
    let base = MAX_CHILDREN_SPECIFICATIONS[type];

    if (takesAdditionalStringFirstArgument(type)) {
        base += 1;
    }

    return base;
}
