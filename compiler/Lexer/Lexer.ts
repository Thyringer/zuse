
import { CompileErrors } from "../CompileError.ts"

import { CharType, Codepoint } from "./Codepoint.ts"
import { FaultyCode } from "./FaultyCode.ts";
import { linearize } from "./Linearizer.ts";
import { LinearizedCode } from "./LinearizedCode.ts";
import { pretokenizeLine } from "./Prelexer.ts";
import { LexicalCategory, Token } from "./Token.ts"
import { TokenizedCode } from "./TokenizedCode.ts";

import { Tab } from "../Presets.ts";


//

export function tokenize(lines: LinearizedCode): TokenizedCode | FaultyCode {
	let errors = new CompileErrors(lines.component_name.join("."));

	let prev_token: Token | undefined;
	let codepoint: Codepoint;
	let prev_chartype: CharType | undefined;
	let chartype: CharType | undefined;

	for (const line of lines) {
		line.tokens = pretokenizeLine(line.code);
			// The prelexer has already done the decomposition into lexemes, so that only the categorization needs to be completed and lexical checks carried out.

		for (const [token_index, token] of line.tokens!.entries()) {

			if (token.category === undefined) {
				prev_chartype = undefined;

				for(let index = token.from; index < token.to; index++) {
					codepoint = new Codepoint(line.code[index]);
					chartype = codepoint.presort();

					if (prev_chartype === undefined) {
						switch(chartype) {
							case CharType.Sign: {
								chartype = undefined;
									// Remains undefined until a digit or letter finally provides information.
								break;
	
							}
							case CharType.Digit: {
								token.category = LexicalCategory.Integer;
								break;
							}
							case CharType.CapitalLetter: {
								token.category = LexicalCategory.CapitalizedName
								break;
							}
							case CharType.SmallLetter: {
								token.category = (token.lexeme as string)[0] === '-'
									? LexicalCategory.Label
									: LexicalCategory.UncapitalizedName;
								break;
							}
							case CharType.Tab: {
								if (line.level === 0 && token.from === 0) {
									errors.pushSyntaxError(11, line, token.from);
								}
								else {
									errors.pushSyntaxError(12, line, token.from);
								}
								break;
							}
							case CharType.Other: {
								errors.pushSyntaxError(13, line, token.from);
								break;
							}
						}
					}
					else {
						switch(token.category as LexicalCategory) {
							case LexicalCategory.UncapitalizedName:
							case LexicalCategory.CapitalizedName: {
								switch (chartype) {
									case CharType.CapitalLetter:
									case CharType.SmallLetter:
									case CharType.Digit:
									case CharType.Sign: {
										break;
									}
									case CharType.Other: {
										/*
										console.log(`index = ${index}`);
										console.log(`token.to = ${token.to}`);
										console.log(`length = ${line.code.length}`);
										console.log(`char = ${line.code[index]}`);
										console.log(`chartype = ${chartype}`);
										*/
										errors.pushSyntaxError(14, line, index);
										break
									}
								}
								break;
							}
							case LexicalCategory.Integer: {
								switch (chartype) {
									case CharType.Digit: {
										break
									}
									case CharType.CapitalLetter:
									// deno-lint-ignore no-fallthrough
									case CharType.SmallLetter: {
										if (index - token.from === 1) {
											if (codepoint.isBinPrefix()) {
												token.category = LexicalCategory.BinaryInteger;
												break;
											}
											else if (codepoint.isHexPrefix()) {
												token.category = LexicalCategory.HexadecimalInteger;
												break;
											}
										}
									}
									case CharType.Sign:
									case CharType.Other: {
										errors.pushSyntaxError(15, line, index);
										break
									}
								}
								break;
							}
							case LexicalCategory.BinaryInteger: {
								switch (chartype) {
									// deno-lint-ignore no-fallthrough
									case CharType.Digit: {
										if (codepoint.isBinDigit()) {
											break;
										}
									}
									case CharType.CapitalLetter:
									case CharType.SmallLetter: 
									case CharType.Sign:
									case CharType.Other: {
										errors.pushSyntaxError(16, line, index);
										break
									}
								}
								break;
							}
							case LexicalCategory.HexadecimalInteger: {
								switch (chartype){
									case CharType.Digit:
									case CharType.CapitalLetter:
									// deno-lint-ignore no-fallthrough
									case CharType.SmallLetter: {
										if (codepoint.isHexDigit()) {
											break;
										}
									}
									case CharType.Sign:
									case CharType.Other: {
										errors.pushSyntaxError(17, line, index);
										break
									}
								}
								break;
							}
							case LexicalCategory.RawString: {
								if (prev_token !== undefined ) {
									switch (prev_token.category) {
										case LexicalCategory.Whitespace:
										case LexicalCategory.Separator: {
											break;
										}
										case LexicalCategory.UncapitalizedName:
										// deno-lint-ignore no-fallthrough
										case LexicalCategory.CapitalizedName: {
											const lexeme = prev_token.lexeme as string
											if ((lexeme).length === 1) {
												const codepoint = new Codepoint(lexeme);
												if (codepoint.isBinPrefix()) {
													token.category = LexicalCategory.Binary;
													break;
												}
												else if (codepoint.isHexPrefix()) {
													token.category = LexicalCategory.Hex;
													break;
												}
											}
										}
										default: {
											errors.pushSyntaxError(20, line, prev_token.to - 1, token.from + 1)
											break;
										}
									}
								}
							}
						}
					}
					
					prev_chartype = chartype;
				}
			}
			else if (token.isQuoting()) {
				token.lexeme = (token.lexeme as string).slice(1, -1);
					// Remove unnecessary quotation marks.
			}
			
			prev_token = token;
		}
	}

	//console.log(new TokenizedCode(lines).displayLines());
	//console.log(new TokenizedCode(lines).displayTokens());

	return errors.length === 0 ? new TokenizedCode(lines) : new FaultyCode(lines, errors);
}


//

Deno.test("Lexer", async () => {
	const file_path = "./tests/Collatz.k";
	const source_code = await Deno.readTextFile(file_path);
	
	let start;
	let end;

	console.log("Measuring performance...");
	start = performance.now();
	const lines = linearize(source_code, ["Collatz"], Tab);
	const output = tokenize(lines);

	if (output instanceof TokenizedCode) {
		console.log(`\n${output.displayTokens(85)}`);
		console.log(`\n${output.displayLines(82)}`);
	}
	else {
		console.log(`\n${output.display}\n`);
	}

	end = performance.now();
	console.log(`\n${end - start}ms`);
});