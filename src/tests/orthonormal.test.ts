import { describe, expect, test } from "@jest/globals";
import { BracketedMultiplication, Braket, operatorFromString } from "../functions";

describe("operator module - evaluate orthonormal BraKet", () => {
    test("Merging: No BraKet", () => {
        expect(
            JSON.parse(
                (operatorFromString("1*bra(a)") as BracketedMultiplication)
                    .MergeAndEvaluateBraKetMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "number",
                    value: "1",
                    children: [],
                },
                {
                    type: "singular_bra",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "a",
                            children: [],
                        },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString("ket(a)bra(k)") as BracketedMultiplication)
                    .MergeAndEvaluateBraKetMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "singular_ket",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "a",
                            children: [],
                        },
                    ],
                },
                {
                    type: "singular_bra",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "k",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Merging: There is a BraKet", () => {
        expect(
            JSON.parse(
                (operatorFromString("bra(k)ket(a)") as BracketedMultiplication)
                    .MergeAndEvaluateBraKetMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "double_braket",
            value: "",
            children: [
                {
                    type: "variable",
                    value: "k",
                    children: [],
                },
                {
                    type: "variable",
                    value: "a",
                    children: [],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString("x*bra(k)ket(a)*2") as BracketedMultiplication)
                    .MergeAndEvaluateBraKetMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "variable",
                    value: "x",
                    children: [],
                },
                {
                    type: "double_braket",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "k",
                            children: [],
                        },
                        {
                            type: "variable",
                            value: "a",
                            children: [],
                        },
                    ],
                },
                {
                    type: "number",
                    value: "2",
                    children: [],
                },
            ],
        });
    });

    test("Evaluating: Merge and Evaluate", () => {
        expect(
            JSON.parse(
                (operatorFromString("bra(1)ket(1)") as BracketedMultiplication)
                    .MergeAndEvaluateBraKetMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "number",
            value: "1",
            children: [],
        });
    });

    test("Evaluating: Evaluate to 1", () => {
        expect(
            JSON.parse((operatorFromString("braket(0 0)") as Braket).OrthoNormalEvalMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "number",
            value: "1",
            children: [],
        });

        expect(
            JSON.parse(
                (operatorFromString("braket((1; 2; 3) (1; 2; 3))") as Braket)
                    .OrthoNormalEvalMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "number",
            value: "1",
            children: [],
        });
    });

    test("Evaluating: Evaluate to 0", () => {
        expect(
            JSON.parse((operatorFromString("braket(0 1)") as Braket).OrthoNormalEvalMODIFICATION().getSerializedStructure())
        ).toMatchObject({
            type: "number",
            value: "0",
            children: [],
        });

        expect(
            JSON.parse(
                (operatorFromString("braket((1; 6; 3) (1; 2; 3))") as Braket)
                    .OrthoNormalEvalMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "number",
            value: "0",
            children: [],
        });

        expect(
            JSON.parse(
                (operatorFromString("braket((2); (3*1))") as Braket).OrthoNormalEvalMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "number",
            value: "0",
            children: [],
        });
    });

    test("Evaluating: unsure evaluation", () => {
        expect(
            JSON.parse(
                (operatorFromString("braket((1; 2; 3); (1; 2))") as Braket).OrthoNormalEvalMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "double_braket",
            value: "",
            children: [
                {
                    type: "structural_container",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "1",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "2",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "3",
                            children: [],
                        },
                    ],
                },
                {
                    type: "structural_container",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "1",
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
        });

        expect(
            JSON.parse(
                (operatorFromString("braket((2); (3*x))") as Braket).OrthoNormalEvalMODIFICATION().getSerializedStructure()
            )
        ).toMatchObject({
            type: "double_braket",
            value: "",
            children: [
                {
                    type: "number",
                    value: "2",
                    children: [],
                },
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
                            type: "variable",
                            value: "x",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });
});
