import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString, generateOperatorConfig, KroneckerDelta, Operator } from "../functions";

describe("operator implementation delta", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("Parsing", () => {
        expect(JSON.parse(operatorFromString(testConfig, "delta(1 2)").getSerializedStructure())).toMatchObject({
            type: "kronecker_delta",
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
        });
    });

    test("Rendering", () => {
        expect(operatorFromString(testConfig, "delta(x y)").getExportFormulaString()).toEqual("\\delta_{{x},{y}}");
    });

    test("Numerical Value", () => {
        expect(
            JSON.parse(operatorFromString(testConfig, "delta(1 2)").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "number",
            value: "0",
            children: [],
        });
        expect(
            JSON.parse(operatorFromString(testConfig, "delta(2 (1+1))").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "number",
            value: "1",
            children: [],
        });
        expect(
            JSON.parse(operatorFromString(testConfig, "delta(x (x+1))").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({
            type: "kronecker_delta",
            value: "",
            children: [
                {
                    type: "variable",
                    value: "x",
                    children: [],
                },
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
                            type: "variable",
                            value: "x",
                            children: [],
                        },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                operatorFromString(testConfig, "delta(dist(l) dist(l))").getCopyWithNumbersFolded().getSerializedStructure()
            )
        ).toMatchObject({ type: "number", value: "1", children: [] });
        expect(
            JSON.parse(operatorFromString(testConfig, "delta(dist(l) l)").getCopyWithNumbersFolded().getSerializedStructure())
        ).toMatchObject({ type: "number", value: "1", children: [] });
        expect(
            JSON.parse(
                operatorFromString(testConfig, "delta(dist(l) dist(m))").getCopyWithNumbersFolded().getSerializedStructure()
            )
        ).toMatchObject({ type: "number", value: "0", children: [] });
    });

    test("Split one delta into product", () => {
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "delta((l;s) (m;s'))") as KroneckerDelta)
                    .SplitIntoProductMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "kronecker_delta",
                    value: "",
                    children: [
                        { type: "variable", value: "l", children: [] },
                        { type: "variable", value: "m", children: [] },
                    ],
                },
                {
                    type: "kronecker_delta",
                    value: "",
                    children: [
                        { type: "variable", value: "s", children: [] },
                        { type: "variable", value: "s'", children: [] },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                (operatorFromString(testConfig, "delta((l;s;a) (m;s'))") as KroneckerDelta)
                    .SplitIntoProductMODIFICATION()
                    .getSerializedStructure()
            )
        ).toMatchObject({
            type: "kronecker_delta",
            value: "",
            children: [
                {
                    type: "structural_container",
                    value: "",
                    children: [
                        { type: "variable", value: "l", children: [] },
                        { type: "variable", value: "s", children: [] },
                        { type: "variable", value: "a", children: [] },
                    ],
                },
                {
                    type: "structural_container",
                    value: "",
                    children: [
                        { type: "variable", value: "m", children: [] },
                        { type: "variable", value: "s'", children: [] },
                    ],
                },
            ],
        });
    });

    test("Split all deltas into products", () => {
        const operator = operatorFromString(testConfig, "delta((l;s) (m;s'))+exp(delta((l;s;a) (m;s';b)))*(1+delta((l) (m)))");

        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    operator,
                    (operatorFromString(testConfig, "delta((l) (m))") as KroneckerDelta).SplitAllDeltasIntoProductsPEERALTERATION(
                        [operator]
                    )
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
                        {
                            type: "kronecker_delta",
                            value: "",
                            children: [
                                { type: "variable", value: "l", children: [] },
                                { type: "variable", value: "m", children: [] },
                            ],
                        },
                        {
                            type: "kronecker_delta",
                            value: "",
                            children: [
                                { type: "variable", value: "s", children: [] },
                                { type: "variable", value: "s'", children: [] },
                            ],
                        },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "exp_function",
                            value: "",
                            children: [
                                {
                                    type: "bracketed_multiplication",
                                    value: "",
                                    children: [
                                        {
                                            type: "kronecker_delta",
                                            value: "",
                                            children: [
                                                { type: "variable", value: "l", children: [] },
                                                { type: "variable", value: "m", children: [] },
                                            ],
                                        },
                                        {
                                            type: "kronecker_delta",
                                            value: "",
                                            children: [
                                                { type: "variable", value: "s", children: [] },
                                                { type: "variable", value: "s'", children: [] },
                                            ],
                                        },
                                        {
                                            type: "kronecker_delta",
                                            value: "",
                                            children: [
                                                { type: "variable", value: "a", children: [] },
                                                { type: "variable", value: "b", children: [] },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "bracketed_sum",
                            value: "",
                            children: [
                                { type: "number", value: "1", children: [] },
                                {
                                    type: "kronecker_delta",
                                    value: "",
                                    children: [
                                        { type: "variable", value: "l", children: [] },
                                        { type: "variable", value: "m", children: [] },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("Sum over delta argument", () => {
        const baseOperator = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_sum",
                value: "",
                children: [
                    {
                        type: "bracketed_multiplication",
                        value: "",
                        children: [
                            {
                                type: "kronecker_delta",
                                value: "",
                                children: [
                                    {
                                        type: "variable",
                                        value: "m",
                                        children: [],
                                        uuid: "2024f571-8acf-408d-8cf5-4bdc85af01ef",
                                    },
                                    {
                                        type: "variable",
                                        value: "l",
                                        children: [],
                                        uuid: "b70ad8cd-8889-46c8-a5ea-73275e8274de",
                                    },
                                ],
                                uuid: "533fc91d-755e-48e2-aba8-47a320fff303",
                            },
                            {
                                type: "variable",
                                value: "m",
                                children: [],
                                uuid: "296ccbcb-69c2-4a01-8698-c4e0e2b36139",
                            },
                            {
                                type: "variable",
                                value: "l",
                                children: [],
                                uuid: "cb7b564d-27fc-430c-a4f2-555e6f38f68f",
                            },
                            {
                                type: "exp_function",
                                value: "",
                                children: [
                                    {
                                        type: "variable",
                                        value: "m",
                                        children: [],
                                        uuid: "8456d11c-90b8-4b02-985d-0d11f9a65f84",
                                    },
                                ],
                                uuid: "cf599f1b-a12f-462e-9f1f-6457d3d9e6e3",
                            },
                            {
                                type: "exp_function",
                                value: "",
                                children: [
                                    {
                                        type: "variable",
                                        value: "l",
                                        children: [],
                                        uuid: "bed1c99e-c170-45f8-915c-046584f558ca",
                                    },
                                ],
                                uuid: "de232c74-361a-4e3d-9225-6cec8206726f",
                            },
                            {
                                type: "variable",
                                value: "x",
                                children: [],
                                uuid: "39e949cb-4e43-46cd-9f09-7e8991a8f53f",
                            },
                            {
                                type: "exp_function",
                                value: "",
                                children: [
                                    {
                                        type: "variable",
                                        value: "x",
                                        children: [],
                                        uuid: "2ac986a9-4434-44d1-b7e7-9441019b2c75",
                                    },
                                ],
                                uuid: "6d6b77b8-090a-406d-a7b5-32be0500085e",
                            },
                        ],
                        uuid: "b4d52e97-5f93-4a3b-b6e8-e2faee37a286",
                    },
                    {
                        type: "bracketed_multiplication",
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
                                        uuid: "3d195599-2c3a-414d-b234-230a43ad175b",
                                    },
                                ],
                                uuid: "d339fa87-b282-4313-b518-b22ae0409349",
                            },
                            {
                                type: "exp_function",
                                value: "",
                                children: [
                                    {
                                        type: "variable",
                                        value: "l",
                                        children: [],
                                        uuid: "0e8afecd-11de-445d-9362-e49269292241",
                                    },
                                ],
                                uuid: "4333faf2-8dce-4368-9f2f-63f2562a5ce4",
                            },
                        ],
                        uuid: "05bf384a-b013-4c06-89c4-c4c1a41b3c7f",
                    },
                ],
                uuid: "f989abe4-4ca5-4873-a939-856c6b425e17",
            }),
            true
        );
        const argumentOperator = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_multiplication",
                value: "",
                children: [
                    {
                        type: "kronecker_delta",
                        value: "",
                        children: [
                            {
                                type: "variable",
                                value: "m",
                                children: [],
                                uuid: "2024f571-8acf-408d-8cf5-4bdc85af01ef",
                            },
                            {
                                type: "variable",
                                value: "l",
                                children: [],
                                uuid: "b70ad8cd-8889-46c8-a5ea-73275e8274de",
                            },
                        ],
                        uuid: "533fc91d-755e-48e2-aba8-47a320fff303",
                    },
                    {
                        type: "variable",
                        value: "m",
                        children: [],
                        uuid: "296ccbcb-69c2-4a01-8698-c4e0e2b36139",
                    },
                    {
                        type: "variable",
                        value: "l",
                        children: [],
                        uuid: "cb7b564d-27fc-430c-a4f2-555e6f38f68f",
                    },
                    {
                        type: "exp_function",
                        value: "",
                        children: [
                            {
                                type: "variable",
                                value: "m",
                                children: [],
                                uuid: "8456d11c-90b8-4b02-985d-0d11f9a65f84",
                            },
                        ],
                        uuid: "cf599f1b-a12f-462e-9f1f-6457d3d9e6e3",
                    },
                    {
                        type: "exp_function",
                        value: "",
                        children: [
                            {
                                type: "variable",
                                value: "l",
                                children: [],
                                uuid: "bed1c99e-c170-45f8-915c-046584f558ca",
                            },
                        ],
                        uuid: "de232c74-361a-4e3d-9225-6cec8206726f",
                    },
                    {
                        type: "variable",
                        value: "x",
                        children: [],
                        uuid: "39e949cb-4e43-46cd-9f09-7e8991a8f53f",
                    },
                    {
                        type: "exp_function",
                        value: "",
                        children: [
                            {
                                type: "variable",
                                value: "x",
                                children: [],
                                uuid: "2ac986a9-4434-44d1-b7e7-9441019b2c75",
                            },
                        ],
                        uuid: "6d6b77b8-090a-406d-a7b5-32be0500085e",
                    },
                ],
                uuid: "b4d52e97-5f93-4a3b-b6e8-e2faee37a286",
            }),
            true
        );
        const kroneckerDelta = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "kronecker_delta",
                value: "",
                children: [
                    {
                        type: "variable",
                        value: "m",
                        children: [],
                        uuid: "2024f571-8acf-408d-8cf5-4bdc85af01ef",
                    },
                    {
                        type: "variable",
                        value: "l",
                        children: [],
                        uuid: "b70ad8cd-8889-46c8-a5ea-73275e8274de",
                    },
                ],
                uuid: "533fc91d-755e-48e2-aba8-47a320fff303",
            }),
            true
        );

        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    baseOperator,
                    (kroneckerDelta as KroneckerDelta).SumOverFirstArgumentPEERALTERATION([argumentOperator])
                )
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
                        { type: "variable", value: "l", children: [] },
                        { type: "variable", value: "l", children: [] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "l", children: [] }] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "l", children: [] }] },
                        { type: "variable", value: "x", children: [] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "x", children: [] }] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "m", children: [] }] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "l", children: [] }] },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    baseOperator,
                    (kroneckerDelta as KroneckerDelta).SumOverSecondArgumentPEERALTERATION([argumentOperator])
                )
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
                        { type: "variable", value: "m", children: [] },
                        { type: "variable", value: "m", children: [] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "m", children: [] }] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "m", children: [] }] },
                        { type: "variable", value: "x", children: [] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "x", children: [] }] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "m", children: [] }] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "l", children: [] }] },
                    ],
                },
            ],
        });
        expect((kroneckerDelta as KroneckerDelta).SumOverSecondArgumentPEERALTERATION([]).length).toBe(0);
    });

    test("Sum over delta argument", () => {
        const baseOperator = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "bracketed_sum",
                value: "",
                children: [
                    {
                        type: "bracketed_multiplication",
                        value: "",
                        children: [
                            {
                                type: "kronecker_delta",
                                value: "",
                                children: [
                                    {
                                        type: "variable",
                                        value: "m",
                                        children: [],
                                        uuid: "9706b4c7-ebd2-47ea-b0c2-4b167838ae48",
                                    },
                                    {
                                        type: "variable",
                                        value: "l",
                                        children: [],
                                        uuid: "ed5ac3a0-7502-4fad-80d3-aabafefbc58e",
                                    },
                                ],
                                uuid: "1cbd656e-81e7-40f5-84a0-1404d9baa91a",
                            },
                            {
                                type: "variable",
                                value: "m",
                                children: [],
                                uuid: "5b7a9579-00bb-44bd-a4c4-321aacb0983d",
                            },
                            {
                                type: "variable",
                                value: "x",
                                children: [],
                                uuid: "f4ac5e4a-80a4-4272-9663-c6c14240a21d",
                            },
                        ],
                        uuid: "ac536dcb-52b5-44cd-98df-90494dc7b6ae",
                    },
                    {
                        type: "bracketed_multiplication",
                        value: "",
                        children: [
                            {
                                type: "kronecker_delta",
                                value: "",
                                children: [
                                    {
                                        type: "variable",
                                        value: "l",
                                        children: [],
                                        uuid: "bab531b7-b8f1-479c-9e4f-7ebff0958ef6",
                                    },
                                    {
                                        type: "variable",
                                        value: "m",
                                        children: [],
                                        uuid: "67dfddaa-d251-4bff-bb01-50c0b18877dc",
                                    },
                                ],
                                uuid: "0fb5b2b7-736c-460f-8ea8-7e1e0ac461a8",
                            },
                            {
                                type: "variable",
                                value: "x",
                                children: [],
                                uuid: "9c63cad7-9d8a-42d2-9430-0e93bd339f28",
                            },
                            {
                                type: "exp_function",
                                value: "",
                                children: [
                                    {
                                        type: "variable",
                                        value: "m",
                                        children: [],
                                        uuid: "c01c620a-ae0f-4cd7-bcb0-df099b8e8c73",
                                    },
                                ],
                                uuid: "50c05087-d166-445c-b233-dc7fd8af9d97",
                            },
                        ],
                        uuid: "278c10c0-bcf2-46e7-8b24-b4028f038d40",
                    },
                    {
                        type: "bracketed_multiplication",
                        value: "",
                        children: [
                            {
                                type: "kronecker_delta",
                                value: "",
                                children: [
                                    {
                                        type: "variable",
                                        value: "l",
                                        children: [],
                                        uuid: "ee94d16a-0e52-43e4-ad6d-62781329320d",
                                    },
                                    {
                                        type: "variable",
                                        value: "m",
                                        children: [],
                                        uuid: "1238bd1c-cf47-4fd8-bae6-c0302a8ba3cb",
                                    },
                                ],
                                uuid: "d323a87b-0792-471f-991f-93dc5b208571",
                            },
                            {
                                type: "variable",
                                value: "x",
                                children: [],
                                uuid: "3e4192f2-67a2-4253-8545-679d62177f68",
                            },
                            {
                                type: "exp_function",
                                value: "",
                                children: [
                                    {
                                        type: "variable",
                                        value: "m",
                                        children: [],
                                        uuid: "e85c83c7-ee07-488c-a8b6-0653492c46bd",
                                    },
                                ],
                                uuid: "e1470781-ad7f-42b8-a568-93b976ae9e98",
                            },
                        ],
                        uuid: "d0b856a6-49f6-4af1-8e84-a6f54b6f8d93",
                    },
                    {
                        type: "bracketed_multiplication",
                        value: "",
                        children: [
                            {
                                type: "kronecker_delta",
                                value: "",
                                children: [
                                    {
                                        type: "bracketed_sum",
                                        value: "",
                                        children: [
                                            {
                                                type: "variable",
                                                value: "l",
                                                children: [],
                                                uuid: "25c098b0-f10d-4d7f-abae-503dd8c0627c",
                                            },
                                            {
                                                type: "number",
                                                value: "1",
                                                children: [],
                                                uuid: "5c7e12fa-62eb-4731-9004-d4a20f89d357",
                                            },
                                        ],
                                        uuid: "3e8c6056-0dce-4b85-9cab-4775b7cb00ae",
                                    },
                                    {
                                        type: "variable",
                                        value: "m",
                                        children: [],
                                        uuid: "2f3abb05-30ce-4dc4-8622-fd34a858c61b",
                                    },
                                ],
                                uuid: "c1886287-097e-48e5-a31b-a3472195d659",
                            },
                            {
                                type: "variable",
                                value: "x",
                                children: [],
                                uuid: "4e9f8a71-d15c-4b35-a2d2-671dc44d48c7",
                            },
                            {
                                type: "exp_function",
                                value: "",
                                children: [
                                    {
                                        type: "variable",
                                        value: "m",
                                        children: [],
                                        uuid: "e2cefa21-b267-4cf9-8def-f07fd3a47948",
                                    },
                                ],
                                uuid: "c169b86f-9e7b-4a07-8f6f-c835e0bf7294",
                            },
                        ],
                        uuid: "fde85bd8-3e0a-49a9-8adf-f7e2623a5115",
                    },
                    {
                        type: "variable",
                        value: "m",
                        children: [],
                        uuid: "22010104-8e6e-49ac-a07b-3c8fc92a0847",
                    },
                    {
                        type: "big_sum",
                        value: "",
                        children: [
                            {
                                type: "empty_argument",
                                value: "",
                                children: [],
                                uuid: "4cd0fe6b-ebcc-4d8c-81a5-47fb219a90be",
                            },
                            {
                                type: "empty_argument",
                                value: "",
                                children: [],
                                uuid: "f0cc050b-8b17-4d40-902e-f6d772b79844",
                            },
                            {
                                type: "bracketed_multiplication",
                                value: "",
                                children: [
                                    {
                                        type: "kronecker_delta",
                                        value: "",
                                        children: [
                                            {
                                                type: "variable",
                                                value: "l",
                                                children: [],
                                                uuid: "87990b5a-0b70-40ab-adfa-a30d565908de",
                                            },
                                            {
                                                type: "variable",
                                                value: "m",
                                                children: [],
                                                uuid: "8b07e6c7-f5e8-4850-b2c5-5cffd9f33713",
                                            },
                                        ],
                                        uuid: "c5724726-243a-41b6-b59a-8c27f7ef9c9c",
                                    },
                                    {
                                        type: "variable",
                                        value: "x",
                                        children: [],
                                        uuid: "878c0aca-9f28-411f-8645-a400dc1feafb",
                                    },
                                    {
                                        type: "exp_function",
                                        value: "",
                                        children: [
                                            {
                                                type: "variable",
                                                value: "l",
                                                children: [],
                                                uuid: "adfd3a56-aaa2-431d-a413-b3839a2fba4e",
                                            },
                                        ],
                                        uuid: "95b91cf2-ae10-4c5b-b3dd-89fea3056a8c",
                                    },
                                ],
                                uuid: "9b38d6bb-2191-4321-a2f0-fa1bd652e490",
                            },
                        ],
                        uuid: "ec2e3a00-c86a-4d29-ab87-9df39f6d1812",
                    },
                ],
                uuid: "1392f124-846c-4d58-b679-773d06cac65f",
            }),
            true
        );
        const kroneckerDelta = Operator.generateStructure(
            testConfig,
            JSON.stringify({
                type: "kronecker_delta",
                value: "",
                children: [
                    {
                        type: "variable",
                        value: "m",
                        children: [],
                        uuid: "9706b4c7-ebd2-47ea-b0c2-4b167838ae48",
                    },
                    {
                        type: "variable",
                        value: "l",
                        children: [],
                        uuid: "ed5ac3a0-7502-4fad-80d3-aabafefbc58e",
                    },
                ],
                uuid: "1cbd656e-81e7-40f5-84a0-1404d9baa91a",
            }),
            true
        );

        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    baseOperator,
                    (kroneckerDelta as KroneckerDelta).ExecEquivDeltasOverParentFirstArgumentPEERALTERATION([baseOperator])
                )
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
                        { type: "variable", value: "l", children: [] },
                        { type: "variable", value: "x", children: [] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "x", children: [] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "l", children: [] }] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "x", children: [] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "l", children: [] }] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "kronecker_delta",
                            value: "",
                            children: [
                                {
                                    type: "bracketed_sum",
                                    value: "",
                                    children: [
                                        { type: "number", value: "1", children: [] },
                                        { type: "variable", value: "l", children: [] },
                                    ],
                                },
                                { type: "variable", value: "m", children: [] },
                            ],
                        },
                        { type: "variable", value: "x", children: [] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "m", children: [] }] },
                    ],
                },
                { type: "variable", value: "m", children: [] },
                {
                    type: "big_sum",
                    value: "",
                    children: [
                        { type: "empty_argument", value: "", children: [] },
                        { type: "empty_argument", value: "", children: [] },
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                {
                                    type: "kronecker_delta",
                                    value: "",
                                    children: [
                                        { type: "variable", value: "l", children: [] },
                                        { type: "variable", value: "m", children: [] },
                                    ],
                                },
                                { type: "variable", value: "x", children: [] },
                                { type: "exp_function", value: "", children: [{ type: "variable", value: "l", children: [] }] },
                            ],
                        },
                    ],
                },
            ],
        });
        expect(
            JSON.parse(
                Operator.processPeerAlterationResult(
                    baseOperator,
                    (kroneckerDelta as KroneckerDelta).ExecEquivDeltasOverParentSecondArgumentPEERALTERATION([baseOperator])
                )
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
                            type: "kronecker_delta",
                            value: "",
                            children: [
                                { type: "variable", value: "m", children: [] },
                                { type: "variable", value: "l", children: [] },
                            ],
                        },
                        { type: "variable", value: "m", children: [] },
                        { type: "variable", value: "x", children: [] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "kronecker_delta",
                            value: "",
                            children: [
                                { type: "variable", value: "l", children: [] },
                                { type: "variable", value: "m", children: [] },
                            ],
                        },
                        { type: "variable", value: "x", children: [] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "m", children: [] }] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "kronecker_delta",
                            value: "",
                            children: [
                                { type: "variable", value: "l", children: [] },
                                { type: "variable", value: "m", children: [] },
                            ],
                        },
                        { type: "variable", value: "x", children: [] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "m", children: [] }] },
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "kronecker_delta",
                            value: "",
                            children: [
                                {
                                    type: "bracketed_sum",
                                    value: "",
                                    children: [
                                        { type: "number", value: "1", children: [] },
                                        { type: "variable", value: "l", children: [] },
                                    ],
                                },
                                { type: "variable", value: "m", children: [] },
                            ],
                        },
                        { type: "variable", value: "x", children: [] },
                        { type: "exp_function", value: "", children: [{ type: "variable", value: "m", children: [] }] },
                    ],
                },
                { type: "variable", value: "m", children: [] },
                {
                    type: "big_sum",
                    value: "",
                    children: [
                        { type: "empty_argument", value: "", children: [] },
                        { type: "empty_argument", value: "", children: [] },
                        {
                            type: "bracketed_multiplication",
                            value: "",
                            children: [
                                { type: "variable", value: "x", children: [] },
                                { type: "exp_function", value: "", children: [{ type: "variable", value: "m", children: [] }] },
                            ],
                        },
                    ],
                },
            ],
        });
    });
});
