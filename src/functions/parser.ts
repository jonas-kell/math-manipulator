import {
    Operator,
    ExportOperatorContent,
    OperatorType,
    MAX_CHILDREN_SPECIFICATIONS,
    MIN_CHILDREN_SPECIFICATIONS,
} from "./operator";

/**
 * @throws Error on failing to tokenize/parse
 */
export function operatorFromString(input: string): Operator {
    return Operator.generateStructure(JSON.stringify(parseStringToExportOperatorContent(input)), false);
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

    const tokens = tokenize(input);
    return infixTokenGroupTreeToExportOperatorTreeRecursive(groupTokenStream(tokens));
}

enum TokenType {
    Plus = "Plus",
    Minus = "Minus",
    OpenParen = "OpenParen",
    CloseParen = "CloseParen",
    Multiplicate = "Multiplicate",
    Divide = "Divide",
    Function = "Function",
    Number = "Number",
    Other = "Other",
}

enum ReservedWord {
    PlusSign = "+",
    MinusSign = "-",
    MultiplicationSign = "*",
    DivisionSign1 = "/",
    DivisionSign2 = ":",
    OpenParenSign = "(",
    CloseParenSign = ")",
}

const AllowedFunctionKeywordMapping = {
    sum: OperatorType.BigSum,
    int: OperatorType.BigInt,
} as { [key: string]: OperatorType };
const AllowedFunctionKeywords = Object.keys(AllowedFunctionKeywordMapping);

interface Token {
    type: TokenType;
    content: string;
}

function tokenize(input: string): Token[] {
    // make sure, that before all reserved words is at least one space
    let spacesIntroduced = input;
    Object.values(ReservedWord).forEach((word) => {
        spacesIntroduced = spacesIntroduced.replaceAll(word, " " + word + " ");
    });
    spacesIntroduced += " "; // make sure to terminate with space

    // remove all multiple spaces, newlines and so on
    const whitespaceSanitized = spacesIntroduced.replaceAll(/\s+/g, " ");
    const length = whitespaceSanitized.length;

    let tokens = [] as Token[];

    console.log("Input", whitespaceSanitized);

    // cut into typed token stream
    let currentBuf = "";
    let startIndex = 0;
    let endIndex = 1;
    while (true) {
        currentBuf = whitespaceSanitized.substring(startIndex, endIndex).trimStart();

        // test if is reserved word
        let wordFound = false;
        switch (currentBuf) {
            case ReservedWord.PlusSign:
                tokens.push({ type: TokenType.Plus, content: "" });
                wordFound = true;
                break;
            case ReservedWord.MinusSign:
                tokens.push({ type: TokenType.Minus, content: "" });
                wordFound = true;
                break;
            case ReservedWord.MultiplicationSign:
                tokens.push({ type: TokenType.Multiplicate, content: "" });
                wordFound = true;
                break;
            case ReservedWord.DivisionSign1:
            case ReservedWord.DivisionSign2:
                tokens.push({ type: TokenType.Divide, content: "" });
                wordFound = true;
                break;
            case ReservedWord.OpenParenSign:
                tokens.push({ type: TokenType.OpenParen, content: "" });
                wordFound = true;
                break;
            case ReservedWord.CloseParenSign:
                tokens.push({ type: TokenType.CloseParen, content: "" });
                wordFound = true;
                break;
        }
        for (let i = 0; i < AllowedFunctionKeywords.length; i++) {
            if (currentBuf == AllowedFunctionKeywords[i]) {
                tokens.push({
                    type: TokenType.Function,
                    content: AllowedFunctionKeywordMapping[AllowedFunctionKeywords[i]],
                });
                wordFound = true;
                break;
            }
        }

        // only attempt to parse if substring is finished
        if (currentBuf.endsWith(" ")) {
            // try parsing as number
            if (!wordFound) {
                // only if can be parsed as number
                if (!isNaN(Number(currentBuf))) {
                    tokens.push({ type: TokenType.Number, content: String(Number(currentBuf)) });
                    wordFound = true;
                }
            }

            // rest
            if (!wordFound) {
                const w = currentBuf.substring(0, currentBuf.length - 1); // remove space at the end
                tokens.push({ type: TokenType.Other, content: w });
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
        throw Error("Not all tokens have been processed in the grouping stage");
    }
    const trimmed = trimTokenGroupRecursive(res[0]);
    const implicitMultiplyInserted = insertMultiplicationsIntoForbiddenFollowingsRecursive(trimmed);
    console.log(implicitMultiplyInserted);
    const precedenceFixed = fixOperatorPrecedenceGrouping(implicitMultiplyInserted);
    console.log(precedenceFixed);

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

const logicalLeaves = [TokenType.Other, TokenType.Number]; // basically the contrary of operators

function insertMultiplicationsIntoForbiddenFollowingsRecursive(tokenGroup: TokenGroup): TokenGroup {
    if (tokenGroup instanceof TokenGroupKnot) {
        let children = tokenGroup.getChildren().map((child) => insertMultiplicationsIntoForbiddenFollowingsRecursive(child));

        let newChildren = [] as TokenGroup[];
        let prev = "none" as "logical" | "operator" | "none";
        let curr = "none" as "logical" | "operator" | "none";
        children.forEach((oldChild) => {
            // update type
            if (
                oldChild instanceof TokenGroupKnot ||
                (oldChild instanceof TokenGroupLeaf && logicalLeaves.includes(oldChild.getToken().type))
            ) {
                curr = "logical";
            } else {
                curr = "operator";
            }

            // check if need insert multiplication
            if (curr == "logical" && prev == "logical") {
                newChildren.push(
                    // insert implicit multiplication
                    new TokenGroupLeaf({
                        type: TokenType.Multiplicate,
                        content: "",
                    })
                );
            }
            // insert self
            newChildren.push(oldChild);

            // cache prev type
            prev = curr;
        });

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
    | TokenType.Function;

const tokenTypesWithOperatorCharacterDefinitions: { [key in tokenTypesWithOperatorCharacterType]: OperatorCharacter } = {
    [TokenType.Plus]: {
        precedence: 1,
        takesNrArgumentsBefore: 1,
        takesNrArgumentsAfter: 1,
    },
    [TokenType.Multiplicate]: {
        precedence: 100,
        takesNrArgumentsAfter: 1,
        takesNrArgumentsBefore: 1,
    },
    [TokenType.Divide]: {
        precedence: 101,
        takesNrArgumentsAfter: 1,
        takesNrArgumentsBefore: 1,
    },
    [TokenType.Minus]: {
        // only one-after-it type of minus
        precedence: 500,
        takesNrArgumentsBefore: 0,
        takesNrArgumentsAfter: 1,
    },
    [TokenType.Function]: {
        precedence: 1000,
        takesNrArgumentsAfter: 1,
        takesNrArgumentsBefore: 0,
    },
};
const tokenTypesWithOperatorCharacter = Object.keys(tokenTypesWithOperatorCharacterDefinitions);

class TokenGroupKnotInfix extends TokenGroup {
    constructor(private operator: TokenGroupLeaf, private childrenBefore: TokenGroup[], private childrenAfter: TokenGroup[]) {
        super();
    }

    getOperator() {
        return this.operator;
    }

    getChildrenBefore() {
        return this.childrenBefore;
    }

    getChildrenAfter() {
        return this.childrenAfter;
    }
}

/**
 * Converts all TokenGroupKnot into TokenGroupKnotInfix!!
 */
function fixOperatorPrecedenceGrouping(tokenGroup: TokenGroup): TokenGroup {
    if (tokenGroup instanceof TokenGroupLeaf && tokenTypesWithOperatorCharacter.includes(tokenGroup.getToken().type)) {
        throw Error(
            `Operator-Character ${tokenGroup.getToken().type}:${
                tokenGroup.getToken().content
            } alone on top level, which is not possible`
        );
    }

    return fixOperatorPrecedenceGroupingRecursive(tokenGroup);
}

/**
 * flat operation groupings get their depth
 *
 * e.g. 1+2*3 => fixOperatorPrecedenceGroupingRecursive => (1+(2*3))
 *
 * caution: expects for functions that they are followed by one group only. The group was translated typically to be interweaved with * by insertMultiplicationsIntoForbiddenFollowingsRecursive
 * sum 1 2 => insertMultiplicationsIntoForbiddenFollowingsRecursive => sum 1 * 2 => fixOperatorPrecedenceGroupingRecursive => (sum 1) * 2
 * If multiple arguments are needed for a function, grouping beforehand is needed. This however makes the syntax quite neat actually
 * sum(1 2) => insertMultiplicationsIntoForbiddenFollowingsRecursive => sum(1 * 2) => fixOperatorPrecedenceGroupingRecursive => (sum (1 * 2))
 */
function fixOperatorPrecedenceGroupingRecursive(tokenGroup: TokenGroup): TokenGroup {
    if (tokenGroup instanceof TokenGroupKnot) {
        let children = tokenGroup.getChildren().map((child) => fixOperatorPrecedenceGroupingRecursive(child));
        let beforeBuffer = [] as TokenGroup[];
        for (let i = 0; i < children.length; i++) {
            const oldChild = children[i];

            if (oldChild instanceof TokenGroupLeaf && tokenTypesWithOperatorCharacter.includes(oldChild.getToken().type)) {
                const type = oldChild.getToken().type;

                const controlStruct = tokenTypesWithOperatorCharacterDefinitions[type as tokenTypesWithOperatorCharacterType];

                if (beforeBuffer.length != controlStruct.takesNrArgumentsBefore) {
                    throw Error(
                        `Operator-Character ${type}:${oldChild.getToken().content} takes ${
                            controlStruct.takesNrArgumentsBefore
                        } arguments before it, but ${beforeBuffer.length} were supplied`
                    );
                }

                let afterBuffer = [] as TokenGroup[];
                for (let j = i + 1; j < children.length && j - (i + 1) < controlStruct.takesNrArgumentsAfter; j++) {
                    const afterElement = children[j];

                    // can take the next tokens if:
                    //        - they are a group,
                    //        - they are a "logical" Leaf (here == not included in OperatorType leaves)
                    if (
                        afterElement instanceof TokenGroupKnot ||
                        (afterElement instanceof TokenGroupLeaf &&
                            !tokenTypesWithOperatorCharacter.includes(afterElement.getToken().type))
                    ) {
                        afterBuffer.push(afterElement);
                    } else {
                        break;
                    }
                }

                // # must be takesNrArgumentsAfter
                if (afterBuffer.length != controlStruct.takesNrArgumentsAfter) {
                    throw Error(
                        `Operator-Character ${type}:${oldChild.getToken().content} takes ${
                            controlStruct.takesNrArgumentsAfter
                        } arguments after it, but ${afterBuffer.length} were supplied`
                    );
                }

                // advance pointer by how many elements were taken for the afterBuffer
                i += afterBuffer.length;

                // group into new element and insert yourself into the before buffer (for the next operator to take you)
                const newExtraGroup = new TokenGroupKnotInfix(oldChild, beforeBuffer, afterBuffer);
                beforeBuffer = [];
                beforeBuffer.push(newExtraGroup);
            } else {
                beforeBuffer.push(oldChild);
            }
        }

        if (beforeBuffer.length == 1) {
            return beforeBuffer[0]; // avoid adding a unnecessary group for one element
        } else {
            throw Error("Only one element should be in beforeBuffer");
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
            default:
                throw Error(`Singular token without implemented Export target type ${token.type} `);
        }
    } else if (tokenGroup instanceof TokenGroupKnotInfix) {
        const operatorToken = tokenGroup.getOperator().getToken();
        const childrenBefore = tokenGroup
            .getChildrenBefore()
            .map((child) => infixTokenGroupTreeToExportOperatorTreeRecursive(child));
        const childrenAfter = tokenGroup
            .getChildrenAfter()
            .map((child) => infixTokenGroupTreeToExportOperatorTreeRecursive(child));

        switch (operatorToken.type) {
            case TokenType.Plus:
                return {
                    type: OperatorType.BracketedSum,
                    value: "",
                    children: [...childrenBefore, ...childrenAfter],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Multiplicate:
                return {
                    type: OperatorType.BracketedMultiplication,
                    value: "",
                    children: [...childrenBefore, ...childrenAfter],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Minus:
                return {
                    type: OperatorType.Negation,
                    value: "",
                    children: [childrenAfter[0]],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Divide:
                return {
                    type: OperatorType.Fraction,
                    value: "",
                    children: [childrenBefore[0], childrenAfter[0]],
                    uuid: "",
                } as ExportOperatorContent;
            case TokenType.Function:
                const afterGroup = tokenGroup.getChildrenAfter()[0];

                if (afterGroup instanceof TokenGroupKnotInfix) {
                    const childrenForFunctionOperator = afterGroup
                        .getChildrenAfter()
                        .map((child) => infixTokenGroupTreeToExportOperatorTreeRecursive(child));

                    if (
                        childrenForFunctionOperator.length < MIN_CHILDREN_SPECIFICATIONS[operatorToken.content as OperatorType] ||
                        childrenForFunctionOperator.length > MAX_CHILDREN_SPECIFICATIONS[operatorToken.content as OperatorType]
                    ) {
                        throw Error(
                            `Function of subtype ${operatorToken.content} requires between ${
                                MIN_CHILDREN_SPECIFICATIONS[operatorToken.content as OperatorType]
                            } and ${
                                MAX_CHILDREN_SPECIFICATIONS[operatorToken.content as OperatorType]
                            } many arguments in its arguments, but ${childrenForFunctionOperator.length} many were provided`
                        );
                    }

                    switch (operatorToken.content) {
                        case OperatorType.BigSum:
                            return {
                                type: OperatorType.BigSum,
                                value: "",
                                children: [
                                    childrenForFunctionOperator[0],
                                    childrenForFunctionOperator[1],
                                    childrenForFunctionOperator[2],
                                ],
                                uuid: "",
                            } as ExportOperatorContent;
                        default:
                            throw Error(`Function of subtype ${operatorToken.content} has no translation implemented`);
                    }
                }
                throw Error(
                    `Function of subtype ${operatorToken.content} needs to have its arguments as a group without operators. e.g. sum(n=1 \\infty n)`
                );

            default:
                throw Error(`Group translation not implemented for operator ${operatorToken.type}`);
        }
    } else {
        throw Error(
            `Only the types TokenGroupKnotInfix and TokenGroupLeaf should exist... TokenGroupKnot should have been converted to TokenGroupKnotInfix`
        );
    }
}
