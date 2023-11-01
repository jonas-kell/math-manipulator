import { describe, expect, test } from "@jest/globals";
import { Numerical, Operator, StructuralVariable } from "../functions";

describe("operator module - replace operator feature", () => {
    const testOp = Operator.generateStructure(
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
                            type: "structural_variable",
                            value: "A",
                            children: [
                                {
                                    type: "variable",
                                    value: "x",
                                    children: [],
                                    uuid: "0b27cb45-640f-410b-97c7-8dc09f93104a",
                                },
                            ],
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
                testOp
                    .getCopyWithReplaced(Operator.uuidFromUUIDRef("ref_f7f98f57-4211-4cc4-9182-dfb0fd5ed470"), new Numerical(5))
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
                            type: "structural_variable",
                            value: "A",
                            children: [
                                {
                                    type: "variable",
                                    value: "x",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("get operator from nested", () => {
        expect(
            JSON.parse(
                testOp
                    .getOperatorByUUID(Operator.uuidFromUUIDRef("ref_c0dc69c0-f5af-48ea-b8a5-b96870d595da"))!
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
        expect(testOp.getOperatorByUUID(Operator.uuidFromUUIDRef("ref_c0dc69c0-f5af-48ea-b8a5-b96870d595d9"))).toBeNull();
    });

    test("Replace with structural variable", () => {
        expect(
            JSON.parse(
                testOp
                    .getCopyWithPackedIntoStructuralVariable(
                        "B",
                        Operator.uuidFromUUIDRef("ref_f7f98f57-4211-4cc4-9182-dfb0fd5ed470")
                    )!
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
                            type: "structural_variable",
                            value: "B",
                            children: [
                                {
                                    type: "number",
                                    value: "4",
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "structural_variable",
                            value: "A",
                            children: [
                                {
                                    type: "variable",
                                    value: "x",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("Unpack structural variable", () => {
        expect(
            JSON.parse(
                (
                    testOp.getOperatorByUUID(
                        Operator.uuidFromUUIDRef("ref_521f0012-1366-41e1-a322-d5d893817930")
                    )! as StructuralVariable
                )
                    .UnpackMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "variable",
            value: "x",
            children: [],
        });
    });
});
