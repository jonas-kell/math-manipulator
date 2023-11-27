import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { Numerical, Operator, Variable, generateOperatorConfig } from "../functions";

describe("operator module - replace operator feature", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    const testOp = () =>
        Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "exp_function",
                value: "",
                children: [
                    {
                        type: "bracketed_sum",
                        value: "",
                        children: [
                            {
                                type: "number",
                                value: "1",
                                children: [],
                                uuid: "c0dc69c0-f5af-48ea-b8a5-b96870d595da",
                            },
                            {
                                type: "number",
                                value: "4",
                                children: [],
                                uuid: "f7f98f57-4211-4cc4-9182-dfb0fd5ed470",
                            },
                            {
                                type: "variable",
                                value: "A",
                                children: [],
                                uuid: "521f0012-1366-41e1-a322-d5d893817930",
                            },
                        ],
                        uuid: "be603e6b-8dda-4eaf-84bd-3ac74b107940",
                    },
                ],
                uuid: "9e546568-4914-4a8a-bce5-e90aa6ded1dd",
            }),
            true
        );

    test("replace an operator from nested", () => {
        expect(
            JSON.parse(
                testOp()
                    .getCopyWithReplaced(
                        Operator.UUIDFromUUIDRef("ref_f7f98f57-4211-4cc4-9182-dfb0fd5ed470"),
                        new Numerical(testConfig, 5)
                    )
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "exp_function",
            value: "",
            children: [
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "1",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "5",
                            children: [],
                        },
                        {
                            type: "variable",
                            value: "A",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("get operator from nested", () => {
        expect(
            JSON.parse(
                testOp()
                    .getOperatorByUUID(Operator.UUIDFromUUIDRef("ref_c0dc69c0-f5af-48ea-b8a5-b96870d595da"))!
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "number",
            value: "1",
            children: [],
            uuid: "c0dc69c0-f5af-48ea-b8a5-b96870d595da",
        });
    });

    test("get operator where it cannot be found", () => {
        expect(testOp().getOperatorByUUID(Operator.UUIDFromUUIDRef("ref_c0dc69c0-f5af-48ea-b8a5-b96870d595d9"))).toBeNull();
    });

    test("Replace with variable and unpack again", () => {
        // puts value into variable-storage
        expect(
            JSON.parse(
                testOp()
                    .getCopyWithPackedIntoVariable("B", Operator.UUIDFromUUIDRef("ref_521f0012-1366-41e1-a322-d5d893817930"))!
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "exp_function",
            value: "",
            children: [
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "1",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "4",
                            children: [],
                        },
                        {
                            type: "variable",
                            value: "B",
                            children: [],
                        },
                    ],
                },
            ],
        });

        expect(
            JSON.parse(
                (
                    Operator.generateStructure(
                        testConfig,
                        JSON.stringify({
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "bracketed_multiplication",
                                    value: "",
                                    children: [
                                        {
                                            type: "variable",
                                            value: "B",
                                            children: [],
                                            uuid: "15543986-86ca-43d3-a07b-0af07acafd7a",
                                        },
                                        {
                                            type: "number",
                                            value: "1",
                                            children: [],
                                            uuid: "8116367b-4bb3-4759-b770-953abc838024",
                                        },
                                    ],
                                    uuid: "ff812707-f969-4ca6-ad44-91264636e3c4",
                                },
                            ],
                            uuid: "ac7a21eb-1387-47c0-b476-558e8b10f2c2",
                        }),
                        true
                    ).getOperatorByUUID(Operator.UUIDFromUUIDRef("ref_15543986-86ca-43d3-a07b-0af07acafd7a"))! as Variable
                )
                    .UnpackMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "variable",
            value: "A",
            children: [],
        });
    });

    test("Find parent Functionality", () => {
        expect(
            JSON.parse(testOp().findParentOperator("f7f98f57-4211-4cc4-9182-dfb0fd5ed470")!.getSerializedStructure())
        ).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "number",
                    value: "1",
                    children: [],
                    uuid: "c0dc69c0-f5af-48ea-b8a5-b96870d595da",
                },
                {
                    type: "number",
                    value: "4",
                    children: [],
                    uuid: "f7f98f57-4211-4cc4-9182-dfb0fd5ed470",
                },
                {
                    type: "variable",
                    value: "A",
                    children: [],
                    uuid: "521f0012-1366-41e1-a322-d5d893817930",
                },
            ],
            uuid: "be603e6b-8dda-4eaf-84bd-3ac74b107940",
        });
        expect(testOp().findParentOperator("f7f98f57-4211-4cc4-9182-dfb0fd5aaaaa")).toBeNull();
    });
});
