import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { BracketedMultiplication, operatorFromString, generateOperatorConfig } from "../functions";

describe("operator module - ordering of operators", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("Default implementation", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "sum({} {} {}) x sum({} {} {})") as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "big_sum",
                    value: "",
                    children: [
                        {
                            type: "empty_argument",
                            value: "",
                            children: [],
                        },
                        {
                            type: "empty_argument",
                            value: "",
                            children: [],
                        },
                        {
                            type: "empty_argument",
                            value: "",
                            children: [],
                        },
                    ],
                },
                {
                    type: "variable",
                    value: "x",
                    children: [],
                },
                {
                    type: "big_sum",
                    value: "",
                    children: [
                        {
                            type: "empty_argument",
                            value: "",
                            children: [],
                        },
                        {
                            type: "empty_argument",
                            value: "",
                            children: [],
                        },
                        {
                            type: "empty_argument",
                            value: "",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Correct detection of substrings and local ordering", () => {
        expect(
            JSON.parse(
                (
                    operatorFromString(
                        testConfig,
                        'fc("" 0)fc("" 2)fc("" 1)sum({} {} {})fa("" 2)fa("" 0)fa("" 1)'
                    ) as BracketedMultiplication
                )
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "big_sum",
                            value: "",
                            children: [
                                {
                                    type: "empty_argument",
                                    value: "",
                                    children: [],
                                },
                                {
                                    type: "empty_argument",
                                    value: "",
                                    children: [],
                                },
                                {
                                    type: "empty_argument",
                                    value: "",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("Complex ordering with different number of terms", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, 'f#("" 0)f#("" 2)f#("" 1)fa("" 1)fa("" 0)fa("" 2)') as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "1",
                            children: [],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_annihilation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_annihilation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_annihilation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_annihilation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_annihilation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "0",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "fermionic_annihilation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_annihilation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "fermionic_creation",
                            value: "c",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
                                    children: [
                                        {
                                            type: "number",
                                            value: "0",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
                                    children: [
                                        {
                                            type: "number",
                                            value: "1",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
                                    children: [
                                        {
                                            type: "number",
                                            value: "2",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "c",
                                    children: [
                                        {
                                            type: "number",
                                            value: "0",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "c",
                                    children: [
                                        {
                                            type: "number",
                                            value: "1",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "c",
                                    children: [
                                        {
                                            type: "number",
                                            value: "2",
                                            children: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("More orderable types and getting type ordering correct", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, 'pi pi 3 f#("" 1)fa("" n)ba("" 2) 1') as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "3",
                            children: [],
                        },
                        {
                            type: "constant_pi",
                            value: "",
                            children: [],
                        },
                        {
                            type: "constant_pi",
                            value: "",
                            children: [],
                        },
                        {
                            type: "bosonic_annihilation",
                            value: "b",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "kronecker_delta",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "1",
                                    children: [],
                                },
                                {
                                    type: "variable",
                                    value: "n",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "3",
                                    children: [],
                                },
                                {
                                    type: "constant_pi",
                                    value: "",
                                    children: [],
                                },
                                {
                                    type: "constant_pi",
                                    value: "",
                                    children: [],
                                },
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
                                    children: [
                                        {
                                            type: "variable",
                                            value: "n",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "c",
                                    children: [
                                        {
                                            type: "number",
                                            value: "1",
                                            children: [],
                                        },
                                    ],
                                },
                                {
                                    type: "bosonic_annihilation",
                                    value: "b",
                                    children: [
                                        {
                                            type: "number",
                                            value: "2",
                                            children: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, 'x y b#("" n)ba("" 2)pi') as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                {
                                    type: "constant_pi",
                                    value: "",
                                    children: [],
                                },
                                {
                                    type: "variable",
                                    value: "x",
                                    children: [],
                                },
                                {
                                    type: "variable",
                                    value: "y",
                                    children: [],
                                },
                                {
                                    type: "kronecker_delta",
                                    value: "",
                                    children: [
                                        {
                                            type: "variable",
                                            value: "n",
                                            children: [],
                                        },
                                        {
                                            type: "number",
                                            value: "2",
                                            children: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "constant_pi",
                            value: "",
                            children: [],
                        },
                        {
                            type: "variable",
                            value: "x",
                            children: [],
                        },
                        {
                            type: "variable",
                            value: "y",
                            children: [],
                        },
                        {
                            type: "bosonic_annihilation",
                            value: "b",
                            children: [
                                {
                                    type: "number",
                                    value: "2",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "bosonic_creation",
                            value: "b",
                            children: [
                                {
                                    type: "variable",
                                    value: "n",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("Ordering of complex i and complexConstruct", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, " y i i x 3") as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                { type: "number", value: "3", children: [] },
                {
                    type: "complex_operator_construct",
                    value: "",
                    children: [
                        { type: "number", value: "0", children: [] },
                        { type: "number", value: "1", children: [] },
                    ],
                },
                {
                    type: "complex_operator_construct",
                    value: "",
                    children: [
                        { type: "number", value: "0", children: [] },
                        { type: "number", value: "1", children: [] },
                    ],
                },
                { type: "variable", value: "x", children: [] },
                { type: "variable", value: "y", children: [] },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "i y i x") as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "complex_operator_construct",
                    value: "",
                    children: [
                        { type: "number", value: "0", children: [] },
                        { type: "number", value: "1", children: [] },
                    ],
                },
                {
                    type: "complex_operator_construct",
                    value: "",
                    children: [
                        { type: "number", value: "0", children: [] },
                        { type: "number", value: "1", children: [] },
                    ],
                },
                { type: "variable", value: "x", children: [] },
                { type: "variable", value: "y", children: [] },
            ],
        });
        // general complex sum CANNOT be ordered (it may by mistake contain non-orderable things whose properties then get overwritten, but it would not be visible to the user)
        // Need to split
        // TODO think how this could be implemented properly... it would be trivial to automatically split (complex is a sum) I THOUGHT. But the real- and complex-argument of the "sum" are only guaranteed to be Operator. NOT orderable Operator....
        // Probably would require pre-processing (splitting) in the main function before handing down, that however feels kind of like an generalization and inheritance anti-pattern...
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "y complex(1 1) x") as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                { type: "variable", value: "y", children: [] },
                {
                    type: "complex_operator_construct",
                    value: "",
                    children: [
                        { type: "number", value: "1", children: [] },
                        { type: "number", value: "1", children: [] },
                    ],
                },
                { type: "variable", value: "x", children: [] },
            ],
        });
    });

    test("Fermionic ordering with multiple degrees of freedom", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, 'f#("" 0)f#("d" 2)f#("" 1)fa("" 1)fa("d" 0)fa("" 2)') as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "fermionic_annihilation", value: "c", children: [{ type: "number", value: "2", children: [] }] },
                        { type: "fermionic_creation", value: "c", children: [{ type: "number", value: "0", children: [] }] },
                        { type: "fermionic_annihilation", value: "d", children: [{ type: "number", value: "0", children: [] }] },
                        { type: "fermionic_creation", value: "d", children: [{ type: "number", value: "2", children: [] }] },
                    ],
                },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
                                    children: [{ type: "number", value: "1", children: [] }],
                                },
                                {
                                    type: "fermionic_annihilation",
                                    value: "c",
                                    children: [{ type: "number", value: "2", children: [] }],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "c",
                                    children: [{ type: "number", value: "0", children: [] }],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "c",
                                    children: [{ type: "number", value: "1", children: [] }],
                                },
                                {
                                    type: "fermionic_annihilation",
                                    value: "d",
                                    children: [{ type: "number", value: "0", children: [] }],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "d",
                                    children: [{ type: "number", value: "2", children: [] }],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, 'fa("d" 0)f#("" 0)') as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "negation",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "fermionic_creation", value: "c", children: [{ type: "number", value: "0", children: [] }] },
                        { type: "fermionic_annihilation", value: "d", children: [{ type: "number", value: "0", children: [] }] },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, 'f#("d" 0)fa("d" 0)') as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                { type: "number", value: "1", children: [] },
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                {
                                    type: "fermionic_annihilation",
                                    value: "d",
                                    children: [{ type: "number", value: "0", children: [] }],
                                },
                                {
                                    type: "fermionic_creation",
                                    value: "d",
                                    children: [{ type: "number", value: "0", children: [] }],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("Bosonic ordering with multiple degrees of freedom", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, 'b#("" 0)b#("d" 2)b#("" 1)ba("" 1)ba("d" 0)ba("" 2)') as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                {
                                    type: "bosonic_annihilation",
                                    value: "b",
                                    children: [{ type: "number", value: "2", children: [] }],
                                },
                                {
                                    type: "bosonic_creation",
                                    value: "b",
                                    children: [{ type: "number", value: "0", children: [] }],
                                },
                                {
                                    type: "bosonic_annihilation",
                                    value: "d",
                                    children: [{ type: "number", value: "0", children: [] }],
                                },
                                {
                                    type: "bosonic_creation",
                                    value: "d",
                                    children: [{ type: "number", value: "2", children: [] }],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "bosonic_annihilation", value: "b", children: [{ type: "number", value: "1", children: [] }] },
                        { type: "bosonic_annihilation", value: "b", children: [{ type: "number", value: "2", children: [] }] },
                        { type: "bosonic_creation", value: "b", children: [{ type: "number", value: "0", children: [] }] },
                        { type: "bosonic_creation", value: "b", children: [{ type: "number", value: "1", children: [] }] },
                        { type: "bosonic_annihilation", value: "d", children: [{ type: "number", value: "0", children: [] }] },
                        { type: "bosonic_creation", value: "d", children: [{ type: "number", value: "2", children: [] }] },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, 'ba("d" 0)b#("" 0)') as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                { type: "bosonic_creation", value: "b", children: [{ type: "number", value: "0", children: [] }] },
                { type: "bosonic_annihilation", value: "d", children: [{ type: "number", value: "0", children: [] }] },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, 'b#("d" 0)ba("d" 0)') as BracketedMultiplication)
                    .orderOperatorStrings()
                    .getCopyWithGottenRidOfUnnecessaryTerms()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                { type: "negation", value: "", children: [{ type: "number", value: "1", children: [] }] },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "bosonic_annihilation", value: "d", children: [{ type: "number", value: "0", children: [] }] },
                        { type: "bosonic_creation", value: "d", children: [{ type: "number", value: "0", children: [] }] },
                    ],
                },
            ],
        });
    });
});
