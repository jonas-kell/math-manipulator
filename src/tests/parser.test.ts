import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import { operatorFromString, generateOperatorConfig } from "../functions";

describe("parser module end-to-end", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("Empty string default", () => {
        const input = "";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe("0");
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "number",
            value: "0",
            children: [],
        });
    });

    test("Curly bracket imbalance", () => {
        expect(() => operatorFromString(testConfig, "{}{}{}")).not.toThrow();
        expect(() => operatorFromString(testConfig, "{{}{}")).toThrow();
        expect(() => operatorFromString(testConfig, "}{}{}")).toThrow();
        expect(() => operatorFromString(testConfig, "\\{")).not.toThrow();
        expect(() => operatorFromString(testConfig, "\\}")).not.toThrow();
    });

    test("Default Variable parsing", () => {
        const input = "asd";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe("{asd}");
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            children: [],
            type: "variable",
            value: "asd",
        });
    });

    test("Raw Latex parsing", () => {
        const input = "\\mathcal{H}";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe("{\\mathcal{H}}");
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "raw_latex",
            value: "\\mathcal{H}",
            children: [],
        });
    });

    test("Structural Elements parsing", () => {
        const input = "{} = != <=>";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe("{}\\,\\,\\eq\\,\\,\\neq\\,\\,\\iff");
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "structural_container",
            value: "",
            children: [
                {
                    type: "empty_argument",
                    value: "",
                    children: [],
                },
                {
                    type: "equals",
                    value: "",
                    children: [],
                },
                {
                    type: "not_equals",
                    value: "",
                    children: [],
                },
                {
                    type: "iff",
                    value: "",
                    children: [],
                },
            ],
        });
    });

    test("Constants parsing", () => {
        const input = "pi inf psi phi";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe(
            "\\left(\\pi \\cdot \\infty \\cdot \\Psi \\cdot \\Phi\\right)"
        );
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "constant_pi",
                    value: "",
                    children: [],
                },
                {
                    type: "infinity",
                    value: "",
                    children: [],
                },
                {
                    type: "op_psi",
                    value: "",
                    children: [],
                },
                {
                    type: "op_phi",
                    value: "",
                    children: [],
                },
            ],
        });
    });

    test("Exponent special case parsing", () => {
        const input = "2**2**3";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe("{{2}^{2}}^{3}");
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "power",
            value: "",
            children: [
                {
                    type: "power",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "2",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "2",
                            children: [],
                        },
                    ],
                },
                {
                    type: "number",
                    value: "3",
                    children: [],
                },
            ],
        });
    });

    test("Discern number, variable and raw (multiplication insertion only happens on non-structural)", () => {
        const input = "asd 23.3 23e2 \\frac{2}{1}";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe(
            "\\left({asd} \\cdot 23.3 \\cdot 2300\\right)\\,\\,{\\frac{2}{1}}"
        );
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "structural_container",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "asd",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "23.3",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "2300",
                            children: [],
                        },
                    ],
                },
                {
                    type: "raw_latex",
                    value: "\\frac{2}{1}",
                    children: [],
                },
            ],
        });
    });

    test("One Parameter Function (and parameter unpacking)", () => {
        const input = "exp(a asd asdf) = exp as";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe(
            "\\mathrm{e}^{\\left({a} \\cdot {asd} \\cdot {asdf}\\right)}\\,\\,\\eq\\,\\,\\mathrm{e}^{{as}}"
        );
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "structural_container",
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
                                    type: "variable",
                                    value: "a",
                                    children: [],
                                },
                                {
                                    type: "variable",
                                    value: "asd",
                                    children: [],
                                },
                                {
                                    type: "variable",
                                    value: "asdf",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "equals",
                    value: "",
                    children: [],
                },
                {
                    type: "exp_function",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "as",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Two Parameter Function", () => {
        const input = "braket(psi phi)";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe(
            "\\left\\lang\\Psi\\middle\\vert\\Phi\\right\\rang"
        );
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "double_braket",
            value: "",
            children: [
                {
                    type: "op_psi",
                    value: "",
                    children: [],
                },
                {
                    type: "op_phi",
                    value: "",
                    children: [],
                },
            ],
        });
    });

    test("Three Parameter Function", () => {
        const input = "sum( 1 2  3)";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe("\\sum\\limits_{1 }^{ 2}3");
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "big_sum",
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
        });
    });

    test("Four Parameter Function", () => {
        const input = "int((1+2) a s d)";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe(
            "\\int\\limits_{\\left(1+2\\right)}^{{a}}{s}\\mathrm{d}{d}"
        );
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "big_int",
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
                            value: "2",
                            children: [],
                        },
                    ],
                },
                {
                    type: "variable",
                    value: "a",
                    children: [],
                },
                {
                    type: "variable",
                    value: "s",
                    children: [],
                },
                {
                    type: "variable",
                    value: "d",
                    children: [],
                },
            ],
        });
    });

    test("Wrong Parameter count", () => {
        expect(() => operatorFromString(testConfig, "int(a s a s d)")).toThrow();
        expect(() => operatorFromString(testConfig, "int( a s d)")).toThrow();
    });

    test("Default operations precedence and auto-spacing", () => {
        const input = "1 * 2 /3 +4 5:-6 ";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe(
            "\\left(\\left(1 \\cdot \\frac{2}{3}\\right)+\\left(4 \\cdot \\frac{5}{-6}\\right)\\right)"
        );
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "bracketed_sum",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "1",
                            children: [],
                        },
                        {
                            type: "fraction",
                            value: "",
                            children: [
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
                    ],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "4",
                            children: [],
                        },
                        {
                            type: "fraction",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "5",
                                    children: [],
                                },
                                {
                                    type: "negation",
                                    value: "",
                                    children: [
                                        {
                                            type: "number",
                                            value: "6",
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

    test("Minus auto-introduces plus", () => {
        const input = "-3 = 2 -5";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe("-3\\,\\,\\eq\\,\\,\\left(2-5\\right)");
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "structural_container",
            value: "",
            children: [
                {
                    type: "negation",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "3",
                            children: [],
                        },
                    ],
                },
                {
                    type: "equals",
                    value: "",
                    children: [],
                },
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "2",
                            children: [],
                        },
                        {
                            type: "negation",
                            value: "",
                            children: [
                                {
                                    type: "number",
                                    value: "5",
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("Grouping brackets count match or empty", () => {
        expect(() => operatorFromString(testConfig, "(")).toThrow();
        expect(() => operatorFromString(testConfig, "))")).toThrow();
        expect(() => operatorFromString(testConfig, "(a)(a)")).not.toThrow();
        expect(() => operatorFromString(testConfig, "(a)(a")).toThrow();
        expect(() => operatorFromString(testConfig, "asdasd * ()")).toThrow(); // empty
    });

    test("Function alone at top level", () => {
        expect(() => operatorFromString(testConfig, "exp")).toThrow();
    });

    test("Automatic bracket removal", () => {
        expect(operatorFromString(testConfig, "(((a))) * asd").getExportFormulaString()).toEqual(
            operatorFromString(testConfig, "a * asd").getExportFormulaString()
        );
        expect(operatorFromString(testConfig, "(((a a)))").getExportFormulaString()).toEqual(
            operatorFromString(testConfig, "a * a").getExportFormulaString()
        );
    });

    test("Repeating operator wrong argument counts", () => {
        expect(() => operatorFromString(testConfig, "+s")).toThrow();
        expect(() => operatorFromString(testConfig, "s+")).toThrow();
        expect(() => operatorFromString(testConfig, "*s")).toThrow();
        expect(() => operatorFromString(testConfig, "s*")).toThrow();
    });

    test("Functions all parse", () => {
        const input = 'func("f" x) = funcrm("g" x) = sin(x) = cos x';
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe(
            "{f}\\left({x}\\right)\\,\\,\\eq\\,\\,\\mathrm{g}\\left({x}\\right)\\,\\,\\eq\\,\\,\\mathrm{sin}\\left({x}\\right)\\,\\,\\eq\\,\\,\\mathrm{cos}\\left({x}\\right)"
        );
        expect(JSON.parse(operatorFromString(testConfig, input).getSerializedStructure())).toMatchObject({
            type: "structural_container",
            value: "",
            children: [
                {
                    type: "general_function_math_mode",
                    value: "f",
                    children: [
                        {
                            type: "variable",
                            value: "x",
                            children: [],
                        },
                    ],
                },
                {
                    type: "equals",
                    value: "",
                    children: [],
                },
                {
                    type: "general_function_math_rm",
                    value: "g",
                    children: [
                        {
                            type: "variable",
                            value: "x",
                            children: [],
                        },
                    ],
                },
                {
                    type: "equals",
                    value: "",
                    children: [],
                },
                {
                    type: "sin",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "x",
                            children: [],
                        },
                    ],
                },
                {
                    type: "equals",
                    value: "",
                    children: [],
                },
                {
                    type: "cos",
                    value: "",
                    children: [
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

    test("Automatic StructuralSeparator insertion into function-argument-groups", () => {
        expect(() => operatorFromString(testConfig, "sum({} a s)")).not.toThrow();
        expect(() => operatorFromString(testConfig, "sum(a {} s)")).not.toThrow();
        expect(() => operatorFromString(testConfig, "sum({} a {})")).not.toThrow();
        expect(() => operatorFromString(testConfig, "sum(a a {})")).not.toThrow();
        expect(() => operatorFromString(testConfig, "sum({} a a {})")).toThrow();
        expect(() => operatorFromString(testConfig, "sum({} (a a) {})")).not.toThrow();
        expect(() => operatorFromString(testConfig, "sum({};(a a) {})")).not.toThrow();
        expect(() => operatorFromString(testConfig, "sum({}; a; n)")).not.toThrow();
        expect(() => operatorFromString(testConfig, "int({} a a {})")).not.toThrow();
        expect(() => operatorFromString(testConfig, "int({} a; a {})")).not.toThrow();
    });

    test("Functions with one parameter, difference between treats-as-structural and not", () => {
        expect(JSON.parse(operatorFromString(testConfig, "exp(1 2)").getSerializedStructure())).toMatchObject({
            type: "exp_function",
            value: "",
            children: [
                {
                    type: "bracketed_multiplication",
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
        expect(JSON.parse(operatorFromString(testConfig, "exp(1)").getSerializedStructure())).toMatchObject({
            type: "exp_function",
            value: "",
            children: [
                {
                    type: "number",
                    value: "1",
                    children: [],
                },
            ],
        });
        expect(JSON.parse(operatorFromString(testConfig, "bra(1 0 2)").getSerializedStructure())).toMatchObject({
            type: "singular_bra",
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
                            value: "0",
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
        expect(JSON.parse(operatorFromString(testConfig, "bra(1)").getSerializedStructure())).toMatchObject({
            type: "singular_bra",
            value: "",
            children: [
                {
                    type: "number",
                    value: "1",
                    children: [],
                },
            ],
        });
        expect(JSON.parse(operatorFromString(testConfig, "ket(0;1)").getSerializedStructure())).toMatchObject({
            type: "singular_ket",
            value: "",
            children: [
                {
                    type: "structural_container",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "0",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "1",
                            children: [],
                        },
                    ],
                },
            ],
        });
        expect(JSON.parse(operatorFromString(testConfig, "ket(0 1)").getSerializedStructure())).toMatchObject({
            type: "singular_ket",
            value: "",
            children: [
                {
                    type: "structural_container",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "0",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "1",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Create structural container with ;", () => {
        expect(JSON.parse(operatorFromString(testConfig, "a;s d").getSerializedStructure())).toMatchObject({
            type: "structural_container",
            value: "",
            children: [
                {
                    type: "variable",
                    value: "a",
                    children: [],
                },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        {
                            type: "variable",
                            value: "s",
                            children: [],
                        },
                        {
                            type: "variable",
                            value: "d",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    test("Associative Brackets removed for Sums and Products, but NOT Structural", () => {
        expect(JSON.parse(operatorFromString(testConfig, "1*2*(3*4)").getSerializedStructure())).toMatchObject({
            type: "bracketed_multiplication",
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
                {
                    type: "number",
                    value: "4",
                    children: [],
                },
            ],
        });

        expect(JSON.parse(operatorFromString(testConfig, "1+2+(3+4)").getSerializedStructure())).toMatchObject({
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
                    value: "2",
                    children: [],
                },
                {
                    type: "number",
                    value: "3",
                    children: [],
                },
                {
                    type: "number",
                    value: "4",
                    children: [],
                },
            ],
        });

        expect(JSON.parse(operatorFromString(testConfig, "1*(3+4)").getSerializedStructure())).toMatchObject({
            type: "bracketed_multiplication",
            value: "",
            children: [
                {
                    type: "number",
                    value: "1",
                    children: [],
                },
                {
                    type: "bracketed_sum",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "3",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "4",
                            children: [],
                        },
                    ],
                },
            ],
        });

        expect(JSON.parse(operatorFromString(testConfig, "1;2;(3;4)").getSerializedStructure())).toMatchObject({
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
                    type: "structural_container",
                    value: "",
                    children: [
                        {
                            type: "number",
                            value: "3",
                            children: [],
                        },
                        {
                            type: "number",
                            value: "4",
                            children: [],
                        },
                    ],
                },
            ],
        });
    });
    test("Before functions with appropriate precedence", () => {
        expect(JSON.parse(operatorFromString(testConfig, "exp exp -2 !%").getSerializedStructure())).toMatchObject({
            type: "exp_function",
            value: "",
            children: [
                {
                    type: "exp_function",
                    value: "",
                    children: [
                        {
                            type: "negation",
                            value: "",
                            children: [
                                {
                                    type: "percent",
                                    value: "",
                                    children: [
                                        { type: "faculty", value: "", children: [{ type: "number", value: "2", children: [] }] },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test("Repeating operator wrong argument counts", () => {
        const expected = {
            type: "structural_container",
            value: "",
            children: [
                {
                    type: "exp_function",
                    value: "",
                    children: [
                        {
                            type: "structural_container",
                            value: "",
                            children: [
                                { type: "less", value: "", children: [] },
                                { type: "variable", value: "l", children: [] },
                                { type: "variable", value: "m", children: [] },
                                { type: "greater", value: "", children: [] },
                            ],
                        },
                    ],
                },
                { type: "less", value: "", children: [] },
                { type: "variable", value: "l", children: [] },
                { type: "variable", value: "m", children: [] },
                { type: "greater", value: "", children: [] },
            ],
        };

        expect(JSON.parse(operatorFromString(testConfig, "exp(< l ; m >) ; < l ; m >").getSerializedStructure())).toMatchObject(
            expected
        );
        expect(JSON.parse(operatorFromString(testConfig, "exp(<; l ; m >) ; < l ; m >").getSerializedStructure())).toMatchObject(
            expected
        );
        expect(JSON.parse(operatorFromString(testConfig, "exp(< l ; m; >) ; < l ; m >").getSerializedStructure())).toMatchObject(
            expected
        );
        expect(JSON.parse(operatorFromString(testConfig, "exp(< ;l ; m; >) ; < l ; m >").getSerializedStructure())).toMatchObject(
            expected
        );
        expect(JSON.parse(operatorFromString(testConfig, "exp(< l ; m >) ; <; l ; m >").getSerializedStructure())).toMatchObject(
            expected
        );
        expect(JSON.parse(operatorFromString(testConfig, "exp(< l ; m >) ; < l ; m; >").getSerializedStructure())).toMatchObject(
            expected
        );
        expect(JSON.parse(operatorFromString(testConfig, "exp(< l ; m >) ; < ;l ; m; >").getSerializedStructure())).toMatchObject(
            expected
        );
        expect(JSON.parse(operatorFromString(testConfig, "< l  m >").getSerializedStructure())).toMatchObject({
            type: "structural_container",
            value: "",
            children: [
                { type: "less", value: "", children: [] },
                {
                    type: "bracketed_multiplication",
                    value: "",
                    children: [
                        { type: "variable", value: "l", children: [] },
                        { type: "variable", value: "m", children: [] },
                    ],
                },
                { type: "greater", value: "", children: [] },
            ],
        });
    });
});
