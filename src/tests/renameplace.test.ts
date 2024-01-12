import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { generateOperatorConfig, Operator, OperatorConfig, useVariablesStore, operatorFromString } from "../functions";

const testConfig = generateOperatorConfig();

function opFromObj(config: OperatorConfig, obj: any): Operator {
    return Operator.generateStructure(config, JSON.stringify(obj), true);
}

describe("operator module - general Peeralterations for renaming and replacing", () => {
    beforeEach(() => {
        mockPinia();
    });

    const mainOp = (config: OperatorConfig) =>
        opFromObj(config, {
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "l",
                            children: [],
                            uuid: "fa9b2a9b-2176-454b-aa5d-d57e2d49ff72",
                        },
                        {
                            type: "variable",
                            value: "m",
                            children: [],
                            uuid: "d53907d4-7419-42ec-88eb-9e6bf69bac33",
                        },
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "bracketed_multiplication",
                                    value: "",
                                    children: [
                                        {
                                            type: "variable",
                                            value: "l",
                                            children: [],
                                            uuid: "0e3331e5-389b-4acc-aa40-6fde236e1d8d",
                                        },
                                        {
                                            type: "variable",
                                            value: "m",
                                            children: [],
                                            uuid: "dca92277-014a-4cbc-a2a9-5d0b744a88fb",
                                        },
                                    ],
                                    uuid: "ffe7dd29-7a41-4fab-ba86-b77ac1f0aac0",
                                },
                            ],
                            uuid: "43319050-9b51-4c2d-807b-5e75ef9969d9",
                        },
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "exp_function",
                                    value: "",
                                    children: [
                                        {
                                            type: "variable",
                                            value: "m",
                                            children: [],
                                            uuid: "7152376b-c16e-4597-8ebd-35fa1e78b5eb",
                                        },
                                    ],
                                    uuid: "b52f0395-df1c-4e01-94cf-d5612100cadf",
                                },
                            ],
                            uuid: "cf915d89-e235-4e39-adc2-e090f3e00bbd",
                        },
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "variable",
                                    value: "m",
                                    children: [],
                                    uuid: "aff333c7-e3f4-43c7-b868-630654056968",
                                },
                            ],
                            uuid: "9c9c3fc0-af36-44bf-8439-b4e166393e1a",
                        },
                    ],
                    uuid: "9e381653-48f1-48ed-a33f-56300d76558b",
                },
                {
                    type: "variable",
                    value: "m",
                    children: [],
                    uuid: "6ff162e5-d467-46d8-a4a8-122ab5a3cb4c",
                },
            ],
            uuid: "5da8b002-142a-47b1-859d-19851cfa19c8",
        });
    const selOp = (config: OperatorConfig) =>
        opFromObj(config, {
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "variable",
                    value: "l",
                    children: [],
                    uuid: "fa9b2a9b-2176-454b-aa5d-d57e2d49ff72",
                },
                {
                    type: "variable",
                    value: "m",
                    children: [],
                    uuid: "d53907d4-7419-42ec-88eb-9e6bf69bac33",
                },
                {
                    type: "exp_function",
                    value: "",
                    children: [
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                {
                                    type: "variable",
                                    value: "l",
                                    children: [],
                                    uuid: "0e3331e5-389b-4acc-aa40-6fde236e1d8d",
                                },
                                {
                                    type: "variable",
                                    value: "m",
                                    children: [],
                                    uuid: "dca92277-014a-4cbc-a2a9-5d0b744a88fb",
                                },
                            ],
                            uuid: "ffe7dd29-7a41-4fab-ba86-b77ac1f0aac0",
                        },
                    ],
                    uuid: "43319050-9b51-4c2d-807b-5e75ef9969d9",
                },
                {
                    type: "exp_function",
                    value: "",
                    children: [
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "variable",
                                    value: "m",
                                    children: [],
                                    uuid: "7152376b-c16e-4597-8ebd-35fa1e78b5eb",
                                },
                            ],
                            uuid: "b52f0395-df1c-4e01-94cf-d5612100cadf",
                        },
                    ],
                    uuid: "cf915d89-e235-4e39-adc2-e090f3e00bbd",
                },
                {
                    type: "exp_function",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "m",
                            children: [],
                            uuid: "aff333c7-e3f4-43c7-b868-630654056968",
                        },
                    ],
                    uuid: "9c9c3fc0-af36-44bf-8439-b4e166393e1a",
                },
            ],
            uuid: "9e381653-48f1-48ed-a33f-56300d76558b",
        });

    test("Peeralteration: rename-swap", () => {
        const mainOpInst = mainOp(testConfig);
        const selOpInst = selOp(testConfig);

        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    mainOpInst,
                    selOpInst.renameSwapImplementation([
                        opFromObj(testConfig, {
                            type: "variable",
                            value: "l",
                            children: [],
                            uuid: "8419c171-9079-4351-9dac-cb969c4d869a",
                        }),
                        opFromObj(testConfig, {
                            type: "variable",
                            value: "m",
                            children: [],
                            uuid: "776d74c3-6f50-46bd-bf1d-03a15d09d06c",
                        }),
                    ])
                ).getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "m", children: [] },
                        { type: "variable", value: "l", children: [] },
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "bracketed_multiplication",
                                    value: "",
                                    children: [
                                        { type: "variable", value: "m", children: [] },
                                        { type: "variable", value: "l", children: [] },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                { type: "exp_function", value: "", children: [{ type: "variable", value: "l", children: [] }] },
                            ],
                        },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "l", children: [] }] },
                    ],
                },
                { type: "variable", value: "m", children: [] },
            ],
        });
        // not right input configuration
        expect(
            selOpInst.renameSwapImplementation([
                opFromObj(testConfig, {
                    type: "variable",
                    value: "l",
                    children: [],
                    uuid: "8419c171-9079-4351-9dac-cb969c4d869a",
                }),
            ]).length
        ).toBe(0);
        // nothing to replace
        expect(
            selOpInst.renameSwapImplementation([
                opFromObj(testConfig, {
                    type: "variable",
                    value: "x",
                    children: [],
                    uuid: "asdasdasd",
                }),
                opFromObj(testConfig, {
                    type: "variable",
                    value: "y",
                    children: [],
                    uuid: "lkjasdfhjklasdf",
                }),
            ]).length
        ).toBe(0);
    });

    test("Peeralteration: replace-with", () => {
        const mainOpInst = mainOp(testConfig);
        const selOpInst = selOp(testConfig);

        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    mainOpInst,
                    selOpInst.replaceAllEqualImplementation([
                        opFromObj(testConfig, {
                            type: "variable",
                            value: "l",
                            children: [],
                            uuid: "8419c171-9079-4351-9dac-cb969c4d869a",
                        }),
                        opFromObj(testConfig, {
                            type: "variable",
                            value: "m",
                            children: [],
                            uuid: "776d74c3-6f50-46bd-bf1d-03a15d09d06c",
                        }),
                    ])
                ).getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "m", children: [] },
                        { type: "variable", value: "m", children: [] },
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "bracketed_multiplication",
                                    value: "",
                                    children: [
                                        { type: "variable", value: "m", children: [] },
                                        { type: "variable", value: "m", children: [] },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                { type: "exp_function", value: "", children: [{ type: "variable", value: "m", children: [] }] },
                            ],
                        },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "m", children: [] }] },
                    ],
                },
                { type: "variable", value: "m", children: [] },
            ],
        });
        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    mainOpInst,
                    selOpInst.replaceAllEqualImplementation([
                        opFromObj(testConfig, {
                            type: "variable",
                            value: "m",
                            children: [],
                            uuid: "776d74c3-6f50-46bd-bf1d-03a15d09d06c",
                        }),
                        opFromObj(testConfig, {
                            type: "variable",
                            value: "l",
                            children: [],
                            uuid: "8419c171-9079-4351-9dac-cb969c4d869a",
                        }),
                    ])
                ).getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "l", children: [] },
                        { type: "variable", value: "l", children: [] },
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "bracketed_multiplication",
                                    value: "",
                                    children: [
                                        { type: "variable", value: "l", children: [] },
                                        { type: "variable", value: "l", children: [] },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                { type: "exp_function", value: "", children: [{ type: "variable", value: "l", children: [] }] },
                            ],
                        },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "l", children: [] }] },
                    ],
                },
                { type: "variable", value: "m", children: [] },
            ],
        });
        // not right input configuration
        expect(
            selOpInst.replaceAllEqualImplementation([
                opFromObj(testConfig, {
                    type: "variable",
                    value: "l",
                    children: [],
                    uuid: "8419c171-9079-4351-9dac-cb969c4d869a",
                }),
            ]).length
        ).toBe(0);
        // nothing to replace
        expect(
            selOpInst.replaceAllEqualImplementation([
                opFromObj(testConfig, {
                    type: "variable",
                    value: "x",
                    children: [],
                    uuid: "asdasdasd",
                }),
                opFromObj(testConfig, {
                    type: "variable",
                    value: "y",
                    children: [],
                    uuid: "lkjasdfhjklasdf",
                }),
            ]).length
        ).toBe(0);
    });

    test("Peeralteration: pack-same-into-variable", () => {
        const variableTestConfig = generateOperatorConfig("aldskjakaskldjsakj", "vnztsavtbsdzgs", "maszubatsfdad");

        const mainOpInst = mainOp(variableTestConfig);
        const selOpInst = selOp(variableTestConfig);

        // variable x is currently empty, so nothing to replace
        expect(
            selOpInst.variableAllEqualImplementation([
                opFromObj(variableTestConfig, {
                    type: "variable",
                    value: "x",
                    children: [],
                    uuid: "777774c3-6f50-46bd-bf1d-03a15d09d06c",
                }),
            ]).length
        ).toBe(0);

        // set variable x
        useVariablesStore().setOperatorForVariable(variableTestConfig, "x", operatorFromString(variableTestConfig, "exp(m)"));

        // variable x now set, so should replace something
        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    mainOpInst,
                    selOpInst.variableAllEqualImplementation([
                        opFromObj(variableTestConfig, {
                            type: "variable",
                            value: "x",
                            children: [],
                            uuid: "777774c3-6f50-46bd-bf1d-03a15d09d06c",
                        }),
                    ])
                ).getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "l", children: [] },
                        { type: "variable", value: "m", children: [] },
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "bracketed_multiplication",
                                    value: "",
                                    children: [
                                        { type: "variable", value: "l", children: [] },
                                        { type: "variable", value: "m", children: [] },
                                    ],
                                },
                            ],
                        },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "x", children: [] }] },
                        { type: "variable", value: "x", children: [] },
                    ],
                },
                { type: "variable", value: "m", children: [] },
            ],
        });

        // not right input configuration
        expect(selOpInst.variableAllEqualImplementation([]).length).toBe(0);

        // nothing to replace
        useVariablesStore().setOperatorForVariable(variableTestConfig, "x", operatorFromString(variableTestConfig, "{}"));
        expect(
            selOpInst.variableAllEqualImplementation([
                opFromObj(variableTestConfig, {
                    type: "variable",
                    value: "x",
                    children: [],
                    uuid: "777774c3-6f50-46bd-bf1d-03a15d09d06c",
                }),
            ]).length
        ).toBe(0);

        // not a variable input
        useVariablesStore().setOperatorForVariable(variableTestConfig, "x", operatorFromString(variableTestConfig, "{}"));
        expect(
            selOpInst.variableAllEqualImplementation([
                opFromObj(variableTestConfig, { type: "number", value: "1", children: [] }),
            ]).length
        ).toBe(0);
    });
});
